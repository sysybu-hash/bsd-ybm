"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { SETTINGS_HUB_NAV_GROUPS, type SettingsHubNavItem } from "@/lib/settings-hub-nav";

type Props = {
  children: React.ReactNode;
  includePlatformNav: boolean;
};

function isActive(pathname: string, item: SettingsHubNavItem) {
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export default function SettingsCenterShell({ children, includePlatformNav }: Props) {
  const pathname = usePathname() ?? "";

  return (
    <div className="flex min-w-0 flex-col gap-6 lg:flex-row lg:items-start" dir="rtl">
      <nav
        className="v2-panel w-full shrink-0 p-3 lg:sticky lg:top-4 lg:w-80"
        aria-label="מרכז הגדרות BSD-YBM"
      >
        <div className="mb-4 px-2">
          <p className="text-[11px] font-black uppercase tracking-wider text-[color:var(--v2-muted)]">הגדרות</p>
          <p className="mt-1 text-sm font-semibold text-[color:var(--v2-ink)]">ארגון, מנויים ותפעול</p>
        </div>
        <div className="max-h-[70vh] space-y-6 overflow-y-auto pr-1">
          {SETTINGS_HUB_NAV_GROUPS.map((group) => {
            const items = group.items.filter((item) => includePlatformNav || !item.platformAdminOnly);
            if (items.length === 0) return null;
            return (
              <div key={group.id}>
                <h2 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-[color:var(--v2-muted)]">
                  {group.title}
                </h2>
                <ul className="space-y-1">
                  {items.map((item) => {
                    const on = isActive(pathname, item);
                    return (
                      <li key={item.id}>
                        <Link
                          href={item.href}
                          className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-start text-sm font-semibold transition ${
                            on
                              ? "bg-[color:var(--v2-accent)] text-white shadow-md"
                              : "text-[color:var(--v2-ink)] hover:bg-[color:var(--v2-canvas)]"
                          }`}
                          aria-current={on ? "page" : undefined}
                        >
                          <item.icon
                            className={`h-5 w-5 shrink-0 ${on ? "text-white" : "text-[color:var(--v2-accent)]"}`}
                            aria-hidden
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block font-black leading-tight">{item.label}</span>
                            <span
                              className={`mt-0.5 block text-[11px] font-medium leading-snug ${
                                on ? "text-white/90" : "text-[color:var(--v2-muted)]"
                              }`}
                            >
                              {item.description}
                            </span>
                          </span>
                          <ChevronLeft className={`h-4 w-4 shrink-0 opacity-60 ${on ? "text-white" : ""}`} aria-hidden />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </nav>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
