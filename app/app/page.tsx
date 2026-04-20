import Link from "next/link";
import {
  ArrowUpRight,
  BellRing,
  BrainCircuit,
  CreditCard,
  FileText,
  FolderCog,
  FolderKanban,
  Plus,
  Settings,
  Sparkles,
  TrendingUp,
  UsersRound,
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
import { formatCurrencyILS, formatShortDate } from "@/lib/ui-formatters";
import type { AppRouteId } from "@/components/app-shell/app-nav";
import type { WorkspaceAccessContext } from "@/lib/workspace-access";
import { getHiddenPrimaryRouteIds, toWorkspaceFeatureInput } from "@/lib/workspace-features";
import Metric3DCard from "@/components/dashboard/Metric3DCard";

export const dynamic = "force-dynamic";

function docTypeLabel(t: ReturnType<typeof createTranslator>, type: DocType) {
  const key = `workspaceHome.docType.${type}` as const;
  return t(key);
}

function docStatusLabel(t: ReturnType<typeof createTranslator>, status: DocStatus) {
  const key = `workspaceHome.docStatus.${status}` as const;
  return t(key);
}

export default async function AppHomePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.organizationId) {
    redirect("/login");
  }

  const organizationId = session.user.organizationId;
  const firstName =
    (session.user.name ?? "").trim().split(" ")[0] ||
    session.user.email?.split("@")[0] ||
    "";

  const [
    organization,
    clientsCount,
    documentsCount,
    invoicesAgg,
    paidAgg,
    pendingAgg,
    activeProjectsCount,
    hasMeckanoAccess,
    recentIssued,
    recentClients,
  ] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        industry: true,
        constructionTrade: true,
        industryConfigJson: true,
        subscriptionTier: true,
        subscriptionStatus: true,
      },
    }),
    prisma.contact.count({ where: { organizationId } }),
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
    prisma.project.count({ where: { organizationId, isActive: true } }),
    canAccessMeckano(session),
    prisma.issuedDocument.findMany({
      where: { organizationId },
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: {
        id: true,
        type: true,
        status: true,
        clientName: true,
        total: true,
        date: true,
      },
    }),
    prisma.contact.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
      },
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

  const accessContext: WorkspaceAccessContext = {
    role: session.user.role ?? "",
    isPlatformAdmin: isAdmin(session.user.email),
    subscriptionTier: organization?.subscriptionTier ?? "FREE",
    subscriptionStatus: organization?.subscriptionStatus ?? "INACTIVE",
    hasOrganization: true,
    hasMeckanoAccess,
  };
  const hiddenPrimaryRouteIds = getHiddenPrimaryRouteIds(
    toWorkspaceFeatureInput(accessContext, industryProfile),
  );

  const quickActions: readonly {
    id: Exclude<AppRouteId, "home" | "help" | "business" | "intelligence" | "admin" | "success" | "advanced">;
    href: string;
    Icon: typeof FileText;
  }[] = [
    { id: "documents", href: "/app/documents", Icon: FileText },
    { id: "clients", href: "/app/clients", Icon: UsersRound },
    { id: "projects", href: "/app/projects", Icon: FolderKanban },
    { id: "inbox", href: "/app/inbox", Icon: BellRing },
    { id: "finance", href: "/app/finance", Icon: CreditCard },
    { id: "ai", href: "/app/ai", Icon: BrainCircuit },
    { id: "operations", href: "/app/operations", Icon: FolderCog },
    { id: "settings", href: "/app/settings", Icon: Settings },
  ];
  const visibleActions = quickActions.filter((row) => !hiddenPrimaryRouteIds.has(row.id));

  const totalInvoiced = invoicesAgg._sum.total ?? 0;
  const totalPaid = paidAgg._sum.total ?? 0;
  const totalPending = pendingAgg._sum.total ?? 0;
  const pendingCount = pendingAgg._count._all;
  const collectionRate = totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0;

  const showAdmin = isAdmin(session.user.email);

  const now = new Date();
  const dateFmt = new Intl.DateTimeFormat(uiLocale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);

  // ─── AI narrative line (זה "הפרשנות של המערכת" — החזון החי) ───
  const insightParts: string[] = [];
  if (pendingCount > 0) {
    insightParts.push(
      t("workspaceHome.aiNarrative.pendingInvoices", {
        count: String(pendingCount),
        amount: formatCurrencyILS(totalPending),
      }),
    );
  }
  if (totalInvoiced > 0 && collectionRate > 0) {
    insightParts.push(
      t("workspaceHome.aiNarrative.collectionRate", { rate: String(collectionRate) }),
    );
  }
  if (clientsCount > 0) {
    insightParts.push(t("workspaceHome.aiNarrative.clientsActive", { count: String(clientsCount) }));
  }
  if (insightParts.length === 0) {
    insightParts.push(t("workspaceHome.aiNarrative.empty"));
  }
  const insightText = insightParts.join(" · ");

  return (
    <div className="mx-auto max-w-[1400px] space-y-8" dir={dirRtl ? "rtl" : "ltr"}>
      {/* ═══════════ Header ═══════════ */}
      <header className="animate-fade-in-up stagger-1 flex flex-col gap-1">
        <p className="v2-eyebrow self-start">
          {t("workspaceHome.dashboardEyebrow")} · {dateFmt}
        </p>
        <h1 className="mt-3 text-[40px] leading-[1.1] font-black tracking-tight text-[color:var(--ink-900)] sm:text-[48px]">
          {t("workspaceHome.greeting", { name: firstName })}
        </h1>
        <p className="mt-2 max-w-2xl text-base text-[color:var(--ink-500)]">
          {t("workspaceHome.subtitle")}
        </p>
      </header>

      {/* ═══════════ AI Insight Strip ═══════════ */}
      <section
        className="animate-fade-in-up stagger-2 ai-insight-strip flex items-start gap-4"
        aria-label={t("workspaceHome.aiNarrative.aria")}
      >
        <span className="ai-insight-strip__dot">
          <Sparkles className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[color:var(--axis-ai)]">
            {t("workspaceHome.aiNarrative.eyebrow")}
          </p>
          <p className="mt-1 text-[15px] leading-relaxed font-semibold text-[color:var(--ink-800)]">
            {insightText}
          </p>
        </div>
        <Link
          href="/app/ai"
          className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--axis-ai-border)] bg-[color:var(--canvas-raised)] px-3 py-2 text-[12px] font-bold text-[color:var(--axis-ai)] transition hover:bg-[color:var(--axis-ai-soft)]"
        >
          {t("workspaceHome.aiNarrative.open")}
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </section>

      {/* ═══════════ KPI Tiles (שלושה צירים) ═══════════ */}
      <section aria-labelledby="kpi-heading" className="animate-fade-in-up stagger-3">
        <h2 id="kpi-heading" className="sr-only">{industryProfile.homeTitle}</h2>
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <Metric3DCard
            uid="kpi-clients"
            axis="clients"
            label={industryProfile.clientsLabel}
            value={String(clientsCount)}
            icon={UsersRound}
            trend={
              clientsCount > 0
                ? t("workspaceHome.metricTrends.clientsMonthly", {
                    count: String(Math.min(clientsCount, 15)),
                  })
                : t("workspaceHome.metricTrends.noneYet")
            }
            linkLabel={t("workspaceHome.metricLinks.clients")}
            linkHref="/app/clients"
          />
          <Metric3DCard
            uid="kpi-billing"
            axis="finance"
            label={t("workspaceHome.stats.billingVolume")}
            value={formatCurrencyILS(totalInvoiced)}
            icon={CreditCard}
            trend={
              totalInvoiced > 0
                ? t("workspaceHome.metricTrends.financeFresh")
                : t("workspaceHome.metricTrends.noneYet")
            }
            linkLabel={t("workspaceHome.metricLinks.finance")}
            linkHref="/app/finance"
          />
          <Metric3DCard
            uid="kpi-projects"
            axis="neutral"
            label={t("workspaceHome.stats.activeProjects")}
            value={String(activeProjectsCount)}
            icon={FolderKanban}
            trend={
              activeProjectsCount > 0
                ? t("workspaceHome.metricTrends.projectsActive", {
                    count: String(activeProjectsCount),
                  })
                : t("workspaceHome.metricTrends.noneYet")
            }
            linkLabel={t("workspaceHome.metricLinks.projects")}
            linkHref="/app/projects"
          />
          <Metric3DCard
            uid="kpi-docs"
            axis="ai"
            label={industryProfile.documentsLabel}
            value={String(documentsCount)}
            icon={FileText}
            trend={
              documentsCount > 0
                ? t("workspaceHome.metricTrends.documentsTotal", {
                    count: String(documentsCount),
                  })
                : t("workspaceHome.metricTrends.noneYet")
            }
            linkLabel={t("workspaceHome.metricLinks.documents")}
            linkHref="/app/documents"
          />
        </div>
      </section>

      {/* ═══════════ Dual Axis: Clients (left) × Finance (right) ═══════════ */}
      <section
        aria-label={t("workspaceHome.dualAxisAria")}
        className="animate-fade-in-up stagger-4 grid gap-6 lg:grid-cols-2"
      >
        {/* ─── ציר לקוחות ─── */}
        <article className="holo-border-card axis-clients overflow-hidden">
          <header className="flex items-center justify-between gap-3 border-b border-[color:var(--line-subtle)] px-5 py-4">
            <div>
              <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-[color:var(--axis-clients)]">
                {t("workspaceHome.axisClients.eyebrow")}
              </p>
              <h2 className="mt-0.5 text-lg font-black tracking-tight text-[color:var(--ink-900)]">
                {t("workspaceHome.axisClients.title")}
              </h2>
            </div>
            <Link
              href="/app/clients"
              className="inline-flex items-center gap-1 text-[13px] font-bold text-[color:var(--axis-clients)] hover:underline"
            >
              {t("workspaceHome.axisClients.all")}
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </header>

          {recentClients.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <UsersRound className="mx-auto h-8 w-8 text-[color:var(--ink-300)]" aria-hidden />
              <p className="mt-3 text-sm font-semibold text-[color:var(--ink-500)]">
                {t("workspaceHome.axisClients.empty")}
              </p>
              <Link
                href="/app/clients"
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[color:var(--axis-clients)] px-3.5 py-2 text-[13px] font-bold text-white transition hover:bg-[color:var(--axis-clients-strong)]"
              >
                <Plus className="h-4 w-4" aria-hidden />
                {t("workspaceHome.axisClients.addFirst")}
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-[color:var(--line-subtle)]">
              {recentClients.map((client) => (
                <li key={client.id}>
                  <Link
                    href={`/app/clients/${client.id}`}
                    className="flex items-center gap-3 px-5 py-3 transition hover:bg-[color:var(--canvas-sunken)]"
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-bold"
                      style={{
                        background: "var(--axis-clients-soft)",
                        color: "var(--axis-clients-ink)",
                      }}
                      aria-hidden
                    >
                      {client.name.trim().slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-[color:var(--ink-900)]">
                        {client.name}
                      </p>
                      <p className="truncate text-[12px] text-[color:var(--ink-500)]">
                        {client.email || client.phone || t(`workspaceClients.status.${client.status}`)}
                      </p>
                    </div>
                    <time className="shrink-0 text-[11px] tabular-nums text-[color:var(--ink-400)]">
                      {formatShortDate(client.createdAt)}
                    </time>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </article>

        {/* ─── ציר כספים ─── */}
        <article className="holo-border-card axis-finance overflow-hidden">
          <header className="flex items-center justify-between gap-3 border-b border-[color:var(--line-subtle)] px-5 py-4">
            <div>
              <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-[color:var(--axis-finance)]">
                {t("workspaceHome.axisFinance.eyebrow")}
              </p>
              <h2 className="mt-0.5 text-lg font-black tracking-tight text-[color:var(--ink-900)]">
                {t("workspaceHome.axisFinance.title")}
              </h2>
            </div>
            <Link
              href="/app/finance"
              className="inline-flex items-center gap-1 text-[13px] font-bold text-[color:var(--axis-finance)] hover:underline"
            >
              {t("workspaceHome.axisFinance.all")}
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </header>

          {/* Summary bar */}
          <div className="grid grid-cols-3 gap-px bg-[color:var(--line-subtle)]">
            <div className="bg-[color:var(--canvas-raised)] px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--ink-400)]">
                {t("workspaceHome.axisFinance.totalInvoiced")}
              </p>
              <p className="mt-0.5 text-sm font-black tabular-nums text-[color:var(--ink-900)]">
                {formatCurrencyILS(totalInvoiced)}
              </p>
            </div>
            <div className="bg-[color:var(--canvas-raised)] px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--ink-400)]">
                {t("workspaceHome.axisFinance.totalPaid")}
              </p>
              <p className="mt-0.5 text-sm font-black tabular-nums text-[color:var(--state-success)]">
                {formatCurrencyILS(totalPaid)}
              </p>
            </div>
            <div className="bg-[color:var(--canvas-raised)] px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--ink-400)]">
                {t("workspaceHome.axisFinance.collectionRate")}
              </p>
              <p className="mt-0.5 flex items-center gap-1 text-sm font-black tabular-nums text-[color:var(--ink-900)]">
                <TrendingUp className="h-3.5 w-3.5 text-[color:var(--axis-finance)]" aria-hidden />
                {collectionRate}%
              </p>
            </div>
          </div>

          {recentIssued.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <CreditCard className="mx-auto h-8 w-8 text-[color:var(--ink-300)]" aria-hidden />
              <p className="mt-3 text-sm font-semibold text-[color:var(--ink-500)]">
                {t("workspaceHome.axisFinance.empty")}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="v2-table">
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
                    const statusColor =
                      row.status === "PAID"
                        ? "bg-[color:var(--state-success-soft)] text-[color:var(--state-success)]"
                        : row.status === "PENDING"
                          ? "bg-[color:var(--state-info-soft)] text-[color:var(--state-info)]"
                          : "bg-[color:var(--canvas-sunken)] text-[color:var(--ink-500)]";
                    return (
                      <tr key={row.id}>
                        <td className="tabular-nums text-[color:var(--ink-500)]">
                          {formatShortDate(row.date)}
                        </td>
                        <td className="font-semibold text-[color:var(--ink-900)]">
                          {row.clientName}
                        </td>
                        <td className="text-[color:var(--ink-500)]">{docTypeLabel(t, row.type)}</td>
                        <td>
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ${statusColor}`}
                          >
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
          )}
        </article>
      </section>

      {/* ═══════════ Quick Actions ═══════════ */}
      {visibleActions.length > 0 ? (
        <section
          aria-label={t("workspaceHome.startHere.eyebrow")}
          className="animate-fade-in-up stagger-5"
        >
          <div className="mb-3 flex items-end justify-between">
            <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-[color:var(--ink-500)]">
              {t("workspaceHome.startHere.eyebrow")}
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
            {visibleActions.map(({ id, href, Icon }) => (
              <Link
                key={id}
                href={href}
                className="group flex flex-col items-start gap-2 rounded-lg border border-[color:var(--line)] bg-[color:var(--canvas-raised)] p-3.5 transition hover:-translate-y-0.5 hover:border-[color:var(--line-strong)] hover:shadow-[var(--shadow-sm)]"
              >
                <Icon className="h-5 w-5 text-[color:var(--ink-500)] transition group-hover:text-[color:var(--axis-clients)]" aria-hidden />
                <span className="text-[13px] font-bold text-[color:var(--ink-900)]">
                  {t(`workspaceHome.startHere.cards.${id}.title`)}
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* ═══════════ Footer nav ═══════════ */}
      <footer className="animate-fade-in-up stagger-5 border-t border-[color:var(--line)] pt-6">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link
            href="/app/onboarding"
            className="text-sm font-semibold text-[color:var(--ink-500)] transition hover:text-[color:var(--ink-900)]"
          >
            {t("workspaceHome.footer.onboarding")}
          </Link>
          <Link
            href="/app/automations"
            className="text-sm font-semibold text-[color:var(--ink-500)] transition hover:text-[color:var(--ink-900)]"
          >
            {t("workspaceHome.footer.automations")}
          </Link>
          <Link
            href="/app/portal"
            className="text-sm font-semibold text-[color:var(--ink-500)] transition hover:text-[color:var(--ink-900)]"
          >
            {t("workspaceHome.footer.portal")}
          </Link>
          <Link
            href="/app/settings"
            className="text-sm font-semibold text-[color:var(--ink-500)] transition hover:text-[color:var(--ink-900)]"
          >
            {t("workspaceHome.footer.settings")}
          </Link>
          {showAdmin ? (
            <Link
              href="/app/admin"
              className="text-sm font-semibold text-[color:var(--ink-500)] transition hover:text-[color:var(--ink-900)]"
            >
              {t("workspaceHome.footer.admin")}
            </Link>
          ) : null}
          <Link
            href="/app/advanced"
            className="ms-auto inline-flex items-center gap-1 text-sm font-bold text-[color:var(--ink-700)] transition hover:text-[color:var(--ink-900)]"
          >
            {t("workspaceHome.advancedCta")}
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </footer>
    </div>
  );
}
