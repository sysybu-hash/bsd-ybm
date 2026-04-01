"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useI18n } from "@/components/I18nProvider";
import { intlLocaleForApp } from "@/lib/i18n/intl-locale";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import RechartsBounded from "@/components/RechartsBounded";
import {
  Box,
  ArrowUpRight,
  ArrowDownLeft,
  FileSearch,
  Layers,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Sparkles,
  BarChart3,
  ScanLine,
} from "lucide-react";
import { compareSupplierPrices } from "@/app/actions/erp-compare";
import type { PriceSpikeAlert } from "@/lib/erp-price-spikes";

const primary = "var(--primary-color, #2563eb)";

export type ErpStatCard = {
  label: string;
  value: string;
  trend: string;
  valueClass: string;
};

export type ErpFlowSummary = {
  totalItems: number;
  totalIssued: number;
  totalExpenses: number;
};

type Props = {
  stats: ErpStatCard[];
  chartData: { name: string; value: number }[];
  scanQuotaSummary: string | null;
  flowSummary: ErpFlowSummary | null;
  priceSpikes: PriceSpikeAlert[];
};

export default function ERPDashboard({
  stats,
  chartData,
  scanQuotaSummary,
  flowSummary,
  priceSpikes,
}: Props) {
  const { t, dir, locale } = useI18n();
  const intlTag = intlLocaleForApp(locale);

  const quotaLabel = scanQuotaSummary?.trim() ? scanQuotaSummary : "—";

  const netFlow =
    flowSummary != null
      ? flowSummary.totalIssued - flowSummary.totalExpenses
      : null;

  const [insightByKey, setInsightByKey] = useState<Record<string, string>>({});
  const [isAiPending, startInsight] = useTransition();

  const runAiForKey = (normalizedKey: string) => {
    startInsight(async () => {
      const r = await compareSupplierPrices(normalizedKey);
      setInsightByKey((prev) => ({
        ...prev,
        [normalizedKey]: r.ok ? r.insight : r.error,
      }));
    });
  };

  return (
    <div className="space-y-8 text-right" dir={dir}>

      {/* ── Page header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            {t("erpDash.pageTitle")}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">{t("erpDash.pageSubtitle")}</p>
          {netFlow != null && (
            <p className="mt-2 flex flex-wrap items-center gap-2 text-sm font-semibold">
              {netFlow >= 0 ? (
                <TrendingUp size={15} className="text-emerald-600 shrink-0" />
              ) : (
                <TrendingDown size={15} className="text-rose-600 shrink-0" />
              )}
              {t("erpDash.netFlowIntro")}{" "}
              <span className={`font-black ${netFlow >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                ₪{netFlow.toLocaleString(intlTag)}
              </span>
            </p>
          )}
        </div>

        {/* Quota pill */}
        <div className="flex shrink-0 items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-3 self-start">
          <ScanLine size={16} className="text-blue-600" aria-hidden />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-500">{t("erpDash.quotaCaption")}</p>
            <p className="text-sm font-black text-slate-900">{quotaLabel}</p>
          </div>
        </div>
      </div>

      {/* ── Flow summary cards ── */}
      {flowSummary ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Box size={18} aria-hidden />
              </div>
              <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-bold text-blue-700">
                {t("erpDash.badgeInventory")}
              </span>
            </div>
            <p className="text-xs font-medium text-slate-500">{t("erpDash.flowItemsLabel")}</p>
            <p className="mt-1.5 text-3xl font-black text-slate-900">{flowSummary.totalItems}</p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <ArrowUpRight size={18} aria-hidden />
              </div>
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                {t("erpDash.badgeIncome")}
              </span>
            </div>
            <p className="text-xs font-medium text-slate-500">{t("erpDash.flowIssuedLabel")}</p>
            <p className="mt-1.5 text-3xl font-black text-slate-900">
              ₪{flowSummary.totalIssued.toLocaleString(intlTag)}
            </p>
          </div>

          <div className="rounded-2xl border border-rose-100 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <ArrowDownLeft size={18} aria-hidden />
              </div>
              <span className="rounded-full bg-rose-100 px-2.5 py-1 text-[10px] font-bold text-rose-700">
                {t("erpDash.badgeExpense")}
              </span>
            </div>
            <p className="text-xs font-medium text-slate-500">{t("erpDash.flowExpenseLabel")}</p>
            <p className="mt-1.5 text-3xl font-black text-slate-900">
              ₪{flowSummary.totalExpenses.toLocaleString(intlTag)}
            </p>
          </div>
        </div>
      ) : null}

      {/* ── Scanner CTA ── */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm md:p-8">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse 60% 80% at 100% 50%, rgba(37,99,235,0.05) 0%, transparent 65%)" }}
          aria-hidden
        />
        <div className="relative flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg"
              style={{ backgroundColor: "var(--primary-color, #2563eb)" }}
            >
              <FileSearch size={26} aria-hidden />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">{t("erpDash.scannerTitle")}</h2>
              <p className="mt-0.5 text-sm text-slate-500">{t("erpDash.scannerDesc")}</p>
            </div>
          </div>
          <Link
            href="/dashboard/erp#erp-multi-scanner"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
            style={{ backgroundColor: "var(--primary-color, #2563eb)" }}
          >
            <Layers size={17} />
            {t("erpDash.scannerCta")}
          </Link>
        </div>
      </div>

      {/* ── Price spike alerts ── */}
      {priceSpikes.length > 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <div className="mb-4 flex items-center gap-2 text-amber-800">
            <AlertTriangle size={18} className="shrink-0" />
            <span className="font-bold">{t("erpDash.spikesTitle")}</span>
          </div>
          <ul className="space-y-3">
            {priceSpikes.map((s) => (
              <li
                key={s.normalizedKey}
                className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-white p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900">{s.description || s.normalizedKey}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    <span className="font-black text-rose-600">
                      {t("erpDash.spikeRise", { pct: s.changePercent.toFixed(1) })}
                    </span>{" "}
                    {t("erpDash.spikeRange", {
                      from: s.previousPrice.toFixed(2),
                      to: s.latestPrice.toFixed(2),
                    })}
                  </p>
                  {insightByKey[s.normalizedKey] ? (
                    <p className="mt-2 border-t border-amber-100 pt-2 text-sm leading-relaxed text-slate-700">
                      {insightByKey[s.normalizedKey]}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  disabled={isAiPending}
                  onClick={() => runAiForKey(s.normalizedKey)}
                  className="inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: "var(--primary-color, #2563eb)" }}
                >
                  <Sparkles size={15} />
                  {t("erpDash.analyzeAi")}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <p className="text-xs font-medium text-slate-500">{stat.label}</p>
            <p className={`mt-2 text-3xl font-black ${stat.valueClass}`}>{stat.value}</p>
            <div className="mt-3 inline-block rounded-lg bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
              {stat.trend}
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Chart ── */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm md:p-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-base font-black text-slate-900">
              <BarChart3 className="text-blue-600" size={20} aria-hidden />
              {t("erpDash.chartTitle")}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">הוצאות לפי תקופה — נתוני ERP</p>
          </div>
        </div>
        {chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <BarChart3 className="text-slate-200" size={44} strokeWidth={1} aria-hidden />
            <div>
              <p className="font-bold text-slate-700">אין עדיין נתוני תרשים</p>
              <p className="mt-1 text-sm text-slate-500">{t("erpDash.chartEmpty")}</p>
            </div>
            <Link
              href="/dashboard/erp#erp-multi-scanner"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:opacity-90"
              style={{ backgroundColor: "var(--primary-color, #2563eb)" }}
            >
              {t("erpDash.scannerCta")}
            </Link>
          </div>
        ) : (
          <RechartsBounded height={380}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  tickMargin={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  width={52}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
                    fontSize: "13px",
                  }}
                  formatter={(value: number) => [
                    `₪${value.toLocaleString(intlTag)}`,
                    t("erpDash.chartTooltipExpenses"),
                  ]}
                />
                <Bar dataKey="value" fill={primary} radius={[8, 8, 0, 0]} maxBarSize={64} />
              </BarChart>
            </ResponsiveContainer>
          </RechartsBounded>
        )}
      </div>
    </div>
  );
}
