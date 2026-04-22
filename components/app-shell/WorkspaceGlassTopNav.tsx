"use client";

import Link from "next/link";
import { BellRing, CircleHelp, Sparkles } from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
import type { AppNavItem } from "@/components/app-shell/app-nav";
import { isAppNavPathActive } from "@/lib/app-shell-active-nav";
import BsdYbmLogo from "@/components/brand/BsdYbmLogo";
import AppCommandPalette, { type AppCommandItem } from "@/components/app-shell/AppCommandPalette";
import WorkspaceLocaleSwitcher from "@/components/app-shell/WorkspaceLocaleSwitcher";

type Props = Readonly<{
  items: AppNavItem[];
  pathname: string;
  navLabel: string;
  userInitials?: string;
  commandItems: AppCommandItem[];
}>;

/**
 * Command Center top bar:
 * - לוגו → דף הבית השיווקי (/)
 * - ניווט ראשי
 * - חיפוש (פלטת הפקודות), שפת ממשק, עזרה, התראות, פרופיל
 */
export default function WorkspaceGlassTopNav({
  items,
  pathname,
  navLabel,
  userInitials = "אב",
  commandItems,
}: Props) {
  const { t } = useI18n();

  return (
    <div className="flex w-full min-w-0 flex-nowrap items-center gap-3 lg:gap-4" aria-label={navLabel}>
      <div className="shrink-0">
        <BsdYbmLogo
          href="/"
          variant="marketing-light"
          size="lg"
          subtitle={
            <span className="mt-0.5 block text-[10px] font-semibold text-[color:var(--ink-500)]">
              {t("workspaceNav.logoSubtitle")}
            </span>
          }
        />
      </div>

      <nav className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto px-0 [-ms-overflow-style:none] [scrollbar-width:none] lg:px-2 [&::-webkit-scrollbar]:hidden">
        {items.map((item) => {
          const active = isAppNavPathActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`bento-topnav-link ${active ? "bento-topnav-link--active" : ""}`}
            >
              {item.id === "ai" ? (
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-[color:var(--axis-ai)]" aria-hidden />
              ) : null}
              <span className="whitespace-nowrap">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="ms-auto flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2 border-[color:var(--line)] lg:max-w-[min(100%,560px)] lg:flex-initial lg:border-s lg:ps-4">
        <AppCommandPalette items={commandItems} />
        <div className="flex shrink-0 items-center gap-1.5">
          <WorkspaceLocaleSwitcher ariaLabel={t("workspaceShell.topBar.localeAria")} />
          <Link
            href="/app/help"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[color:var(--ink-500)] transition hover:bg-[color:var(--canvas-sunken)] hover:text-[color:var(--ink-900)]"
            aria-label={t("workspaceNav.utility.help.label")}
          >
            <CircleHelp className="h-[18px] w-[18px]" aria-hidden />
          </Link>
          <button
            type="button"
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-[color:var(--ink-500)] transition hover:bg-[color:var(--canvas-sunken)] hover:text-[color:var(--ink-900)]"
            aria-label={t("workspaceShell.topBar.notificationsAria")}
          >
            <BellRing className="h-[18px] w-[18px]" aria-hidden />
            <span className="absolute end-2 top-2 h-1.5 w-1.5 rounded-full bg-[color:var(--axis-clients)] ring-2 ring-[color:var(--canvas-raised)]" />
          </button>
          <div className="mx-1 hidden h-6 w-px bg-[color:var(--line)] sm:block" aria-hidden />
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--ink-900)] text-[11px] font-bold text-white transition hover:bg-[color:var(--ink-800)]"
            aria-label={t("workspaceShell.topBar.profileAria")}
          >
            {userInitials}
          </button>
        </div>
      </div>
    </div>
  );
}
