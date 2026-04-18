"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { LogOut, Sparkles } from "lucide-react";
import AppCommandPalette from "@/components/app-shell/AppCommandPalette";
import WorkspaceUtilityDock from "@/components/app-shell/WorkspaceUtilityDock";
import { buildAppNavCollection, type AppNavItem } from "@/components/app-shell/app-nav";
import { marketingSans } from "@/lib/fonts/marketing-fonts";
import BsdYbmLogo from "@/components/brand/BsdYbmLogo";
import type { IndustryProfile } from "@/lib/professions/runtime";
import {
  getSubscriptionStatusLabel,
  getVisibleUtilitySectionIds,
  getWorkspaceModeLabel,
  getWorkspaceRoleLabel,
  getWorkspaceTierLabel,
  hasActiveWorkspaceSubscription,
  type WorkspaceAccessContext,
} from "@/lib/workspace-access";
import { getHiddenPrimaryRouteIds, toWorkspaceFeatureInput } from "@/lib/workspace-features";
import { WorkspaceShellTransitionProvider } from "@/components/app-shell/WorkspaceShellTransition";
import { useI18n } from "@/components/I18nProvider";

type Props = Readonly<{
  children: ReactNode;
  user: {
    name: string;
    email: string;
    organizationId?: string | null;
    role: string;
    isPlatformAdmin?: boolean;
    subscriptionTier?: string | null;
    subscriptionStatus?: string | null;
    hasMeckanoAccess?: boolean;
    industryProfile: IndustryProfile;
  };
}>;

function isRouteActive(pathname: string, href: string) {
  const current = pathname.replace(/\/$/, "") || "/";
  const target = href.replace(/\/$/, "") || "/";
  if (target === "/app") return current === "/app";
  return current === target || current.startsWith(`${target}/`);
}

function SidebarLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-bold transition ${
        active
          ? "border-r-[3px] border-[color:var(--app-sidebar-accent-line)] bg-[color:var(--app-sidebar-active-bg)] text-white"
          : "text-[color:var(--app-sidebar-muted)] hover:bg-white/5 hover:text-[color:var(--app-sidebar-text)]"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      <span className="truncate">{label}</span>
    </Link>
  );
}

function MobilePill({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${
        active
          ? "bg-[#14b8a6] text-white"
          : "border border-slate-300 bg-white text-slate-600"
      }`}
    >
      <Icon className="h-4 w-4" aria-hidden />
      {label}
    </Link>
  );
}

function buildCommandItem(item: AppNavItem) {
  return {
    href: item.href,
    label: item.label,
    summary: item.summary,
    icon: item.icon,
    keywords: [item.legacyHref, item.label, item.summary],
  };
}

export default function AppShellV2({ children, user }: Props) {
  const { t, dir } = useI18n();
  const pathname = usePathname() ?? "/app";
  const firstName = user.name.trim().split(" ")[0] || user.email.split("@")[0] || "User";
  const initials = firstName.slice(0, 2).toUpperCase();

  const accessContext: WorkspaceAccessContext = {
    role: user.role,
    isPlatformAdmin: user.isPlatformAdmin,
    subscriptionTier: user.subscriptionTier,
    subscriptionStatus: user.subscriptionStatus,
    hasOrganization: Boolean(user.organizationId),
    hasMeckanoAccess: user.hasMeckanoAccess,
  };

  const visibleUtilityIds = getVisibleUtilitySectionIds(accessContext);
  const hiddenPrimaryRouteIds = getHiddenPrimaryRouteIds(toWorkspaceFeatureInput(accessContext, user.industryProfile));
  const nav = buildAppNavCollection(user.industryProfile, t, { visibleUtilityIds, hiddenPrimaryRouteIds });
  const utilityNavItems = nav.utility.filter(
    (item) =>
      item.showInNav !== false &&
      visibleUtilityIds.includes(item.id as "help" | "business" | "intelligence" | "admin"),
  );
  const currentSection = nav.all.find((item) => isRouteActive(pathname, item.href)) ?? nav.primary[0];

  const roleLabel = getWorkspaceRoleLabel(accessContext);
  const modeLabel = getWorkspaceModeLabel(accessContext);
  const tierLabel = getWorkspaceTierLabel(accessContext);
  const subscriptionLabel = getSubscriptionStatusLabel(user.subscriptionStatus);
  const subscriptionActive = hasActiveWorkspaceSubscription(user.subscriptionStatus);

  const commandItems = [...nav.primary, ...nav.utility, nav.advanced].map(buildCommandItem);

  return (
    <WorkspaceShellTransitionProvider>
    <div
      className={`${marketingSans.className} min-h-screen bg-[color:var(--app-main-bg)] text-[color:var(--v2-ink)]`}
      dir={dir}
    >
      <a
        href="#app-main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:right-4 focus:top-4 focus:z-[60] focus:rounded-2xl focus:bg-[color:var(--v2-accent)] focus:px-4 focus:py-3 focus:text-sm focus:font-black focus:text-white"
      >
        {t("workspaceNav.skipToMain")}
      </a>

      <div className="grid min-h-screen lg:grid-cols-[276px_1fr]">
        <aside className="hidden border-l border-[color:var(--app-sidebar-border)] bg-[color:var(--app-sidebar-bg)] lg:block">
          <div className="sticky top-0 flex min-h-screen flex-col px-4 py-5">
            <BsdYbmLogo
              href="/app"
              variant="sidebar"
              size="sm"
              subtitle={
                <span className="mt-0.5 block text-[10px] font-medium text-slate-400">{t("workspaceNav.logoSubtitle")}</span>
              }
            />

            <div className="mt-8">
              <p className="px-2 text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">
                {t("workspaceNav.sectionDailyWork")}
              </p>
              <nav className="mt-3 grid gap-1.5">
                {nav.primary.map((item) => (
                  <SidebarLink
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    icon={item.icon}
                    active={isRouteActive(pathname, item.href)}
                  />
                ))}
              </nav>
            </div>

            {utilityNavItems.length > 0 ? (
              <div className="mt-6">
                <p className="px-2 text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">
                  {t("workspaceNav.sectionMoreNav")}
                </p>
                <nav className="mt-3 grid gap-1.5">
                  {utilityNavItems.map((item) => (
                    <SidebarLink
                      key={item.href}
                      href={item.href}
                      label={item.label}
                      icon={item.icon}
                      active={isRouteActive(pathname, item.href)}
                    />
                  ))}
                </nav>
              </div>
            ) : null}

            <div className="mt-auto space-y-3 pt-6">
              <Link
                href={nav.advanced.href}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-black text-white transition hover:bg-white/10"
              >
                <Sparkles className="h-4 w-4" aria-hidden />
                {nav.advanced.label}
              </Link>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-3.5">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#14b8a6]/20 text-sm font-black text-[#5eead4]">
                    {initials}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-white">{user.name}</p>
                    <p className="truncate text-xs text-slate-400">{user.email}</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-black text-slate-300">{roleLabel}</span>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-black text-slate-400">{tierLabel}</span>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-black text-slate-400">{modeLabel}</span>
                </div>

                <p
                  className={`mt-3 text-xs font-bold ${
                    subscriptionActive ? "text-emerald-400" : "text-amber-400"
                  }`}
                >
                  {subscriptionLabel}
                </p>
              </div>

              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-transparent px-4 py-2.5 text-sm font-bold text-slate-300 transition hover:bg-white/5 hover:text-white"
              >
                <LogOut className="h-4 w-4" aria-hidden />
                {t("workspaceNav.signOut")}
              </button>
            </div>
          </div>
        </aside>

        <div className="min-w-0 bg-[color:var(--app-main-bg)]">
          <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/95 shadow-sm backdrop-blur-md">
            <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-sm font-black text-[color:var(--v2-accent)] shadow-sm lg:hidden">
                  {initials}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-[color:var(--v2-muted)]">
                    <span>{user.industryProfile.industryLabel}</span>
                    <span>•</span>
                    <span>{roleLabel}</span>
                    <span>•</span>
                    <span>{tierLabel}</span>
                  </div>
                  <h1 className="truncate text-lg font-black tracking-[-0.05em] text-[color:var(--v2-ink)] sm:text-xl">
                    {currentSection.label}
                  </h1>
                </div>
              </div>

              <AppCommandPalette items={commandItems} />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[color:var(--v2-line)] bg-white/88 text-[color:var(--v2-ink)] sm:hidden"
                  aria-label={t("workspaceNav.signOutAria")}
                >
                  <LogOut className="h-4 w-4" aria-hidden />
                </button>

                <Link href={nav.advanced.href} className="v2-button v2-button-secondary hidden sm:inline-flex">
                  <Sparkles className="h-4 w-4" aria-hidden />
                  {t("workspaceNav.advancedShort")}
                </Link>
              </div>
            </div>

            <nav className="mx-auto flex max-w-[1600px] gap-2 overflow-x-auto px-4 pb-3 sm:px-6 lg:hidden lg:px-8">
              {nav.primary.map((item) => (
                <MobilePill
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  active={isRouteActive(pathname, item.href)}
                />
              ))}
            </nav>

            {utilityNavItems.length > 0 ? (
              <nav className="mx-auto flex max-w-[1600px] gap-2 overflow-x-auto px-4 pb-3 sm:px-6 lg:hidden lg:px-8">
                {utilityNavItems.map((item) => (
                  <MobilePill
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    icon={item.icon}
                    active={isRouteActive(pathname, item.href)}
                  />
                ))}
              </nav>
            ) : null}
          </header>

          <main
            id="app-main-content"
            className="mx-auto max-w-[1600px] px-4 py-5 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] sm:px-6 lg:px-8 lg:pb-8"
          >
            {children}
          </main>
        </div>
      </div>

      <WorkspaceUtilityDock
        orgId={user.organizationId}
        industryProfile={user.industryProfile}
        userName={user.name}
        hiddenPrimaryRouteIds={hiddenPrimaryRouteIds}
      />
    </div>
    </WorkspaceShellTransitionProvider>
  );
}
