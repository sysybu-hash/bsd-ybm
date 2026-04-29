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
import { PageHeader, Stat } from "@/components/ui/claude";
import { EmptyState } from "@/components/ui/empty-state";
import { Tile } from "@/components/ui/bento";

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
    <div className="cd-canvas flex w-full min-w-0 flex-col space-y-10" dir={dir}>
      <PageHeader
        eyebrow={t("workspaceOperations.eyebrow")}
        title={t("workspaceOperations.heroTitle")}
        subtitle={t("workspaceOperations.heroSubtitle", { org: organizationName })}
        actions={
          meckanoEnabled ? (
            <Link href="/app/operations/meckano" className="cd-btn cd-btn-primary">
              {t("workspaceOperations.meckanoCta")}
              <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            </Link>
          ) : null
        }
      />

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Stat label={t("workspaceOperations.statActiveUsers")} value={stats.activeUsers} icon={UsersRound} href="/app/operations" />
        <Stat label={t("workspaceOperations.statOpenQueues")} value={stats.openQueues} icon={Workflow} href="/app/operations" />
        <Stat label={t("workspaceOperations.statFieldCoverage")} value={stats.fieldCoverage} icon={MapPinned} href="/app/operations" />
        <Stat label={t("workspaceOperations.statReviewLoad")} value={stats.reviewLoad} icon={ClipboardList} href="/app/operations" />
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
                  <EmptyState
                    variant="card"
                    icon={MapPinned}
                    title="מוכנים למפות אתרי עבודה"
                    description={
                      operationsContextLabel
                        ? `${t("workspaceOperations.zonesEmptyWithTrade", { trade: operationsContextLabel })} — הגדירו אזורים במקאנו כדי לראות כאן סנכרון ושטח.`
                        : `${t("workspaceOperations.zonesEmpty")} חברו את מקאנו והגדירו אזורי דיווח — כך תראו כאן נוכחות וצוות במקום אחד.`
                    }
                  />
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
                <EmptyState
                  variant="card"
                  icon={ClipboardList}
                  title="עדיין שקט בפעילות האחרונה"
                  description={
                    operationsContextLabel
                      ? `${t("workspaceOperations.recentEmptyWithTrade", { trade: operationsContextLabel })} כשתתחילו זרימות ודיווחים, יופיע כאן ציר זמן ברור.`
                      : `${t("workspaceOperations.recentEmpty")} ברגע שתפעילו תהליכים ואינטגרציות, תראו כאן מה קורה בארגון.`
                  }
                />
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
              <Link href="/app/erp" className="rounded-2xl bg-[color:var(--canvas-sunken)] px-4 py-4 text-sm font-black text-[color:var(--ink-900)]">
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
