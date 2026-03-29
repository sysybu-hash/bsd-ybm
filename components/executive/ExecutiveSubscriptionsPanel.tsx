"use client";

import type { FormEvent } from "react";
import { useMemo, useState, useTransition } from "react";
import type { ScanBundle, SubscriptionTier } from "@prisma/client";
import {
  executiveApplyManualSubscriptionAction,
  executiveListOrganizationsAction,
  executiveSaveBillingConfigAction,
  executiveSendJoinInviteAction,
  executiveUpdateBundlePriceAction,
  type ExecutiveOrgRow,
} from "@/app/actions/executive-subscriptions";
import { executiveTierOptionsForSelect } from "@/lib/subscription-tier-config";

type BillingCfg = {
  paypalClientIdPublic: string | null;
  tierMonthlyPricesJson: unknown;
};

type Props = {
  initialOrgs: ExecutiveOrgRow[];
  bundles: ScanBundle[];
  billingConfig: BillingCfg | null;
};

const MODE_OPTIONS: { value: "standard" | "vip" | "trial"; label: string }[] = [
  { value: "standard", label: "רגיל (מכסות לפי רמה)" },
  { value: "vip", label: "VIP (תאגיד + מכסות גבוהות)" },
  { value: "trial", label: "הרצה (FREE + ניסיון 30 יום)" },
];

export default function ExecutiveSubscriptionsPanel({
  initialOrgs,
  bundles,
  billingConfig,
}: Props) {
  const [orgs, setOrgs] = useState(initialOrgs);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

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
        CORPORATE: 399.9,
      },
      null,
      2,
    );
  }, [billingConfig?.tierMonthlyPricesJson]);

  const refresh = () => {
    startTransition(async () => {
      const r = await executiveListOrganizationsAction();
      if (Array.isArray(r)) setOrgs(r);
    });
  };

  const onBillingSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setMsg(null);
    setErr(null);
    startTransition(async () => {
      const r = await executiveSaveBillingConfigAction(fd);
      if (r.ok) setMsg("הגדרות גבייה נשמרו.");
      else setErr(r.error);
    });
  };

  const onInviteSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setMsg(null);
    setErr(null);
    startTransition(async () => {
      const r = await executiveSendJoinInviteAction(fd);
      if (r.ok) setMsg("נשלח מייל הזמנה.");
      else setErr(r.error);
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
      if (r.ok) setMsg("מחיר חבילה עודכן.");
      else setErr(r.error);
    });
  };

  const applyRow = (orgId: string) => {
    const tierEl = document.getElementById(`tier-${orgId}`) as HTMLSelectElement | null;
    const modeEl = document.getElementById(`mode-${orgId}`) as HTMLSelectElement | null;
    const tier = tierEl?.value ?? "FREE";
    const mode = (modeEl?.value ?? "standard") as "standard" | "vip" | "trial";
    setMsg(null);
    setErr(null);
    startTransition(async () => {
      const r = await executiveApplyManualSubscriptionAction(orgId, tier, mode);
      if (r.ok) {
        setMsg("הארגון עודכן.");
        refresh();
      } else setErr(r.error);
    });
  };

  return (
    <div className="space-y-10" dir="rtl">
      {(msg || err) && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
            err ? "border-rose-200 bg-rose-50 text-rose-900" : "border-emerald-200 bg-emerald-50 text-emerald-900"
          }`}
        >
          {err ?? msg}
        </div>
      )}

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 md:p-8 shadow-xl shadow-slate-200/40">
        <h2 className="text-xl font-black text-slate-900 mb-2">גבייה ו־PayPal</h2>
        <p className="text-sm text-slate-600 mb-6">
          מחירי מנוי אפקטיביים ליצירת הזמנת PayPal (חל על לקוחות בדף החיוב). מזהה לקוח ציבורי — לרוב מ־
          <code className="text-xs bg-slate-100 px-1 rounded">NEXT_PUBLIC_PAYPAL_CLIENT_ID</code>; כאן ניתן לעקוף
          למסד.
        </p>
        <form className="space-y-4" onSubmit={onBillingSubmit}>
          <label className="block text-sm font-bold text-slate-700">
            PayPal Client ID (ציבורי)
            <input
              name="paypalClientId"
              defaultValue={billingConfig?.paypalClientIdPublic ?? ""}
              placeholder="השאר ריק לשימוש ב־env"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-sm"
              dir="ltr"
            />
          </label>
          <label className="block text-sm font-bold text-slate-700">
            מחירי מנוי חודשיים (JSON בשקלים)
            <textarea
              name="tierPricesJson"
              rows={8}
              defaultValue={defaultPricesJson}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-sm"
              dir="ltr"
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-slate-900 text-white px-5 py-2.5 text-sm font-bold disabled:opacity-50"
          >
            שמירת הגדרות גבייה
          </button>
        </form>
      </section>

      <section className="rounded-[2rem] border border-indigo-200 bg-indigo-50/40 p-6 md:p-8">
        <h2 className="text-xl font-black text-slate-900 mb-2">הזמנת הצטרפות במייל</h2>
        <form className="grid gap-3 md:grid-cols-2" onSubmit={onInviteSubmit}>
          <input
            name="email"
            type="email"
            required
            placeholder="לקוח@דומיין"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            dir="ltr"
          />
          <input name="headline" placeholder="כותרת המייל" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          <select name="tierHint" className="rounded-xl border border-slate-200 px-3 py-2 text-sm md:col-span-2">
            <option value="">ללא ציון רמה</option>
            {tierOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <textarea
            name="bodyText"
            rows={4}
            placeholder="גוף ההודעה (אופציונלי — יווסף טקסט ברירת מחדל)"
            className="md:col-span-2 rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={pending}
            className="md:col-span-2 rounded-xl bg-indigo-600 text-white px-5 py-2.5 text-sm font-bold disabled:opacity-50"
          >
            שליחת הזמנה
          </button>
        </form>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 md:p-8 shadow-xl shadow-slate-200/40">
        <h2 className="text-xl font-black text-slate-900 mb-4">חבילות סריקה (מחירים)</h2>
        <ul className="space-y-3">
          {bundles.map((b) => (
            <li
              key={b.id}
              className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4"
            >
              <div className="flex-1 min-w-[200px]">
                <p className="font-bold text-slate-900">{b.name}</p>
                <p className="text-xs text-slate-500">
                  +{b.cheapAdds} זולות · +{b.premiumAdds} פרימיום · {b.slug}
                </p>
              </div>
              <form className="flex items-center gap-2" onSubmit={onBundleSubmit(b.id)}>
                <label className="text-xs font-bold text-slate-600">
                  ₪
                  <input
                    name="price"
                    type="number"
                    step="0.01"
                    defaultValue={b.priceIls}
                    className="mr-1 w-28 rounded-lg border border-slate-200 px-2 py-1 text-sm font-mono"
                    dir="ltr"
                  />
                </label>
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-lg bg-slate-800 text-white px-3 py-1.5 text-xs font-bold disabled:opacity-50"
                >
                  עדכון
                </button>
              </form>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-[2rem] border border-emerald-200 bg-white p-6 md:p-8 shadow-xl shadow-emerald-100/30">
        <h2 className="text-xl font-black text-slate-900 mb-4">ארגונים — מנוי ידני</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500">
                <th className="py-3 px-2">ארגון</th>
                <th className="py-3 px-2">מייל</th>
                <th className="py-3 px-2">רמה נוכחית</th>
                <th className="py-3 px-2">יתרות</th>
                <th className="py-3 px-2">רמה חדשה</th>
                <th className="py-3 px-2">מצב</th>
                <th className="py-3 px-2" />
              </tr>
            </thead>
            <tbody>
              {orgs.map((o) => (
                <tr key={o.id} className="border-b border-slate-100 align-top">
                  <td className="py-3 px-2 font-bold text-slate-900">{o.name}</td>
                  <td className="py-3 px-2 font-mono text-xs" dir="ltr">
                    {o.primaryEmail ?? "—"}
                  </td>
                  <td className="py-3 px-2">
                    {o.subscriptionTier} · {o.subscriptionStatus}
                  </td>
                  <td className="py-3 px-2 text-xs whitespace-nowrap">
                    זול {o.cheapScansLeft} / פרימיום {o.premiumScansLeft}
                  </td>
                  <td className="py-3 px-2">
                    <select
                      id={`tier-${o.id}`}
                      defaultValue={o.subscriptionTier as SubscriptionTier}
                      className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
                    >
                      {tierOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 px-2">
                    <select id={`mode-${o.id}`} defaultValue="standard" className="rounded-lg border border-slate-200 px-2 py-1 text-xs">
                      {MODE_OPTIONS.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 px-2">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => applyRow(o.id)}
                      className="rounded-lg bg-emerald-600 text-white px-3 py-1.5 text-xs font-bold disabled:opacity-50"
                    >
                      החלה
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
