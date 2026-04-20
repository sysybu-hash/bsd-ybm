"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { BellRing, Grid2X2, LogOut, Settings, Sparkles } from "lucide-react";
import AppCommandPalette from "@/components/app-shell/AppCommandPalette";
import WorkspaceUtilityDock from "@/components/app-shell/WorkspaceUtilityDock";
import WorkspaceGlassTopNav from "@/components/app-shell/WorkspaceGlassTopNav";
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
      className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition ${
        active
          ? "bg-[color:var(--app-sidebar-active-bg)] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]"
          : "text-[color:var(--app-sidebar-muted)] hover:bg-white/6 hover:text-[color:var(--app-sidebar-text)]"
      }`}
    >
      {active ? (
        <span
          className="pointer-events-none absolute inset-y-2 start-0 w-[3px] rounded-e-full bg-[color:var(--app-sidebar-accent-line)]"
          aria-hidden
        />
      ) : null}
      <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
      {routeId === "ai" ? (
        <Sparkles className="pointer-events-none absolute end-0.5 top-0.5 h-3 w-3 text-teal-300" aria-hidden />
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
      className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${
        active
          ? "glass-2026-topnav-link--active text-white"
          : "border border-slate-200/90 bg-white/80 text-slate-600 backdrop-blur-sm"
      }`}
    >
      <Icon className="h-4 w-4" aria-hidden />
      <span className="flex items-center gap-1">
        {label}
        {routeId === "ai" ? <Sparkles className="h-3.5 w-3.5 text-amber-200" aria-hidden /> : null}
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

  const roleLabel = getWorkspaceRoleLabel(accessContext);
  const modeLabel = getWorkspaceModeLabel(accessContext);
  const tierLabel = getWorkspaceTierLabel(accessContext);
  const subscriptionLabel = getSubscriptionStatusLabel(user.subscriptionStatus);
  const subscriptionActive = hasActiveWorkspaceSubscription(user.subscriptionStatus);

  const commandItems = [...nav.primary, ...nav.utility, nav.advanced].map(buildCommandItem);

  return (
    <WorkspaceShellTransitionProvider>
      <div
        className={`${marketingSans.className} v2-site-shell min-h-screen text-[color:var(--v2-ink)] lg:flex lg:items-center lg:justify-center lg:p-6 xl:p-8`}
        dir={dir}
      >
        <a
          href="#app-main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:right-4 focus:top-4 focus:z-[60] focus:rounded-2xl focus:bg-[color:var(--v2-accent)] focus:px-4 focus:py-3 focus:text-sm focus:font-black focus:text-white"
        >
          {t("workspaceNav.skipToMain")}
        </a>

        <div className="relative z-10 grid min-h-screen w-full max-w-[1800px] lg:min-h-[calc(100vh-3rem)] lg:grid-cols-[1fr_4rem] lg:overflow-hidden lg:rounded-[36px] lg:border lg:border-white/70 lg:bg-white/55 lg:backdrop-blur-2xl lg:shadow-[0_34px_90px_-34px_rgba(15,23,42,0.42),0_0_0_1px_rgba(255,255,255,0.55)_inset] xl:min-h-[calc(100vh-4rem)]">
          <div className="min-w-0 flex flex-col h-full overflow-hidden bg-white/35 backdrop-blur-2xl">
            {/* Desktop Top Nav — logo outside pill on the right */}
            <div className="hidden lg:flex pt-5 pb-2 px-6 z-50 sticky top-0 bg-white/35 backdrop-blur-2xl">
              <WorkspaceGlassTopNav items={nav.primary} pathname={pathname} navLabel={t("workspaceNav.primaryNavAria")} userInitials={initials} />
            </div>

            {/* Mobile Header (Only visible on small screens) */}
            <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-md lg:hidden">
              <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-xs font-black text-[color:var(--v2-accent)] shadow-sm ring-1 ring-slate-200/80">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <h1 className="truncate text-base font-black tracking-[-0.04em] text-[color:var(--v2-ink)]">
                      {currentSection.label}
                    </h1>
                  </div>
                </div>

                <AppCommandPalette items={commandItems} />

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[color:var(--v2-line)] bg-white/90 text-[color:var(--v2-ink)]"
                    aria-label={t("workspaceNav.signOutAria")}
                  >
                    <LogOut className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </div>

              <nav
                className="glass-2026-topnav mx-4 mb-3 flex gap-2 overflow-x-auto pb-1 sm:mx-6"
                aria-label={t("workspaceNav.primaryNavAria")}
              >
                <div className="flex min-w-min gap-2 px-1.5 py-1">
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
                </div>
              </nav>

              {utilityNavItems.length > 0 ? (
                <nav className="mx-auto flex gap-2 overflow-x-auto px-4 pb-3 sm:px-6" aria-label={t("workspaceNav.sectionMoreNav")}>
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
              className="mx-auto w-full max-w-[1500px] px-6 py-4 pb-[calc(4.25rem+env(safe-area-inset-bottom,0px))] sm:px-8 lg:px-10 lg:pb-8 flex-1 overflow-y-auto"
            >
              {children}
            </main>
          </div>

          {/* Narrow utility sidebar on the visual LEFT (last child in DOM = end in RTL) */}
          <aside className="hidden border-s border-white/40 bg-white/18 backdrop-blur-2xl lg:flex lg:flex-col">
            <div className="flex min-h-screen flex-col items-center px-2 py-5">
              <nav className="mt-4 flex w-full flex-1 flex-col items-center gap-2.5" aria-label={t("workspaceNav.sectionDailyWork")}>
                <Link
                  href="/app/inbox"
                  title={t("workspaceNav.items.inbox.label")}
                  aria-label={t("workspaceNav.items.inbox.label")}
                  className={`relative flex h-10 w-10 items-center justify-center rounded-2xl transition ${
                    isAppNavPathActive(pathname, "/app/inbox")
                      ? "bg-white/55 text-slate-900 shadow-[0_10px_22px_-14px_rgba(15,23,42,0.35)] ring-1 ring-white/70"
                      : "text-slate-700/70 hover:bg-white/40 hover:text-slate-900 ring-1 ring-white/30"
                  }`}
                >
                  <BellRing className="h-[18px] w-[18px]" aria-hidden />
                </Link>
                <Link
                  href="/app/advanced"
                  title={t("workspaceNav.advanced.label")}
                  aria-label={t("workspaceNav.advanced.label")}
                  className={`flex h-10 w-10 items-center justify-center rounded-2xl transition ${
                    isAppNavPathActive(pathname, "/app/advanced")
                      ? "bg-white/55 text-slate-900 shadow-[0_10px_22px_-14px_rgba(15,23,42,0.35)] ring-1 ring-white/70"
                      : "text-slate-700/70 hover:bg-white/40 hover:text-slate-900 ring-1 ring-white/30"
                  }`}
                >
                  <Grid2X2 className="h-[18px] w-[18px]" aria-hidden />
                </Link>
                <Link
                  href="/app/settings"
                  title={t("workspaceNav.items.settings.label")}
                  aria-label={t("workspaceNav.items.settings.label")}
                  className={`flex h-10 w-10 items-center justify-center rounded-2xl transition ${
                    isAppNavPathActive(pathname, "/app/settings")
                      ? "bg-white/55 text-slate-900 shadow-[0_10px_22px_-14px_rgba(15,23,42,0.35)] ring-1 ring-white/70"
                      : "text-slate-700/70 hover:bg-white/40 hover:text-slate-900 ring-1 ring-white/30"
                  }`}
                >
                  <Settings className="h-[18px] w-[18px]" aria-hidden />
                </Link>
              </nav>

              <div className="mt-auto pb-2">
                <Link
                  href="/app/settings/overview"
                  title={`${user.name} · ${user.email}`}
                  aria-label={user.name}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white/55 text-sm font-black text-teal-800 ring-2 ring-white/65 shadow-[0_18px_34px_-26px_rgba(15,23,42,0.45)] transition hover:bg-white/70"
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
