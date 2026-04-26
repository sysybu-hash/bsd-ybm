"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { LogOut, Menu, PanelRightOpen, Sparkles, X } from "lucide-react";
import AppCommandPalette from "@/components/app-shell/AppCommandPalette";
import WorkspaceUtilityDock from "@/components/app-shell/WorkspaceUtilityDock";
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
  expanded,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  routeId?: AppNavItem["id"];
  expanded: boolean;
}) {
  return (
    <Link
      href={href}
      title={label}
      aria-label={label}
      className={`group/navitem relative flex h-10 w-full shrink-0 items-center gap-3 rounded-lg px-3 text-sm font-bold transition ${
        active
          ? "bg-[color:var(--sidebar-active-bg)] text-[color:var(--sidebar-text-active)] shadow-[0_12px_30px_rgba(124,87,255,0.18)]"
          : "text-[color:var(--sidebar-muted)] hover:bg-[color:var(--sidebar-hover-bg)] hover:text-[color:var(--sidebar-text-active)]"
      }`}
    >
      {active ? (
        <span
          className="pointer-events-none absolute inset-y-2 end-0 w-[3px] rounded-s-full bg-[color:var(--sidebar-accent-line)]"
          aria-hidden
        />
      ) : null}
      <span className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
        active ? "bg-white/55 text-[color:var(--sidebar-accent-line)]" : "bg-[color:var(--canvas-sunken)] text-current"
      }`}>
        <Icon className="h-[18px] w-[18px]" aria-hidden />
        {routeId === "ai" ? (
          <Sparkles className="pointer-events-none absolute end-0.5 top-0.5 h-2.5 w-2.5 text-[color:var(--axis-ai)]" aria-hidden />
        ) : null}
      </span>
      <span className={`min-w-0 truncate transition-opacity duration-150 ${expanded ? "opacity-100" : "opacity-0"}`}>
        {label}
      </span>
    </Link>
  );
}

function SidebarSectionLabel({ children, expanded }: { children: ReactNode; expanded: boolean }) {
  return (
    <p className={`px-3 pb-1 pt-3 text-[10px] font-black uppercase tracking-[0.16em] text-[color:var(--sidebar-muted)] transition-opacity duration-150 ${expanded ? "opacity-100" : "opacity-0"}`}>
      {children}
    </p>
  );
}

type DesktopNavGroup = {
  title: string;
  items: AppNavItem[];
  sublinks?: Partial<Record<AppNavItem["id"], { href: string; label: string }[]>>;
};

function SidebarSubLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`ms-11 block rounded-lg px-3 py-1.5 text-xs font-bold transition ${
        active
          ? "bg-[color:var(--sidebar-active-bg)] text-[color:var(--sidebar-text-active)]"
          : "text-[color:var(--sidebar-muted)] hover:bg-[color:var(--sidebar-hover-bg)] hover:text-[color:var(--sidebar-text-active)]"
      }`}
    >
      {label}
    </Link>
  );
}

function SidebarNavGroup({
  group,
  expanded,
  pathname,
}: {
  group: DesktopNavGroup;
  expanded: boolean;
  pathname: string;
}) {
  if (group.items.length === 0) return null;

  return (
    <div
      className={
        expanded
          ? "space-y-1 rounded-xl border border-[color:var(--line)] bg-[color:var(--canvas-raised)]/70 p-1.5 shadow-[0_8px_22px_rgba(15,23,42,0.04)]"
          : "space-y-1"
      }
    >
      <SidebarSectionLabel expanded={expanded}>{group.title}</SidebarSectionLabel>
      {group.items.map((item) => {
        const sublinks = group.sublinks?.[item.id] ?? [];
        const itemActive =
          isAppNavPathActive(pathname, item.href) ||
          sublinks.some((link) => pathname === link.href || pathname.startsWith(`${link.href}/`));

        return (
          <div key={item.href} className="space-y-1">
            <SidebarIconLink
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={itemActive}
              routeId={item.id}
              expanded={expanded}
            />
            {expanded && sublinks.length > 0 ? (
              <div className="space-y-1">
                {sublinks.map((link) => (
                  <SidebarSubLink
                    key={link.href}
                    href={link.href}
                    label={link.label}
                    active={pathname === link.href || pathname.startsWith(`${link.href}/`)}
                  />
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function MobileNavLink({
  href,
  label,
  icon: Icon,
  active,
  routeId,
  onClick,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  routeId?: AppNavItem["id"];
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex min-h-12 w-full items-center gap-3 rounded-lg border px-3 text-sm font-bold transition ${
        active
          ? "border-[color:var(--axis-ai)] bg-[color:var(--axis-ai-soft)] text-[color:var(--axis-ai-ink)]"
          : "border-[color:var(--line)] bg-white text-[color:var(--ink-700)] hover:border-[color:var(--line-strong)] hover:text-[color:var(--ink-900)]"
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          active ? "bg-white text-[color:var(--axis-ai)]" : "bg-[color:var(--canvas-sunken)] text-current"
        }`}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <span className="flex min-w-0 flex-1 items-center gap-1 truncate">
        {label}
        {routeId === "ai" ? (
          <Sparkles className="h-3.5 w-3.5 text-[color:var(--axis-ai)]" aria-hidden />
        ) : null}
      </span>
    </Link>
  );
}

function MobileBottomTab({
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
      aria-current={active ? "page" : undefined}
      className={`relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-[11px] font-black transition ${
        active
          ? "bg-[color:var(--axis-ai)] text-white shadow-[0_10px_22px_rgba(79,70,229,0.22)]"
          : "text-[color:var(--ink-600)] hover:bg-[color:var(--canvas-sunken)] hover:text-[color:var(--ink-900)]"
      }`}
    >
      <Icon className="h-5 w-5" aria-hidden />
      {routeId === "ai" ? (
        <Sparkles
          className={`pointer-events-none absolute end-2 top-1.5 h-3 w-3 ${
            active ? "text-white/80" : "text-[color:var(--axis-ai)]"
          }`}
          aria-hidden
        />
      ) : null}
      <span className="max-w-full truncate leading-none">{label}</span>
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
  const [desktopMenuPinned, setDesktopMenuPinned] = useState(false);
  const [desktopMenuHovered, setDesktopMenuHovered] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
      visibleUtilityIds.includes(item.id as "projects" | "operations" | "help" | "business" | "admin"),
  );
  const currentSection = resolveActiveAppNavItem(pathname, nav);

  // Subscription / role labels are kept available for future use in a profile popover.
  void getWorkspaceRoleLabel(accessContext);
  void getWorkspaceModeLabel(accessContext);
  void getWorkspaceTierLabel(accessContext);
  void getSubscriptionStatusLabel(user.subscriptionStatus);
  void hasActiveWorkspaceSubscription(user.subscriptionStatus);

  const commandItems = [...nav.primary, ...nav.utility].map(buildCommandItem);
  const desktopMenuExpanded = desktopMenuPinned || desktopMenuHovered;
  const mobileBottomNav = nav.primary.slice(0, 5);
  const allMobileNavItems = [...nav.primary, ...utilityNavItems];
  const navById = new Map(nav.all.map((item) => [item.id, item]));
  const pickDesktopItems = (ids: AppNavItem["id"][]) =>
    ids
      .map((id) => navById.get(id))
      .filter((item): item is AppNavItem => item !== undefined && item.showInNav !== false);
  const desktopNavGroups: DesktopNavGroup[] = [
    {
      title: "עבודה יומית",
      items: pickDesktopItems(["home", "inbox", "projects"]),
      sublinks: {
        inbox: [{ href: "/app/inbox/advanced", label: "תיבת עבודה מתקדמת" }],
      },
    },
    {
      title: "לקוחות, מסמכים וכספים",
      items: pickDesktopItems(["clients", "documents", "finance"]),
      sublinks: {
        clients: [{ href: "/app/clients/advanced", label: "CRM מתקדם" }],
        documents: [
          { href: "/app/documents/erp", label: "לוח סריקה חכם" },
          { href: "/app/documents/issue", label: "הפקת מסמך" },
          { href: "/app/documents/issued", label: "מסמכים שהופקו" },
        ],
      },
    },
    {
      title: "מנועים ותפעול",
      items: pickDesktopItems(["ai", "operations", "business"]),
      sublinks: {
        operations: [
          { href: "/app/operations/meckano", label: "Meckano ונוכחות" },
          { href: "/app/operations/advanced", label: "תפעול מתקדם" },
        ],
      },
    },
    {
      title: "מערכת וניהול",
      items: pickDesktopItems(["settings", "help", "admin"]),
      sublinks: {
        settings: [
          { href: "/app/settings/organization", label: "ארגון והרשאות" },
          { href: "/app/settings/profession", label: "התאמת מקצוע" },
          { href: "/app/settings/stack", label: "מנועים וחיבורים" },
          { href: "/app/settings/billing", label: "מנוי וחיוב" },
        ],
        admin: [{ href: "/app/admin/steel", label: "ניהול ברזל" }],
      },
    },
  ];

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
        <div className="relative z-10 flex min-h-screen w-full">
          {/* Content column */}
          <div className="flex min-w-0 flex-1 flex-col">
            {/* Desktop Top Bar */}
            <header className="sticky top-0 z-40 hidden border-b border-[color:var(--line)] bg-white/96 backdrop-blur-xl lg:block">
              <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-4 px-6">
                {/* לוגו */}
                <BsdYbmLogo href="/app" variant="marketing-light" size="sm" className="shrink-0" />

                {/* לשוניות ניווט ראשי */}
                <nav className="flex h-full flex-1 items-center gap-0.5 overflow-x-auto" aria-label="תפריט ראשי">
                  {nav.primary.map((item) => {
                    const active = isAppNavPathActive(pathname, item.href);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        className={`group relative flex h-full items-center gap-1.5 whitespace-nowrap px-3 text-sm font-semibold transition-colors ${
                          active
                            ? "text-[color:var(--ink-900)]"
                            : "text-[color:var(--ink-500)] hover:text-[color:var(--ink-800)]"
                        }`}
                      >
                        <Icon className={`h-[15px] w-[15px] shrink-0 ${active ? "text-[color:var(--axis-clients)]" : ""}`} aria-hidden />
                        {item.label}
                        {item.id === "ai" && (
                          <span className="ms-0.5 inline-flex items-center rounded-full bg-[color:var(--axis-ai-soft)] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-[color:var(--axis-ai)]">
                            AI
                          </span>
                        )}
                        {active && (
                          <span className="absolute inset-x-0 bottom-0 h-[3px] rounded-t-full bg-[color:var(--axis-clients)]" aria-hidden />
                        )}
                      </Link>
                    );
                  })}
                  {/* פרויקטים מה-utility nav */}
                  {nav.utility.filter(u => u.id === "projects" || u.id === "operations").map((item) => {
                    const active = isAppNavPathActive(pathname, item.href);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        className={`group relative flex h-full items-center gap-1.5 whitespace-nowrap px-3 text-sm font-semibold transition-colors ${
                          active
                            ? "text-[color:var(--ink-900)]"
                            : "text-[color:var(--ink-500)] hover:text-[color:var(--ink-800)]"
                        }`}
                      >
                        <Icon className={`h-[15px] w-[15px] shrink-0 ${active ? "text-[color:var(--axis-clients)]" : ""}`} aria-hidden />
                        {item.label}
                        {active && (
                          <span className="absolute inset-x-0 bottom-0 h-[3px] rounded-t-full bg-[color:var(--axis-clients)]" aria-hidden />
                        )}
                      </Link>
                    );
                  })}
                </nav>

                {/* כלי ניהול ימין */}
                <div className="flex shrink-0 items-center gap-2">
                  <div className="w-56">
                    <AppCommandPalette items={commandItems} />
                  </div>
                </div>
              </div>
            </header>

            {/* Mobile Header */}
            <header className="sticky top-0 z-40 border-b border-[color:var(--line)] bg-white/96 backdrop-blur-xl lg:hidden">
              <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-3 py-2.5 sm:px-4">
                <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                  <BsdYbmLogo href="/" variant="marketing-light" size="sm" className="shrink-0" />
                  <div className="min-w-0">
                    <p className="truncate text-[10px] font-black uppercase tracking-[0.14em] text-[color:var(--ink-500)]">
                      BSD-YBM
                    </p>
                    <h1 className="truncate text-base font-black tracking-tight text-[color:var(--ink-900)]">
                      {currentSection.label}
                    </h1>
                  </div>
                </div>

                <AppCommandPalette items={commandItems} />

                <button
                  type="button"
                  onClick={() => setMobileMenuOpen((current) => !current)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[color:var(--line)] bg-white text-[color:var(--ink-800)] shadow-sm"
                  aria-label={mobileMenuOpen ? "סגור תפריט" : "פתח תפריט"}
                  aria-expanded={mobileMenuOpen}
                >
                  {mobileMenuOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
                </button>
              </div>

              {mobileMenuOpen ? (
                <div className="border-t border-[color:var(--line)] bg-white px-3 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-3 shadow-[0_18px_48px_rgba(15,23,42,0.10)]">
                  <nav
                    className="grid max-h-[calc(100dvh-8rem)] grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2"
                    aria-label={t("workspaceNav.primaryNavAria")}
                  >
                    {allMobileNavItems.map((item) => (
                      <MobileNavLink
                        key={item.href}
                        href={item.href}
                        label={item.label}
                        icon={item.icon}
                        active={isAppNavPathActive(pathname, item.href)}
                        routeId={item.id}
                        onClick={() => setMobileMenuOpen(false)}
                      />
                    ))}
                  </nav>
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-[color:var(--line)] bg-[color:var(--canvas-sunken)] px-4 text-sm font-black text-[color:var(--ink-800)]"
                  >
                    <LogOut className="h-4 w-4" aria-hidden />
                    {t("workspaceNav.signOutAria")}
                  </button>
                </div>
              ) : null}
            </header>

            <main
              id="app-main-content"
              className="relative flex-1 px-3 pt-4 pb-[calc(7.5rem+env(safe-area-inset-bottom,0px))] sm:px-4 lg:py-5 lg:pb-7 lg:pr-[max(6rem,calc(env(safe-area-inset-right,0px)+6rem))] lg:pl-[max(2rem,calc(env(safe-area-inset-left,0px)+1.25rem+3.5rem))]"
            >
              <div className="mx-auto w-full min-w-0">{children}</div>
            </main>
          </div>

          <nav
            className="fixed inset-x-0 bottom-0 z-[55] border-t border-[color:var(--line)] bg-white/96 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] pt-2 shadow-[0_-14px_34px_rgba(15,23,42,0.08)] backdrop-blur-xl lg:hidden"
            aria-label={t("workspaceNav.primaryNavAria")}
          >
            <div className="mx-auto flex max-w-md gap-1">
              {mobileBottomNav.map((item) => (
                <MobileBottomTab
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

          {/* Narrow dark sidebar (visual LEFT in RTL) */}
          <aside
            className={`group/sidebar hidden overflow-hidden border-s border-[color:var(--sidebar-border)] bg-[color:var(--sidebar-bg)] shadow-[0_16px_44px_rgba(15,23,42,0.06)] transition-[width] duration-200 ease-out lg:fixed lg:right-0 lg:top-0 lg:z-50 lg:flex lg:h-screen lg:flex-col ${
              desktopMenuExpanded ? "lg:w-80" : "lg:w-[4.5rem]"
            }`}
            onMouseEnter={() => setDesktopMenuHovered(true)}
            onMouseLeave={() => setDesktopMenuHovered(false)}
            onFocus={() => setDesktopMenuHovered(true)}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) setDesktopMenuHovered(false);
            }}
          >
            <div className="flex h-full w-80 flex-col px-3 py-4">
              <div className="mb-3 flex items-center gap-3 px-2">
                <button
                  type="button"
                  onClick={() => setDesktopMenuPinned((current) => !current)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[color:var(--canvas-sunken)] text-[color:var(--ink-700)] ring-1 ring-[color:var(--line)] transition hover:bg-white hover:text-[color:var(--sidebar-accent-line)]"
                  aria-label={desktopMenuPinned ? "סגור תפריט צד" : "פתח תפריט צד"}
                  aria-expanded={desktopMenuExpanded}
                >
                  <PanelRightOpen className="h-5 w-5" aria-hidden />
                </button>
                <BsdYbmLogo href="/" iconOnly variant="sidebar" size="sm" className="shrink-0" />
                <div className={`min-w-0 transition-opacity duration-150 ${desktopMenuExpanded ? "opacity-100" : "opacity-0"}`}>
                  <p className="truncate text-lg font-black text-[color:var(--sidebar-accent-line)]">BSD-YBM</p>
                  <p className="truncate text-[11px] font-semibold text-[color:var(--sidebar-muted)]">{currentSection.label}</p>
                </div>
              </div>
              <div className={`mb-3 overflow-hidden px-1 transition-opacity duration-150 ${desktopMenuExpanded ? "opacity-100" : "opacity-0"}`}>
                <AppCommandPalette items={commandItems} />
              </div>
              <nav
                className="flex min-h-0 w-full flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden pr-1"
                aria-label="תפריט סביבת העבודה"
              >
                {desktopNavGroups.map((group) => (
                  <SidebarNavGroup
                    key={group.title}
                    group={group}
                    expanded={desktopMenuExpanded}
                    pathname={pathname}
                  />
                ))}
              </nav>

              <div className="mt-auto pb-1 pt-3">
                <Link
                  href="/app/settings/overview"
                  title={`${user.name} · ${user.email}`}
                  aria-label={user.name}
                  className="flex h-11 w-full items-center gap-3 rounded-lg bg-[color:var(--sidebar-accent-line)] px-3 text-white shadow-[0_12px_26px_rgba(79,70,229,0.22)] transition hover:brightness-105"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-[11px] font-bold">
                    {initials}
                  </span>
                  <span className={`min-w-0 transition-opacity duration-150 ${desktopMenuExpanded ? "opacity-100" : "opacity-0"}`}>
                    <span className="block truncate text-sm font-black">{firstName}</span>
                    <span className="block truncate text-[11px] font-semibold text-white/70">{user.email}</span>
                  </span>
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
