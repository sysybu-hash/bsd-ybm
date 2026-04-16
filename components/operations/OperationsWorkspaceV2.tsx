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
import { getAdvancedWorkspaceHref } from "@/components/app-shell/app-nav";
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
  meckanoEnabled,
  stats,
  workflows,
  integrations,
  zones,
  recentActivity,
}: Props) {
  const advancedOperationsHref = getAdvancedWorkspaceHref("operations");
  return (
    <div className="grid gap-6" dir="rtl">
      <section className="v2-panel v2-panel-soft overflow-hidden p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div>
            <span className="v2-eyebrow">Operations Workspace</span>
            <h1 className="mt-4 text-3xl font-black tracking-[-0.06em] text-[color:var(--v2-ink)] sm:text-5xl">
              תפעול חדש שמרכז צוות, שטח, מסמכים וגבייה למסלול עבודה אחד ברור.
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-[color:var(--v2-muted)] sm:text-lg">
              במקום לקפוץ בין מסכי תפעול שונים, כאן רואים מה תקין, מה תקוע ואיזה workflow דורש תשומת לב כדי
              שהעבודה תמשיך לזוז. כרגע המסך מכוון לארגון {organizationName}.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {meckanoEnabled ? (
                <Link href="/app/operations/meckano" className="v2-button v2-button-primary">
                  פתיחת Meckano
                  <ArrowLeft className="h-4 w-4" aria-hidden />
                </Link>
              ) : null}
              <Link href="/app/inbox" className="v2-button v2-button-secondary">
                מעבר לתיבת העבודה
                <Sparkles className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: "צוות זמין", value: stats.activeUsers, icon: UsersRound },
              { label: "תורים פתוחים", value: stats.openQueues, icon: Workflow },
              { label: "כיסוי שטח", value: stats.fieldCoverage, icon: MapPinned },
              { label: "עומס בדיקה", value: stats.reviewLoad, icon: ClipboardList },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="v2-panel p-5">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--v2-accent-soft)] text-[color:var(--v2-accent)]">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <p className="mt-4 text-sm font-bold text-[color:var(--v2-muted)]">{label}</p>
                <p className="mt-2 text-2xl font-black tracking-[-0.04em] text-[color:var(--v2-ink)]">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-4">
          <div className="v2-panel p-6">
            <div className="flex items-center gap-2">
              <Workflow className="h-5 w-5 text-[color:var(--v2-accent)]" aria-hidden />
              <h2 className="text-xl font-black text-[color:var(--v2-ink)]">זרימות עבודה</h2>
            </div>
            <div className="mt-5 grid gap-4">
              {workflows.map((workflow) => (
                <article key={workflow.id} className="rounded-[24px] border border-[color:var(--v2-line)] bg-white/82 px-5 py-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-black ${workflowClass(workflow.status)}`}>
                          {workflow.status === "healthy" ? "תקין" : workflow.status === "attention" ? "במעקב" : "חסום"}
                        </span>
                      </div>
                      <h3 className="mt-4 text-lg font-black text-[color:var(--v2-ink)]">{workflow.title}</h3>
                      <p className="mt-3 text-sm leading-7 text-[color:var(--v2-muted)]">{workflow.summary}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {workflow.metrics.map((metric) => (
                          <span key={metric} className="rounded-full bg-[color:var(--v2-canvas)] px-3 py-1 text-xs font-black text-[color:var(--v2-muted)]">
                            {metric}
                          </span>
                        ))}
                      </div>
                    </div>
                    <Link href={workflow.href} className="v2-button v2-button-secondary shrink-0">
                      {workflow.cta}
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {meckanoEnabled ? (
            <div className="v2-panel p-6">
              <div className="flex items-center gap-2">
                <MapPinned className="h-5 w-5 text-[color:var(--v2-accent)]" aria-hidden />
                <h2 className="text-xl font-black text-[color:var(--v2-ink)]">אזורי שטח פעילים</h2>
              </div>
              <div className="mt-4 grid gap-3">
                {zones.length === 0 ? (
                  <div className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-4 text-sm text-[color:var(--v2-muted)]">
                    עדיין לא הוגדרו אזורי דיווח פעילים. אפשר להתחיל דרך מסך Meckano.
                  </div>
                ) : null}
                {zones.map((zone) => (
                  <div key={zone.id} className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-black text-[color:var(--v2-ink)]">{zone.name}</p>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${
                          zone.synced ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {zone.synced ? "מסונכרן ל-CRM" : "טרם סונכרן"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-[color:var(--v2-muted)]">
                      מנהל: {zone.managerName || "לא הוגדר"} · עובדים משויכים: {zone.assigneeCount}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <aside className="grid gap-4">
          <div className="v2-panel v2-panel-highlight p-6">
            <div className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-[color:var(--v2-accent)]" aria-hidden />
              <p className="text-lg font-black text-[color:var(--v2-ink)]">חיבורי מערכת</p>
            </div>
            <div className="mt-4 grid gap-3">
              {integrations.map((integration) => (
                <div key={integration.label} className="rounded-2xl bg-white/78 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-black text-[color:var(--v2-ink)]">{integration.label}</p>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black ${
                        integration.connected ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {integration.connected ? "מחובר" : "דורש הגדרה"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[color:var(--v2-muted)]">{integration.details}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="v2-panel p-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[color:var(--v2-accent)]" aria-hidden />
              <p className="text-lg font-black text-[color:var(--v2-ink)]">פעילות אחרונה</p>
            </div>
            <div className="mt-4 grid gap-3">
              {recentActivity.length === 0 ? (
                <div className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-4 text-sm text-[color:var(--v2-muted)]">
                  אין פעילות אחרונה להצגה כרגע.
                </div>
              ) : null}
              {recentActivity.map((activity, index) => (
                <div key={`${activity.action}-${index}`} className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-4">
                  <p className="font-black text-[color:var(--v2-ink)]">{activity.action}</p>
                  {activity.details ? <p className="mt-2 text-sm text-[color:var(--v2-muted)]">{activity.details}</p> : null}
                  <p className="mt-2 text-xs font-semibold text-[color:var(--v2-muted)]">{formatDateTime(activity.createdAt)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="v2-panel p-6">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-[color:var(--v2-accent)]" aria-hidden />
              <p className="text-lg font-black text-[color:var(--v2-ink)]">קיצורי פעולה</p>
            </div>
            <div className="mt-4 grid gap-3">
              <Link href="/app/billing" className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-4 text-sm font-black text-[color:var(--v2-ink)]">
                מעבר לחיוב ולגבייה
              </Link>
              <Link href="/app/documents" className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-4 text-sm font-black text-[color:var(--v2-ink)]">
                מעבר למסמכים
              </Link>
              <Link href="/app/automations" className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-4 text-sm font-black text-[color:var(--v2-ink)]">
                Automation Center
              </Link>
              <Link href="/app/onboarding" className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-4 text-sm font-black text-[color:var(--v2-ink)]">
                Onboarding חכם
              </Link>
              <Link href={advancedOperationsHref} className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-4 text-sm font-black text-[color:var(--v2-ink)]">
                תפעול מתקדם
              </Link>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
