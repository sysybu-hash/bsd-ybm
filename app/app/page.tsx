import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Briefcase,
  Calendar,
  CreditCard,
  FileText,
  ListTodo,
  Percent,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/is-admin";
import { canAccessMeckano } from "@/lib/meckano-access";
import { prisma } from "@/lib/prisma";
import { COOKIE_LOCALE, isRtlLocale, normalizeLocale } from "@/lib/i18n/config";
import { readRequestMessages } from "@/lib/i18n/server-messages";
import { createTranslator } from "@/lib/i18n/translate";
import { getIndustryProfile } from "@/lib/professions/runtime";
import { formatCurrencyILS } from "@/lib/ui-formatters";
import { buildAppNavCollection } from "@/components/app-shell/app-nav";
import type { WorkspaceAccessContext } from "@/lib/workspace-access";
import { getHiddenPrimaryRouteIds, toWorkspaceFeatureInput } from "@/lib/workspace-features";

export const dynamic = "force-dynamic";

export default async function AppHomePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.organizationId) {
    redirect("/login");
  }

  const organizationId = session.user.organizationId;
  const [
    organization,
    clientsCount,
    documentsCount,
    invoicesSum,
    activeProjectsCount,
    recentProjects,
    recentDocs,
    hasMeckanoAccess,
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
    }),
    prisma.project.count({ where: { organizationId, isActive: true } }),
    prisma.project.findMany({
      where: { organizationId, isActive: true },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { id: true, name: true, createdAt: true },
    }),
    prisma.document.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { id: true, fileName: true, createdAt: true },
    }),
    canAccessMeckano(session),
  ]);
  const messages = await readRequestMessages();
  const t = createTranslator(messages);
  const jar = await cookies();
  const uiLocale = normalizeLocale(jar.get(COOKIE_LOCALE)?.value);
  const dateLocale = uiLocale === "en" ? "en-GB" : uiLocale === "ru" ? "ru-RU" : "he-IL";
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

  const totalInvoiced = invoicesSum._sum.total ?? 0;
  const schedulePct = Math.min(96, 58 + Math.min(activeProjectsCount * 6, 38));

  const stats = [
    { label: t("workspaceHome.stats.activeProjects"), value: String(activeProjectsCount), icon: Briefcase },
    { label: industryProfile.clientsLabel, value: String(clientsCount), icon: UsersRound },
    { label: industryProfile.documentsLabel, value: String(documentsCount), icon: FileText },
    {
      label: t("workspaceHome.stats.billingVolume"),
      value: formatCurrencyILS(totalInvoiced),
      icon: CreditCard,
    },
  ];

  const quickLinks = buildAppNavCollection(industryProfile, t, { hiddenPrimaryRouteIds }).primary.filter(
    (item) => item.href !== "/app",
  );

  const projectCards =
    recentProjects.length > 0
      ? recentProjects
      : [
          { id: "p1", name: t("workspaceHome.demoProjects.p1"), createdAt: new Date() },
          { id: "p2", name: t("workspaceHome.demoProjects.p2"), createdAt: new Date() },
          { id: "p3", name: t("workspaceHome.demoProjects.p3"), createdAt: new Date() },
        ];

  return (
    <div className="grid gap-5" dir={isRtlLocale(uiLocale) ? "rtl" : "ltr"}>
      <section className="v2-panel v2-panel-soft p-6 sm:p-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <span className="v2-eyebrow">{t("workspaceHome.eyebrow")}</span>
            <h1 className="mt-4 text-3xl font-black tracking-[-0.06em] text-[color:var(--v2-ink)] sm:text-4xl">
              {industryProfile.homeTitle}
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[color:var(--v2-muted)]">
              {industryProfile.homeDescription}
            </p>
          </div>

          <Link href="/app/advanced" className="v2-button v2-button-secondary self-start lg:self-auto">
            {t("workspaceHome.advancedCta")}
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(({ label, value, icon: Icon }) => (
            <article key={label} className="rounded-2xl border border-slate-200/90 bg-white px-4 py-4 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--v2-accent-soft)] text-[color:var(--v2-accent)]">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[color:var(--v2-muted)]">{label}</p>
                  <p className="mt-1 truncate text-xl font-black tracking-[-0.04em] text-[color:var(--v2-ink)]">
                    {value}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-[color:var(--v2-muted)]">
          <span className="inline-flex items-center gap-2 font-bold text-[color:var(--v2-ink)]">
            <Percent className="h-4 w-4 text-[color:var(--v2-accent)]" aria-hidden />
            {t("workspaceHome.scheduleRow")}
          </span>
          <div className="h-2 flex-1 min-w-[120px] overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-[color:var(--v2-accent)] transition-all"
              style={{ width: `${schedulePct}%` }}
            />
          </div>
          <span className="font-mono text-xs">{schedulePct}%</span>
        </div>
      </section>

      <section className="v2-panel p-5 sm:p-6">
        <h2 className="text-xl font-black text-[color:var(--v2-ink)]">{t("workspaceHome.projectsTitle")}</h2>
        <p className="mt-1 text-sm text-[color:var(--v2-muted)]">{t("workspaceHome.projectsSubtitle")}</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {projectCards.map((p, i) => (
            <article
              key={p.id}
              className={`rounded-2xl border bg-white p-4 shadow-sm transition ${
                i === 1 ? "border-[#14b8a6]/50 ring-2 ring-[#14b8a6]/20" : "border-slate-200"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-[color:var(--v2-ink)]">{p.name}</h3>
                <Calendar className="h-4 w-4 shrink-0 text-[color:var(--v2-muted)]" aria-hidden />
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-[color:var(--v2-accent)]"
                  style={{ width: `${[42, 74, 65][i % 3]}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-[color:var(--v2-muted)]">
                {t("workspaceHome.updatedPrefix")} {p.createdAt.toLocaleDateString(dateLocale)}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="v2-panel p-5 sm:p-6">
        <h2 className="text-lg font-black text-[color:var(--v2-ink)]">{t("workspaceHome.docsActivityTitle")}</h2>
        <ul className="mt-4 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
          {(recentDocs.length > 0
            ? recentDocs.map((d) => ({ key: d.id, line: d.fileName }))
            : [
                { key: "x1", line: t("workspaceHome.docsEmptyHint") },
              ]
          ).map((row, idx) => (
            <li key={row.key} className="flex items-center gap-3 px-4 py-3 text-sm">
              <ListTodo className="h-4 w-4 shrink-0 text-[color:var(--v2-accent)]" aria-hidden />
              <span className={idx === 0 ? "font-semibold text-[color:var(--v2-ink)]" : "text-[color:var(--v2-muted)]"}>
                {row.line}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="v2-panel p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="v2-eyebrow">{t("workspaceHome.shortcutsEyebrow")}</span>
            <h2 className="mt-3 text-2xl font-black tracking-[-0.05em] text-[color:var(--v2-ink)]">
              {t("workspaceHome.shortcutsTitle")}
            </h2>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {quickLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm transition hover:border-[#14b8a6]/30"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-[color:var(--v2-accent)]">
                <item.icon className="h-4 w-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-black text-[color:var(--v2-ink)]">{item.label}</p>
                <p className="mt-1 truncate text-sm text-[color:var(--v2-muted)]">{item.summary}</p>
              </div>
              <ArrowLeft className="h-4 w-4 shrink-0 text-[color:var(--v2-muted)]" aria-hidden />
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="v2-panel p-6">
          <span className="v2-eyebrow">{t("workspaceHome.moreEyebrow")}</span>
          <h2 className="mt-3 text-xl font-black text-[color:var(--v2-ink)]">{t("workspaceHome.moreTitle")}</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {[
              {
                href: "/app/onboarding",
                label: t("workspaceHome.moreLinks.onboarding.label"),
                summary: t("workspaceHome.moreLinks.onboarding.summary"),
              },
              {
                href: "/app/automations",
                label: t("workspaceHome.moreLinks.automations.label"),
                summary: t("workspaceHome.moreLinks.automations.summary"),
              },
              {
                href: "/app/portal",
                label: t("workspaceHome.moreLinks.portal.label"),
                summary: t("workspaceHome.moreLinks.portal.summary"),
              },
              {
                href: "/app/admin",
                label: t("workspaceHome.moreLinks.admin.label"),
                summary: t("workspaceHome.moreLinks.admin.summary"),
              },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold transition hover:border-[#14b8a6]/40"
              >
                <span className="font-black text-[color:var(--v2-ink)]">{item.label}</span>
                <span className="mt-1 block text-[color:var(--v2-muted)]">{item.summary}</span>
              </Link>
            ))}
          </div>
        </div>
        <aside className="v2-panel v2-panel-highlight p-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[color:var(--v2-accent)]" aria-hidden />
            <p className="text-lg font-black text-[color:var(--v2-ink)]">{t("workspaceHome.tipsTitle")}</p>
          </div>
          <ul className="mt-4 grid gap-3 text-sm leading-7 text-[color:var(--v2-muted)]">
            <li className="flex gap-2">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--v2-accent)]" aria-hidden />
              הגדירו התמחות מקצועית בהגדרות — כדי שה-AI והתפריטים ידברו בשפה שלכם.
            </li>
            <li className="flex gap-2">
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--v2-accent)]" aria-hidden />
              {t("workspaceHome.tips.upload")}
            </li>
          </ul>
        </aside>
      </section>
    </div>
  );
}
