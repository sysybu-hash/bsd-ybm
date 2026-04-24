"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ClipboardList,
  CreditCard,
  Link2,
  MapPinned,
  Sparkles,
  UsersRound,
  Workflow,
} from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
import { formatDateTime } from "@/lib/ui-formatters";

type WorkflowStatus = "healthy" | "attention" | "blocked";

type WorkflowItem = {
  id: string;
  title: string;
  summary: string;
  status: WorkflowStatus;
  href: string;
  cta: string;
  metrics: string[];
};

type IntegrationItem = {
  label: string;
  connected: boolean;
  details: string;
};

type ZoneItem = {
  id: string;
  name: string;
  synced: boolean;
  managerName: string | null;
  assigneeCount: number;
};

type ActivityItem = {
  action: string;
  details: string;
  createdAt: string;
};

type Props = Readonly<{
  organizationName: string;
  /** תווית הקשר (מקצוע/ענף) לריקים דינמיים — מ־IndustryProfile */
  operationsContextLabel?: string;
  meckanoEnabled: boolean;
  stats: {
    activeUsers: string;
    openQueues: string;
    fieldCoverage: string;
    reviewLoad: string;
  };
  workflows: WorkflowItem[];
  integrations: IntegrationItem[];
  zones: ZoneItem[];
  recentActivity: ActivityItem[];
}>;

function workflowClass(status: WorkflowStatus) {
  if (status === "healthy") return "bg-emerald-100 text-emerald-700";
  if (status === "attention") return "bg-amber-100 text-amber-700";
  return "bg-rose-100 text-rose-700";
}

export default function OperationsWorkspaceV2({
  organizationName,
  operationsContextLabel,
  meckanoEnabled,
  stats,
  workflows,
  integrations,
  zones,
  recentActivity,
}: Props) {
  const { t, dir } = useI18n();

  const workflowStatusLabel = (status: WorkflowStatus) => {
    if (status === "healthy") return t("workspaceOperations.workflowHealthy");
    if (status === "attention") return t("workspaceOperations.workflowAttention");
    return t("workspaceOperations.workflowBlocked");
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-8" dir={dir}>
      <section className="tile overflow-hidden p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div>
            <span className="bento-eyebrow">{t("workspaceOperations.eyebrow")}</span>
            <h1 className="mt-4 text-3xl font-black tracking-[-0.06em] text-[color:var(--ink-900)] sm:text-5xl">
              {t("workspaceOperations.heroTitle")}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-[color:var(--ink-500)] sm:text-lg">
              {t("workspaceOperations.heroSubtitle", { org: organizationName })}
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {meckanoEnabled ? (
                <Link href="/app/operations/meckano" className="bento-btn bento-btn--primary">
                  {t("workspaceOperations.meckanoCta")}
                  <ArrowLeft className="h-4 w-4" aria-hidden />
                </Link>
              ) : null}
              <Link href="/app/inbox" className="bento-btn bento-btn--secondary">
                {t("workspaceOperations.inboxCta")}
                <Sparkles className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: t("workspaceOperations.statActiveUsers"), value: stats.activeUsers, icon: UsersRound },
              { label: t("workspaceOperations.statOpenQueues"), value: stats.openQueues, icon: Workflow },
              { label: t("workspaceOperations.statFieldCoverage"), value: stats.fieldCoverage, icon: MapPinned },
              { label: t("workspaceOperations.statReviewLoad"), value: stats.reviewLoad, icon: ClipboardList },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="tile p-5">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--axis-clients-soft)] text-[color:var(--axis-clients)]">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <p className="mt-4 text-sm font-bold text-[color:var(--ink-500)]">{label}</p>
                <p className="mt-2 text-2xl font-black tracking-[-0.04em] text-[color:var(--ink-900)]">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-4">
          <div className="tile p-6">
            <div className="flex items-center gap-2">
              <Workflow className="h-5 w-5 text-[color:var(--axis-clients)]" aria-hidden />
              <h2 className="text-xl font-black text-[color:var(--ink-900)]">{t("workspaceOperations.workflowsTitle")}</h2>
            </div>
            <div className="mt-5 grid gap-4">
              {workflows.map((workflow) => (
                <article key={workflow.id} className="rounded-[24px] border border-[color:var(--line)] bg-white/82 px-5 py-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-black ${workflowClass(workflow.status)}`}>
                          {workflowStatusLabel(workflow.status)}
                        </span>
                      </div>
                      <h3 className="mt-4 text-lg font-black text-[color:var(--ink-900)]">{workflow.title}</h3>
                      <p className="mt-3 text-sm leading-7 text-[color:var(--ink-500)]">{workflow.summary}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {workflow.metrics.map((metric) => (
                          <span key={metric} className="rounded-full bg-[color:var(--canvas-sunken)] px-3 py-1 text-xs font-black text-[color:var(--ink-500)]">
                            {metric}
                          </span>
                        ))}
                      </div>
                    </div>
                    <Link href={workflow.href} className="bento-btn bento-btn--secondary shrink-0">
                      {workflow.cta}
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {meckanoEnabled ? (
            <div className="tile p-6">
              <div className="flex items-center gap-2">
                <MapPinned className="h-5 w-5 text-[color:var(--axis-clients)]" aria-hidden />
                <h2 className="text-xl font-black text-[color:var(--ink-900)]">{t("workspaceOperations.zonesTitle")}</h2>
              </div>
              <div className="mt-4 grid gap-3">
                {zones.length === 0 ? (
                  <div className="rounded-2xl bg-[color:var(--canvas-sunken)] px-4 py-4 text-sm text-[color:var(--ink-500)]">
                    {operationsContextLabel
                      ? t("workspaceOperations.zonesEmptyWithTrade", { trade: operationsContextLabel })
                      : t("workspaceOperations.zonesEmpty")}
                  </div>
                ) : null}
                {zones.map((zone) => (
                  <div key={zone.id} className="rounded-2xl bg-[color:var(--canvas-sunken)] px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-black text-[color:var(--ink-900)]">{zone.name}</p>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${
                          zone.synced ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {zone.synced ? t("workspaceOperations.zoneSynced") : t("workspaceOperations.zoneNotSynced")}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-[color:var(--ink-500)]">
                      {t("workspaceOperations.zoneManagerLabel")}: {zone.managerName || t("workspaceOperations.zoneManagerUnset")} ·{" "}
                      {t("workspaceOperations.zoneAssigneesLabel")}: {zone.assigneeCount}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <aside className="grid gap-4">
          <div className="tile tile--lavender p-6">
            <div className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-[color:var(--axis-clients)]" aria-hidden />
              <p className="text-lg font-black text-[color:var(--ink-900)]">{t("workspaceOperations.integrationsTitle")}</p>
            </div>
            <div className="mt-4 grid gap-3">
              {integrations.map((integration) => (
                <div key={integration.label} className="rounded-2xl bg-white/78 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-black text-[color:var(--ink-900)]">{integration.label}</p>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black ${
                        integration.connected ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {integration.connected
                        ? t("workspaceOperations.integrationConnected")
                        : t("workspaceOperations.integrationNeedsSetup")}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[color:var(--ink-500)]">{integration.details}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="tile p-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[color:var(--axis-clients)]" aria-hidden />
              <p className="text-lg font-black text-[color:var(--ink-900)]">{t("workspaceOperations.recentTitle")}</p>
            </div>
            <div className="mt-4 grid gap-3">
              {recentActivity.length === 0 ? (
                <div className="rounded-2xl bg-[color:var(--canvas-sunken)] px-4 py-4 text-sm text-[color:var(--ink-500)]">
                  {operationsContextLabel
                    ? t("workspaceOperations.recentEmptyWithTrade", { trade: operationsContextLabel })
                    : t("workspaceOperations.recentEmpty")}
                </div>
              ) : null}
              {recentActivity.map((activity, index) => (
                <div key={`${activity.action}-${index}`} className="rounded-2xl bg-[color:var(--canvas-sunken)] px-4 py-4">
                  <p className="font-black text-[color:var(--ink-900)]">{activity.action}</p>
                  {activity.details ? <p className="mt-2 text-sm text-[color:var(--ink-500)]">{activity.details}</p> : null}
                  <p className="mt-2 text-xs font-semibold text-[color:var(--ink-500)]">{formatDateTime(activity.createdAt)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="tile p-6">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-[color:var(--axis-clients)]" aria-hidden />
              <p className="text-lg font-black text-[color:var(--ink-900)]">{t("workspaceOperations.shortcutsTitle")}</p>
            </div>
            <div className="mt-4 grid gap-3">
              <Link href="/app/settings/billing" className="rounded-2xl bg-[color:var(--canvas-sunken)] px-4 py-4 text-sm font-black text-[color:var(--ink-900)]">
                {t("workspaceOperations.shortcutBilling")}
              </Link>
              <Link href="/app/documents" className="rounded-2xl bg-[color:var(--canvas-sunken)] px-4 py-4 text-sm font-black text-[color:var(--ink-900)]">
                {t("workspaceOperations.shortcutDocuments")}
              </Link>
              <Link href="/app/automations" className="rounded-2xl bg-[color:var(--canvas-sunken)] px-4 py-4 text-sm font-black text-[color:var(--ink-900)]">
                {t("workspaceOperations.shortcutAutomation")}
              </Link>
              <Link href="/app/onboarding" className="rounded-2xl bg-[color:var(--canvas-sunken)] px-4 py-4 text-sm font-black text-[color:var(--ink-900)]">
                {t("workspaceOperations.shortcutOnboarding")}
              </Link>
              <Link href="/app/settings/operations" className="rounded-2xl bg-[color:var(--canvas-sunken)] px-4 py-4 text-sm font-black text-[color:var(--ink-900)]">
                {t("workspaceOperations.shortcutAdvanced")}
              </Link>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
