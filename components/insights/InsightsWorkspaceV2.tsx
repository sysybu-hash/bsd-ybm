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
  if (tone === "accent") return "bg-[color:var(--v2-accent-soft)] text-[color:var(--v2-accent)]";
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
  const [view, setView] = useState<"summary" | "actions">("summary");
  const insightParagraphs = insightText
    .split(/\n+/)
    .map((part) => part.trim())
    .filter(Boolean);

  return (
    <div className="grid gap-6" dir="rtl">
      <section className="v2-panel v2-panel-soft overflow-hidden p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div>
            <span className="v2-eyebrow">Insights Workspace</span>
            <h1 className="mt-4 text-3xl font-black tracking-[-0.06em] text-[color:var(--v2-ink)] sm:text-5xl">
              חלון תובנות שמרכז את מה שהמערכת כבר יודעת, ומה כדאי לעשות עם זה עכשיו.
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-[color:var(--v2-muted)] sm:text-lg">
              במקום מסך AI מנותק מהעבודה היומיומית, התובנות מתחברות לגבייה, למסמכים, ללקוחות ולצנרת, ומציגות
              תמונה קצרה, בהירה וישימה.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/app/insights/advanced" className="v2-button v2-button-primary">
                AI Hub מתקדם
              </Link>
              <Link href="/app/billing" className="v2-button v2-button-secondary">
                מעבר לחיוב
                <Sparkles className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {metrics.map((metric) => {
              const Icon = iconForMetric(metric.icon);
              return (
                <div key={metric.label} className="v2-panel p-5">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--v2-accent-soft)] text-[color:var(--v2-accent)]">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <p className="mt-4 text-sm font-bold text-[color:var(--v2-muted)]">{metric.label}</p>
                  <p className="mt-2 text-2xl font-black tracking-[-0.04em] text-[color:var(--v2-ink)]">{metric.value}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-4">
          <div className="v2-panel p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-lg font-black text-[color:var(--v2-ink)]">מבט מנהלים</p>
                <p className="mt-2 text-sm leading-7 text-[color:var(--v2-muted)]">
                  תצוגה אחת לסיכום ולהמלצות פעולה, במקום לעבור בין כמה מסכי בקרה שונים.
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-2xl bg-[color:var(--v2-canvas)] p-1">
                <button
                  type="button"
                  onClick={() => startTransition(() => setView("summary"))}
                  className={`rounded-2xl px-4 py-2 text-sm font-black transition ${
                    view === "summary" ? "bg-white text-[color:var(--v2-ink)] shadow-sm" : "text-[color:var(--v2-muted)]"
                  }`}
                >
                  סיכום
                </button>
                <button
                  type="button"
                  onClick={() => startTransition(() => setView("actions"))}
                  className={`rounded-2xl px-4 py-2 text-sm font-black transition ${
                    view === "actions" ? "bg-white text-[color:var(--v2-ink)] shadow-sm" : "text-[color:var(--v2-muted)]"
                  }`}
                >
                  המלצות פעולה
                </button>
              </div>
            </div>
          </div>

          {view === "summary" ? (
            <>
              <div className="v2-panel p-6">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-[color:var(--v2-accent)]" aria-hidden />
                  <h2 className="text-xl font-black text-[color:var(--v2-ink)]">תובנת מערכת</h2>
                </div>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--v2-muted)]">
                  עודכן ב-{updatedAt ? formatDateTime(updatedAt) : "זמן אמת"}
                </p>
                <div className="mt-5 grid gap-4">
                  {insightParagraphs.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="rounded-[24px] border border-[color:var(--v2-line)] bg-white/82 px-5 py-4 text-sm leading-8 text-[color:var(--v2-ink)]"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                {signals.map((signal) => (
                  <article key={signal.title} className="v2-panel p-5">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${toneClass(signal.tone)}`}>
                      {signal.tone === "accent" ? "מוקד" : signal.tone === "success" ? "תקין" : "מעקב"}
                    </span>
                    <h3 className="mt-4 text-lg font-black text-[color:var(--v2-ink)]">{signal.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-[color:var(--v2-muted)]">{signal.body}</p>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <div className="grid gap-4">
              {recommendations.length === 0 ? (
                <div className="v2-panel p-8 text-center">
                  <p className="text-2xl font-black text-[color:var(--v2-ink)]">אין כרגע המלצות פתוחות.</p>
                  <p className="mt-3 text-sm leading-7 text-[color:var(--v2-muted)]">
                    הזרימות המרכזיות נראות רגועות. אפשר להמשיך לעבודה שוטפת בלקוחות, במסמכים או בחיוב.
                  </p>
                </div>
              ) : null}

              {recommendations.map((item) => (
                <article key={item.id} className="v2-panel p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-black ${severityClass(item.severity)}`}>
                          {item.source}
                        </span>
                        <span className="text-xs font-black uppercase tracking-[0.18em] text-[color:var(--v2-muted)]">
                          {item.severity === "high" ? "גבוה" : item.severity === "medium" ? "בינוני" : "נמוך"}
                        </span>
                      </div>
                      <h3 className="mt-4 text-lg font-black text-[color:var(--v2-ink)]">{item.title}</h3>
                      <p className="mt-3 text-sm leading-7 text-[color:var(--v2-muted)]">{item.body}</p>
                    </div>
                    <Link href={item.href} className="v2-button v2-button-secondary shrink-0">
                      {item.cta}
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <aside className="grid gap-4">
          <div className="v2-panel v2-panel-highlight p-6">
            <div className="flex items-center gap-2">
              <BadgeCheck className="h-5 w-5 text-[color:var(--v2-accent)]" aria-hidden />
              <p className="text-lg font-black text-[color:var(--v2-ink)]">בריאות מקורות המידע</p>
            </div>
            <div className="mt-4 grid gap-3">
              {health.map((item) => (
                <div key={item.label} className="rounded-2xl bg-white/78 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-black text-[color:var(--v2-ink)]">{item.label}</p>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black ${
                        item.status === "good" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {item.status === "good" ? "תקין" : "דורש מעקב"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[color:var(--v2-muted)]">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="v2-panel p-6">
            <p className="text-lg font-black text-[color:var(--v2-ink)]">לקוחות עם גבייה פתוחה</p>
            <div className="mt-4 grid gap-3">
              {pendingClients.length === 0 ? (
                <div className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-4 text-sm text-[color:var(--v2-muted)]">
                  אין כרגע לקוחות בולטים עם גבייה פתוחה.
                </div>
              ) : null}
              {pendingClients.map((client) => (
                <div key={client.name} className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-4">
                  <p className="font-black text-[color:var(--v2-ink)]">{client.name}</p>
                  <p className="mt-2 text-sm text-[color:var(--v2-muted)]">{formatCurrencyILS(client.total)}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
