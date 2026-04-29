import {
  ArrowUpRight,
  Bot,
  CheckCircle2,
  Clock,
  FileText,
  FolderKanban,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import {
  BentoGrid,
  ProgressBar,
  ProgressRing,
  Sparkline,
  Tile,
  TileHeader,
  TileLink,
} from "@/components/ui/bento";
import { normalizeConstructionTrade, type ConstructionTradeId } from "@/lib/construction-trades";

// ─── types ────────────────────────────────────────────────────────────────────

export type RecentProject = {
  id: string;
  name: string;
  isActive: boolean;
  contactCount: number;
};

export type RecentDocument = {
  id: string;
  kind: string;
  contactName: string | null;
  total: number;
  status: string;
  dateStr: string;
};

export type ExecutiveDashboardProps = {
  userFirstName?: string;
  scanUsed: number;
  scanLimit: number;
  cashDisplay: string;
  cashChangePct: number;
  activeClientsCount: number;
  activeProjectsCount: number;
  openDealsCount: number;
  recentProjects: RecentProject[];
  recentDocuments: RecentDocument[];
  sparklineValues: number[];
  constructionTrade?: string | null;
};

// ─── helpers ──────────────────────────────────────────────────────────────────

const DOC_STATUS_LABEL: Record<string, string> = {
  PAID: "שולם",
  PENDING: "ממתין",
  DRAFT: "טיוטה",
  CANCELLED: "בוטל",
};

const DOC_STATUS_COLOR: Record<string, string> = {
  PAID: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  PENDING: "bg-amber-50 text-amber-700 border border-amber-100",
  DRAFT: "bg-slate-50 text-slate-500 border border-slate-100",
  CANCELLED: "bg-rose-50 text-rose-600 border border-rose-100",
};

function fmtCurrency(n: number) {
  return new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(n);
}

// ─── component ────────────────────────────────────────────────────────────────

export function ExecutiveDashboard({
  userFirstName,
  scanUsed,
  scanLimit,
  cashDisplay,
  cashChangePct,
  activeClientsCount,
  activeProjectsCount,
  openDealsCount,
  recentProjects,
  recentDocuments,
  sparklineValues,
  constructionTrade,
}: ExecutiveDashboardProps) {
  const trade = normalizeConstructionTrade(constructionTrade) as ConstructionTradeId;
  const scanPct = Math.min(100, Math.max(0, Math.round((scanUsed / Math.max(1, scanLimit)) * 100)));
  const trendPositive = cashChangePct >= 0;

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6">

      {/* ── Hero: ברכה + 4 KPI + תובנת AI ── */}
      <Tile tone="clients" span={12}>
        <div className="flex flex-col gap-5">
          {/* כותרת */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="tile-eyebrow">BSD-YBM · Command Center</p>
              <h1 className="mt-2 text-[28px] font-black tracking-tight text-[color:var(--ink-900)]">
                {userFirstName ? `שלום, ${userFirstName} 👋` : "לוח בקרה"}
              </h1>
              <p className="mt-1 text-sm text-[color:var(--ink-500)]">
                הנה מה שקורה בעסק שלך היום
              </p>
            </div>
            <div className="hidden h-12 w-12 items-center justify-center rounded-xl bg-[color:var(--axis-clients-soft)] sm:flex">
              <Bot className="h-6 w-6 text-[color:var(--axis-clients)]" aria-hidden />
            </div>
          </div>

          {/* 4 KPI cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KpiChip icon={Users} label="לקוחות פעילים" value={String(activeClientsCount)} axis="clients" />
            <KpiChip icon={FolderKanban} label="פרויקטים פעילים" value={String(activeProjectsCount)} axis="clients" />
            <KpiChip icon={Wallet} label="הופק החודש" value={cashDisplay} axis="finance" />
            <KpiChip icon={Bot} label="סריקות AI" value={`${scanUsed}/${scanLimit}`} axis="ai" />
          </div>

          {/* AI insight strip */}
          <div className="ai-insight-strip flex items-center gap-3">
            <span className="ai-insight-strip__dot">
              <Sparkles className="h-4 w-4" aria-hidden />
            </span>
            <p className="text-sm font-medium text-[color:var(--ink-700)]">
              <strong>תובנת AI:</strong>{" "}
              {openDealsCount > 0
                ? `יש ${openDealsCount} עסקאות פתוחות — כדאי לעדכן את הסטטוסים בCRM.`
                : "כל העסקאות מעודכנות. אין פעולות דחופות ממתינות."}
            </p>
          </div>
        </div>
      </Tile>

      {/* ── שורה אמצעית: 3 כרטיסים ── */}
      <BentoGrid>

        {/* פרויקטים פעילים */}
        <Tile tone="neutral" span={4}>
          <TileHeader
            eyebrow="פרויקטים"
            title="פרויקטים פעילים"
            action={<TileLink href="/app/crm?hub=projects" label="הכל" tone="clients" />}
          />
          <ul className="mt-4 space-y-2">
            {recentProjects.length === 0 && (
              <li className="tile-label text-center py-4">אין פרויקטים פעילים</li>
            )}
            {recentProjects.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 transition hover:bg-[color:var(--canvas-sunken)]">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: p.isActive ? "var(--axis-clients)" : "var(--ink-300)" }}
                    aria-hidden
                  />
                  <span className="truncate text-sm font-semibold text-[color:var(--ink-800)]">{p.name}</span>
                </div>
                <span className="shrink-0 text-xs text-[color:var(--ink-500)]">{p.contactCount} לקוחות</span>
              </li>
            ))}
          </ul>
        </Tile>

        {/* מסמכים אחרונים */}
        <Tile tone="neutral" span={4}>
          <TileHeader
            eyebrow="ERP · מסמכים"
            title="הופקו לאחרונה"
            action={<TileLink href="/app/erp" label="הכל" tone="finance" />}
          />
          <ul className="mt-4 space-y-2">
            {recentDocuments.length === 0 && (
              <li className="tile-label text-center py-4">אין מסמכים שהופקו</li>
            )}
            {recentDocuments.map((doc) => (
              <li key={doc.id} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[color:var(--ink-800)]">
                    {doc.contactName ?? "—"}
                  </p>
                  <p className="text-xs text-[color:var(--ink-500)]">{doc.kind} · {doc.dateStr}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-sm font-bold text-[color:var(--ink-900)]">{fmtCurrency(doc.total)}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${DOC_STATUS_COLOR[doc.status] ?? DOC_STATUS_COLOR.DRAFT}`}>
                    {DOC_STATUS_LABEL[doc.status] ?? doc.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </Tile>

        {/* AI Workload */}
        <Tile tone="lavender" span={4}>
          <TileHeader eyebrow="AI · סריקה" liveDot />
          <div className="mt-3 flex flex-col items-center gap-4">
            <ProgressRing value={scanPct} axis="ai" size={120} strokeWidth={10}>
              <p className="text-[28px] font-black tabular-nums text-[color:var(--axis-ai)]">{scanPct}%</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--ink-400)]">ניצול</p>
            </ProgressRing>
            <div className="w-full space-y-1 text-center">
              <p className="text-sm font-bold text-[color:var(--ink-800)]">
                {scanUsed} מתוך {scanLimit} סריקות
              </p>
              <ProgressBar value={scanPct} axis="ai" height={6} />
            </div>
            <TileLink href="/app" label="מעבר ל-AI Assistant" tone="ai" />
          </div>
        </Tile>
      </BentoGrid>

      {/* ── שורה תחתונה: ספארקליין + CRM Pipeline ── */}
      <BentoGrid>

        {/* גרף הכנסות */}
        <Tile tone="finance" span={7}>
          <TileHeader
            eyebrow="כספים · ERP"
            title="מגמת הכנסות חודשית"
            action={<TileLink href="/app/erp" label="לפיננסים" tone="finance" />}
          />
          <div className="mt-4 flex items-end gap-4">
            <div>
              <p className="tile-hero-value">{cashDisplay}</p>
              <p className="tile-label mt-1 flex items-center gap-1">
                <TrendingUp
                  className="h-3.5 w-3.5"
                  style={{ color: trendPositive ? "var(--state-success)" : "var(--state-danger)" }}
                  aria-hidden
                />
                <span style={{ color: trendPositive ? "var(--state-success)" : "var(--state-danger)" }}>
                  {trendPositive ? "+" : ""}{cashChangePct}%
                </span>
                <span className="text-[color:var(--ink-400)]">מהחודש הקודם</span>
              </p>
            </div>
          </div>
          <Sparkline
            values={sparklineValues.length >= 2 ? sparklineValues : [0, 10, 8, 22, 18, 35, 30, 47]}
            axis="finance"
            height={60}
            className="mt-4 w-full"
          />
        </Tile>

        {/* CRM Pipeline */}
        <Tile tone="neutral" span={5}>
          <TileHeader
            eyebrow="CRM · עסקאות"
            title="פייפליין"
            action={<TileLink href="/app/crm" label="לCRM" tone="clients" />}
          />
          <div className="mt-4 space-y-3">
            {[
              { label: "ליד", pct: 85, axis: "clients" as const, count: openDealsCount },
              { label: "הצעה", pct: 55, axis: "finance" as const, count: Math.round(openDealsCount * 0.6) },
              { label: "פעיל", pct: 30, axis: "success" as const, count: Math.round(openDealsCount * 0.3) },
            ].map((stage) => (
              <div key={stage.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-[color:var(--ink-600)]">
                  <span>{stage.label}</span>
                  <span>{stage.count}</span>
                </div>
                <ProgressBar value={stage.pct} axis={stage.axis} height={7} />
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between rounded-lg bg-[color:var(--canvas-sunken)] px-3 py-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-[color:var(--ink-600)]">
              <CheckCircle2 className="h-3.5 w-3.5 text-[color:var(--state-success)]" aria-hidden />
              לקוחות פעילים
            </span>
            <span className="text-sm font-black text-[color:var(--ink-900)]">{activeClientsCount}</span>
          </div>
        </Tile>

      </BentoGrid>
    </div>
  );
}

// ─── sub-components ───────────────────────────────────────────────────────────

function KpiChip({
  icon: Icon,
  label,
  value,
  axis,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  axis: "finance" | "clients" | "ai";
}) {
  const iconColor =
    axis === "finance"
      ? "text-[color:var(--axis-finance)]"
      : axis === "ai"
        ? "text-[color:var(--axis-ai)]"
        : "text-[color:var(--axis-clients)]";

  return (
    <div className="card-avenue flex items-center gap-3 px-4 py-3">
      <Icon className={`h-5 w-5 shrink-0 ${iconColor}`} aria-hidden />
      <div className="min-w-0">
        <p className="truncate text-[10px] font-bold uppercase tracking-wider text-[color:var(--ink-400)]">{label}</p>
        <p className="mt-0.5 truncate text-base font-black text-[color:var(--ink-900)]">{value}</p>
      </div>
    </div>
  );
}
