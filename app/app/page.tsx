import Link from "next/link";
import { Fragment } from "react";
import {
  ArrowUpRight,
  BellRing,
  CreditCard,
  FileText,
  FolderCog,
  Lightbulb,
  Settings,
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
import type { AppRouteId } from "@/components/app-shell/app-nav";
import type { WorkspaceAccessContext } from "@/lib/workspace-access";
import { getHiddenPrimaryRouteIds, toWorkspaceFeatureInput } from "@/lib/workspace-features";

export const dynamic = "force-dynamic";

export default async function AppHomePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.organizationId) {
    redirect("/login");
  }

  const organizationId = session.user.organizationId;
  const [organization, clientsCount, documentsCount, invoicesSum, activeProjectsCount, hasMeckanoAccess] =
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
    ]);

  const messages = await readRequestMessages();
  const t = createTranslator(messages);
  const jar = await cookies();
  const uiLocale = normalizeLocale(jar.get(COOKIE_LOCALE)?.value);
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
    { id: "inbox", href: "/app/inbox", Icon: BellRing },
    { id: "billing", href: "/app/billing", Icon: CreditCard },
    { id: "operations", href: "/app/operations", Icon: FolderCog },
    { id: "insights", href: "/app/insights", Icon: Lightbulb },
    { id: "settings", href: "/app/settings", Icon: Settings },
  ];
  let startHereItems = startHereOrder.filter((row) => !hiddenPrimaryRouteIds.has(row.id)).slice(0, 3);
  if (startHereItems.length === 0) {
    startHereItems = [{ id: "settings", href: "/app/settings", Icon: Settings }];
  }

  const totalInvoiced = invoicesSum._sum.total ?? 0;

  const stats = [
    { label: t("workspaceHome.stats.activeProjects"), value: String(activeProjectsCount) },
    { label: industryProfile.clientsLabel, value: String(clientsCount) },
    { label: industryProfile.documentsLabel, value: String(documentsCount) },
    { label: t("workspaceHome.stats.billingVolume"), value: formatCurrencyILS(totalInvoiced) },
  ];

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

  return (
    <div className="mx-auto max-w-2xl space-y-8 pb-4" dir={isRtlLocale(uiLocale) ? "rtl" : "ltr"}>
      <header className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">{t("workspaceHome.eyebrow")}</p>
        <h1 className="text-2xl font-black tracking-[-0.04em] text-[color:var(--v2-ink)] sm:text-3xl">
          {industryProfile.homeTitle}
        </h1>
        <p className="text-sm leading-relaxed text-[color:var(--v2-muted)]">{industryProfile.homeDescription}</p>
      </header>

      <section aria-labelledby="start-here-heading" className="space-y-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
            {t("workspaceHome.startHere.eyebrow")}
          </p>
          <h2 id="start-here-heading" className="mt-1 text-base font-black text-[color:var(--v2-ink)]">
            {t("workspaceHome.startHere.title")}
          </h2>
          <p className="text-xs text-[color:var(--v2-muted)]">{t("workspaceHome.startHere.subtitle")}</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {startHereItems.map(({ id, href, Icon }) => (
            <Link
              key={id}
              href={href}
              className="flex flex-col gap-1.5 rounded-xl border border-slate-200/90 bg-white px-3 py-3 transition hover:border-[color:var(--v2-accent)]/40 hover:bg-slate-50/80"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-[color:var(--v2-accent)]">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <span className="text-sm font-bold text-[color:var(--v2-ink)]">
                {t(`workspaceHome.startHere.cards.${id}.title`)}
              </span>
              <span className="line-clamp-2 text-xs leading-snug text-[color:var(--v2-muted)]">
                {t(`workspaceHome.startHere.cards.${id}.body`)}
              </span>
            </Link>
          ))}
        </div>
        <p className="text-[11px] text-slate-400">{t("workspaceHome.startHere.navHint")}</p>
      </section>

      <div
        className="flex flex-wrap items-baseline gap-x-0 gap-y-1 border-t border-slate-100 pt-6 text-xs text-[color:var(--v2-muted)]"
        role="status"
      >
        {stats.map((s, i) => (
          <Fragment key={s.label}>
            {i > 0 ? <span className="mx-2 text-slate-300 select-none" aria-hidden>·</span> : null}
            <span>
              <strong className="font-semibold text-[color:var(--v2-ink)]">{s.value}</strong>
              <span className="ms-1">{s.label}</span>
            </span>
          </Fragment>
        ))}
      </div>

      <footer className="space-y-3 border-t border-slate-100 pt-5 text-xs text-[color:var(--v2-muted)]">
        <p className="leading-relaxed">{t("workspaceHome.footerHint")}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          {footerNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="font-semibold text-[color:var(--v2-accent)] underline-offset-2 hover:underline"
            >
              {t(item.labelKey)}
            </Link>
          ))}
          <Link
            href="/app/advanced"
            className="ms-auto inline-flex items-center gap-1 font-bold text-slate-600 hover:text-[color:var(--v2-ink)]"
          >
            {t("workspaceHome.advancedCta")}
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </footer>
    </div>
  );
}
