"use client";

import { useState, useTransition } from "react";
import { UserPlus, CheckCircle2, KeyRound, Loader2 } from "lucide-react";
import {
  approveOrganizationAction,
  approvePendingRegistrationAction,
  provisionUserAction,
} from "@/app/actions/admin-subscriptions";
import { ADMIN_PLAN_OPTIONS, planLabelHe } from "@/lib/subscription-plans";
import { generateProvisionPassword } from "@/lib/password";

type PendingOrg = {
  id: string;
  name: string;
  plan: string;
  createdAt: string;
};

type OrgOption = { id: string; name: string };
type PendingUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
  organizationId: string;
  organizationName: string;
  organizationPlan: string;
  organizationStatus: string;
};

const ROLES: { value: string; label: string }[] = [
  { value: "ORG_ADMIN", label: "מנהל ארגון" },
  { value: "PROJECT_MGR", label: "מנהל פרויקטים" },
  { value: "EMPLOYEE", label: "עובד" },
  { value: "CLIENT", label: "לקוח" },
];

export default function AdminSubscriptionTools({
  pendingOrgs,
  allOrgs,
  pendingUsers,
}: {
  pendingOrgs: PendingOrg[];
  allOrgs: OrgOption[];
  pendingUsers: PendingUser[];
}) {
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [genPassword, setGenPassword] = useState(() => generateProvisionPassword(14));

  const onApprove = (organizationId: string, plan: string) => {
    setMsg(null);
    setErr(null);
    startTransition(async () => {
      const r = await approveOrganizationAction(organizationId, plan);
      if (r.ok) {
        setMsg("המנוי אושר והמשתמשים הופעלו.");
        window.location.reload();
      } else {
        setErr(r.error);
      }
    });
  };

  return (
    <div className="space-y-10">
      <section className="rounded-2xl border border-indigo-500/30 bg-indigo-500/15 p-6 md:p-8">
        <h2 className="text-xl font-black italic text-gray-900 mb-2 flex items-center gap-2">
          <CheckCircle2 className="text-indigo-400" size={22} />
          משתמשים ממתינים לאישור והגדרה
        </h2>
        <p className="text-sm text-gray-700 mb-6">
          לכל רישום חדש ניתן לקבוע תפקיד וחבילה, לאשר ולהפעיל מיד.
        </p>
        {pendingUsers.length === 0 ? (
          <p className="text-gray-500 text-sm">אין משתמשים ממתינים.</p>
        ) : (
          <ul className="space-y-3">
            {pendingUsers.map((u) => (
              <li
                key={u.id}
                className="bg-white rounded-xl border border-indigo-500/20 p-4 flex flex-col gap-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-bold text-gray-900">
                      {u.name || "ללא שם"} · {u.email}
                    </p>
                    <p className="text-xs text-gray-400">
                      ארגון: {u.organizationName} · נוצר{" "}
                      {new Date(u.createdAt).toLocaleDateString("he-IL")}
                    </p>
                  </div>
                  <div className="text-[11px] text-gray-400">
                    מצב ארגון: {u.organizationStatus} · תוכנית נוכחית: {u.organizationPlan}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    id={`pending-role-${u.id}`}
                    defaultValue={u.role || "ORG_ADMIN"}
                    className="rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white"
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                  <select
                    id={`pending-plan-${u.id}`}
                    defaultValue={u.organizationPlan || "FREE"}
                    className="rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white"
                  >
                    {ADMIN_PLAN_OPTIONS.map((p) => (
                      <option key={p} value={p}>
                        {planLabelHe(p)} ({p})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      setMsg(null);
                      setErr(null);
                      const roleSel = document.getElementById(
                        `pending-role-${u.id}`,
                      ) as HTMLSelectElement | null;
                      const planSel = document.getElementById(
                        `pending-plan-${u.id}`,
                      ) as HTMLSelectElement | null;
                      const nextRole = roleSel?.value ?? "ORG_ADMIN";
                      const nextPlan = planSel?.value ?? "FREE";
                      startTransition(async () => {
                        const r = await approvePendingRegistrationAction(
                          u.id,
                          nextRole,
                          nextPlan,
                        );
                        if (r.ok) {
                          setMsg(`המשתמש ${u.email} אושר והופעל.`);
                          window.location.reload();
                        } else {
                          setErr(r.error);
                        }
                      });
                    }}
                    className="rounded-xl bg-indigo-600 hover:bg-indigo-500/15 text-white px-4 py-2 text-sm font-bold disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    {pending ? <Loader2 className="animate-spin" size={16} /> : null}
                    אשר רישום
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-indigo-500/30 bg-indigo-500/15 p-6 md:p-8">
        <h2 className="text-xl font-black italic text-indigo-800 mb-2 flex items-center gap-2">
          <CheckCircle2 className="text-indigo-400" size={22} />
          בקשות הרשמה ממתינות לאישור
        </h2>
        <p className="text-sm text-gray-700 mb-6">
          לאחר אישור — המשתמש יוכל להתחבר עם Google (אם חשבון קיים) או עם סיסמה אם יצרת משתמש
          בפריסה יזומה.
        </p>
        {pendingOrgs.length === 0 ? (
          <p className="text-gray-500 text-sm">אין בקשות ממתינות.</p>
        ) : (
          <ul className="space-y-4">
            {pendingOrgs.map((o) => (
              <li
                key={o.id}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white rounded-xl border border-indigo-500/20 p-4"
              >
                <div>
                  <p className="font-bold text-gray-900">{o.name}</p>
                  <p className="text-xs text-gray-400">
                    תוכנית נוכחית (בקשה): {o.plan} · נוצר{" "}
                    {new Date(o.createdAt).toLocaleDateString("he-IL")}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    id={`plan-${o.id}`}
                    className="rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white"
                    defaultValue="FREE"
                  >
                    {ADMIN_PLAN_OPTIONS.map((p) => (
                      <option key={p} value={p}>
                        {planLabelHe(p)} ({p})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      const sel = document.getElementById(
                        `plan-${o.id}`,
                      ) as HTMLSelectElement | null;
                      const plan = sel?.value ?? "FREE";
                      onApprove(o.id, plan);
                    }}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-500/15 text-white px-4 py-2 text-sm font-bold disabled:opacity-50 flex items-center gap-2"
                  >
                    {pending ? <Loader2 className="animate-spin" size={18} /> : null}
                    אשר והפעל
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 md:p-8 shadow-sm">
        <h2 className="text-xl font-black italic text-gray-900 mb-2 flex items-center gap-2">
          <UserPlus className="text-indigo-400" size={22} />
          יצירת משתמש ומנוי (סיסמה)
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          מחולל סיסמה; ניתן לשלוח אימייל אוטומטי (דורש RESEND_API_KEY) או להעתיק מהמסך. אם האימייל כבר
          קיים באותו ארגון (למשל אחרי הרשמה) — תעודכן הסיסמה והחשבון יופעל.
        </p>
        <form
          action={(fd) => {
            setMsg(null);
            setErr(null);
            startTransition(() => {
              void (async () => {
                const r = await provisionUserAction(fd);
                if (r.ok) {
                  setMsg(
                    r.emailed
                      ? "המשתמש נוצר ונשלח אימייל."
                      : `המשתמש נוצר. סיסמה: ${r.password ?? ""}`,
                  );
                  setGenPassword(generateProvisionPassword(14));
                  window.location.reload();
                } else {
                  setErr(r.error);
                }
              })();
            });
          }}
          className="grid gap-4 max-w-xl"
        >
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">אימייל</label>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">שם תצוגה</label>
            <input name="name" className="w-full rounded-xl border border-gray-200 px-4 py-2.5" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">ארגון</label>
            <select
              name="organizationId"
              required
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 bg-white"
            >
              <option value="">בחרו…</option>
              {allOrgs.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">הרשאה</label>
            <select
              name="role"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 bg-white"
              defaultValue="EMPLOYEE"
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
              <input type="checkbox" name="useGenerated" defaultChecked />
              מחולל סיסמה אוטומטי
            </label>
            <button
              type="button"
              className="text-sm font-bold text-indigo-400 flex items-center gap-1"
              onClick={() => setGenPassword(generateProvisionPassword(14))}
            >
              <KeyRound size={16} />
              צור חדשה: <code className="bg-white px-2 py-0.5 rounded">{genPassword}</code>
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              או סיסמה ידנית (כבו &quot;אוטומטי&quot; למעלה)
            </label>
            <input
              name="passwordManual"
              type="text"
              autoComplete="new-password"
              placeholder="השאירו ריק אם מסומן אוטומטי"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="sendEmail" defaultChecked />
            שלח אימייל עם פרטי כניסה
          </label>
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-500/15 text-white font-bold py-3 disabled:opacity-50"
          >
            {pending ? "שומר…" : "צור משתמש"}
          </button>
        </form>
        {msg && (
          <p className="mt-4 text-sm font-medium text-emerald-400 bg-emerald-500/15 border border-emerald-100 rounded-xl p-3">
            {msg}
          </p>
        )}
        {err && (
          <p className="mt-4 text-sm font-medium text-rose-300 bg-rose-500/[0.08] border border-red-100 rounded-xl p-3">
            {err}
          </p>
        )}
      </section>
    </div>
  );
}
