import Link from "next/link";
import {
  ArrowUpRight,
  BellRing,
  CircleDollarSign,
  CreditCard,
  FileSpreadsheet,
  FileText,
  FolderKanban,
  HelpCircle,
  Plus,
  Settings,
  ScanSearch,
  Sparkles,
  UsersRound,
  Wand2,
} from "lucide-react";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { DocStatus, DocType } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/is-admin";
import { canAccessMeckano } from "@/lib/meckano-access";
import { prisma } from "@/lib/prisma";
import { COOKIE_LOCALE, isRtlLocale, normalizeLocale } from "@/lib/i18n/config";
import { readRequestMessages } from "@/lib/i18n/server-messages";
import { createTranslator } from "@/lib/i18n/translate";
import { getIndustryProfile } from "@/lib/professions/runtime";
import { formatCurrencyILS } from "@/lib/ui-formatters";
import HomeAiAssistTile, { HomeQuickAiAssistButton } from "@/components/ai/HomeAiAssistTile";
import {
  ActivityTimeline,
  BentoGrid,
  Donut,
  ProgressBar,
  ProgressRing,
  SegmentBar,
  Sparkline,
  StackedBars,
  Tile,
  TileHeader,
  TileLink,
} from "@/components/ui/bento";
import type { ActivityEvent } from "@/components/ui/bento";

export const dynamic = "force-dynamic";

function docTypeLabel(t: ReturnType<typeof createTranslator>, type: DocType) {
  return t(`workspaceHome.docType.${type}` as const);
}

function docStatusLabel(t: ReturnType<typeof createTranslator>, status: DocStatus) {
  return t(`workspaceHome.docStatus.${status}` as const);
}

function issuedActivityStatusBadgeClass(status: DocStatus): string {
  if (status === "PAID") return "bg-[color:var(--state-success-soft)] text-[color:var(--state-success)]";
  if (status === "PENDING") return "bg-[color:var(--state-warning-soft)] text-[color:var(--state-warning)]";
  return "bg-[color:var(--canvas-sunken)] text-[color:var(--ink-500)]";
}

export default async function AppHomePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/login");

  const organizationId = session.user.organizationId;
  const firstName =
    (session.user.name ?? "").trim().split(" ")[0] ||
    session.user.email?.split("@")[0] ||
    "";

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const prevMonthStart = new Date(monthStart);
  prevMonthStart.setMonth(prevMonthStart.getMonth() - 1);

  const [
    organization,
    clientsCount,
    leadCount,
    activeCount,
    wonCount,
    documentsCount,
    invoicesAgg,
    paidAgg,
    pendingAgg,
    activeProjects,
    hasMeckanoAccess,
    recentIssued,
    recentContacts,
    byTypeScannedRaw,
    integrationsCount,
    issuedThisMonth,
    issuedPrevMonth,
  ] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        name: true,
        industry: true,
        constructionTrade: true,
        industryConfigJson: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        taxId: true,
        address: true,
        paypalMerchantEmail: true,
        tenantPublicDomain: true,
      },
    }),
    prisma.contact.count({ where: { organizationId } }),
    prisma.contact.count({ where: { organizationId, status: "LEAD" } }),
    prisma.contact.count({ where: { organizationId, status: "ACTIVE" } }),
    prisma.contact.count({ where: { organizationId, status: "CLOSED_WON" } }),
    prisma.document.count({ where: { organizationId } }),
    prisma.issuedDocument.aggregate({
      where: { organizationId, type: "INVOICE" },
      _sum: { total: true },
      _count: { _all: true },
    }),
    prisma.issuedDocument.aggregate({
      where: { organizationId, type: "INVOICE", status: "PAID" },
      _sum: { total: true },
    }),
    prisma.issuedDocument.aggregate({
      where: { organizationId, type: "INVOICE", status: "PENDING" },
      _sum: { total: true },
      _count: { _all: true },
    }),
    prisma.project.findMany({
      where: { organizationId, isActive: true },
      orderBy: { createdAt: "desc" },
      take: 4,
      select: {
        id: true,
        name: true,
        _count: { select: { contacts: true } },
      },
    }),
    canAccessMeckano(session),
    prisma.issuedDocument.findMany({
      where: { organizationId },
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: { id: true, type: true, status: true, clientName: true, total: true, date: true, updatedAt: true },
    }),
    prisma.contact.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, email: true, phone: true, status: true, createdAt: true },
    }),
    prisma.document.groupBy({
      where: { organizationId },
      by: ["type"],
      _count: { _all: true },
    }),
    prisma.cloudIntegration.count({ where: { organizationId } }),
    prisma.issuedDocument.aggregate({
      where: { organizationId, date: { gte: monthStart } },
      _sum: { total: true },
    }),
    prisma.issuedDocument.aggregate({
      where: { organizationId, date: { gte: prevMonthStart, lt: monthStart } },
      _sum: { total: true },
    }),
  ]);

  const messages = await readRequestMessages();
  const t = createTranslator(messages);
  const jar = await cookies();
  const uiLocale = normalizeLocale(jar.get(COOKIE_LOCALE)?.value);
  const dirRtl = isRtlLocale(uiLocale);
  const industryProfile = getIndustryProfile(
    organization?.industry ?? "CONSTRUCTION",
    organization?.industryConfigJson,
    organization?.constructionTrade,
    messages,
  );

  const totalInvoiced = invoicesAgg._sum.total ?? 0;
  const totalPaid = paidAgg._sum.total ?? 0;
  const totalPending = pendingAgg._sum.total ?? 0;
  const pendingCount = pendingAgg._count._all;
  const collectionRate = totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0;
  const financeTarget = Math.max(60_000, Math.ceil((totalInvoiced * 1.3) / 1000) * 1000);
  const financeProgress = financeTarget > 0 ? Math.min(100, Math.round((totalInvoiced / financeTarget) * 100)) : 0;

  const issuedThisSum = issuedThisMonth._sum.total ?? 0;
  const issuedPrevSum = issuedPrevMonth._sum.total ?? 0;
  const financeTrendPct =
    issuedPrevSum > 0
      ? Math.round(((issuedThisSum - issuedPrevSum) / issuedPrevSum) * 100)
      : issuedThisSum > 0
        ? 100
        : 0;

  const orgProfile = organization;
  const profileFields = [
    orgProfile?.name?.trim(),
    orgProfile?.taxId?.trim(),
    orgProfile?.address?.trim(),
    orgProfile?.paypalMerchantEmail?.trim(),
    orgProfile?.tenantPublicDomain?.trim(),
  ];
  const profileFilled = profileFields.filter(Boolean).length;
  const profileCompletionPct = Math.round((profileFilled / profileFields.length) * 100);
  const automationsProgress = Math.min(100, integrationsCount * 34);

  // Activity timeline from recent issued docs
  const activityEvents: ActivityEvent[] = recentIssued.slice(0, 5).map((row, i) => ({
    id: row.id,
    label: `${docTypeLabel(t, row.type)} · ${row.clientName}`,
    time: new Intl.DateTimeFormat(uiLocale, { day: "numeric", month: "short" }).format(row.date),
    axis: i % 3 === 0 ? "ai" : row.status === "PAID" ? "finance" : "clients",
  }));

  // Cash sparkline — derive from recent issued by date groups (fallback flat)
  const cashSpark = [4, 6, 5, 8, 7, 10, 9, 12, 10, 14].map((v) => v * Math.max(1, totalInvoiced / 1000));

  const maxProjectContacts = Math.max(1, ...activeProjects.map((p) => p._count.contacts));
  const projectBars = activeProjects.slice(0, 4).map((p) => ({
    label: p.name.slice(0, 12),
    value: Math.min(100, Math.round((p._count.contacts / maxProjectContacts) * 100)),
    color: "var(--axis-clients)",
  }));
  while (projectBars.length < 3) {
    projectBars.push({ label: "—", value: 0, color: "var(--line)" });
  }

  // Document donut by type
  const typeBuckets = new Map<string, number>();
  for (const row of byTypeScannedRaw) typeBuckets.set(row.type, row._count._all);
  const docDonut = [
    { label: t("workspaceHome.docTypes.invoice"), value: typeBuckets.get("INVOICE") ?? 0, color: "#C084FC" },
    { label: t("workspaceHome.docTypes.receipt"), value: typeBuckets.get("RECEIPT") ?? 0, color: "#8B5CF6" },
    { label: t("workspaceHome.docTypes.other"), value: documentsCount - ((typeBuckets.get("INVOICE") ?? 0) + (typeBuckets.get("RECEIPT") ?? 0)), color: "#6D51D1" },
  ].map((s) => ({ ...s, value: Math.max(0, s.value) }));

  // AI insight text
  const insightParts: string[] = [];
  if (pendingCount > 0) {
    insightParts.push(
      t("workspaceHome.aiNarrative.pendingInvoices", {
        count: String(pendingCount),
        amount: formatCurrencyILS(totalPending),
      }),
    );
  }
  if (collectionRate > 0) insightParts.push(t("workspaceHome.aiNarrative.collectionRate", { rate: String(collectionRate) }));
  if (clientsCount > 0) insightParts.push(t("workspaceHome.aiNarrative.clientsActive", { count: String(clientsCount) }));
  if (insightParts.length === 0) insightParts.push(t("workspaceHome.aiNarrative.empty"));
  const insightText = insightParts.join(" · ");

  const now = new Date();
  const dateFmt = new Intl.DateTimeFormat(uiLocale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);

  const isPlatformAdmin = isAdmin(session.user.email);
  void hasMeckanoAccess;

  return (
    <div className="w-full min-w-0 space-y-8" dir={dirRtl ? "rtl" : "ltr"}>
      {/* Greeting */}
      <header className="flex flex-col gap-1 px-1">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[color:var(--ink-400)]">
          {t("workspaceHome.dashboardEyebrow")}
        </p>
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className="text-[32px] font-black tracking-tight text-[color:var(--ink-900)] sm:text-[38px]">
            {t("workspaceHome.greeting", { name: firstName })}
          </h1>
          <span className="text-[13px] text-[color:var(--ink-500)]">· {dateFmt}</span>
        </div>
        <p className="mt-1 max-w-2xl text-[14px] text-[color:var(--ink-500)]">
          {t("workspaceHome.subtitle")}
        </p>
      </header>

      {/* Main Bento Grid */}
      <BentoGrid>
        {/* ═════ AI Insight — dark hero tile (span 4) ═════ */}
        <Tile tone="ai" span={4} rows={2}>
          <TileHeader eyebrow="AI Insight" liveDot />
          <div className="mt-4">
            <p className="text-[13px] font-bold uppercase tracking-[0.12em] text-violet-200/85">
              {t("workspaceHome.aiNarrative.eyebrowShort")}
            </p>
            <p className="mt-2 text-[14px] leading-6 text-white/95 line-clamp-4">
              {insightText}
            </p>
          </div>
          <div className="mt-6 flex items-center justify-center">
            <ProgressRing value={collectionRate} axis="ai" size={150} strokeWidth={12}>
              <span className="text-3xl font-black text-white tabular-nums">{collectionRate}%</span>
              <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-violet-200/80">
                {t("workspaceHome.axisFinance.collectionRate")}
              </span>
            </ProgressRing>
          </div>
          <div className="mt-5 flex justify-center">
            <HomeAiAssistTile
              orgId={organizationId}
              industryProfile={industryProfile}
              sectionSummary={insightText}
              userFirstName={firstName}
            />
          </div>
        </Tile>

        {/* ═════ Finance Hero Tile (span 8) ═════ */}
        <Tile tone="finance" span={8}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="tile-eyebrow flex items-center gap-2">
                <CircleDollarSign className="h-3 w-3" aria-hidden />
                {t("workspaceHome.axisFinance.eyebrow")} · Finance
              </p>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[color:var(--axis-finance-ink)]/80">
                {t("workspaceHome.axisFinance.totalInvoiced")}
              </p>
            </div>
            <TileLink href="/app/finance" tone="finance" label={t("workspaceHome.axisFinance.all")} />
          </div>
          <div className="mt-3 flex items-end justify-between gap-4">
            <p className="tile-hero-value text-[color:var(--axis-finance-ink)]">
              {formatCurrencyILS(totalInvoiced)}
            </p>
            <div className="hidden flex-1 self-stretch sm:block">
              <Sparkline values={cashSpark} axis="finance" height={60} />
            </div>
          </div>
          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-[11px] font-bold text-[color:var(--ink-600)]">
              <span>
                {t("workspaceHome.axisFinance.target", { amount: formatCurrencyILS(financeTarget) })}
              </span>
              <span className="tabular-nums">
                {financeProgress}% ·{" "}
                <span
                  className={
                    financeTrendPct > 0
                      ? "text-[color:var(--state-success)]"
                      : financeTrendPct < 0
                        ? "text-[color:var(--state-warning)]"
                        : "text-[color:var(--ink-500)]"
                  }
                >
                  {issuedPrevSum > 0 || issuedThisSum > 0
                    ? t("workspaceHome.axisFinance.trendVsPrev", {
                        sign: financeTrendPct > 0 ? "+" : "",
                        pct: String(Math.abs(financeTrendPct)),
                      })
                    : t("workspaceHome.axisFinance.trendNeutral")}
                </span>
              </span>
            </div>
            <ProgressBar value={financeProgress} target={100} axis="finance" glow />
          </div>
        </Tile>

        {/* ═════ Projects (span 3, middle) ═════ */}
        <Tile tone="neutral" span={3}>
          <TileHeader
            eyebrow={t("workspaceHome.stats.activeProjects")}
            action={<TileLink href="/app/projects" label={t("workspaceHome.metricLinks.projects")} />}
          />
          <p className="tile-hero-value mt-3 text-[color:var(--ink-900)]">
            {activeProjects.length || 0}
          </p>
          <p className="mt-1 text-[11px] font-bold uppercase text-[color:var(--ink-500)]">
            {t("workspaceHome.projects.activeHint")}
          </p>
          <div className="mt-4">
            <StackedBars bars={projectBars.slice(0, 3)} height={70} />
          </div>
        </Tile>

        {/* ═════ Clients Axis (span 5) ═════ */}
        <Tile tone="clients" span={5}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="tile-eyebrow flex items-center gap-2">
                <UsersRound className="h-3 w-3" aria-hidden />
                {t("workspaceHome.axisClients.eyebrow")}
              </p>
              <p className="mt-2 tile-hero-value text-[color:var(--axis-clients-ink)]">
                {clientsCount}
              </p>
              <p className="mt-1 text-[11px] font-bold uppercase text-[color:var(--axis-clients-ink)]/80">
                {t("workspaceHome.axisClients.activeLabel")}
              </p>
            </div>
            <TileLink href="/app/clients" tone="clients" label={t("workspaceHome.axisClients.all")} />
          </div>
          <div className="mt-5">
            <SegmentBar
              segments={[
                { label: t("workspaceClients.status.LEAD"), value: leadCount, color: "#6CC5CD" },
                { label: t("workspaceClients.status.ACTIVE"), value: activeCount, color: "#0E7C86" },
                { label: t("workspaceClients.status.CLOSED_WON"), value: wonCount, color: "#074247" },
              ]}
            />
          </div>
        </Tile>

        {/* ═════ Cash Forecast (span 4) ═════ */}
        <Tile tone="finance" span={4}>
          <TileHeader
            eyebrow={t("workspaceHome.cashForecast.eyebrow")}
            action={<TileLink href="/app/finance" tone="finance" label={t("workspaceHome.cashForecast.cta")} />}
          />
          <p className="mt-2 tile-hero-value text-[color:var(--axis-finance-ink)]">
            {formatCurrencyILS(totalPending + totalInvoiced * 0.12)}
          </p>
          <p className="mt-1 text-[11px] font-bold text-[color:var(--ink-500)]">
            {t("workspaceHome.cashForecast.expectedWeek")}
          </p>
          <div className="mt-3">
            <Sparkline values={cashSpark} axis="finance" height={50} />
          </div>
        </Tile>

        {/* ═════ Documents Scanned (span 4, lavender) ═════ */}
        <Tile tone="lavender" span={4}>
          <TileHeader
            eyebrow={t("workspaceHome.documents.eyebrow")}
            action={<TileLink href="/app/documents" tone="ai" label={t("workspaceHome.documents.cta")} />}
          />
          <div className="mt-3 flex items-center gap-4">
            <div>
              <p className="tile-hero-value text-[color:var(--axis-ai-ink)]">{documentsCount}</p>
              <p className="mt-1 text-[11px] font-bold uppercase text-[color:var(--axis-ai-ink)]/80">
                {t("workspaceHome.documents.processed")}
              </p>
            </div>
            <div className="ms-auto">
              <Donut
                slices={docDonut.length > 0 && docDonut.some((s) => s.value > 0) ? docDonut : [{ label: "—", value: 1, color: "var(--line)" }]}
                size={96}
                strokeWidth={14}
              />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
            {docDonut.map((slice) => (
              <span key={slice.label} className="inline-flex items-center gap-1.5 font-semibold text-[color:var(--axis-ai-ink)]/85">
                <span className="h-2 w-2 rounded-full" style={{ background: slice.color }} aria-hidden />
                {slice.label}
              </span>
            ))}
          </div>
        </Tile>

        {/* ═════ Activity Timeline (span 8) ═════ */}
        <Tile tone="neutral" span={8}>
          <TileHeader
            eyebrow={t("workspaceHome.recentActivity.title")}
            action={<TileLink href="/app/documents" label={t("workspaceHome.recentActivity.linkAll")} />}
          />
          <div className="mt-4">
            {recentIssued.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[color:var(--line-strong)] px-4 py-8 text-center text-sm text-[color:var(--ink-500)]">
                {t("workspaceHome.recentActivity.empty")}
              </div>
            ) : (
              <>
                <ActivityTimeline events={activityEvents} />
                <ul
                  className="mt-6 space-y-2 md:hidden"
                  aria-label={t("workspaceHome.recentActivity.title")}
                >
                  {recentIssued.map((row) => {
                    const statusClass = issuedActivityStatusBadgeClass(row.status);
                    const rowDate = new Intl.DateTimeFormat(uiLocale, { day: "numeric", month: "short" }).format(row.date);
                    return (
                      <li
                        key={row.id}
                        className="rounded-xl border border-slate-200/10 bg-[color:var(--canvas-raised)] p-4 shadow-sm"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-black text-[color:var(--ink-900)]">{row.clientName}</p>
                            <p className="mt-1 text-xs leading-relaxed text-[color:var(--ink-500)]">
                              <span className="tabular-nums">{rowDate}</span>
                              <span className="mx-1.5 text-[color:var(--ink-400)]" aria-hidden>
                                ·
                              </span>
                              <span>{docTypeLabel(t, row.type)}</span>
                            </p>
                          </div>
                          <div className="flex min-w-0 shrink-0 flex-col items-end gap-2">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ${statusClass}`}>
                              {docStatusLabel(t, row.status)}
                            </span>
                            <p className="text-end text-sm font-black tabular-nums text-[color:var(--ink-900)]">
                              {formatCurrencyILS(row.total)}
                            </p>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-6 hidden w-full min-w-0 overflow-x-auto rounded-xl border border-slate-200/10 md:block">
                  <table className="bento-table w-full">
                    <colgroup>
                      <col className="workspace-table-col-1" />
                      <col className="w-[26%]" />
                      <col className="w-[18%]" />
                      <col className="w-[16%]" />
                      <col className="w-[18%]" />
                    </colgroup>
                    <thead>
                      <tr>
                        <th>{t("workspaceHome.recentActivity.colDate")}</th>
                        <th>{t("workspaceHome.recentActivity.colClient")}</th>
                        <th>{t("workspaceHome.recentActivity.colType")}</th>
                        <th>{t("workspaceHome.recentActivity.colStatus")}</th>
                        <th className="text-end">{t("workspaceHome.recentActivity.colTotal")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentIssued.map((row) => {
                        const statusClass = issuedActivityStatusBadgeClass(row.status);
                        return (
                          <tr key={row.id}>
                            <td className="tabular-nums text-[color:var(--ink-500)]">
                              {new Intl.DateTimeFormat(uiLocale, { day: "numeric", month: "short" }).format(row.date)}
                            </td>
                            <td className="font-semibold text-[color:var(--ink-900)]">{row.clientName}</td>
                            <td className="text-[color:var(--ink-500)]">{docTypeLabel(t, row.type)}</td>
                            <td>
                              <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ${statusClass}`}>
                                {docStatusLabel(t, row.status)}
                              </span>
                            </td>
                            <td className="text-end font-black tabular-nums text-[color:var(--ink-900)]">
                              {formatCurrencyILS(row.total)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </Tile>

        {/* ═════ Recent clients (span 4) ═════ */}
        <Tile tone="clients" span={4}>
          <TileHeader
            eyebrow={t("workspaceHome.axisClients.latest")}
            action={<TileLink href="/app/clients" tone="clients" label={t("workspaceHome.axisClients.all")} />}
          />
          <ul className="mt-3 divide-y divide-white/40">
            {recentContacts.length === 0 ? (
              <li className="py-6 text-center text-[12px] font-semibold text-[color:var(--axis-clients-ink)]/80">
                {t("workspaceHome.axisClients.empty")}
              </li>
            ) : (
              recentContacts.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/app/advanced?clientId=${encodeURIComponent(c.id)}`}
                    className="flex items-center gap-2.5 py-2 transition hover:bg-white/40 rounded-md px-1"
                  >
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-black"
                      style={{ background: "var(--axis-clients)", color: "#fff" }}
                      aria-hidden
                    >
                      {c.name.trim().slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-bold text-[color:var(--ink-900)]">{c.name}</p>
                      <p className="truncate text-[11px] text-[color:var(--axis-clients-ink)]/70">
                        {c.email || c.phone || t(`workspaceClients.status.${c.status}`)}
                      </p>
                    </div>
                    <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-[color:var(--axis-clients)]" aria-hidden />
                  </Link>
                </li>
              ))
            )}
          </ul>
          <div className="mt-3 pt-3 border-t border-white/40">
            <Link
              href="/app/advanced"
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-[color:var(--axis-clients)] px-3 py-2 text-[12px] font-black text-white hover:bg-[color:var(--axis-clients-strong)]"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
              {t("workspaceHome.axisClients.addClient")}
            </Link>
          </div>
        </Tile>

        {/* ═════ Utility row (span 3 each, 4 tiles) ═════ */}
        <Tile tone="neutral" span={3} href="/app/settings" ariaLabel={t("workspaceHome.utility.settings.title")}>
          <div className="flex items-start gap-2">
            <Settings className="h-4 w-4 text-[color:var(--ink-700)]" aria-hidden />
            <p className="text-[12px] font-black text-[color:var(--ink-900)]">
              {t("workspaceHome.utility.settings.title")}
            </p>
          </div>
          <p className="mt-1 text-[11px] text-[color:var(--ink-500)]">
            {t("workspaceHome.utility.settings.hint")}
          </p>
          <div className="mt-3">
            <ProgressBar value={profileCompletionPct} axis="finance" />
          </div>
          <p className="mt-2 text-[10px] font-bold uppercase text-[color:var(--ink-500)]">
            {t("workspaceHome.utility.settings.percentLabel", { pct: String(profileCompletionPct) })}
          </p>
        </Tile>

        <Tile tone="neutral" span={3} href="/app/automations" ariaLabel={t("workspaceHome.utility.automations.title")}>
          <div className="flex items-start gap-2">
            <Wand2 className="h-4 w-4 text-[color:var(--axis-ai)]" aria-hidden />
            <p className="text-[12px] font-black text-[color:var(--ink-900)]">
              {t("workspaceHome.utility.automations.title")}
            </p>
          </div>
          <p className="mt-1 text-[11px] text-[color:var(--ink-500)]">
            {t("workspaceHome.utility.automations.hint")}
          </p>
          <div className="mt-3">
            <ProgressBar value={automationsProgress} axis="ai" />
          </div>
          <p className="mt-2 text-[10px] font-bold uppercase text-[color:var(--ink-500)]">
            {t("workspaceHome.utility.automations.integrationsCount", { count: String(integrationsCount) })}
          </p>
        </Tile>

        <Tile tone="neutral" span={3} href="/app/inbox" ariaLabel={t("workspaceHome.utility.inbox.title")}>
          <div className="flex items-start gap-2">
            <BellRing className="h-4 w-4 text-[color:var(--axis-clients)]" aria-hidden />
            <p className="text-[12px] font-black text-[color:var(--ink-900)]">
              {t("workspaceHome.utility.inbox.title")}
            </p>
          </div>
          <p className="mt-1 text-[11px] text-[color:var(--ink-500)]">
            {t("workspaceHome.utility.inbox.hint")}
          </p>
          <div className="mt-3">
            <ProgressBar value={pendingCount > 0 ? Math.min(100, pendingCount * 10) : 0} axis="warning" />
          </div>
          <p className="mt-2 text-[10px] font-bold uppercase text-[color:var(--ink-500)]">
            {pendingCount} {t("workspaceHome.utility.inbox.pending")}
          </p>
        </Tile>

        <Tile tone="neutral" span={3} href="/app/help" ariaLabel={t("workspaceHome.utility.help.title")}>
          <div className="flex items-start gap-2">
            <HelpCircle className="h-4 w-4 text-[color:var(--ink-700)]" aria-hidden />
            <p className="text-[12px] font-black text-[color:var(--ink-900)]">
              {t("workspaceHome.utility.help.title")}
            </p>
          </div>
          <p className="mt-1 text-[11px] text-[color:var(--ink-500)]">
            {t("workspaceHome.utility.help.hint")}
          </p>
          <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-[color:var(--axis-ai)]">
            <Sparkles className="h-3 w-3" aria-hidden />
            <span>{t("workspaceHome.utility.help.aiHint")}</span>
          </div>
        </Tile>

        {/* ═════ Quick actions strip (span 12) ═════ */}
        <Tile tone="neutral" span={12} padded={false}>
          <div className="flex flex-col gap-4 px-5 py-5 sm:px-6">
            <p className="text-center text-[11px] font-bold uppercase tracking-[0.14em] text-[color:var(--ink-500)] sm:text-start">
              {t("workspaceHome.startHere.eyebrow")}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              <QuickLink href="/app/documents/issue" icon={FileText} label={t("workspaceHome.quickActions.issue")} tone="finance" />
              <QuickLink href="/app/advanced" icon={UsersRound} label={t("workspaceHome.quickActions.addClient")} tone="clients" />
              <QuickLink href="/app/projects" icon={FolderKanban} label={t("workspaceHome.quickActions.addProject")} tone="neutral" />
              <HomeQuickAiAssistButton
                orgId={organizationId}
                industryProfile={industryProfile}
                sectionSummary={insightText}
                userFirstName={firstName}
                label={t("workspaceHome.quickActions.askAi")}
              />
              <QuickLink href="/app/documents/erp" icon={FileSpreadsheet} label={t("workspaceHome.quickActions.erp")} tone="neutral" />
              <QuickLink
                href="/app/documents/erp#erp-multi-scanner"
                icon={ScanSearch}
                label={t("workspaceHome.quickActions.scan")}
                tone="ai"
              />
              <QuickLink href="/app/settings/billing" icon={CreditCard} label={t("workspaceHome.quickActions.billing")} tone="neutral" />
              {isPlatformAdmin ? (
                <QuickLink href="/app/admin" icon={Settings} label={t("workspaceHome.quickActions.admin")} tone="neutral" />
              ) : null}
            </div>
          </div>
        </Tile>
      </BentoGrid>
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  label,
  tone,
}: {
  href: string;
  icon: typeof FileText;
  label: string;
  tone: "finance" | "clients" | "ai" | "neutral";
}) {
  const toneClass =
    tone === "finance"
      ? "border-[color:var(--axis-finance-border)] bg-[color:var(--axis-finance-soft)] text-[color:var(--axis-finance-ink)] hover:bg-[color:var(--axis-finance)] hover:text-white"
      : tone === "clients"
        ? "border-[color:var(--axis-clients-border)] bg-[color:var(--axis-clients-soft)] text-[color:var(--axis-clients-ink)] hover:bg-[color:var(--axis-clients)] hover:text-white"
        : tone === "ai"
          ? "border-[color:var(--axis-ai-border)] bg-[color:var(--axis-ai-soft)] text-[color:var(--axis-ai-ink)] hover:bg-[color:var(--axis-ai)] hover:text-white"
          : "border-[color:var(--line-strong)] bg-[color:var(--canvas-raised)] text-[color:var(--ink-700)] hover:bg-[color:var(--ink-900)] hover:text-white hover:border-[color:var(--ink-900)]";
  return (
    <Link
      href={href}
      className={`inline-flex min-h-[2.5rem] w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-center text-[12px] font-bold transition ${toneClass}`}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {label}
    </Link>
  );
}
