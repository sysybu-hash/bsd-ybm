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

/** תפריט ניווט עליון — כמו במוקאפ: אייקונים שמאל, ניווט מרכז, לוגו BSD-YBM בצד ימין */
export default function WorkspaceGlassTopNav({ items, pathname, navLabel, userInitials = "אב" }: Props) {
  const { t } = useI18n();

  return (
    <div className="flex w-full items-center gap-4" aria-label={navLabel}>
      {/* לוגו BSD-YBM — בצד ימין (first in DOM = visual right in RTL) */}
      <div className="shrink-0 ps-2">
        <BsdYbmLogo
          href="/app"
          variant="marketing-light"
          size="md"
          subtitle={<span className="mt-0.5 block text-[10px] font-semibold text-slate-500">{t("workspaceNav.logoSubtitle")}</span>}
        />
      </div>

      {/* גלולת הניווט (מרכז + שמאל) */}
      <div className="holo-border-card flex flex-1 items-center gap-1 px-2.5 py-1.5 shadow-[0_18px_55px_-34px_rgba(59,130,246,0.25)]">
        {/* נתיבי הניווט — ממולא */}
        <nav className="flex flex-1 items-center justify-center gap-0.5 overflow-x-auto px-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((item) => {
            const active = isAppNavPathActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`glass-2026-topnav-link ${active ? "glass-2026-topnav-link--active" : ""}`}
              >
                {item.id === "ai" ? <Sparkles className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden /> : null}
                <span className="whitespace-nowrap">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* אייקונים בצד שמאל של הגלולה */}
        <div className="flex items-center gap-3 pe-2 ps-2 border-s border-white/45">
          <button
            type="button"
            className="relative text-slate-600 transition hover:text-teal-600"
            aria-label={t("workspaceShell.topBar.searchAria")}
          >
            <Search className="h-[18px] w-[18px]" aria-hidden />
          </button>
          <Link
            href="/app/help"
            className="text-slate-600 transition hover:text-teal-600"
            aria-label={t("workspaceNav.utility.help.label")}
          >
            <CircleHelp className="h-[18px] w-[18px]" aria-hidden />
          </Link>
          <button
            type="button"
            className="relative text-slate-600 transition hover:text-teal-600"
            aria-label={t("workspaceShell.topBar.notificationsAria")}
          >
            <BellRing className="h-[18px] w-[18px]" aria-hidden />
            <span className="absolute -left-0.5 -top-0.5 flex h-2 w-2 items-center justify-center rounded-full bg-teal-500 ring-2 ring-white" />
          </button>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200 text-[11px] font-black text-teal-800 shadow-sm transition hover:scale-105"
            aria-label={t("workspaceShell.topBar.profileAria")}
          >
            {userInitials}
          </button>
        </div>
      </div>
    </div>
  );
}
