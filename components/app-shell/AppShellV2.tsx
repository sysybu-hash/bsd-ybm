"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { BellRing, Grid2X2, LogOut, ScanSearch, Settings, Sparkles } from "lucide-react";
import AppCommandPalette from "@/components/app-shell/AppCommandPalette";
import WorkspaceUtilityDock from "@/components/app-shell/WorkspaceUtilityDock";
import WorkspaceGlassTopNav from "@/components/app-shell/WorkspaceGlassTopNav";
import BsdYbmLogo from "@/components/brand/BsdYbmLogo";
import { buildAppNavCollection, type AppNavItem } from "@/components/app-shell/app-nav";
import { marketingSans } from "@/lib/fonts/marketing-fonts";
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
import {
  isAppNavPathActive,
  resolveActiveAppNavItem,
} from "@/lib/app-shell-active-nav";

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

/** Sidebar (dark, narrow) — left rail on RTL (visually) */
function SidebarIconLink({
  href,
  label,
  icon: Icon,
  active,
  routeId,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  routeId?: AppNavItem["id"];
}) {
  return (
    <Link
      href={href}
      title={label}
      aria-label={label}
      className={`group relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition ${
        active
          ? "bg-white/[0.08] text-white"
          : "text-[color:var(--sidebar-muted)] hover:bg-white/[0.04] hover:text-[color:var(--sidebar-text)]"
      }`}
    >
      {active ? (
        <span
          className="pointer-events-none absolute inset-y-2 start-0 w-[2px] rounded-e-full bg-[color:var(--sidebar-accent-line)]"
          aria-hidden
        />
      ) : null}
      <Icon className="h-[18px] w-[18px]" aria-hidden />
      {routeId === "ai" ? (
        <Sparkles className="pointer-events-none absolute end-1 top-1 h-2.5 w-2.5 text-[color:var(--axis-ai)]" aria-hidden />
      ) : null}
    </Link>
  );
}

function MobilePill({
  href,
  label,
  icon: Icon,
  active,
  routeId,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  routeId?: AppNavItem["id"];
}) {
  return (
    <Link
      href={href}
      className={`inline-flex shrink-0 items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-semibold transition ${
        active
          ? "border-[color:var(--ink-900)] bg-[color:var(--ink-900)] text-white"
          : "border-[color:var(--line)] bg-[color:var(--canvas-raised)] text-[color:var(--ink-600)] hover:border-[color:var(--line-strong)] hover:text-[color:var(--ink-900)]"
      }`}
    >
      <Icon className="h-4 w-4" aria-hidden />
      <span className="flex items-center gap-1">
        {label}
        {routeId === "ai" ? (
          <Sparkles className={`h-3.5 w-3.5 ${active ? "text-white/80" : "text-[color:var(--axis-ai)]"}`} aria-hidden />
        ) : null}
      </span>
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
      visibleUtilityIds.includes(item.id as "help" | "business" | "admin"),
  );
  const currentSection = resolveActiveAppNavItem(pathname, nav);

  // Subscription / role labels are kept available for future use in a profile popover.
  void getWorkspaceRoleLabel(accessContext);
  void getWorkspaceModeLabel(accessContext);
  void getWorkspaceTierLabel(accessContext);
  void getSubscriptionStatusLabel(user.subscriptionStatus);
  void hasActiveWorkspaceSubscription(user.subscriptionStatus);

  const commandItems = [...nav.primary, ...nav.utility, nav.advanced].map(buildCommandItem);

  return (
    <WorkspaceShellTransitionProvider>
      <div
        className={`${marketingSans.className} bento-site-shell min-h-screen text-[color:var(--ink-900)]`}
        dir={dir}
      >
        <a
          href="#app-main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:right-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-[color:var(--ink-900)] focus:px-4 focus:py-3 focus:text-sm focus:font-bold focus:text-white"
        >
          {t("workspaceNav.skipToMain")}
        </a>

        {/* Desktop layout: narrow dark sidebar (visual LEFT in RTL) + content (RIGHT) */}
        <div className="relative z-10 flex min-h-screen w-full lg:grid lg:grid-cols-[1fr_4.5rem]">
          {/* Content column */}
          <div className="flex min-w-0 flex-col">
            {/* Desktop Top Bar — bordered bottom, no floating */}
            <header className="sticky top-0 z-40 hidden border-b border-[color:var(--line)] bg-[color:var(--canvas-raised)]/95 backdrop-blur-sm lg:block">
              <div className="mx-auto flex w-full min-w-0 max-w-[1600px] items-center gap-4 px-6 py-3">
                <WorkspaceGlassTopNav
                  items={nav.primary}
                  pathname={pathname}
                  navLabel={t("workspaceNav.primaryNavAria")}
                  userInitials={initials}
                  commandItems={commandItems}
                />
              </div>
            </header>

            {/* Mobile Header */}
            <header className="sticky top-0 z-40 border-b border-[color:var(--line)] bg-[color:var(--canvas-raised)]/95 backdrop-blur-sm lg:hidden">
              <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
                <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                  <BsdYbmLogo href="/" variant="marketing-light" size="sm" className="shrink-0" />
                  <div className="min-w-0">
                    <h1 className="truncate text-base font-bold tracking-tight text-[color:var(--ink-900)]">
                      {currentSection.label}
                    </h1>
                  </div>
                </div>

                <AppCommandPalette items={commandItems} />

                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[color:var(--line)] bg-[color:var(--canvas-raised)] text-[color:var(--ink-700)]"
                  aria-label={t("workspaceNav.signOutAria")}
                >
                  <LogOut className="h-4 w-4" aria-hidden />
                </button>
              </div>

              <nav
                className="flex gap-2 overflow-x-auto px-4 pb-3 sm:px-6"
                aria-label={t("workspaceNav.primaryNavAria")}
              >
                {nav.primary.map((item) => (
                  <MobilePill
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    icon={item.icon}
                    active={isAppNavPathActive(pathname, item.href)}
                    routeId={item.id}
                  />
                ))}
              </nav>

              {utilityNavItems.length > 0 ? (
                <nav
                  className="mx-auto flex gap-2 overflow-x-auto px-4 pb-3 sm:px-6"
                  aria-label={t("workspaceNav.sectionMoreNav")}
                >
                  {utilityNavItems.map((item) => (
                    <MobilePill
                      key={item.href}
                      href={item.href}
                      label={item.label}
                      icon={item.icon}
                      active={isAppNavPathActive(pathname, item.href)}
                      routeId={item.id}
                    />
                  ))}
                </nav>
              ) : null}
            </header>

            <main
              id="app-main-content"
              className="relative flex-1 py-6 pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] pl-4 pr-[max(1rem,calc(env(safe-area-inset-right,0px)+0.75rem+3.5rem))] sm:pl-6 sm:pr-[max(1.25rem,calc(env(safe-area-inset-right,0px)+1rem+3.5rem))] lg:pb-8 lg:pl-10 lg:pr-[max(2.5rem,calc(env(safe-area-inset-right,0px)+1.25rem+3.5rem))]"
            >
              <div className="mx-auto w-full min-w-0">{children}</div>
            </main>
          </div>

          {/* Narrow dark sidebar (visual LEFT in RTL) */}
          <aside className="hidden border-s border-[color:var(--sidebar-border)] bg-[color:var(--sidebar-bg)] lg:flex lg:flex-col">
            <div className="flex min-h-screen flex-col items-center px-1 py-4">
              <BsdYbmLogo href="/" iconOnly variant="sidebar" size="sm" className="mb-3" />
              <nav
                className="flex w-full flex-1 flex-col items-center gap-1.5"
                aria-label={t("workspaceNav.sectionDailyWork")}
              >
                <SidebarIconLink
                  href="/app/inbox"
                  label={t("workspaceNav.items.inbox.label")}
                  icon={BellRing}
                  active={isAppNavPathActive(pathname, "/app/inbox")}
                  routeId="inbox"
                />
                <SidebarIconLink
                  href="/app/documents/erp"
                  label={t("workspaceDock.dock.scanner")}
                  icon={ScanSearch}
                  active={isAppNavPathActive(pathname, "/app/documents/erp")}
                />
                <SidebarIconLink
                  href="/app/advanced"
                  label={t("workspaceNav.advanced.label")}
                  icon={Grid2X2}
                  active={isAppNavPathActive(pathname, "/app/advanced")}
                />
                <SidebarIconLink
                  href="/app/settings"
                  label={t("workspaceNav.items.settings.label")}
                  icon={Settings}
                  active={isAppNavPathActive(pathname, "/app/settings")}
                  routeId="settings"
                />
              </nav>

              <div className="mt-auto pb-1">
                <Link
                  href="/app/settings/overview"
                  title={`${user.name} · ${user.email}`}
                  aria-label={user.name}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.08] text-[11px] font-bold text-white ring-1 ring-white/10 transition hover:bg-white/[0.12]"
                >
                  {initials}
                </Link>
              </div>
            </div>
          </aside>
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
