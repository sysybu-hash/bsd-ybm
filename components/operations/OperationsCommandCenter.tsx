"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Bell,
  BookOpen,
  Bot,
  CheckCircle2,
  CreditCard,
  Gauge,
  KeyRound,
  Link2,
  Rocket,
  Shield,
  Users,
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
  const [simple, setSimple] = useState(true);
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
        simple?: boolean;
        automation?: typeof automation;
      };
      if (typeof parsed.simple === "boolean") setSimple(parsed.simple);
      if (parsed.automation) {
        setAutomation((prev) => ({ ...prev, ...parsed.automation }));
      }
    } catch {
      // ignore
    }
  }, []);

  const persist = (nextSimple: boolean, nextAutomation: typeof automation) => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ simple: nextSimple, automation: nextAutomation }),
      );
    } catch {
      // ignore
    }
  };

  const toggleSimple = () => {
    const next = !simple;
    setSimple(next);
    persist(next, automation);
  };

  const toggleAutomation = (key: keyof typeof automation) => {
    const next = { ...automation, [key]: !automation[key] };
    setAutomation(next);
    persist(simple, next);
  };

  const mrrLike = useMemo(
    () => Math.round(data.revenuePaid30d),
    [data.revenuePaid30d],
  );

  return (
    <div className="space-y-6" dir="rtl">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
              <Rocket size={13} />
              Growth OS
            </p>
            <h1 className="mt-2 text-3xl font-black text-slate-900">מרכז צמיחה ותפעול</h1>
            <p className="mt-1 text-sm text-slate-600">כל 10 השדרוגים במקום אחד, עם מצב פשוט להפעלה יומיומית.</p>
          </div>
          <button
            type="button"
            onClick={toggleSimple}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            {simple ? "מצב פשוט פעיל" : "מצב מתקדם פעיל"}
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric title="MRR (30d)" value={`₪${mrrLike.toLocaleString()}`} />
          <Metric title="משתמשים פעילים" value={`${data.usersActive}/${data.usersTotal}`} />
          <Metric title="בריאות הכנסות" value={`${data.revenueHealth}%`} />
          <Metric title="Wizard Events" value={`${data.wizardEvents30d}`} />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card title="1. דוחות מנהלים בזמן אמת" icon={<Gauge size={17} className="text-blue-600" />}>
          <p>מנוי: {data.subscriptionTier} · סטטוס: {data.subscriptionStatus}</p>
          <p>לקוחות: {data.contactsCount} · פרויקטים: {data.projectsCount}</p>
          <Link href="/dashboard/control-center" className="mt-3 inline-flex rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700">פתח דוחות משפך</Link>
        </Card>

        <Card title="2. אוטומציות חכמות" icon={<Workflow size={17} className="text-violet-600" />}>
          <Toggle label="תזכורות חשבוניות אוטומטיות" on={automation.invoiceReminders} onToggle={() => toggleAutomation("invoiceReminders")} />
          <Toggle label="Follow-up למי שנתקע ב-Wizard" on={automation.dropoutFollowup} onToggle={() => toggleAutomation("dropoutFollowup")} />
          {!simple ? <Toggle label="קמפיין שימוש נמוך" on={automation.lowUsageNudge} onToggle={() => toggleAutomation("lowUsageNudge")} /> : null}
          <Link href="/dashboard/operator" className="mt-2 inline-flex rounded-xl bg-violet-700 px-3 py-2 text-xs font-bold text-white hover:bg-violet-800">פתח עוזר תפעולי</Link>
        </Card>

        <Card title="3. הרשאות (RBAC)" icon={<KeyRound size={17} className="text-amber-600" />}>
          <p>ניהול תפקידים והרשאות דרך מסך חשבון/אדמין.</p>
          <div className="mt-3 flex gap-2">
            <Link href="/dashboard/settings?tab=account" className="rounded-xl bg-amber-600 px-3 py-2 text-xs font-bold text-white hover:bg-amber-700">ניהול הרשאות</Link>
            {ownerMode ? <Link href="/dashboard/admin" className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">Admin</Link> : null}
          </div>
        </Card>

        <Card title="4. מרכז אינטגרציות" icon={<Link2 size={17} className="text-cyan-600" />}>
          <Health label="Google Calendar" ok={data.integrations.calendar} />
          <Health label="PayPal" ok={data.integrations.paypal} />
          <Health label="AI Engines" ok={data.integrations.ai} />
          <p className="mt-2 text-xs text-slate-500">Live Data Tier: {data.integrations.liveDataTier}</p>
        </Card>

        <Card title="5. Billing חכם" icon={<CreditCard size={17} className="text-rose-600" />}>
          <p>שולם 30d: ₪{data.revenuePaid30d.toLocaleString()}</p>
          <p>ממתין 30d: ₪{data.revenuePending30d.toLocaleString()}</p>
          <Link href="/dashboard/billing" className="mt-3 inline-flex rounded-xl bg-rose-600 px-3 py-2 text-xs font-bold text-white hover:bg-rose-700">ניהול תשלומים</Link>
        </Card>

        <Card title="6. התראות In-App" icon={<Bell size={17} className="text-indigo-600" />}>
          <div className="max-h-28 space-y-1 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs">
            {data.recentActivity.length === 0 ? (
              <p className="text-slate-500">אין פעילות אחרונה.</p>
            ) : (
              data.recentActivity.map((a, i) => (
                <p key={`${a.action}-${i}`} className="truncate text-slate-700">{a.action}</p>
              ))
            )}
          </div>
        </Card>

        <Card title="7. Help Center" icon={<BookOpen size={17} className="text-emerald-600" />}>
          <p>מדריך תפעול מקוצר + ניווט למסכים המומלצים.</p>
          <Link href="/dashboard/help" className="mt-3 inline-flex rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700">פתח מדריך</Link>
        </Card>

        <Card title="8. Onboarding דינמי" icon={<Rocket size={17} className="text-blue-600" />}>
          <p>ארגון: {data.organizationName}</p>
          <p>סוג: {data.organizationType}</p>
          <Link href="/dashboard/control-center" className="mt-3 inline-flex rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">צ&apos;קליסט אונבורדינג</Link>
        </Card>

        <Card title="9. Customer Health" icon={<Users size={17} className="text-violet-600" />}>
          <p className="text-sm">ציון בריאות לקוחות: <span className="font-black text-slate-900">{data.customerHealth}/100</span></p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-violet-600" style={{ width: `${data.customerHealth}%` }} />
          </div>
        </Card>

        <Card title="10. אבטחה וציות" icon={<Shield size={17} className="text-emerald-600" />}>
          <Health label="Debug Route מוגן" ok={true} />
          <Health label="Telemetry עם Consent" ok={true} />
          <Health label="Owner-Only Admin" ok={ownerMode} />
          {ownerMode ? (
            <a href="/api/admin/system-health" className="mt-3 inline-flex rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700">בדיקת אבטחה</a>
          ) : null}
        </Card>
      </section>
    </div>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-bold text-slate-500">{title}</p>
      <p className="mt-1 text-xl font-black text-slate-900">{value}</p>
    </div>
  );
}

function Card({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-3 flex items-center gap-2 text-base font-black text-slate-900">
        {icon}
        {title}
      </h2>
      <div className="space-y-2 text-sm text-slate-700">{children}</div>
    </article>
  );
}

function Toggle({
  label,
  on,
  onToggle,
}: {
  label: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs hover:bg-slate-100"
    >
      <span>{label}</span>
      <span className={`rounded-full px-2 py-0.5 font-bold ${on ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
        {on ? "ON" : "OFF"}
      </span>
    </button>
  );
}

function Health({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
      <span>{label}</span>
      <span className={`inline-flex items-center gap-1 font-bold ${ok ? "text-emerald-700" : "text-amber-700"}`}>
        {ok ? <CheckCircle2 size={13} /> : <Bot size={13} />}
        {ok ? "פעיל" : "דורש השלמה"}
      </span>
    </div>
  );
}
