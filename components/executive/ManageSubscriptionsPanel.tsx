"use client";

import type { FormEvent } from "react";
import { useMemo, useState, useTransition } from "react";
import type { ExecutiveOrgRow } from "@/app/actions/executive-subscriptions";
import {
  manageSubsAdjustScansAction,
  manageSubsCreateManualUserAction,
  manageSubsListOrganizationsAction,
  manageSubsSendTierInviteAction,
} from "@/app/actions/manage-subscriptions";
import { executiveTierOptionsForSelect } from "@/lib/subscription-tier-config";

const ORG_TYPES = [
  { value: "HOME", label: "משק בית" },
  { value: "FREELANCER", label: "עצמאי" },
  { value: "COMPANY", label: "חברה" },
  { value: "ENTERPRISE", label: "ארגון" },
];

type Props = {
  initialOrgs: ExecutiveOrgRow[];
};

export default function ManageSubscriptionsPanel({ initialOrgs }: Props) {
  const [orgs, setOrgs] = useState(initialOrgs);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const tierOptions = useMemo(() => executiveTierOptionsForSelect(), []);

  const refresh = () => {
    startTransition(async () => {
      const r = await manageSubsListOrganizationsAction();
      if (Array.isArray(r)) setOrgs(r);
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
        setMsg("נוצר ארגון ומשתמש — נשלח מייל עם סיסמה זמנית (אם הוגדר Resend/SMTP).");
        refresh();
        e.currentTarget.reset();
      } else setErr(r.error);
    });
  };

  const onAdjust = (organizationId: string) => (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    const fd = new FormData(ev.currentTarget);
    fd.set("organizationId", organizationId);
    setMsg(null);
    setErr(null);
    startTransition(async () => {
      const r = await manageSubsAdjustScansAction(fd);
      if (r.ok) {
        setMsg("יתרת סריקות עודכנה.");
        refresh();
        ev.currentTarget.reset();
      } else setErr(r.error);
    });
  };

  const onInvite = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setMsg(null);
    setErr(null);
    startTransition(async () => {
      const r = await manageSubsSendTierInviteAction(fd);
      if (r.ok) {
        setMsg("נוצרה הזמנה ונשלח מייל עם קישור הרשמה.");
        e.currentTarget.reset();
      } else setErr(r.error);
    });
  };

  return (
    <div className="space-y-10">
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
        <h2 className="text-xl font-black text-slate-900 mb-2">יצירת משתמש ידנית (VIP / בדיקות)</h2>
        <p className="text-sm text-slate-500 mb-6">
          דילוג על PayPal — חשבון פעיל מיד. סימון VIP מפעיל דילוג על ניכוי סריקות ומכסה גבוהה.
        </p>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={onCreateUser}>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-500 mb-1">אימייל</label>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">שם (אופציונלי)</label>
            <input name="name" className="w-full rounded-xl border border-slate-200 px-4 py-2.5" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">שם ארגון</label>
            <input
              name="organizationName"
              required
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">סוג לקוח</label>
            <select name="orgType" className="w-full rounded-xl border border-slate-200 px-4 py-2.5">
              {ORG_TYPES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">רמת מנוי (בלי VIP)</label>
            <select name="tier" className="w-full rounded-xl border border-slate-200 px-4 py-2.5">
              {tierOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2 pb-1">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer">
              <input type="checkbox" name="vip" className="rounded border-slate-300" />
              VIP (ללא ניכוי סריקות)
            </label>
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-xl bg-slate-900 text-white px-6 py-3 font-bold hover:bg-slate-800 disabled:opacity-50"
            >
              צור משתמש וארגון
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 md:p-8 shadow-xl shadow-slate-200/40">
        <h2 className="text-xl font-black text-slate-900 mb-2">הזמנה עם טוקן לרמת מנוי</h2>
        <p className="text-sm text-slate-500 mb-6">
          נשלח מייל עם קישור ל־<code className="text-xs">/register?invite=…</code> — יש להירשם עם אותו אימייל.
        </p>
        <form className="grid gap-4 md:grid-cols-3" onSubmit={onInvite}>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">אימייל מוזמן</label>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">רמה</label>
            <select name="tier" required className="w-full rounded-xl border border-slate-200 px-4 py-2.5">
              {tierOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">תוקף (ימים)</label>
            <input
              name="validDays"
              type="number"
              min={1}
              max={90}
              defaultValue={14}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
            />
          </div>
          <div className="md:col-span-3">
            <button
              type="submit"
              disabled={pending}
              className="rounded-xl bg-violet-600 text-white px-6 py-3 font-bold hover:bg-violet-700 disabled:opacity-50"
            >
              צור הזמנה ושלח מייל
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 md:p-8 shadow-xl shadow-slate-200/40">
        <h2 className="text-xl font-black text-slate-900 mb-6">ארגונים — עדכון יתרות סריקה</h2>
        <div className="space-y-8 max-h-[560px] overflow-y-auto pe-2">
          {orgs.map((o) => (
            <div
              key={o.id}
              className="rounded-2xl border border-slate-100 bg-slate-50/60 p-5 space-y-3"
            >
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <p className="font-black text-slate-900">{o.name}</p>
                  <p className="text-xs text-slate-500 font-mono" dir="ltr">
                    {o.id}
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    {o.subscriptionTier} · זול {o.cheapScansRemaining} / פרימיום {o.premiumScansRemaining}
                  </p>
                </div>
              </div>
              <form className="flex flex-wrap gap-3 items-end" onSubmit={onAdjust(o.id)}>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">זול ±</label>
                  <input
                    name="cheapDelta"
                    type="number"
                    defaultValue={0}
                    className="w-28 rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">פרימיום ±</label>
                  <input
                    name="premiumDelta"
                    type="number"
                    defaultValue={0}
                    className="w-28 rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-lg bg-slate-800 text-white text-sm font-bold px-4 py-2 hover:bg-slate-700 disabled:opacity-50"
                >
                  עדכן יתרה
                </button>
              </form>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
