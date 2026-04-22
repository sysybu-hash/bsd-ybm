"use client";

import Link from "next/link";
import { startTransition, useState } from "react";
import {
  BadgeCheck,
  CircleDollarSign,
  FileSearch,
  Lightbulb,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
import { getAdvancedWorkspaceHref } from "@/components/app-shell/app-nav";
import { formatCurrencyILS, formatDateTime } from "@/lib/ui-formatters";

type MetricIcon = "revenue" | "review" | "contacts" | "pipeline";

type Metric = {
  label: string;
  value: string;
  icon: MetricIcon;
};

type Signal = {
  title: string;
  body: string;
  tone: "accent" | "success" | "neutral";
};

type HealthItem = {
  label: string;
  value: string;
  status: "good" | "attention";
};

type Recommendation = {
  id: string;
  source: string;
  title: string;
  body: string;
  href: string;
  cta: string;
  severity: "high" | "medium" | "low";
};

type PendingClient = {
  name: string;
  total: number;
};

type Props = Readonly<{
  insightText: string;
  updatedAt: string | null;
  metrics: Metric[];
  signals: Signal[];
  health: HealthItem[];
  recommendations: Recommendation[];
  pendingClients: PendingClient[];
}>;

function severityClass(severity: Recommendation["severity"]) {
  if (severity === "high") return "bg-rose-100 text-rose-700";
  if (severity === "medium") return "bg-amber-100 text-amber-700";
  return "bg-sky-100 text-sky-700";
}

function toneClass(tone: Signal["tone"]) {
  if (tone === "accent") return "bg-[color:var(--axis-clients-soft)] text-[color:var(--axis-clients)]";
  if (tone === "success") return "bg-emerald-100 text-emerald-700";
  return "bg-slate-100 text-slate-700";
}

function iconForMetric(icon: MetricIcon) {
  if (icon === "revenue") return CircleDollarSign;
  if (icon === "review") return FileSearch;
  if (icon === "contacts") return UsersRound;
  return Lightbulb;
}

export default function InsightsWorkspaceV2({
  insightText,
  updatedAt,
  metrics,
  signals,
  health,
  recommendations,
  pendingClients,
}: Props) {
  const { t, dir } = useI18n();
  const advancedInsightsHref = getAdvancedWorkspaceHref("ai");
  const [view, setView] = useState<"summary" | "actions">("summary");
  const insightParagraphs = insightText
    .split(/\n+/)
    .map((part) => part.trim())
    .filter(Boolean);

  const signalToneLabel = (tone: Signal["tone"]) => {
    if (tone === "accent") return t("workspaceInsights.signalFocus");
    if (tone === "success") return t("workspaceInsights.signalOk");
    return t("workspaceInsights.signalWatch");
  };

  const severityLabel = (severity: Recommendation["severity"]) => {
    if (severity === "high") return t("workspaceInsights.severityHigh");
    if (severity === "medium") return t("workspaceInsights.severityMedium");
    return t("workspaceInsights.severityLow");
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-8" dir={dir}>
      <section className="tile tile--soft overflow-hidden p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div>
            <span className="bento-eyebrow">{t("workspaceInsights.eyebrow")}</span>
            <h1 className="mt-4 text-3xl font-black tracking-[-0.06em] text-[color:var(--ink-900)] sm:text-5xl">
              {t("workspaceInsights.heroTitle")}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-[color:var(--ink-500)] sm:text-lg">
              {t("workspaceInsights.heroSubtitle")}
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href={advancedInsightsHref} className="bento-btn bento-btn--primary">
                {t("workspaceInsights.advancedCta")}
              </Link>
              <Link href="/app/billing" className="bento-btn bento-btn--secondary">
                {t("workspaceInsights.billingCta")}
                <Sparkles className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {metrics.map((metric) => {
              const Icon = iconForMetric(metric.icon);
              return (
                <div key={metric.label} className="tile p-5">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--axis-clients-soft)] text-[color:var(--axis-clients)]">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <p className="mt-4 text-sm font-bold text-[color:var(--ink-500)]">{metric.label}</p>
                  <p className="mt-2 text-2xl font-black tracking-[-0.04em] text-[color:var(--ink-900)]">{metric.value}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-4">
          <div className="tile p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-lg font-black text-[color:var(--ink-900)]">{t("workspaceInsights.executiveTitle")}</p>
                <p className="mt-2 text-sm leading-7 text-[color:var(--ink-500)]">{t("workspaceInsights.executiveSubtitle")}</p>
              </div>

              <div className="flex items-center gap-2 rounded-2xl bg-[color:var(--canvas-sunken)] p-1">
                <button
                  type="button"
                  onClick={() => startTransition(() => setView("summary"))}
                  className={`rounded-2xl px-4 py-2 text-sm font-black transition ${
                    view === "summary" ? "bg-white text-[color:var(--ink-900)] shadow-sm" : "text-[color:var(--ink-500)]"
                  }`}
                >
                  {t("workspaceInsights.viewSummary")}
                </button>
                <button
                  type="button"
                  onClick={() => startTransition(() => setView("actions"))}
                  className={`rounded-2xl px-4 py-2 text-sm font-black transition ${
                    view === "actions" ? "bg-white text-[color:var(--ink-900)] shadow-sm" : "text-[color:var(--ink-500)]"
                  }`}
                >
                  {t("workspaceInsights.viewActions")}
                </button>
              </div>
            </div>
          </div>

          {view === "summary" ? (
            <>
              <div className="tile p-6">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-[color:var(--axis-clients)]" aria-hidden />
                  <h2 className="text-xl font-black text-[color:var(--ink-900)]">{t("workspaceInsights.insightTitle")}</h2>
                </div>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--ink-500)]">
                  {t("workspaceInsights.updatedPrefix")}
                  {updatedAt ? formatDateTime(updatedAt) : t("workspaceInsights.updatedLive")}
                </p>
                <div className="mt-5 grid gap-4">
                  {insightParagraphs.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="rounded-[24px] border border-[color:var(--line)] bg-white/82 px-5 py-4 text-sm leading-8 text-[color:var(--ink-900)]"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                {signals.map((signal) => (
                  <article key={signal.title} className="tile p-5">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${toneClass(signal.tone)}`}>
                      {signalToneLabel(signal.tone)}
                    </span>
                    <h3 className="mt-4 text-lg font-black text-[color:var(--ink-900)]">{signal.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-[color:var(--ink-500)]">{signal.body}</p>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <div className="grid gap-4">
              {recommendations.length === 0 ? (
                <div className="tile p-8 text-center">
                  <p className="text-2xl font-black text-[color:var(--ink-900)]">{t("workspaceInsights.emptyRecsTitle")}</p>
                  <p className="mt-3 text-sm leading-7 text-[color:var(--ink-500)]">{t("workspaceInsights.emptyRecsBody")}</p>
                </div>
              ) : null}

              {recommendations.map((item) => (
                <article key={item.id} className="tile p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-black ${severityClass(item.severity)}`}>
                          {item.source}
                        </span>
                        <span className="text-xs font-black uppercase tracking-[0.18em] text-[color:var(--ink-500)]">
                          {severityLabel(item.severity)}
                        </span>
                      </div>
                      <h3 className="mt-4 text-lg font-black text-[color:var(--ink-900)]">{item.title}</h3>
                      <p className="mt-3 text-sm leading-7 text-[color:var(--ink-500)]">{item.body}</p>
                    </div>
                    <Link href={item.href} className="bento-btn bento-btn--secondary shrink-0">
                      {item.cta}
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <aside className="grid gap-4">
          <div className="tile tile--highlight p-6">
            <div className="flex items-center gap-2">
              <BadgeCheck className="h-5 w-5 text-[color:var(--axis-clients)]" aria-hidden />
              <p className="text-lg font-black text-[color:var(--ink-900)]">{t("workspaceInsights.healthTitle")}</p>
            </div>
            <div className="mt-4 grid gap-3">
              {health.map((item) => (
                <div key={item.label} className="rounded-2xl bg-white/78 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-black text-[color:var(--ink-900)]">{item.label}</p>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black ${
                        item.status === "good" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {item.status === "good" ? t("workspaceInsights.healthGood") : t("workspaceInsights.healthWatch")}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[color:var(--ink-500)]">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="tile p-6">
            <p className="text-lg font-black text-[color:var(--ink-900)]">{t("workspaceInsights.pendingTitle")}</p>
            <div className="mt-4 grid gap-3">
              {pendingClients.length === 0 ? (
                <div className="rounded-2xl bg-[color:var(--canvas-sunken)] px-4 py-4 text-sm text-[color:var(--ink-500)]">
                  {t("workspaceInsights.pendingEmpty")}
                </div>
              ) : null}
              {pendingClients.map((client) => (
                <div key={client.name} className="rounded-2xl bg-[color:var(--canvas-sunken)] px-4 py-4">
                  <p className="font-black text-[color:var(--ink-900)]">{client.name}</p>
                  <p className="mt-2 text-sm text-[color:var(--ink-500)]">{formatCurrencyILS(client.total)}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
