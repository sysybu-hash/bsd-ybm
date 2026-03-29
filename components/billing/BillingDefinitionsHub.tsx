"use client";

import type { FormEvent } from "react";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CompanyType, CustomerType, SubscriptionTier } from "@prisma/client";
import { Building2, Mail, Save, Shield, Sparkles } from "lucide-react";
import {
  updateOrganizationAction,
  updateBillingConnectionsAction,
} from "@/app/actions/org-settings";
import { executiveSendJoinInviteAction } from "@/app/actions/executive-subscriptions";
import { executiveTierOptionsForSelect, tierLabelHe } from "@/lib/subscription-tier-config";
import { useI18n } from "@/components/I18nProvider";

const ORG_TYPE_VALUES = [
  { value: "HOME", msgKey: "settings.orgTypeHome" as const },
  { value: "FREELANCER", msgKey: "settings.orgTypeFreelancer" as const },
  { value: "COMPANY", msgKey: "settings.orgTypeCompany" as const },
  { value: "ENTERPRISE", msgKey: "settings.orgTypeEnterprise" as const },
];

const COMPANY_TYPE_VALUES = [
  { value: "LICENSED_DEALER", label: "עוסק מורשה (מע״מ)" },
  { value: "EXEMPT_DEALER", label: "עוסק פטור (ללא מע״מ)" },
  { value: "LTD_COMPANY", label: "חברה בע״מ" },
] as const;

type OrgSnapshot = {
  name: string;
  type: CustomerType;
  companyType: CompanyType;
  taxId: string | null;
  address: string | null;
  isReportable: boolean;
  paypalMerchantEmail: string | null;
  paypalMeSlug: string | null;
  liveDataTier: string;
  subscriptionTier: SubscriptionTier;
  isVip: boolean;
  trialEndsAt: Date | null;
};

type Props = {
  initial: OrgSnapshot;
  canEditOrgBilling: boolean;
  showExecutiveInvite: boolean;
};

function formatTrial(d: Date | null) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("he-IL", {
    dateStyle: "short",
  }).format(new Date(d));
}

export default function BillingDefinitionsHub({
  initial,
  canEditOrgBilling,
  showExecutiveInvite,
}: Props) {
  const { t } = useI18n();
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const tierOptions = executiveTierOptionsForSelect();

  const onOrgSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setMsg(null);
    setErr(null);
    startTransition(async () => {
      const r = await updateOrganizationAction(fd);
      if (r.ok) {
        setMsg("פרטי ארגון ומס נשמרו.");
        router.refresh();
      } else setErr(r.error);
    });
  };

  const onBillingConnSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setMsg(null);
    setErr(null);
    startTransition(async () => {
      const r = await updateBillingConnectionsAction(fd);
      if (r.ok) {
        setMsg("הגדרות תשלום ורמת נתונים נשמרו.");
        router.refresh();
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
        (e.target as HTMLFormElement).reset();
      } else setErr(r.error);
    });
  };

  const sectionClass =
    "rounded-[1.25rem] border border-white/10 bg-white/[0.07] backdrop-blur-xl p-5 sm:p-6 text-slate-200";

  return (
    <div className="mb-8 space-y-6" dir="rtl">
      {(msg || err) && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
            err
              ? "border-rose-400/40 bg-rose-950/40 text-rose-100"
              : "border-emerald-400/30 bg-emerald-950/30 text-emerald-100"
          }`}
        >
          {err ?? msg}
        </div>
      )}

      {/* מצב מנוי — קריאה בלבד (מקור אמת בטבלת Organization) */}
      <section className={sectionClass}>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Shield className="h-5 w-5 text-sky-400" aria-hidden />
          <h2 className="text-lg font-black text-white">מצב מנוי (קריאה בלבד)</h2>
        </div>
        <p className="text-sm text-slate-400 leading-relaxed">
          רמה נוכחית:{" "}
          <strong className="text-white">
            {tierLabelHe(initial.subscriptionTier)} ({initial.subscriptionTier})
          </strong>
          {" · "}
          VIP: <strong className="text-white">{initial.isVip ? "כן" : "לא"}</strong>
          {" · "}
          סיום ניסיון (FREE):{" "}
          <strong className="text-white">{formatTrial(initial.trialEndsAt)}</strong>
        </p>
        <p className="mt-2 text-xs text-slate-500">
          שינוי רמה ידני / טוקן הזמנה — במסכי Executive או בטופס יצירת משתמש (SuperAdmin). קישורים:{" "}
          <Link href="/dashboard/executive/subscriptions" className="text-sky-400 underline font-bold">
            ניהול מנויים והזמנות
          </Link>
          {" · "}
          <Link
            href="/dashboard/executive/manage-subscriptions"
            className="text-violet-300 underline font-bold"
          >
            ניהול מתקדם
          </Link>
        </p>
      </section>

      {/* לוח עסק ומס — אותם שדות כמו בהגדרות › חשבון */}
      <section className={sectionClass}>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Building2 className="h-5 w-5 text-amber-400" aria-hidden />
          <h2 className="text-lg font-black text-white">לוח עסק וסיווג מס</h2>
        </div>
        {!canEditOrgBilling ? (
          <p className="text-sm text-slate-400">
            עדכון פרטי מס וכתובת — רק <strong className="text-slate-200">מנהל ארגון</strong>. ערכים
            נוכחיים: {initial.companyType}, ח.פ: {initial.taxId ?? "—"}
          </p>
        ) : (
          <form className="space-y-4 max-w-xl" onSubmit={onOrgSubmit}>
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-1">שם העסק / הארגון</label>
              <input
                name="name"
                required
                defaultValue={initial.name}
                className="w-full rounded-xl border border-white/15 bg-slate-900/60 px-4 py-2.5 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-1">סוג לקוח (ארגון)</label>
              <select
                name="type"
                defaultValue={initial.type}
                className="w-full rounded-xl border border-white/15 bg-slate-900/60 px-4 py-2.5 text-white"
              >
                {ORG_TYPE_VALUES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {t(o.msgKey)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-1">
                סיווג מס (חשבוניות / מע״מ)
              </label>
              <select
                name="companyType"
                defaultValue={initial.companyType}
                className="w-full rounded-xl border border-white/15 bg-slate-900/60 px-4 py-2.5 text-white"
              >
                {COMPANY_TYPE_VALUES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-1">ח.פ / ע.מ</label>
              <input
                name="taxId"
                defaultValue={initial.taxId ?? ""}
                className="w-full rounded-xl border border-white/15 bg-slate-900/60 px-4 py-2.5 text-white"
                dir="ltr"
                placeholder="מספר עוסק / חברה"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-1">כתובת להצגה במסמכים</label>
              <textarea
                name="address"
                rows={3}
                defaultValue={initial.address ?? ""}
                className="w-full rounded-xl border border-white/15 bg-slate-900/60 px-4 py-2.5 text-white resize-y min-h-[5rem]"
              />
            </div>
            <label className="flex items-start gap-3 cursor-pointer text-sm font-medium text-slate-200">
              <input
                type="checkbox"
                name="isReportable"
                defaultChecked={initial.isReportable}
                className="mt-1 h-4 w-4 rounded border-slate-500"
              />
              <span>
                ארגון מדווח למס (חשבוניות והפקות רשמיות)
                <span className="block text-xs font-normal text-slate-500 mt-1">
                  כבו לניהול אישי בלבד — מסמכים כמזכר פנימי ללא חישוב מע״מ.
                </span>
              </span>
            </label>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500/90 px-5 py-2.5 text-sm font-black text-slate-900 disabled:opacity-50"
            >
              <Save size={18} />
              שמירת לוח עסק ומס
            </button>
          </form>
        )}
      </section>

      {/* PayPal ארגון + רמת נתונים חיים */}
      {canEditOrgBilling ? (
        <section className={sectionClass}>
          <h2 className="text-lg font-black text-white mb-4">תשלומים מלקוחות ורמת נתונים חיים</h2>
          <p className="text-xs text-slate-500 mb-4">
            אותם שדות כמו ב־הגדרות › מנויים — נשמרים בטבלת <code className="text-slate-400">Organization</code>.
          </p>
          <form className="space-y-4 max-w-xl" onSubmit={onBillingConnSubmit}>
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-1">
                מייל חשבון PayPal של הארגון
              </label>
              <input
                name="paypalMerchantEmail"
                defaultValue={initial.paypalMerchantEmail ?? ""}
                className="w-full rounded-xl border border-white/15 bg-slate-900/60 px-4 py-2.5 text-white"
                dir="ltr"
                placeholder="לקוח@paypal.com"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-1">שם משתמש PayPal.Me</label>
              <input
                name="paypalMeSlug"
                defaultValue={initial.paypalMeSlug ?? ""}
                className="w-full rounded-xl border border-white/15 bg-slate-900/60 px-4 py-2.5 text-white"
                dir="ltr"
                placeholder="ללא paypal.me/"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-1">רמת נתונים חיים</label>
              <select
                name="liveDataTier"
                defaultValue={initial.liveDataTier}
                className="w-full rounded-xl border border-white/15 bg-slate-900/60 px-4 py-2.5 text-white"
              >
                <option value="basic">בסיסי</option>
                <option value="standard">מתקדם</option>
                <option value="premium">פרימיום</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-black text-white disabled:opacity-50"
            >
              <Save size={18} />
              שמירה
            </button>
          </form>
        </section>
      ) : null}

      {/* הזמנה במייל — Executive */}
      {showExecutiveInvite ? (
        <section className={`${sectionClass} border-indigo-400/25`}>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Mail className="h-5 w-5 text-indigo-400" aria-hidden />
            <h2 className="text-lg font-black text-white">הזמנת הצטרפות במייל (פלטפורמה)</h2>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            נשלח מייל עם קישור להתחברות/הרשמה. ניתן לציין רמת מנוי מוצעת בגוף ההודעה. לניהול מלא (ארגונים,
            PayPal גלובלי) —{" "}
            <Link href="/dashboard/executive/subscriptions" className="text-indigo-300 underline font-bold">
              כאן
            </Link>
            .
          </p>
          <form className="grid gap-3 md:grid-cols-2 max-w-3xl" onSubmit={onInviteSubmit}>
            <input
              name="email"
              type="email"
              required
              placeholder="לקוח@דומיין"
              className="rounded-xl border border-white/15 bg-slate-900/60 px-3 py-2 text-sm text-white"
              dir="ltr"
            />
            <input
              name="headline"
              placeholder="כותרת המייל"
              className="rounded-xl border border-white/15 bg-slate-900/60 px-3 py-2 text-sm text-white"
            />
            <select
              name="tierHint"
              className="rounded-xl border border-white/15 bg-slate-900/60 px-3 py-2 text-sm text-white md:col-span-2"
            >
              <option value="">ללא ציון רמת מנוי במייל</option>
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
              className="md:col-span-2 rounded-xl border border-white/15 bg-slate-900/60 px-3 py-2 text-sm text-white"
            />
            <button
              type="submit"
              disabled={pending}
              className="md:col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-black text-white disabled:opacity-50"
            >
              <Sparkles size={18} />
              שליחת הזמנה
            </button>
          </form>
        </section>
      ) : null}
    </div>
  );
}
