"use client";

import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { ScanBundle, SubscriptionTier } from "@prisma/client";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  ExternalLink,
  Search,
  X,
} from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
import type { ExecutiveOrgRow } from "@/app/actions/executive-subscriptions";
import {
  executiveApplyManualSubscriptionAction,
  executiveSaveBillingConfigAction,
  executiveSendJoinInviteAction,
  executiveUpdateBundlePriceAction,
} from "@/app/actions/executive-subscriptions";
import {
  manageSubsAdjustScansAction,
  manageSubsCreateManualUserAction,
  manageSubsListOrganizationsAction,
  manageSubsSaveTenantDomainAction,
  manageSubsSendTierInviteAction,
  manageSubsUpdateSubscriptionAction,
} from "@/app/actions/manage-subscriptions";
import {
  executiveTierOptionsForSelect,
  tierAllowance,
  tierLabelHe,
} from "@/lib/subscription-tier-config";
import { formatCreditsForDisplay, isEffectivelyUnlimitedCredits } from "@/lib/org-credits-display";
const ORG_TYPES = [
  { value: "HOME", label: "משק בית" },
  { value: "FREELANCER", label: "עצמאי" },
  { value: "COMPANY", label: "חברה" },
  { value: "ENTERPRISE", label: "ארגון" },
];

const MANUAL_MODES: { value: "standard" | "vip" | "trial"; label: string }[] = [
  { value: "standard", label: "רגיל (מכסות לפי רמה)" },
  { value: "vip", label: "VIP" },
  { value: "trial", label: "הרצה + ניסיון" },
];

type BillingCfg = {
  paypalClientIdPublic: string | null;
  tierMonthlyPricesJson: unknown;
};

type Toast = { id: string; type: "ok" | "err"; text: string };

type Props = {
  initialOrgs: ExecutiveOrgRow[];
  bundles: ScanBundle[];
  billingConfig: BillingCfg | null;
  focusOrgId?: string | null;
};

function statusBadgeClass(status: string): string {
  const u = status.toUpperCase();
  if (u === "ACTIVE" || u === "TRIAL") {
    return "bg-gradient-to-r from-indigo-100/90 via-blue-50 to-gray-100 text-indigo-900 ring-1 ring-indigo-400/50 shadow-sm shadow-indigo-200/40";
  }
  if (u === "CANCELED" || u === "PAST_DUE") {
    return "bg-gradient-to-r from-rose-100 to-gray-100 text-rose-900 ring-1 ring-rose-300/40";
  }
  return "bg-gradient-to-r from-gray-200/80 to-gray-100 text-gray-800 ring-1 ring-gray-400/30";
}

function UsageBar({
  label,
  remaining,
  included,
}: {
  label: string;
  remaining: number;
  included: number;
}) {
  const unlimited = isEffectivelyUnlimitedCredits(remaining);
  const pct =
    unlimited || included <= 0
      ? 100
      : Math.max(0, Math.min(100, (remaining / included) * 100));
  const usedLabel = unlimited
    ? "ללא הגבלה"
    : included > 0
      ? `נותרו ${remaining.toLocaleString("he-IL")} מתוך ${included.toLocaleString("he-IL")}`
      : `${remaining.toLocaleString("he-IL")} נותרו`;

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs font-bold text-gray-600">
        <span>{label}</span>
        <span className="font-mono text-[11px] text-gray-500" dir="ltr">
          {usedLabel}
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-gray-200/80 ring-1 ring-gray-300/40">
        <div
          className={`h-full rounded-full transition-all ${
            unlimited
              ? "bg-gradient-to-l from-indigo-400 via-blue-300 to-gray-300"
              : pct > 25
                ? "bg-gradient-to-l from-emerald-500 to-teal-400"
                : "bg-gradient-to-l from-indigo-500 to-rose-400"
          }`}
          style={{ width: `${unlimited ? 100 : pct}%` }}
        />
      </div>
    </div>
  );
}

export default function AdminSubscriptionControlCenter({
  initialOrgs,
  bundles,
  billingConfig,
  focusOrgId,
}: Props) {
  const { dir } = useI18n();
  const [orgs, setOrgs] = useState(initialOrgs);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<ExecutiveOrgRow | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [platformOpen, setPlatformOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [pending, startTransition] = useTransition();
  const focusAppliedRef = useRef<string | null>(null);
  useEffect(() => {
    focusAppliedRef.current = null;
  }, [focusOrgId]);
  const tierOptions = useMemo(() => executiveTierOptionsForSelect(), []);

  const defaultPricesJson = useMemo(() => {
    if (billingConfig?.tierMonthlyPricesJson != null) {
      try {
        return JSON.stringify(billingConfig.tierMonthlyPricesJson, null, 2);
      } catch {
        return "{}";
      }
    }
    return JSON.stringify(
      {
        HOUSEHOLD: 59.9,
        DEALER: 99.9,
        COMPANY: 159.9,
        CORPORATE: 299.9,
      },
      null,
      2,
    );
  }, [billingConfig?.tierMonthlyPricesJson]);

  const filteredOrgs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orgs;
    return orgs.filter((o) => {
      const email = (o.primaryEmail ?? "").toLowerCase();
      const name = o.name.toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [orgs, query]);

  const refresh = useCallback(() => {
    startTransition(async () => {
      const r = await manageSubsListOrganizationsAction();
      if (Array.isArray(r)) setOrgs(r);
    });
  }, []);

  const pushToast = (type: Toast["type"], text: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((prev) => [...prev, { id, type, text }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4800);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const openRow = (o: ExecutiveOrgRow) => {
    setSelected(o);
    setSheetOpen(true);
  };

  const closeSheet = () => {
    setSheetOpen(false);
    setTimeout(() => setSelected(null), 200);
  };

  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSheet();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheetOpen]);

  useEffect(() => {
    const id = focusOrgId?.trim();
    if (!id || !orgs.some((o) => o.id === id)) return;
    if (focusAppliedRef.current === id) return;
    focusAppliedRef.current = id;
    const t = window.setTimeout(() => {
      const el = document.getElementById(`admin-sub-row-${id}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.classList.add("ring-2", "ring-indigo-400", "ring-offset-2", "bg-indigo-50/80");
      const o = orgs.find((x) => x.id === id);
      if (o) openRow(o);
      window.setTimeout(() => {
        el?.classList.remove("ring-2", "ring-indigo-400", "ring-offset-2", "bg-indigo-50/80");
      }, 4000);
    }, 320);
    return () => window.clearTimeout(t);
  }, [focusOrgId, orgs]);

  const exportCsv = () => {
    const headers = [
      "organizationId",
      "organizationName",
      "primaryEmail",
      "tenantPublicDomain",
      "subscriptionTier",
      "subscriptionStatus",
      "cheapScansRemaining",
      "premiumScansRemaining",
      "maxCompanies",
    ];
    const escapeCell = (v: string | number | null | undefined) => {
      const s = String(v ?? "");
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, "\"\"")}"`;
      return s;
    };
    const lines = [
      headers.join(","),
      ...filteredOrgs.map((o) =>
        [
          o.id,
          o.name,
          o.primaryEmail ?? "",
          o.tenantPublicDomain ?? "",
          o.subscriptionTier,
          o.subscriptionStatus,
          o.cheapScansRemaining,
          o.premiumScansRemaining,
          o.maxCompanies,
        ]
          .map(escapeCell)
          .join(","),
      ),
    ];
    const blob = new Blob([`\uFEFF${lines.join("\n")}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `admin-subscriptions-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    pushToast("ok", "קובץ CSV יוצא בהצלחה.");
  };

  const onBillingSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setMsg(null);
    setErr(null);
    startTransition(async () => {
      const r = await executiveSaveBillingConfigAction(fd);
      if (r.ok) {
        setMsg("הגדרות גבייה נשמרו.");
        pushToast("ok", "הגדרות גבייה נשמרו.");
      } else setErr(r.error);
    });
  };

  const onInviteSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setMsg(null);
    setErr(null);
    startTransition(async () => {
      const r = await executiveSendJoinInviteAction(fd);
      if (r.ok) {
        setMsg("נשלח מייל הזמנה.");
        pushToast("ok", "נשלח מייל הזמנה.");
      } else setErr(r.error);
    });
  };

  const onBundleSubmit = (bundleId: string) => (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const v = Number(fd.get("price"));
    setMsg(null);
    setErr(null);
    startTransition(async () => {
      const r = await executiveUpdateBundlePriceAction(bundleId, v);
      if (r.ok) {
        setMsg("מחיר חבילה עודכן.");
        pushToast("ok", "מחיר חבילה עודכן.");
      } else setErr(r.error);
    });
  };

  const onCreateUser = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setMsg(null);
    setErr(null);
    startTransition(async () => {
      const r = await manageSubsCreateManualUserAction(fd);
      if (r.ok) {
        setMsg("נוצר ארגון ומשתמש.");
        pushToast("ok", "נוצר ארגון ומשתמש.");
        refresh();
        e.currentTarget.reset();
      } else {
        setErr(r.error);
        pushToast("err", r.error);
      }
    });
  };

  const onTierInvite = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setMsg(null);
    setErr(null);
    startTransition(async () => {
      const r = await manageSubsSendTierInviteAction(fd);
      if (r.ok) {
        setMsg("הזמנה נשלחה.");
        pushToast("ok", "הזמנה נשלחה.");
        e.currentTarget.reset();
      } else {
        setErr(r.error);
        pushToast("err", r.error);
      }
    });
  };

  const copyId = (id: string) => {
    void navigator.clipboard.writeText(id).then(() => pushToast("ok", "מזהה ארגון הועתק."));
  };

  const selectedAllow = selected ? tierAllowance(selected.subscriptionTier) : null;

  return (
    <div className="relative min-h-screen pb-24" dir={dir}>
      <div className="fixed end-4 top-4 z-[270] flex w-[min(26rem,92vw)] flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded-xl border px-3 py-2 text-sm shadow-sm ${
              t.type === "ok"
                ? "border-emerald-200 bg-emerald-50/95 text-emerald-900"
                : "border-rose-200 bg-rose-50/95 text-rose-900"
            }`}
            role="status"
          >
            <div className="flex items-start gap-2">
              <p className="flex-1 font-bold">{t.text}</p>
              <button
                type="button"
                onClick={() => dismissToast(t.id)}
                className="rounded-md p-1 text-gray-500 hover:bg-white/70"
                aria-label="סגור התראה"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {(msg || err) && (
        <div className="mx-auto mb-6 max-w-[1800px] px-4 sm:px-8">
          <div
            className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
              err ? "border-rose-200 bg-rose-50 text-rose-900" : "border-emerald-200 bg-emerald-50 text-emerald-900"
            }`}
          >
            {err ?? msg}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-[1800px] space-y-6 px-4 sm:px-8">
        <div className="rounded-2xl border border-gray-200/80 bg-white shadow-sm">
          <button
            type="button"
            onClick={() => setPlatformOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-3 px-5 py-4 text-start"
          >
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-indigo-700/70">
                Avenue — תצורת פלטפורמה
              </p>
              <p className="text-base font-black text-gray-900">גבייה, חבילות סריקה והזמנות הצטרפות</p>
            </div>
            {platformOpen ? <ChevronUp className="shrink-0 text-gray-500" /> : <ChevronDown className="shrink-0 text-gray-500" />}
          </button>
          {platformOpen ? (
            <div className="space-y-8 border-t border-gray-200/60 px-5 pb-8 pt-6">
              <section className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50/80 p-6 shadow-inner shadow-gray-200/20">
                <h3 className="mb-4 text-lg font-black text-gray-900">גבייה ו־PayPal</h3>
                <form className="space-y-4" onSubmit={onBillingSubmit}>
                  <label className="block text-sm font-bold text-gray-700">
                    PayPal Client ID (ציבורי)
                    <input
                      name="paypalClientId"
                      defaultValue={billingConfig?.paypalClientIdPublic ?? ""}
                      placeholder="ריק = מ־NEXT_PUBLIC_PAYPAL_CLIENT_ID"
                      className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 font-mono text-sm"
                      dir="ltr"
                    />
                  </label>
                  <label className="block text-sm font-bold text-gray-700">
                    מחירי מנוי חודשיים (JSON ₪)
                    <textarea
                      name="tierPricesJson"
                      rows={6}
                      defaultValue={defaultPricesJson}
                      className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 font-mono text-sm"
                      dir="ltr"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={pending}
                    className="rounded-xl bg-gradient-to-l from-gray-700 to-gray-900 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-gray-400/30 disabled:opacity-50"
                  >
                    שמירת הגדרות גבייה
                  </button>
                </form>
              </section>

              <section className="rounded-2xl border border-indigo-200/60 bg-gradient-to-br from-indigo-50/40 to-gray-50/50 p-6">
                <h3 className="mb-3 text-lg font-black text-gray-900">הזמנת הצטרפות במייל</h3>
                <form className="grid gap-3 md:grid-cols-2" onSubmit={onInviteSubmit}>
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="לקוח@דומיין"
                    className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
                    dir="ltr"
                  />
                  <input name="headline" placeholder="כותרת המייל" className="rounded-xl border border-gray-200 px-3 py-2 text-sm" />
                  <select name="tierHint" className="rounded-xl border border-gray-200 px-3 py-2 text-sm md:col-span-2">
                    <option value="">ללא ציון רמה</option>
                    {tierOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <textarea
                    name="bodyText"
                    rows={3}
                    placeholder="גוף ההודעה (אופציונלי)"
                    className="md:col-span-2 rounded-xl border border-gray-200 px-3 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={pending}
                    className="md:col-span-2 rounded-xl bg-gradient-to-l from-indigo-600 to-indigo-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                  >
                    שליחת הזמנה
                  </button>
                </form>
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md shadow-gray-200/25">
                <h3 className="mb-4 text-lg font-black text-gray-900">חבילות סריקה — מחירים</h3>
                <ul className="space-y-3">
                  {bundles.map((b) => (
                    <li
                      key={b.id}
                      className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-100 bg-gray-50/80 p-4"
                    >
                      <div className="min-w-[200px] flex-1">
                        <p className="font-bold text-gray-900">{b.name}</p>
                        <p className="text-xs text-gray-500">
                          +{b.cheapAdds} זולות · +{b.premiumAdds} פרימיום
                        </p>
                      </div>
                      <form className="flex items-center gap-2" onSubmit={onBundleSubmit(b.id)}>
                        <label className="text-xs font-bold text-gray-600">
                          ₪
                          <input
                            name="price"
                            type="number"
                            step="0.01"
                            defaultValue={b.priceIls}
                            className="me-1 w-28 rounded-lg border border-gray-200 px-2 py-1 text-sm font-mono"
                            dir="ltr"
                          />
                        </label>
                        <button
                          type="submit"
                          disabled={pending}
                          className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                        >
                          עדכון
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl border border-gray-200/80 bg-white shadow-sm">
          <button
            type="button"
            onClick={() => setToolsOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-3 px-5 py-4 text-start"
          >
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-gray-500">כלים</p>
              <p className="text-base font-black text-gray-900">יצירת משתמש, הזמנת רמה וייצוא</p>
            </div>
            {toolsOpen ? <ChevronUp className="shrink-0 text-gray-500" /> : <ChevronDown className="shrink-0 text-gray-500" />}
          </button>
          {toolsOpen ? (
            <div className="space-y-8 border-t border-gray-200/60 px-5 pb-8 pt-6">
              <div className="grid gap-8 lg:grid-cols-2">
                <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h3 className="mb-3 text-base font-black text-gray-900">יצירת משתמש ידנית</h3>
                  <form className="grid gap-3" onSubmit={onCreateUser}>
                    <input name="email" type="email" required placeholder="אימייל" className="rounded-xl border border-gray-200 px-3 py-2 text-sm" />
                    <input name="name" placeholder="שם (אופציונלי)" className="rounded-xl border border-gray-200 px-3 py-2 text-sm" />
                    <input name="organizationName" required placeholder="שם ארגון" className="rounded-xl border border-gray-200 px-3 py-2 text-sm" />
                    <select name="orgType" className="rounded-xl border border-gray-200 px-3 py-2 text-sm">
                      {ORG_TYPES.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    <select name="tier" className="rounded-xl border border-gray-200 px-3 py-2 text-sm">
                      {tierOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                      <input type="checkbox" name="vip" className="rounded border-gray-300" />
                      VIP
                    </label>
                    <button
                      type="submit"
                      disabled={pending}
                      className="rounded-xl bg-gradient-to-l from-gray-800 to-gray-950 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                    >
                      צור משתמש וארגון
                    </button>
                  </form>
                </section>
                <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h3 className="mb-3 text-base font-black text-gray-900">הזמנה לרמת מנוי (טוקן)</h3>
                  <form className="grid gap-3" onSubmit={onTierInvite}>
                    <input name="email" type="email" required placeholder="אימייל" className="rounded-xl border border-gray-200 px-3 py-2 text-sm" />
                    <select name="tier" required className="rounded-xl border border-gray-200 px-3 py-2 text-sm">
                      {tierOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    <input name="validDays" type="number" min={1} max={90} defaultValue={14} className="rounded-xl border border-gray-200 px-3 py-2 text-sm" />
                    <button
                      type="submit"
                      disabled={pending}
                      className="rounded-xl bg-indigo-600 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-indigo-500 disabled:opacity-50"
                    >
                      צור הזמנה ושלח מייל
                    </button>
                  </form>
                </section>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={exportCsv}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-gradient-to-br from-gray-100 to-white px-4 py-2 text-xs font-black text-gray-800 shadow-sm ring-1 ring-gray-200/80"
                >
                  <Download size={14} /> ייצוא CSV (מסונן)
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl border border-indigo-200/60 bg-white p-1 shadow-sm ring-1 ring-gray-200/60">
          <div className="rounded-[1.35rem] bg-white/80 px-4 py-5 sm:px-6 sm:py-6">
            <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-transparent bg-clip-text bg-gradient-to-l from-gray-500 via-blue-700 to-gray-600">
                  מרכז שליטה במנויים
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
                  כל המנויים — טבלה אחת
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  לחיצה על שורה פותחת כרטיס ניהול בצד.
                </p>
              </div>
              <label className="relative w-full md:max-w-md">
                <Search className="pointer-events-none absolute right-4 top-1/2 size-[1.15rem] -translate-y-1/2 text-indigo-600/50" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="חיפוש לפי שם או אימייל…"
                  className="w-full rounded-2xl border border-gray-200/90 bg-white py-3.5 pe-12 ps-4 text-sm font-medium shadow-inner shadow-gray-200/40 ring-1 ring-indigo-200/30 placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300/40"
                />
              </label>
            </div>

            <div className="overflow-x-auto rounded-xl ring-1 ring-gray-200/80">
              <table className="w-full min-w-[920px] border-collapse text-right text-sm">
                <thead>
                  <tr className="bg-gradient-to-bl from-gray-200/95 via-white to-indigo-100/50 text-gray-900 shadow-sm">
                    <th className="border-b border-indigo-400/35 px-4 py-4 text-xs font-black uppercase tracking-wider text-gray-700">
                      שם
                    </th>
                    <th className="border-b border-indigo-400/35 px-4 py-4 text-xs font-black uppercase tracking-wider text-gray-700">
                      אימייל
                    </th>
                    <th className="border-b border-indigo-400/35 px-4 py-4 text-xs font-black uppercase tracking-wider text-gray-700">
                      רמה
                    </th>
                    <th className="border-b border-indigo-400/35 px-4 py-4 text-xs font-black uppercase tracking-wider text-gray-700">
                      סריקות נוכחיות
                    </th>
                    <th className="border-b border-indigo-400/35 px-4 py-4 text-xs font-black uppercase tracking-wider text-gray-700">
                      דומיין
                    </th>
                    <th className="border-b border-indigo-400/35 px-4 py-4 text-xs font-black uppercase tracking-wider text-gray-700">
                      סטטוס
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {filteredOrgs.map((o) => (
                    <tr
                      key={o.id}
                      id={`admin-sub-row-${o.id}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => openRow(o)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openRow(o);
                        }
                      }}
                      className="cursor-pointer border-b border-gray-100 transition-colors hover:bg-gradient-to-l hover:from-indigo-50/50 hover:to-transparent focus:bg-indigo-50/60 focus:outline-none"
                    >
                      <td className="px-4 py-3.5 font-bold text-gray-900">{o.name}</td>
                      <td className="px-4 py-3.5 font-mono text-xs text-gray-600" dir="ltr">
                        {o.primaryEmail ?? "—"}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-gray-800">
                        <span className="rounded-lg bg-gradient-to-l from-gray-100 to-indigo-50 px-2 py-1 text-xs font-black ring-1 ring-indigo-200/50">
                          {tierLabelHe(o.subscriptionTier)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-700">
                        <span className="font-mono" dir="ltr">
                          זול {formatCreditsForDisplay(o.cheapScansRemaining)} · פרימיום{" "}
                          {formatCreditsForDisplay(o.premiumScansRemaining)}
                        </span>
                      </td>
                      <td className="max-w-[10rem] truncate px-4 py-3.5 font-mono text-xs text-gray-600" dir="ltr" title={o.tenantPublicDomain ?? ""}>
                        {o.tenantPublicDomain || "—"}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black ${statusBadgeClass(o.subscriptionStatus)}`}
                        >
                          {o.subscriptionStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredOrgs.length === 0 ? (
                <div className="border-t border-gray-100 bg-gray-50/80 px-6 py-12 text-center text-sm font-medium text-gray-500">
                  לא נמצאו תוצאות בשם או אימייל זה.
                </div>
              ) : null}
            </div>
            <p className="mt-3 text-center text-xs text-gray-500">
              מוצגים {filteredOrgs.length} מתוך {orgs.length} ארגונים
            </p>
          </div>
        </div>
      </div>

      {sheetOpen && selected ? (
        <>
          <button
            type="button"
            aria-label="סגור"
            className="fixed inset-0 z-[300] bg-gray-900/35 transition-opacity"
            onClick={closeSheet}
          />
          <aside
            className="fixed start-0 top-0 z-[310] flex h-full w-full max-w-xl flex-col border-s-2 border-indigo-400/40 bg-gradient-to-b from-white via-gray-50 to-indigo-50/20 shadow-xl shadow-gray-900/12"
            dir={dir}
          >
            <div className="flex items-start justify-between gap-3 border-b border-indigo-200/50 bg-white px-5 py-4">
              <div>
                <p className="text-xs font-black text-indigo-700/80">מנוי נבחר</p>
                <h3 className="text-lg font-black text-gray-900">{selected.name}</h3>
                <p className="mt-0.5 font-mono text-[11px] text-gray-500" dir="ltr">
                  {selected.primaryEmail ?? "— אימייל"}
                </p>
              </div>
              <button
                type="button"
                onClick={closeSheet}
                className="rounded-xl border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-5 py-5">
              <section className="rounded-2xl border border-gray-200 bg-white/90 p-4 shadow-sm">
                <h4 className="mb-3 text-sm font-black text-gray-900">הקמת אתר — דומיין מותאם</h4>
                <form
                  className="space-y-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    fd.set("organizationId", selected.id);
                    setMsg(null);
                    setErr(null);
                    startTransition(async () => {
                      const r = await manageSubsSaveTenantDomainAction(fd);
                      if (r.ok) {
                        pushToast("ok", "דומיין נשמר.");
                        startTransition(async () => {
                          const rows = await manageSubsListOrganizationsAction();
                          if (Array.isArray(rows)) {
                            setOrgs(rows);
                            const u = rows.find((x) => x.id === selected.id);
                            if (u) setSelected(u);
                          }
                        });
                      } else {
                        pushToast("err", r.error);
                        setErr(r.error);
                      }
                    });
                  }}
                >
                  <input type="hidden" name="organizationId" value={selected.id} />
                  <label className="block text-xs font-bold text-gray-600">
                    דומיין ציבורי
                    <input
                      name="tenantPublicDomain"
                      key={selected.id + (selected.tenantPublicDomain ?? "")}
                      defaultValue={selected.tenantPublicDomain ?? ""}
                      placeholder="דוגמה: app.client.com"
                      className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 font-mono text-sm"
                      dir="ltr"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={pending}
                    className="w-full rounded-xl bg-gradient-to-l from-gray-800 to-gray-950 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                  >
                    שמירת דומיין
                  </button>
                </form>
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white/90 p-4 shadow-sm">
                <h4 className="mb-4 text-sm font-black text-gray-900">מוניטור שימוש</h4>
                {selectedAllow ? (
                  <div className="space-y-4">
                    <UsageBar
                      label="סריקות זולות (מול מכסת רמה)"
                      remaining={selected.cheapScansRemaining}
                      included={selectedAllow.cheapScans}
                    />
                    <UsageBar
                      label="סריקות פרימיום"
                      remaining={selected.premiumScansRemaining}
                      included={selectedAllow.premiumScans}
                    />
                  </div>
                ) : null}
                <p className="mt-3 text-[11px] text-gray-500">
                  מכסות ברירת מחדש לפי רמה; ארגוני VIP או חבילות עלולים לחרוג מהסרגל.
                </p>
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white/90 p-4 shadow-sm">
                <h4 className="mb-3 text-sm font-black text-gray-900">עקיפה ידנית — סריקות</h4>
                <form
                  className="mb-4 flex flex-wrap gap-2"
                  onSubmit={(ev) => {
                    ev.preventDefault();
                    const fd = new FormData(ev.currentTarget);
                    fd.set("organizationId", selected.id);
                    startTransition(async () => {
                      const r = await manageSubsAdjustScansAction(fd);
                      if (r.ok) {
                        pushToast("ok", "יתרה עודכנה.");
                        refresh();
                      } else pushToast("err", r.error);
                    });
                  }}
                >
                  <input type="hidden" name="organizationId" value={selected.id} />
                  <input name="cheapDelta" type="number" defaultValue={0} className="w-24 rounded-lg border border-gray-200 px-2 py-1.5 text-sm" />
                  <input name="premiumDelta" type="number" defaultValue={0} className="w-24 rounded-lg border border-gray-200 px-2 py-1.5 text-sm" />
                  <button type="submit" disabled={pending} className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs font-bold text-white">
                    החל שינוי
                  </button>
                </form>
                <div className="flex flex-wrap gap-2">
                  {([-50, -10, 10, 50, 100] as const).map((d) => (
                    <button
                      key={`c-${d}`}
                      type="button"
                      disabled={pending}
                      onClick={() => {
                        startTransition(async () => {
                          const fd = new FormData();
                          fd.set("organizationId", selected.id);
                          fd.set("cheapDelta", String(d));
                          fd.set("premiumDelta", "0");
                          const r = await manageSubsAdjustScansAction(fd);
                          if (r.ok) {
                            pushToast("ok", `זול ${d > 0 ? "+" : ""}${d}`);
                            refresh();
                          } else pushToast("err", r.error);
                        });
                      }}
                      className="rounded-lg border border-indigo-200/80 bg-indigo-50/50 px-2.5 py-1 text-[11px] font-bold text-indigo-900"
                    >
                      זול {d > 0 ? `+${d}` : d}
                    </button>
                  ))}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {([-20, -5, 5, 20] as const).map((d) => (
                    <button
                      key={`p-${d}`}
                      type="button"
                      disabled={pending}
                      onClick={() => {
                        startTransition(async () => {
                          const fd = new FormData();
                          fd.set("organizationId", selected.id);
                          fd.set("cheapDelta", "0");
                          fd.set("premiumDelta", String(d));
                          const r = await manageSubsAdjustScansAction(fd);
                          if (r.ok) {
                            pushToast("ok", `פרימיום ${d > 0 ? "+" : ""}${d}`);
                            refresh();
                          } else pushToast("err", r.error);
                        });
                      }}
                      className="rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-900"
                    >
                      פרימיום {d > 0 ? `+${d}` : d}
                    </button>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white/90 p-4 shadow-sm">
                <h4 className="mb-3 text-sm font-black text-gray-900">רמת מנוי וסטטוס</h4>
                <form
                  className="flex flex-col gap-3"
                  onSubmit={(ev) => {
                    ev.preventDefault();
                    const fd = new FormData(ev.currentTarget);
                    fd.set("organizationId", selected.id);
                    startTransition(async () => {
                      const r = await manageSubsUpdateSubscriptionAction(fd);
                      if (r.ok) {
                        pushToast("ok", "מנוי עודכן.");
                        refresh();
                      } else pushToast("err", r.error);
                    });
                  }}
                >
                  <select name="tier" defaultValue={selected.subscriptionTier} className="rounded-xl border border-gray-200 px-3 py-2 text-sm">
                    {tierOptions.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <input
                    name="subscriptionStatus"
                    defaultValue={selected.subscriptionStatus}
                    className="rounded-xl border border-gray-200 px-3 py-2 text-sm uppercase"
                  />
                  <button type="submit" disabled={pending} className="rounded-xl bg-indigo-800 py-2 text-sm font-bold text-white">
                    שמור רמה וסטטוס
                  </button>
                </form>
                <div className="mt-4 space-y-2 border-t border-gray-100 pt-4">
                  <p className="text-xs font-bold text-gray-600">החלה מהירה (כל המכסות לפי מצב)</p>
                  <div className="flex flex-wrap gap-2">
                    {MANUAL_MODES.map((m) => (
                      <button
                        key={m.value}
                        type="button"
                        disabled={pending}
                        onClick={() => {
                          const tierEl = document.getElementById(`sheet-tier-${selected.id}`) as HTMLSelectElement | null;
                          const tier = (tierEl?.value ?? selected.subscriptionTier) as SubscriptionTier;
                          startTransition(async () => {
                            const r = await executiveApplyManualSubscriptionAction(selected.id, tier, m.value);
                            if (r.ok) {
                              pushToast("ok", `הוחל: ${m.label}`);
                              refresh();
                              void manageSubsListOrganizationsAction().then((rows) => {
                                if (Array.isArray(rows)) {
                                  setOrgs(rows);
                                  const u = rows.find((x) => x.id === selected.id);
                                  if (u) setSelected(u);
                                }
                              });
                            } else pushToast("err", r.error);
                          });
                        }}
                        className="rounded-lg bg-gradient-to-l from-emerald-700 to-teal-800 px-3 py-1.5 text-[11px] font-bold text-white"
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                  <select id={`sheet-tier-${selected.id}`} defaultValue={selected.subscriptionTier} className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs">
                    {tierOptions.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white/90 p-4 shadow-sm">
                <h4 className="mb-3 text-sm font-black text-gray-900">שיוך — CRM / ERP</h4>
                <p className="mb-3 text-xs text-gray-600">
                  מודולי CRM ו־ERP נשמים על <strong className="text-gray-800">הארגון המחובר כרגע</strong>. להלן מזהה הארגון של הלקוח לצורך תיאום וייבוא נתונים.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <code className="rounded-lg bg-gray-100 px-2 py-1 font-mono text-[11px]" dir="ltr">
                    {selected.id}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyId(selected.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-bold text-gray-700"
                  >
                    <Copy size={12} /> העתק
                  </button>
                </div>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <a
                    href="/dashboard/crm"
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-gradient-to-br from-white to-gray-100 py-2.5 text-center text-sm font-black text-gray-800 ring-1 ring-gray-200/80"
                  >
                    <ExternalLink size={14} /> מערכת CRM
                  </a>
                  <a
                    href="/dashboard/erp"
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-gradient-to-br from-white to-gray-100 py-2.5 text-center text-sm font-black text-gray-800 ring-1 ring-gray-200/80"
                  >
                    <ExternalLink size={14} /> ERP
                  </a>
                </div>
              </section>
            </div>
          </aside>
        </>
      ) : null}
    </div>
  );
}
