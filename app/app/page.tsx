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
import {
  AxisCard,
  AxisSeeAllLink,
  SplitDualityAxes,
  SplitDualityBridge,
  SplitDualityHeadline,
  SplitDualityShell,
} from "@/components/workspace/SplitDuality";

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

  const now = new Date();
  const dateFmt = new Intl.DateTimeFormat(uiLocale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);

  // AI narrative
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
    insightParts.push(
      t("workspaceHome.aiNarrative.clientsActive", { count: String(clientsCount) }),
    );
  }
  if (insightParts.length === 0) {
    insightParts.push(t("workspaceHome.aiNarrative.empty"));
  }
  const insightText = insightParts.join(" · ");

  return (
    <SplitDualityShell mode="home">
      <div className="relative z-10 mx-auto max-w-[1400px]" dir={dirRtl ? "rtl" : "ltr"}>
        {/* ══════════ HERO headline (spans both halves) ══════════ */}
        <div className="space-y-8">
          <SplitDualityHeadline
            eyebrow={`${t("workspaceHome.dashboardEyebrow")} · ${dateFmt}`}
            title={t("workspaceHome.greeting", { name: firstName })}
            subtitle={t("workspaceHome.subtitle")}
          />

          {/* ══════════ AI INSIGHT BRIDGE ══════════ */}
          <SplitDualityBridge
            eyebrow={t("workspaceHome.aiNarrative.eyebrow")}
            insight={insightText}
            ctaLabel={t("workspaceHome.aiNarrative.open")}
            ctaHref="/app/ai"
          />

          {/* ══════════ Dual-axis row ══════════ */}
          <SplitDualityAxes
            mode="home"
            leadingAxis={
              <AxisCard
                axis="clients"
                eyebrow={t("workspaceHome.axisClients.eyebrow")}
                title={t("workspaceHome.axisClients.title")}
                action={
                  <AxisSeeAllLink
                    axis="clients"
                    href="/app/clients"
                    label={t("workspaceHome.axisClients.all")}
                  />
                }
              >
                {/* Clients KPI */}
                <div className="mb-4 flex items-end gap-3 border-b border-[color:var(--line-subtle)] pb-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[color:var(--ink-500)]">
                      {t("workspaceHome.stats.activeClients")}
                    </p>
                    <p className="sd-hero-value sd-hero-value--clients mt-1">
                      {clientsCount}
                    </p>
                  </div>
                  <Link
                    href="/app/clients?create=1"
                    className="mb-1 ms-auto inline-flex items-center gap-1 rounded-lg bg-[color:var(--axis-clients)] px-3 py-1.5 text-[12px] font-bold text-white transition hover:bg-[color:var(--axis-clients-strong)]"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden />
                    {t("workspaceHome.axisClients.addClient")}
                  </Link>
                </div>

                {/* Recent clients list */}
                {recentClients.length === 0 ? (
                  <div className="py-8 text-center">
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
                          href={`/app/advanced?clientId=${encodeURIComponent(client.id)}`}
                          className="flex items-center gap-3 rounded-md px-1 py-2.5 transition hover:bg-[color:var(--axis-clients-soft)]"
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
              </AxisCard>
            }
            trailingAxis={
              <AxisCard
                axis="finance"
                eyebrow={t("workspaceHome.axisFinance.eyebrow")}
                title={t("workspaceHome.axisFinance.title")}
                action={
                  <AxisSeeAllLink
                    axis="finance"
                    href="/app/finance"
                    label={t("workspaceHome.axisFinance.all")}
                  />
                }
              >
                {/* Finance KPI */}
                <div className="mb-4 flex items-end gap-3 border-b border-[color:var(--line-subtle)] pb-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[color:var(--ink-500)]">
                      {t("workspaceHome.axisFinance.totalInvoiced")}
                    </p>
                    <p className="sd-hero-value sd-hero-value--finance mt-1">
                      {formatCurrencyILS(totalInvoiced)}
                    </p>
                  </div>
                  <Link
                    href="/app/documents/issue"
                    className="mb-1 ms-auto inline-flex items-center gap-1 rounded-lg bg-[color:var(--axis-finance)] px-3 py-1.5 text-[12px] font-bold text-white transition hover:bg-[color:var(--axis-finance-strong)]"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden />
                    {t("workspaceHome.axisFinance.issue")}
                  </Link>
                </div>

                {/* Finance summary pills */}
                <div className="mb-4 grid grid-cols-3 gap-2">
                  <div className="rounded-lg bg-[color:var(--state-success-soft)] px-3 py-2">
                    <p className="text-[10px] font-bold uppercase text-[color:var(--ink-500)]">
                      {t("workspaceHome.axisFinance.totalPaid")}
                    </p>
                    <p className="mt-1 text-sm font-black tabular-nums text-[color:var(--state-success)]">
                      {formatCurrencyILS(totalPaid)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-[color:var(--state-warning-soft)] px-3 py-2">
                    <p className="text-[10px] font-bold uppercase text-[color:var(--ink-500)]">
                      {t("workspaceHome.axisFinance.pending")}
                    </p>
                    <p className="mt-1 text-sm font-black tabular-nums text-[color:var(--state-warning)]">
                      {formatCurrencyILS(totalPending)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-[color:var(--axis-finance-soft)] px-3 py-2">
                    <p className="text-[10px] font-bold uppercase text-[color:var(--ink-500)]">
                      {t("workspaceHome.axisFinance.collectionRate")}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-sm font-black tabular-nums text-[color:var(--ink-900)]">
                      <TrendingUp className="h-3 w-3 text-[color:var(--axis-finance)]" aria-hidden />
                      {collectionRate}%
                    </p>
                  </div>
                </div>

                {/* Recent invoices */}
                {recentIssued.length === 0 ? (
                  <div className="py-8 text-center">
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
                                ? "bg-[color:var(--state-warning-soft)] text-[color:var(--state-warning)]"
                                : "bg-[color:var(--canvas-sunken)] text-[color:var(--ink-500)]";
                          return (
                            <tr key={row.id}>
                              <td className="tabular-nums text-[color:var(--ink-500)]">
                                {formatShortDate(row.date)}
                              </td>
                              <td className="font-semibold text-[color:var(--ink-900)]">
                                <span className="line-clamp-1">{row.clientName}</span>
                                <span className="block text-[11px] font-normal text-[color:var(--ink-400)]">
                                  {docTypeLabel(t, row.type)}
                                </span>
                              </td>
                              <td>
                                <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ${statusColor}`}>
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
              </AxisCard>
            }
          />

          {/* ══════════ Quick Actions ══════════ */}
          {visibleActions.length > 0 ? (
            <section
              aria-label={t("workspaceHome.startHere.eyebrow")}
              className="relative z-10"
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-[color:var(--ink-500)]">
                  {t("workspaceHome.startHere.eyebrow")}
                </h2>
                <Link
                  href="/app/advanced"
                  className="inline-flex items-center gap-1 text-[12px] font-bold text-[color:var(--ink-700)] hover:text-[color:var(--ink-900)]"
                >
                  {t("workspaceHome.advancedCta")}
                  <ArrowUpRight className="h-3 w-3" aria-hidden />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-8">
                {visibleActions.map(({ id, href, Icon }) => (
                  <Link
                    key={id}
                    href={href}
                    className="group flex flex-col items-start gap-2 rounded-lg border border-white/80 bg-white/55 p-3 backdrop-blur-sm transition hover:-translate-y-0.5 hover:bg-white/75 hover:shadow-[var(--shadow-sm)]"
                  >
                    <Icon className="h-4 w-4 text-[color:var(--ink-600)]" aria-hidden />
                    <span className="text-[12px] font-bold text-[color:var(--ink-900)]">
                      {t(`workspaceHome.startHere.cards.${id}.title`)}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </SplitDualityShell>
  );
}
