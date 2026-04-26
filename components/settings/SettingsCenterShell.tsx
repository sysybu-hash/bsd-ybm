"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, Search } from "lucide-react";
import { SETTINGS_HUB_NAV_GROUPS, type SettingsHubNavItem } from "@/lib/settings-hub-nav";
import { useI18n } from "@/components/I18nProvider";

type Props = {
  children: React.ReactNode;
  includePlatformNav: boolean;
};

function isActive(pathname: string, item: SettingsHubNavItem) {
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export default function SettingsCenterShell({ children, includePlatformNav }: Props) {
  const pathname = usePathname() ?? "";
  const { dir } = useI18n();

  return (
    <div className="grid min-w-0 gap-5 xl:grid-cols-[18rem_minmax(0,1fr)]" dir={dir}>
      <aside className="xl:sticky xl:top-4 xl:self-start">
        <div className="rounded-lg border border-[color:var(--line)] bg-[color:var(--canvas-raised)] shadow-[var(--shadow-sm)]">
          <div className="border-b border-[color:var(--line-subtle)] p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[color:var(--ops-indigo)]">
              Settings OS
            </p>
            <h1 className="mt-1 text-xl font-black tracking-tight text-[color:var(--ink-900)]">
              מרכז הגדרות
            </h1>
            <p className="mt-1 text-[12px] leading-5 text-[color:var(--ink-500)]">
              כל ההגדרות מחולקות לפי אחריות: ארגון, תחום בניה, מנועים, תפעול ומנוי.
            </p>
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-[color:var(--line)] bg-[color:var(--canvas-sunken)] px-3 py-2 text-[12px] font-semibold text-[color:var(--ink-500)]">
              <Search className="h-4 w-4" aria-hidden />
              <span>בחר אזור בתפריט</span>
            </div>
          </div>

          <nav className="max-h-[calc(100vh-13rem)] overflow-y-auto p-3" aria-label="Settings">
            <div className="space-y-4">
              {SETTINGS_HUB_NAV_GROUPS.map((group) => {
                const items = group.items.filter((item) => includePlatformNav || !item.platformAdminOnly);
                if (items.length === 0) return null;
                return (
                  <section key={group.id}>
                    <h2 className="px-2 pb-1 text-[10px] font-black uppercase tracking-[0.12em] text-[color:var(--ink-400)]">
                      {group.title}
                    </h2>
                    <ul className="space-y-1">
                      {items.map((item) => {
                        const on = isActive(pathname, item);
                        return (
                          <li key={item.id}>
                            <Link
                              href={item.href}
                              className={`group flex items-center gap-3 rounded-lg border px-3 py-2.5 text-start transition ${
                                on
                                  ? "border-[color:var(--ops-indigo)] bg-[color:var(--ops-indigo)] text-white shadow-[var(--shadow-sm)]"
                                  : "border-transparent text-[color:var(--ink-700)] hover:border-[color:var(--line)] hover:bg-[color:var(--canvas-sunken)]"
                              }`}
                              aria-current={on ? "page" : undefined}
                            >
                              <span
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                                  on
                                    ? "bg-white/14 text-white"
                                    : "bg-white text-[color:var(--ops-indigo)] ring-1 ring-[color:var(--line)]"
                                }`}
                              >
                                <item.icon className="h-4 w-4" aria-hidden />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-[13px] font-black">{item.label}</span>
                                <span className={`mt-0.5 block line-clamp-1 text-[11px] ${on ? "text-white/76" : "text-[color:var(--ink-500)]"}`}>
                                  {item.description}
                                </span>
                              </span>
                              <ChevronLeft className={`h-4 w-4 shrink-0 ${on ? "text-white/80" : "text-[color:var(--ink-400)]"}`} aria-hidden />
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                );
              })}
            </div>
          </nav>
        </div>
      </aside>

      <main className="min-w-0">{children}</main>
    </div>
  );
}
