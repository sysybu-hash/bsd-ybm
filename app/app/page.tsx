import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  FileText,
  FolderOpen,
  Plus,
  ScanLine,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  ActionTile,
  DataRow,
  EmptyState,
  PageHeader,
  SectionHeader,
  Stat,
  Surface,
} from "@/components/ui/claude";

export const dynamic = "force-dynamic";

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

function fmtDate(date: Date) {
  return new Intl.DateTimeFormat("he-IL", { day: "2-digit", month: "2-digit", year: "2-digit" }).format(date);
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const organizationId = session?.user?.organizationId;
  if (!organizationId) {
    redirect("/login");
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const [
    activeClients,
    activeProjects,
    monthIssued,
    prevMonthIssued,
    pendingAgg,
    paidAgg,
    scannedDocsCount,
    recentIssued,
    recentClients,
  ] = await Promise.all([
    prisma.contact.count({ where: { organizationId } }),
    prisma.project.count({ where: { organizationId, isActive: true } }),
    prisma.issuedDocument.aggregate({
      where: { organizationId, type: "INVOICE", date: { gte: startOfMonth } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.issuedDocument.aggregate({
      where: {
        organizationId,
        type: "INVOICE",
        date: { gte: startOfPrevMonth, lte: endOfPrevMonth },
      },
      _sum: { total: true },
    }),
    prisma.issuedDocument.aggregate({
      where: { organizationId, status: "PENDING" },
      _sum: { total: true },
      _count: true,
    }),
    prisma.issuedDocument.aggregate({
      where: { organizationId, status: "PAID", date: { gte: startOfMonth } },
      _sum: { total: true },
    }),
    prisma.document.count({ where: { organizationId, createdAt: { gte: startOfMonth } } }),
    prisma.issuedDocument.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        type: true,
        number: true,
        clientName: true,
        total: true,
        status: true,
        date: true,
      },
    }),
    prisma.contact.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, status: true, createdAt: true, value: true },
    }),
  ]);

  const monthRevenue = monthIssued._sum.total ?? 0;
  const prevRevenue = prevMonthIssued._sum.total ?? 0;
  const pendingAmount = pendingAgg._sum.total ?? 0;
  const pendingCount = pendingAgg._count ?? 0;
  const paidAmount = paidAgg._sum.total ?? 0;
  const totalBilled = monthRevenue;
  const collectionRate = totalBilled > 0 ? Math.round((paidAmount / totalBilled) * 100) : 0;

  const trend = prevRevenue > 0 ? ((monthRevenue - prevRevenue) / prevRevenue) * 100 : null;
  const trendLabel =
    trend === null
      ? undefined
      : trend === 0
        ? "ללא שינוי"
        : `${trend > 0 ? "+" : ""}${trend.toFixed(1)}%`;
  const trendDirection: "up" | "down" | "flat" =
    trend === null || trend === 0 ? "flat" : trend > 0 ? "up" : "down";

  const userFirst = (session?.user?.name ?? session?.user?.email ?? "").split(/[\s@]/)[0] || "ברוך הבא";
  const todayLabel = new Intl.DateTimeFormat("he-IL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(now);

  return (
    <div className="cd-canvas mx-auto w-full max-w-[1200px] px-4 py-8 md:px-8" dir="rtl">
      <div className="space-y-10">
        <PageHeader
          eyebrow={todayLabel}
          title={`שלום, ${userFirst}`}
          subtitle="סקירה שקטה של מה שקרה היום ומה דורש את תשומת הלב שלך."
          actions={
            <>
              <a className="cd-btn cd-btn-secondary" href="/app/erp">
                <FileText size={14} aria-hidden /> הנפק חשבונית
              </a>
              <a className="cd-btn cd-btn-primary" href="/app/scan">
                <ScanLine size={14} aria-hidden /> סרוק מסמך
              </a>
            </>
          }
        />

        <section className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="הכנסות החודש"
            value={fmtIls(monthRevenue)}
            hint={`${monthIssued._count} חשבוניות הונפקו`}
            trend={trendLabel ? { value: trendLabel, direction: trendDirection } : undefined}
            icon={TrendingUp}
            href="/app/erp"
          />
          <Stat
            label="ממתין לגבייה"
            value={fmtIls(pendingAmount)}
            hint={`${pendingCount} חשבוניות פתוחות`}
            icon={Clock}
            href="/app/erp"
          />
          <Stat
            label="לקוחות פעילים"
            value={activeClients}
            hint={`${activeProjects} פרויקטים פעילים`}
            icon={Users}
            href="/app/crm"
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
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            <ActionTile href="/app/scan" label="סרוק מסמך חדש" hint="חשבונית, קבלה, ספק" icon={ScanLine} accent />
            <ActionTile href="/app/erp" label="הנפק חשבונית" hint="ללקוח קיים או חדש" icon={FileText} />
            <ActionTile href="/app/crm" label="הוסף לקוח" hint="פרטי קשר ופרויקט" icon={Plus} />
            <ActionTile href="/app/operations" label="נוכחות עובדים" hint="נוכחות, שטח ותפעול" icon={FolderOpen} />
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Surface className="lg:col-span-2" padded={false}>
            <div className="flex items-center justify-between border-b border-[color:var(--cd-line)] px-6 py-4">
              <div>
                <h2 className="cd-h3">מסמכים אחרונים</h2>
                <p className="cd-mute mt-0.5 text-xs">חשבוניות וקבלות שהונפקו לאחרונה</p>
              </div>
              <a className="cd-btn cd-btn-ghost" href="/app/erp">
                לכל המסמכים <ArrowUpRight size={14} aria-hidden />
              </a>
            </div>
            {recentIssued.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={FileText}
                  title="עדיין לא הונפקו מסמכים"
                  body="המסמכים שתנפיק יופיעו כאן."
                  action={
                    <a className="cd-btn cd-btn-primary" href="/app/erp">
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
                      primary={`${typeLabel} #${doc.number} · ${doc.clientName}`}
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
              <a className="cd-btn cd-btn-ghost" href="/app/crm">
                לכולם <ArrowUpRight size={14} aria-hidden />
              </a>
            </div>
            {recentClients.length === 0 ? (
              <div className="p-6">
                <EmptyState icon={Users} title="עדיין אין לקוחות" body="הוסף את הלקוח הראשון שלך כדי להתחיל." />
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
                <a className="cd-btn cd-btn-secondary mt-4" href="/app/erp">
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
                    <span className="font-semibold tabular-nums text-[color:var(--cd-ink)]">{monthIssued._count}</span>
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
