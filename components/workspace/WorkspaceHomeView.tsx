import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  FileText,
  FolderOpen,
  Layers,
  Plus,
  ScanLine,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { ActionTile, DataRow, PageHeader, SectionHeader, Stat, Surface } from "@/components/ui/claude";
import { EmptyState } from "@/components/ui/empty-state";
import { WORKSPACE_ROUTES } from "@/lib/workspace-canonical-routes";
import type { WorkspaceHomeData } from "@/lib/load-workspace-home";

const DOC_TYPE_LABEL: Record<string, string> = {
  INVOICE: "חשבונית",
  RECEIPT: "קבלה",
  INVOICE_RECEIPT: "חשבונית-קבלה",
  CREDIT_NOTE: "זיכוי",
};

const DOC_STATUS_LABEL: Record<string, string> = {
  PAID: "שולם",
  PENDING: "ממתין",
  CANCELLED: "בוטל",
  DRAFT: "טיוטה",
};

const DOC_STATUS_CHIP: Record<string, string> = {
  PAID: "cd-chip-positive",
  PENDING: "cd-chip-warn",
  CANCELLED: "cd-chip-negative",
  DRAFT: "cd-chip",
};

function fmtIls(n: number) {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("he-IL", { day: "2-digit", month: "2-digit", year: "2-digit" }).format(d);
}

type Props = {
  userFirst: string;
  todayLabel: string;
  data: WorkspaceHomeData;
};

export default function WorkspaceHomeView({ userFirst, todayLabel, data }: Props) {
  const {
    monthRevenue,
    monthIssuedCount,
    pendingAmount,
    pendingCount,
    paidAmount,
    collectionRate,
    trendLabel,
    trendDirection,
    activeClients,
    activeProjects,
    scannedDocsCount,
    recentIssued,
    recentClients,
  } = data;

  return (
    <div className="cd-canvas w-full min-w-0 py-4 md:py-6" dir="rtl">
      <div className="space-y-10">
        <PageHeader
          eyebrow={todayLabel}
          title={`שלום, ${userFirst}`}
          subtitle="סקירה שקטה של מה שקרה היום ומה דורש את תשומת הלב שלך."
          actions={
            <>
              <a className="cd-btn cd-btn-secondary" href={WORKSPACE_ROUTES.erp}>
                <FileText size={14} aria-hidden /> הנפק חשבונית
              </a>
              <a className="cd-btn cd-btn-primary" href={WORKSPACE_ROUTES.scan}>
                <ScanLine size={14} aria-hidden /> סרוק מסמך
              </a>
            </>
          }
        />

        <section className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="הכנסות החודש"
            value={fmtIls(monthRevenue)}
            hint={`${monthIssuedCount} חשבוניות הונפקו`}
            trend={trendLabel ? { value: trendLabel, direction: trendDirection } : undefined}
            icon={TrendingUp}
            href={WORKSPACE_ROUTES.erp}
          />
          <Stat
            label="ממתין לגבייה"
            value={fmtIls(pendingAmount)}
            hint={`${pendingCount} חשבוניות פתוחות`}
            icon={Clock}
            href={WORKSPACE_ROUTES.erp}
          />
          <Stat
            label="לקוחות פעילים"
            value={activeClients}
            hint={`${activeProjects} פרויקטים פעילים`}
            icon={Users}
            href={WORKSPACE_ROUTES.crm}
          />
          <Stat
            label="שיעור גבייה"
            value={`${collectionRate}%`}
            hint={`${fmtIls(paidAmount)} נגבה החודש`}
            icon={Wallet}
          />
        </section>

        <section>
          <SectionHeader
            title="פעולות מהירות"
            subtitle="הקיצורים השימושיים ביותר ביום עבודה רגיל."
          />
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <ActionTile
              href={WORKSPACE_ROUTES.scan}
              label="סרוק מסמך חדש"
              hint="חשבונית, קבלה, ספק"
              icon={ScanLine}
              accent
            />
            <ActionTile
              href={WORKSPACE_ROUTES.erp}
              label="הנפק חשבונית"
              hint="ללקוח קיים או חדש"
              icon={FileText}
            />
            <ActionTile href={WORKSPACE_ROUTES.crm} label="הוסף לקוח" hint="פרטי קשר ופרויקט" icon={Plus} />
            <ActionTile
              href={WORKSPACE_ROUTES.business}
              label="מרכז עסקי"
              hint="CRM ו־ERP במסך אחד"
              icon={Layers}
            />
            <ActionTile
              href={WORKSPACE_ROUTES.operations}
              label="נוכחות עובדים"
              hint="נוכחות, שטח ותפעול"
              icon={FolderOpen}
            />
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Surface className="lg:col-span-2" padded={false}>
            <div className="flex items-center justify-between border-b border-[color:var(--cd-line)] px-6 py-4">
              <div>
                <h2 className="cd-h3">מסמכים אחרונים</h2>
                <p className="cd-mute mt-0.5 text-xs">חשבוניות וקבלות שהונפקו לאחרונה</p>
              </div>
              <a className="cd-btn cd-btn-ghost" href={WORKSPACE_ROUTES.erp}>
                לכל המסמכים <ArrowUpRight size={14} aria-hidden />
              </a>
            </div>
            {recentIssued.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  variant="default"
                  iconName="file"
                  title="עדיין לא הונפקו מסמכים"
                  description="המסמכים שתנפיק יופיעו כאן."
                  action={
                    <a className="cd-btn cd-btn-primary" href={WORKSPACE_ROUTES.erp}>
                      הנפק מסמך ראשון
                    </a>
                  }
                />
              </div>
            ) : (
              <div>
                {recentIssued.map((doc) => {
                  const typeLabel = DOC_TYPE_LABEL[doc.type] ?? doc.type;
                  const statusLabel = DOC_STATUS_LABEL[doc.status] ?? doc.status;
                  const statusChip = DOC_STATUS_CHIP[doc.status] ?? "cd-chip";
                  return (
                    <DataRow
                      key={doc.id}
                      primary={`${typeLabel} #${String(doc.number)} · ${doc.clientName}`}
                      secondary={fmtDate(doc.date)}
                      badge={<span className={`cd-chip ${statusChip}`}>{statusLabel}</span>}
                      meta={fmtIls(doc.total)}
                    />
                  );
                })}
              </div>
            )}
          </Surface>

          <Surface padded={false}>
            <div className="flex items-center justify-between border-b border-[color:var(--cd-line)] px-6 py-4">
              <div>
                <h2 className="cd-h3">לקוחות אחרונים</h2>
                <p className="cd-mute mt-0.5 text-xs">לקוחות שנוספו לאחרונה</p>
              </div>
              <a className="cd-btn cd-btn-ghost" href={WORKSPACE_ROUTES.crm}>
                לכולם <ArrowUpRight size={14} aria-hidden />
              </a>
            </div>
            {recentClients.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  variant="default"
                  iconName="users"
                  title="עדיין אין לקוחות"
                  description="הוסף את הלקוח הראשון שלך כדי להתחיל."
                />
              </div>
            ) : (
              <div>
                {recentClients.map((c) => (
                  <DataRow
                    key={c.id}
                    primary={c.name}
                    secondary={c.status === "LEAD" ? "ליד" : c.status === "CLIENT" ? "לקוח פעיל" : c.status}
                    meta={c.value ? fmtIls(c.value) : fmtDate(c.createdAt)}
                  />
                ))}
              </div>
            )}
          </Surface>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Surface>
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[color:var(--cd-accent-soft)] text-[color:var(--cd-accent-ink)]">
                <Sparkles size={16} strokeWidth={1.75} aria-hidden />
              </span>
              <div className="min-w-0">
                <h2 className="cd-h3">תובנת AI</h2>
                <p className="cd-body mt-2 text-sm">
                  {pendingCount > 0
                    ? `ישנן ${pendingCount} חשבוניות ממתינות לגבייה בסך ${fmtIls(pendingAmount)}. כדאי לבדוק שליחת תזכורת ללקוחות עם איחור.`
                    : "אין חשבוניות פתוחות לגבייה — הגבייה מסונכרנת. ממשיכים."}
                </p>
                <a className="cd-btn cd-btn-secondary mt-4" href={WORKSPACE_ROUTES.erp}>
                  פתח את ה-ERP <ArrowUpRight size={14} aria-hidden />
                </a>
              </div>
            </div>
          </Surface>

          <Surface>
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[color:var(--cd-bg-tint)] text-[color:var(--cd-ink-soft)]">
                <CheckCircle2 size={16} strokeWidth={1.75} aria-hidden />
              </span>
              <div className="min-w-0">
                <h2 className="cd-h3">פעילות החודש</h2>
                <ul className="mt-3 space-y-2 text-sm text-[color:var(--cd-ink-soft)]">
                  <li className="flex items-center justify-between gap-3">
                    <span>מסמכים נסרקו</span>
                    <span className="font-semibold tabular-nums text-[color:var(--cd-ink)]">{scannedDocsCount}</span>
                  </li>
                  <li className="flex items-center justify-between gap-3">
                    <span>חשבוניות הונפקו</span>
                    <span className="font-semibold tabular-nums text-[color:var(--cd-ink)]">{monthIssuedCount}</span>
                  </li>
                  <li className="flex items-center justify-between gap-3">
                    <span>סך חיוב</span>
                    <span className="font-semibold tabular-nums text-[color:var(--cd-ink)]">{fmtIls(monthRevenue)}</span>
                  </li>
                  <li className="flex items-center justify-between gap-3">
                    <span>שיעור גבייה</span>
                    <span className="font-semibold tabular-nums text-[color:var(--cd-ink)]">{collectionRate}%</span>
                  </li>
                </ul>
              </div>
            </div>
          </Surface>
        </section>
      </div>
    </div>
  );
}
