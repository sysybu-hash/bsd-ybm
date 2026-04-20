"use client";

import Link from "next/link";
import { BellRing, CircleHelp, Search, Sparkles } from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
import type { AppNavItem } from "@/components/app-shell/app-nav";
import { isAppNavPathActive } from "@/lib/app-shell-active-nav";
import BsdYbmLogo from "@/components/brand/BsdYbmLogo";

type Props = Readonly<{
  items: AppNavItem[];
  pathname: string;
  navLabel: string;
  userInitials?: string;
}>;

/**
 * Command Center top bar:
 * - לוגו BSD-YBM
 * - ניווט ראשי (underline על הפעיל)
 * - חיפוש / עזרה / התראות / פרופיל
 * בלי glass, בלי blur — שורה אחת נקייה, גבול דק, רקע לבן.
 */
export default function WorkspaceGlassTopNav({ items, pathname, navLabel, userInitials = "אב" }: Props) {
  const { t } = useI18n();

  return (
    <div className="flex w-full items-center gap-4" aria-label={navLabel}>
      {/* לוגו */}
      <div className="shrink-0">
        <BsdYbmLogo
          href="/app"
          variant="marketing-light"
          size="md"
          subtitle={
            <span className="mt-0.5 block text-[10px] font-semibold text-[color:var(--ink-500)]">
              {t("workspaceNav.logoSubtitle")}
            </span>
          }
        />
      </div>

      {/* ניווט ראשי */}
      <nav className="flex flex-1 items-center gap-0.5 overflow-x-auto px-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item) => {
          const active = isAppNavPathActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`glass-2026-topnav-link ${active ? "glass-2026-topnav-link--active" : ""}`}
            >
              {item.id === "ai" ? (
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-[color:var(--axis-ai)]" aria-hidden />
              ) : null}
              <span className="whitespace-nowrap">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* אייקונים + פרופיל */}
      <div className="flex shrink-0 items-center gap-1.5 border-s border-[color:var(--line)] ps-4">
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[color:var(--ink-500)] transition hover:bg-[color:var(--canvas-sunken)] hover:text-[color:var(--ink-900)]"
          aria-label={t("workspaceShell.topBar.searchAria")}
        >
          <Search className="h-[18px] w-[18px]" aria-hidden />
        </button>
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
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[color:var(--axis-clients)] ring-2 ring-[color:var(--canvas-raised)]" />
        </button>
        <div className="mx-1 h-6 w-px bg-[color:var(--line)]" aria-hidden />
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--ink-900)] text-[11px] font-bold text-white transition hover:bg-[color:var(--ink-800)]"
          aria-label={t("workspaceShell.topBar.profileAria")}
        >
          {userInitials}
        </button>
      </div>
    </div>
  );
}
