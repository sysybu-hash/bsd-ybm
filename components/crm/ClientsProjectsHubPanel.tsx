"use client";

import { useMemo } from "react";
import Link from "next/link";
import { BriefcaseBusiness, Filter } from "lucide-react";
import QuickProjectForm from "@/components/crm/QuickProjectForm";
import { useI18n } from "@/components/I18nProvider";
import { EmptyState } from "@/components/ui/empty-state";
import { Surface } from "@/components/ui/claude";
import { formatCurrencyILS } from "@/lib/ui-formatters";
import type { ProjectRecord } from "./clients-workspace-types";

type Props = {
  projects: ProjectRecord[];
  projectSearch: string;
  setProjectSearch: (v: string) => void;
  projectActiveFilter: "all" | "active" | "archived";
  setProjectActiveFilter: (v: "all" | "active" | "archived") => void;
};

export default function ClientsProjectsHubPanel({
  projects,
  projectSearch,
  setProjectSearch,
  projectActiveFilter,
  setProjectActiveFilter,
}: Props) {
  const { t } = useI18n();
  const normalized = projectSearch.trim().toLowerCase();
  const list = useMemo(() => {
    return projects.filter((p) => {
      const matches = normalized.length === 0 || p.name.toLowerCase().includes(normalized);
      const activeOk =
        projectActiveFilter === "all" ||
        (projectActiveFilter === "active" && p.isActive) ||
        (projectActiveFilter === "archived" && !p.isActive);
      return matches && activeOk;
    });
  }, [projects, normalized, projectActiveFilter]);

  return (
    <div className="space-y-6">
      <Surface className="flex flex-wrap items-center gap-3 !p-4">
        <div className="relative min-w-[200px] flex-1">
          <Filter className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--ink-400)]" aria-hidden />
          <input
            value={projectSearch}
            onChange={(e) => setProjectSearch(e.target.value)}
            className="w-full rounded-xl border border-[color:var(--line-strong)] bg-[color:var(--canvas-raised)] py-2.5 pe-4 ps-10 text-sm font-medium outline-none focus:border-[color:var(--axis-clients)]"
            placeholder={t("workspaceClients.projectsHub.searchPlaceholder")}
          />
        </div>
        <select
          value={projectActiveFilter}
          onChange={(e) => setProjectActiveFilter(e.target.value as "all" | "active" | "archived")}
          className="rounded-xl border border-[color:var(--line-strong)] bg-[color:var(--canvas-raised)] px-4 py-2.5 text-sm font-bold"
        >
          <option value="active">{t("workspaceClients.projectsHub.filterActive")}</option>
          <option value="archived">{t("workspaceClients.projectsHub.filterArchived")}</option>
          <option value="all">{t("workspaceClients.projectsHub.filterAll")}</option>
        </select>
      </Surface>

      {list.length === 0 ? (
        <EmptyState
          variant="card"
          icon={BriefcaseBusiness}
          title={t("workspaceClients.projectsHub.emptyTitle")}
          description={t("workspaceClients.projectsHub.emptyDescription")}
          className="py-12"
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((p) => (
            <Link
              key={p.id}
              href={`/app/crm/project/${encodeURIComponent(p.id)}`}
              className="rounded-2xl border border-[color:var(--line-strong)] bg-[color:var(--canvas-raised)] p-4 shadow-sm transition hover:border-[color:var(--axis-clients)] hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="min-w-0 truncate text-base font-black text-[color:var(--ink-900)]">{p.name}</p>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${
                    p.isActive
                      ? "bg-[color:var(--state-success-soft)] text-[color:var(--state-success)]"
                      : "bg-[color:var(--ink-200)] text-[color:var(--ink-600)]"
                  }`}
                >
                  {p.isActive ? t("workspaceClients.projectsHub.badgeActive") : t("workspaceClients.projectsHub.badgeArchived")}
                </span>
              </div>
              <p className="mt-2 text-xs text-[color:var(--ink-500)]">
                {t("workspaceClients.projectsHub.cardMeta", {
                  count: String(p.contactCount),
                  total: formatCurrencyILS(p.totalValue),
                })}
              </p>
              <p className="mt-1 text-[11px] font-bold text-[color:var(--axis-clients)]">{t("workspaceClients.projectsHub.cardOpenCta")}</p>
            </Link>
          ))}
        </div>
      )}

      <Surface className="!p-5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[color:var(--ink-500)]">
          {t("workspaceClients.projectsHub.newProjectTitle")}
        </p>
        <div className="mt-4">
          <QuickProjectForm />
        </div>
      </Surface>
    </div>
  );
}
