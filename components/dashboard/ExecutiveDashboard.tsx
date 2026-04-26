import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { Activity, BarChart3, Bot, CreditCard, FileText, Users } from "lucide-react";
import { normalizeConstructionTrade, type ConstructionTradeId } from "@/lib/construction-trades";

export type ExecutiveDashboardProps = {
  scanUsed: number;
  scanLimit: number;
  cashDisplay: string;
  cashChangePct: number;
  meckanoFieldActive: number;
  hasMeckano: boolean;
  constructionTrade?: string | null;
};

export function ExecutiveDashboard({
  scanUsed,
  scanLimit,
  cashDisplay,
  cashChangePct,
  meckanoFieldActive,
  hasMeckano,
  constructionTrade,
}: ExecutiveDashboardProps) {
  const trade = normalizeConstructionTrade(constructionTrade) as ConstructionTradeId;
  const scanPct = Math.min(100, Math.max(0, Math.round((scanUsed / Math.max(1, scanLimit)) * 100)));

  const trendClass =
    cashChangePct > 0
      ? "text-emerald-600"
      : cashChangePct < 0
        ? "text-amber-600"
        : "text-[color:var(--ink-500)]";
  const trendSign = cashChangePct > 0 ? "+" : "";

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div className="rounded-lg border border-[color:var(--line)] bg-[color:var(--canvas-raised)] p-6 shadow-[var(--shadow-sm)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black text-[color:var(--axis-ai)]">BSD-YBM OPERATIONS</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-[color:var(--ink-900)]">מרכז בקרה</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--ink-500)]">
                מבט תפעולי אחד ללקוחות, כספים, מסמכים וסריקה רב-מנועית.
              </p>
            </div>
            <div className="hidden h-12 w-12 items-center justify-center rounded-lg bg-[color:var(--axis-ai-soft)] text-[color:var(--axis-ai)] sm:flex">
              <Bot className="h-6 w-6" aria-hidden />
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <MiniMetric icon={FileText} label="סריקות" value={`${scanUsed}/${scanLimit}`} />
            <MiniMetric icon={CreditCard} label="הופק החודש" value={cashDisplay} />
            <MiniMetric icon={Users} label="לקוחות פעילים" value={hasMeckano ? String(meckanoFieldActive) : "-"} />
          </div>
        </div>

        <div className="rounded-lg border border-[color:var(--line)] bg-[color:var(--ink-900)] p-6 text-white shadow-[var(--shadow-sm)]">
          <p className="text-xs font-black text-white/55">AI WORKLOAD</p>
          <div className="mt-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-5xl font-black tabular-nums">{scanPct}%</p>
              <p className="mt-2 text-sm text-white/70">ניצול מכסת סריקה</p>
            </div>
            <Activity className="h-10 w-10 text-[color:var(--axis-ai)]" aria-hidden />
          </div>
          <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-white/12">
            <div className="h-full rounded-full bg-[color:var(--axis-ai)] transition-[width]" style={{ width: `${scanPct}%` }} />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <DashboardCard title="מכסת סריקות AI" actionIcon={<Activity size={20} />}>
          <div className="text-3xl font-black text-[color:var(--ink-900)]">
            {scanUsed} <span className="text-sm font-semibold text-[color:var(--ink-500)]">/ {scanLimit}</span>
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[color:var(--canvas-sunken)]">
            <div className="h-full rounded-full bg-[color:var(--axis-ai)] transition-[width]" style={{ width: `${scanPct}%` }} />
          </div>
        </DashboardCard>

        <DashboardCard title="תזרים מוערך החודש" actionIcon={<CreditCard size={20} />}>
          <div className="text-3xl font-black text-[color:var(--ink-900)]">{cashDisplay}</div>
          <p className="mt-2 flex items-center text-sm">
            <span className={`font-medium ${trendClass}`}>
              {trendSign}
              {cashChangePct}%
            </span>
            <span className="ms-2 text-[color:var(--ink-500)]">מהחודש הקודם</span>
          </p>
        </DashboardCard>

        <DashboardCard title="נוכחות שטח" actionIcon={<Users size={20} />}>
          <div className="text-3xl font-black text-[color:var(--ink-900)]">{hasMeckano ? meckanoFieldActive : "-"}</div>
          <p className="mt-2 text-sm text-[color:var(--ink-500)]">
            {hasMeckano ? "לקוחות פעילים בשטח" : "אין חיבור למקאנו"}
          </p>
        </DashboardCard>
      </div>

      {trade === "ELECTRICAL" || trade === "GENERAL_CONTRACTOR" ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {trade === "ELECTRICAL" ? (
            <DashboardCard title="מעקב מחירי חומרי גלם">
              <p className="text-sm leading-relaxed text-[color:var(--ink-500)]">
                כרטיס ייעודי לעבודות חשמל: השוואת רכש וחריגות מחיר בציוד וחומרים.
              </p>
              <EmptyFrame label="נתונים יוצגו כאן" />
            </DashboardCard>
          ) : null}
          {trade === "GENERAL_CONTRACTOR" ? (
            <DashboardCard title="יומן יציקות וסטטוס בטון">
              <p className="text-sm leading-relaxed text-[color:var(--ink-500)]">
                מבט לקבלן שלד / גמר: לוח זמנים וסטטוס אספקה.
              </p>
              <EmptyFrame label="נתונים יוצגו כאן" />
            </DashboardCard>
          ) : null}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <DashboardCard className="lg:col-span-2" title="השוואת מחירי ERP" actionIcon={<BarChart3 size={20} />}>
          <EmptyFrame label="גרף יוצג כאן" tall />
        </DashboardCard>

        <DashboardCard title="לקוחות פעילים">
          <EmptyFrame label="רשימה תוצג כאן" tall />
        </DashboardCard>
      </div>
    </div>
  );
}

function MiniMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FileText;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-[color:var(--line)] bg-[color:var(--canvas-sunken)] p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-black text-[color:var(--ink-500)]">{label}</span>
        <Icon className="h-4 w-4 text-[color:var(--axis-ai)]" aria-hidden />
      </div>
      <p className="mt-3 truncate text-xl font-black text-[color:var(--ink-900)]">{value}</p>
    </div>
  );
}

function EmptyFrame({ label, tall = false }: { label: string; tall?: boolean }) {
  return (
    <div
      className={`mt-4 flex ${tall ? "h-64" : "h-40"} items-center justify-center rounded-lg border border-dashed border-[color:var(--line-strong)] text-sm font-semibold text-[color:var(--ink-500)]`}
    >
      {label}
    </div>
  );
}
