import Link from "next/link";
import {
  ArrowUpRight,
  BellRing,
  BrainCircuit,
  CreditCard,
  FileText,
  FolderCog,
  FolderKanban,
  Settings,
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
import GlassPanel from "@/components/ui/GlassPanel";

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
  const firstName = (session.user.name ?? "").trim().split(" ")[0] || session.user.email?.split("@")[0] || "";

  const [organization, clientsCount, documentsCount, invoicesSum, activeProjectsCount, hasMeckanoAccess, recentIssued] =
    await Promise.all([
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
  const hiddenPrimaryRouteIds = getHiddenPrimaryRouteIds(toWorkspaceFeatureInput(accessContext, industryProfile));

  const startHereOrder: readonly {
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
  let startHereItems = startHereOrder.filter((row) => !hiddenPrimaryRouteIds.has(row.id)).slice(0, 3);
  if (startHereItems.length === 0) {
    startHereItems = [{ id: "settings", href: "/app/settings", Icon: Settings }];
  }

  const totalInvoiced = invoicesSum._sum.total ?? 0;

  const showAdmin = isAdmin(session.user.email);
  const footerNav: { href: string; labelKey: string }[] = [
    { href: "/app/onboarding", labelKey: "workspaceHome.footer.onboarding" },
    { href: "/app/automations", labelKey: "workspaceHome.footer.automations" },
    { href: "/app/portal", labelKey: "workspaceHome.footer.portal" },
    { href: "/app/settings", labelKey: "workspaceHome.footer.settings" },
  ];
  if (showAdmin) {
    footerNav.push({ href: "/app/admin", labelKey: "workspaceHome.footer.admin" });
  }

  const now = new Date();
  const dateFmt = new Intl.DateTimeFormat(uiLocale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);
  const timeFmt = new Intl.DateTimeFormat(uiLocale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(now);

  return (
    <div className="mx-auto max-w-[1300px] space-y-8 pb-6 px-2 pt-2" dir={dirRtl ? "rtl" : "ltr"}>
      <header className="animate-fade-in-up stagger-1 flex flex-col-reverse gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="text-[13px] font-semibold text-slate-500 pt-3 whitespace-nowrap">
          {dateFmt} <span className="mx-2 text-slate-300">|</span> {timeFmt}
        </div>
        <div className="space-y-1 text-right">
          <h1 className="text-[2.75rem] leading-tight font-black tracking-tight text-slate-800">
            {t("workspaceHome.greeting", { name: firstName })}<span className="text-teal-500">!</span>
          </h1>
          <p className="text-sm font-semibold text-slate-500">{t("workspaceHome.subtitle")}</p>
          <p className="text-base font-black text-slate-700 mt-3 pt-1">{t("workspaceHome.dailyWorkTitle")}</p>
        </div>
      </header>

      <section aria-labelledby="kpi-heading" className="animate-fade-in-up stagger-2">
        <h2 id="kpi-heading" className="sr-only">{industryProfile.homeTitle}</h2>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-2">
          <Metric3DCard
            uid="kpi-docs"
            label={industryProfile.documentsLabel}
            value={String(documentsCount)}
            icon={FileText}
            trend={
              documentsCount > 0
                ? t("workspaceHome.metricTrends.documentsTotal", { count: String(documentsCount) })
                : t("workspaceHome.metricTrends.noneYet")
            }
            linkLabel={t("workspaceHome.metricLinks.documents")}
            linkHref="/app/documents"
          />
          <Metric3DCard
            uid="kpi-clients"
            label={industryProfile.clientsLabel}
            value={String(clientsCount)}
            icon={UsersRound}
            trend={
              clientsCount > 0
                ? t("workspaceHome.metricTrends.clientsMonthly", { count: String(Math.min(clientsCount, 15)) })
                : undefined
            }
            linkLabel={t("workspaceHome.metricLinks.clients")}
            linkHref="/app/clients"
          />
          <Metric3DCard
            uid="kpi-projects"
            label={t("workspaceHome.stats.activeProjects")}
            value={String(activeProjectsCount)}
            icon={FolderKanban}
            trend={
              activeProjectsCount > 0
                ? t("workspaceHome.metricTrends.projectsActive", { count: String(activeProjectsCount) })
                : t("workspaceHome.metricTrends.noneYet")
            }
            linkLabel={t("workspaceHome.metricLinks.projects")}
            linkHref="/app/projects"
          />
          <Metric3DCard
            uid="kpi-billing"
            label={t("workspaceHome.stats.billingVolume")}
            value={formatCurrencyILS(totalInvoiced)}
            icon={CreditCard}
            trend={totalInvoiced > 0 ? t("workspaceHome.metricTrends.financeFresh") : undefined}
            linkLabel={t("workspaceHome.metricLinks.finance")}
            linkHref="/app/finance"
          />
        </div>
      </section>

      {/* Two column section: Recent activity + Start Here */}
      <div className="animate-fade-in-up stagger-3 grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">

        {/* Recent tasks / activity */}
        <section aria-labelledby="recent-heading" className="space-y-3">
          <div className="flex items-baseline justify-between gap-2">
            <h2 id="recent-heading" className="text-lg font-black text-[color:var(--v2-ink)]">
              {t("workspaceHome.recentActivity.title")}
            </h2>
            <Link href="/app/documents" className="text-sm font-black text-[color:var(--v2-accent)] hover:underline underline-offset-2">
              {t("workspaceHome.recentActivity.linkAll")}
            </Link>
          </div>

          <GlassPanel as="div" className="p-0 overflow-hidden pearl-panel">
            {recentIssued.length === 0 ? (
              <p className="px-5 py-10 text-sm font-semibold text-[color:var(--v2-muted)] text-center">
                {t("workspaceHome.recentActivity.empty")}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] border-collapse text-sm" dir={dirRtl ? "rtl" : "ltr"}>
                  <thead>
                    <tr className="border-b border-white/45 bg-white/40">
                      <th className="px-4 py-2.5 text-right text-[11px] font-black uppercase tracking-wide text-slate-400">{t("workspaceHome.recentActivity.colDate")}</th>
                      <th className="px-4 py-2.5 text-right text-[11px] font-black uppercase tracking-wide text-slate-400">{t("workspaceHome.recentActivity.colClient")}</th>
                      <th className="px-4 py-2.5 text-right text-[11px] font-black uppercase tracking-wide text-slate-400">{t("workspaceHome.recentActivity.colType")}</th>
                      <th className="px-4 py-2.5 text-right text-[11px] font-black uppercase tracking-wide text-slate-400">{t("workspaceHome.recentActivity.colStatus")}</th>
                      <th className="px-4 py-2.5 text-right text-[11px] font-black uppercase tracking-wide text-slate-400">{t("workspaceHome.recentActivity.colTotal")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentIssued.map((row) => (
                      <tr key={row.id} className="border-b border-white/30 last:border-0 hover:bg-white/30 transition-colors">
                        <td className="px-4 py-3 tabular-nums text-[color:var(--v2-muted)]">{formatShortDate(row.date)}</td>
                        <td className="px-4 py-3 font-bold text-[color:var(--v2-ink)]">{row.clientName}</td>
                        <td className="px-4 py-3 text-[color:var(--v2-muted)]">{docTypeLabel(t, row.type)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-black ${
                            row.status === "PAID" ? "bg-emerald-100 text-emerald-700" :
                            row.status === "PENDING" ? "bg-sky-100 text-sky-700" :
                            "bg-slate-100 text-slate-600"
                          }`}>
                            {docStatusLabel(t, row.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-black tabular-nums text-[color:var(--v2-ink)]">{formatCurrencyILS(row.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlassPanel>
        </section>

        {/* Start Here — quick access cards */}
        <section aria-labelledby="start-here-heading" className="space-y-3">
          <h2 id="start-here-heading" className="text-lg font-black text-[color:var(--v2-ink)]">
            {t("workspaceHome.startHere.eyebrow")}
          </h2>
          <div className="space-y-3">
            {startHereItems.map(({ id, href, Icon }) => (
              <div key={id} className="holo-border-card flex items-center gap-4 px-5 py-4">
                <Icon className="h-8 w-8 shrink-0 text-[color:var(--v2-accent)]" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-base font-black text-[color:var(--v2-ink)]">{t(`workspaceHome.startHere.cards.${id}.title`)}</p>
                  <p className="text-xs text-[color:var(--v2-muted)] leading-snug">{t(`workspaceHome.startHere.cards.${id}.body`)}</p>
                </div>
                <Link
                  href={href}
                  className="shrink-0 rounded-full bg-white/55 px-4 py-2 text-sm font-black text-teal-800 ring-1 ring-white/70 shadow-[0_18px_34px_-26px_rgba(15,23,42,0.35)] transition hover:bg-white/75 hover:-translate-y-0.5"
                >
                  {id === "documents"
                    ? t("workspaceHome.startHere.actions.documents")
                    : id === "clients"
                      ? t("workspaceHome.startHere.actions.clients")
                      : t("workspaceHome.startHere.actions.projects")}
                </Link>
              </div>
            ))}
          </div>
        </section>

      </div>

      <footer className="v2-dashboard-frame pearl-panel animate-fade-in-up stagger-5 space-y-4 p-5 sm:p-6">
        <p className="text-sm leading-relaxed text-[color:var(--v2-muted)]">{t("workspaceHome.footerHint")}</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {footerNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-black text-[color:var(--v2-accent)] underline-offset-2 hover:underline"
            >
              {t(item.labelKey)}
            </Link>
          ))}
          <Link
            href="/app/advanced"
            className="ms-auto inline-flex items-center gap-1 text-sm font-black text-slate-600 hover:text-[color:var(--v2-ink)]"
          >
            {t("workspaceHome.advancedCta")}
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </footer>
    </div>
  );
}
