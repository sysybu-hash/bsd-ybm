"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";
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
  const { t, dir } = useI18n();

  return (
    <div className="flex min-w-0 flex-col gap-6 lg:flex-row lg:items-start" dir={dir}>
      <nav
        className="tile w-full shrink-0 p-3 lg:sticky lg:top-4 lg:w-72"
        aria-label="Settings hub"
      >
        <div className="mb-3 border-b border-[color:var(--line-subtle)] pb-3 px-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[color:var(--ink-400)]">
            {t("settingsHub.sidebarEyebrow") || "SETTINGS"}
          </p>
          <p className="mt-1 text-[13px] font-black tracking-tight text-[color:var(--ink-900)]">
            {t("settingsHub.sidebarTitle") || "ארגון, מנויים ותפעול"}
          </p>
        </div>
        <div className="max-h-[72vh] space-y-4 overflow-y-auto pe-1">
          {SETTINGS_HUB_NAV_GROUPS.map((group) => {
            const items = group.items.filter((item) => includePlatformNav || !item.platformAdminOnly);
            if (items.length === 0) return null;
            return (
              <div key={group.id}>
                <h2 className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[color:var(--ink-400)]">
                  {group.title}
                </h2>
                <ul className="space-y-0.5">
                  {items.map((item) => {
                    const on = isActive(pathname, item);
                    return (
                      <li key={item.id}>
                        <Link
                          href={item.href}
                          className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-start text-[13px] font-semibold transition ${
                            on
                              ? "bg-[color:var(--ink-900)] text-white"
                              : "text-[color:var(--ink-700)] hover:bg-[color:var(--canvas-sunken)]"
                          }`}
                          aria-current={on ? "page" : undefined}
                        >
                          <item.icon
                            className={`h-4 w-4 shrink-0 ${on ? "text-white" : "text-[color:var(--ink-500)]"}`}
                            aria-hidden
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block font-black leading-tight">{item.label}</span>
                            <span
                              className={`mt-0.5 block text-[11px] font-medium leading-snug ${
                                on ? "text-white/80" : "text-[color:var(--ink-500)]"
                              }`}
                            >
                              {item.description}
                            </span>
                          </span>
                          <ChevronLeft className={`h-3.5 w-3.5 shrink-0 opacity-60 ${on ? "text-white" : ""}`} aria-hidden />
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
