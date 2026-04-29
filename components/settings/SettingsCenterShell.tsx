"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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

function dashboardHref(item: SettingsHubNavItem) {
  if (item.id === "overview") return "/app/settings";
  if (["profile", "organization", "profession", "presence", "stack"].includes(item.id)) {
    return `/app/settings#${item.id}`;
  }
  return item.href;
}

export default function SettingsCenterShell({ children, includePlatformNav }: Props) {
  const pathname = usePathname() ?? "";
  const [hash, setHash] = useState("");
  const { dir, t } = useI18n();

  useEffect(() => {
    const readHash = () => setHash(window.location.hash.replace(/^#/, ""));
    readHash();
    window.addEventListener("hashchange", readHash);
    return () => window.removeEventListener("hashchange", readHash);
  }, [pathname]);

  return (
    <div className="cd-canvas grid min-w-0 gap-5 xl:grid-cols-[18rem_minmax(0,1fr)]" dir={dir}>
      <aside className="xl:sticky xl:top-4 xl:self-start">
        <div className="cd-surface overflow-hidden shadow-[var(--cd-shadow)]">
          <div className="border-b border-[color:var(--cd-line)] p-4">
            <p className="cd-eyebrow">{t("workspaceSettings.centerAsideEyebrow")}</p>
            <h1 className="cd-h2 mt-2">{t("workspaceSettings.centerAsideTitle")}</h1>
            <p className="cd-mute mt-1 text-xs leading-5">{t("workspaceSettings.centerAsideSubtitle")}</p>
            <div className="mt-3 flex items-center gap-2 rounded-[var(--cd-radius-sm)] border border-[color:var(--cd-line)] bg-[color:var(--cd-bg-sunken)] px-3 py-2 text-xs font-medium text-[color:var(--cd-ink-mute)]">
              <Search className="h-4 w-4 shrink-0" aria-hidden />
              <span>{t("workspaceSettings.centerNavHint")}</span>
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
                        const on =
                          pathname === "/app/settings"
                            ? hash
                              ? item.id === hash
                              : item.id === "overview"
                            : isActive(pathname, item);
                        return (
                          <li key={item.id}>
                            <Link
                              href={dashboardHref(item)}
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
