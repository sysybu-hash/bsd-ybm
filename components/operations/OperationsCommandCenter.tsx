"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Bell,
  Bot,
  CheckCircle2,
  Gauge,
  Link2,
  ListChecks,
  Workflow,
} from "lucide-react";

type Data = {
  organizationName: string;
  organizationType: string;
  subscriptionTier: string;
  subscriptionStatus: string;
  trialEndsAtIso: string | null;
  usersTotal: number;
  usersActive: number;
  contactsCount: number;
  projectsCount: number;
  revenuePaid30d: number;
  revenuePending30d: number;
  revenueHealth: number;
  wizardEvents30d: number;
  customerHealth: number;
  integrations: {
    calendar: boolean;
    paypal: boolean;
    ai: boolean;
    liveDataTier: string;
  };
  recentActivity: Array<{
    action: string;
    details: string;
    createdAtIso: string;
  }>;
};

const STORAGE_KEY = "bsd-operations:center";

export default function OperationsCommandCenter({
  data,
  ownerMode,
}: {
  data: Data;
  ownerMode: boolean;
}) {
  const [automation, setAutomation] = useState({
    invoiceReminders: true,
    dropoutFollowup: true,
    lowUsageNudge: true,
  });

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        automation?: typeof automation;
      };
      if (parsed.automation) {
        setAutomation((prev) => ({ ...prev, ...parsed.automation }));
      }
    } catch {
      // ignore
    }
  }, []);

  const persist = (nextAutomation: typeof automation) => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ automation: nextAutomation }),
      );
    } catch {
      // ignore
    }
  };

  const toggleAutomation = (key: keyof typeof automation) => {
    const next = { ...automation, [key]: !automation[key] };
    setAutomation(next);
    persist(next);
  };

  const mrrLike = useMemo(
    () => Math.round(data.revenuePaid30d),
    [data.revenuePaid30d],
  );

  return (
    <div className="space-y-6" dir="rtl">
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-[linear-gradient(135deg,_#f8fbff_0%,_#eef6ff_55%,_#ffffff_100%)] px-6 py-7 md:px-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-white px-3 py-1 text-xs font-black text-blue-700">
                <ListChecks size={13} />
                מרכז תפעול
              </p>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">תמונה תפעולית אחת, בלי עומס מיותר</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                המסך הזה מרכז רק את מה שצריך לבדוק עכשיו: בריאות עסקית, אוטומציות, אינטגרציות ופעילות אחרונה.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/dashboard" className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
                חזרה למסך הבית
              </Link>
              <Link href="/dashboard/operator" className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800">
                פתח עוזר תפעולי
              </Link>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-4">
            <Metric title="הכנסות 30 יום" value={`₪${mrrLike.toLocaleString()}`} tone="blue" />
            <Metric title="משתמשים פעילים" value={`${data.usersActive}/${data.usersTotal}`} tone="emerald" />
            <Metric title="בריאות הכנסות" value={`${data.revenueHealth}%`} tone="amber" />
            <Metric title="פעולות Wizard" value={`${data.wizardEvents30d}`} tone="violet" />
          </div>
        </div>

        <div className="grid gap-5 px-6 py-6 md:px-8 xl:grid-cols-[1.15fr_0.85fr]">
          <section className="space-y-5">
            <Panel
              title="מצב עסק ומערכת"
              description="מבט קצר על בסיס הלקוחות, ההכנסות והמנוי."
              icon={<Gauge size={17} className="text-blue-600" />}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <MiniStat label="ארגון" value={`${data.organizationName} · ${data.organizationType}`} />
                <MiniStat label="מנוי" value={`${data.subscriptionTier} · ${data.subscriptionStatus}`} />
                <MiniStat label="לקוחות ופרויקטים" value={`${data.contactsCount} לקוחות · ${data.projectsCount} פרויקטים`} />
                <MiniStat label="הכנסות ממתינות" value={`₪${data.revenuePending30d.toLocaleString()}`} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <QuickLink href="/dashboard/control-center" label="מרכז עבודה" tone="primary" />
                <QuickLink href="/dashboard/billing" label="מנוי ותשלום" />
              </div>
            </Panel>

            <Panel
              title="אוטומציות"
              description="שלוש פעולות קבועות, עם מצב ברור וללא רעש."
              icon={<Workflow size={17} className="text-violet-600" />}
            >
              <div className="space-y-3">
                <ToggleCard label="תזכורות חשבוניות אוטומטיות" hint="מעקב גבייה שקט" on={automation.invoiceReminders} onToggle={() => toggleAutomation("invoiceReminders")} />
                <ToggleCard label="מעקב אחרי נטישת Wizard" hint="החזרת משתמשים שנעצרו" on={automation.dropoutFollowup} onToggle={() => toggleAutomation("dropoutFollowup")} />
                <ToggleCard label="התראה על שימוש נמוך" hint="זיהוי ירידה במעורבות" on={automation.lowUsageNudge} onToggle={() => toggleAutomation("lowUsageNudge")} />
              </div>
            </Panel>
          </section>

          <section className="space-y-5">
            <Panel
              title="בריאות סביבת העבודה"
              description="חיבורים, AI והרשאות במסך אחד קצר."
              icon={<Link2 size={17} className="text-cyan-600" />}
            >
              <div className="space-y-2.5">
                <Health label="Google Calendar" ok={data.integrations.calendar} />
                <Health label="PayPal" ok={data.integrations.paypal} />
                <Health label="AI Engines" ok={data.integrations.ai} />
                <Health label="Live data tier" ok={data.integrations.liveDataTier !== "FREE"} okLabel={data.integrations.liveDataTier} missingLabel="FREE" />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <QuickLink href="/dashboard/settings" label="הגדרות" />
                <QuickLink href="/dashboard/settings?tab=account" label="משתמשים" />
                {ownerMode ? <QuickLink href="/dashboard/admin" label="Admin" tone="warning" /> : null}
              </div>
            </Panel>

            <Panel
              title="פעילות אחרונה"
              description="מה באמת קרה השבוע, בלי רשימה כבדה."
              icon={<Bell size={17} className="text-indigo-600" />}
            >
              <div className="space-y-2">
                {data.recentActivity.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                    אין פעילות אחרונה.
                  </div>
                ) : (
                  data.recentActivity.map((activity, index) => (
                    <div key={`${activity.action}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{activity.action}</p>
                          {activity.details ? <p className="mt-1 text-xs text-slate-500">{activity.details}</p> : null}
                        </div>
                        <p className="shrink-0 text-[11px] font-semibold text-slate-400">
                          {new Date(activity.createdAtIso).toLocaleString("he-IL")}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Panel>
          </section>
        </div>

        <div className="border-t border-slate-100 px-6 py-5 md:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] bg-slate-50 px-5 py-4">
            <div>
              <p className="text-sm font-black text-slate-900">קיצורי דרך שעדיין שייכים למסך הזה</p>
              <p className="mt-1 text-xs text-slate-500">פחות קיצורים, רק מה שמקדם פעולה אמיתית.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <QuickLink href="/dashboard/help" label="מדריך" />
              <QuickLink href="/dashboard/control-center" label="משפך Wizard" />
              <QuickLink href="/dashboard/erp/invoice" label="חשבוניות" />
              <QuickLink href="/dashboard/crm" label="CRM" />
              {ownerMode ? <QuickLink href="/api/admin/system-health" label="בדיקת מערכת" tone="primary" /> : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Panel({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50">{icon}</div>
        <div>
          <h2 className="text-base font-black text-slate-900">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </article>
  );
}

function Metric({ title, value, tone = "blue" }: { title: string; value: string; tone?: "blue" | "emerald" | "amber" | "violet" }) {
  const tones = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    violet: "bg-violet-50 text-violet-700 border-violet-100",
  };

  return (
    <div className={`rounded-3xl border px-4 py-4 ${tones[tone]}`}>
      <p className="text-xs font-bold opacity-80">{title}</p>
      <p className="mt-1 text-2xl font-black text-slate-900">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1.5 text-sm font-bold leading-6 text-slate-900">{value}</p>
    </div>
  );
}

function ToggleCard({
  label,
  hint,
  on,
  onToggle,
}: {
  label: string;
  hint: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right hover:bg-slate-100"
    >
      <div>
        <p className="text-sm font-bold text-slate-900">{label}</p>
        <p className="mt-1 text-xs text-slate-500">{hint}</p>
      </div>
      <span className={`rounded-full px-3 py-1 text-xs font-black ${on ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
        {on ? "פעיל" : "כבוי"}
      </span>
    </button>
  );
}

function QuickLink({ href, label, tone = "default" }: { href: string; label: string; tone?: "default" | "primary" | "warning" }) {
  const styles = {
    default: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
    primary: "bg-slate-900 text-white hover:bg-slate-800",
    warning: "bg-amber-500 text-white hover:bg-amber-600",
  };

  return (
    <Link href={href} className={`rounded-2xl px-4 py-2 text-sm font-bold transition-colors ${styles[tone]}`}>
      {label}
    </Link>
  );
}

function Health({
  label,
  ok,
  okLabel = "פעיל",
  missingLabel = "דורש השלמה",
}: {
  label: string;
  ok: boolean;
  okLabel?: string;
  missingLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
      <span className="font-semibold text-slate-700">{label}</span>
      <span className={`inline-flex items-center gap-1.5 font-bold ${ok ? "text-emerald-700" : "text-amber-700"}`}>
        {ok ? <CheckCircle2 size={14} /> : <Bot size={14} />}
        {ok ? okLabel : missingLabel}
      </span>
    </div>
  );
}
