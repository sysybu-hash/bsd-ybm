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
  const netFlow = flowSummary != null ? flowSummary.totalIssued - flowSummary.totalExpenses : null;

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
    <div className="space-y-8 text-start" dir={dir}>

      {/* ── Page header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black italic text-slate-900">
            {t("erpDash.pageTitle")}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{t("erpDash.pageSubtitle")}</p>
          {netFlow != null && (
            <p className="mt-2 flex flex-wrap items-center gap-2 text-sm font-semibold">
              {netFlow >= 0 ? (
                <TrendingUp size={16} className="text-emerald-500 shrink-0" />
              ) : (
                <TrendingDown size={16} className="text-rose-500 shrink-0" />
              )}
              <span className="text-slate-600">{t("erpDash.netFlowIntro")}</span>{" "}
              <span className={`font-black ${netFlow >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                ₪{netFlow.toLocaleString(intlTag)}
              </span>
            </p>
          )}
        </div>

        {/* Quota pill */}
        <div className="flex shrink-0 items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-3 self-start shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100/50">
             <ScanLine size={18} className="text-blue-600" aria-hidden />
          </div>
          <div className="text-start">
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500/80">{t("erpDash.quotaCaption")}</p>
            <p className="text-sm font-black text-blue-900">{quotaLabel}</p>
          </div>
        </div>
      </div>

      {/* ── Flow summary cards ── */}
      {flowSummary ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="card-avenue rounded-2xl p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Box size={20} aria-hidden />
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 border border-slate-200">
                {t("erpDash.badgeInventory") || "מלאי"}
              </span>
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t("erpDash.flowItemsLabel")}</p>
            <p className="mt-1 text-3xl font-black text-slate-900">{flowSummary.totalItems}</p>
          </div>

          <div className="card-avenue rounded-2xl p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <ArrowUpRight size={20} aria-hidden />
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600 border border-emerald-100">
                {t("erpDash.badgeIncome")}
              </span>
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t("erpDash.flowIssuedLabel")}</p>
            <p className="mt-1 text-3xl font-black text-emerald-700">
              ₪{flowSummary.totalIssued.toLocaleString(intlTag)}
            </p>
          </div>

          <div className="card-avenue rounded-2xl p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <ArrowDownLeft size={20} aria-hidden />
              </div>
              <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-600 border border-rose-100">
                {t("erpDash.badgeExpense")}
              </span>
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t("erpDash.flowExpenseLabel")}</p>
            <p className="mt-1 text-3xl font-black text-rose-700">
              ₪{flowSummary.totalExpenses.toLocaleString(intlTag)}
            </p>
          </div>
        </div>
      ) : null}

      {/* ── Scanner CTA ── */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-white p-6 md:p-8 shadow-sm">
        <div className="relative flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/30">
              <FileSearch size={28} aria-hidden />
            </div>
            <div>
              <h2 className="text-xl font-black italic text-blue-900">{t("erpDash.scannerTitle")}</h2>
              <p className="mt-1 text-sm text-blue-800/70 font-medium">{t("erpDash.scannerDesc")}</p>
            </div>
          </div>
          <Link
            href="/dashboard/erp#erp-multi-scanner"
            className="btn-primary flex shrink-0 items-center gap-2 whitespace-nowrap"
          >
            <Layers size={18} />
            {t("erpDash.scannerCta")}
          </Link>
        </div>
      </div>

      {/* ── Price spike alerts ── */}
      {priceSpikes.length > 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2 text-amber-900">
            <AlertTriangle size={20} className="text-amber-500 shrink-0" />
            <h2 className="text-lg font-black italic">{t("erpDash.spikesTitle")}</h2>
          </div>
          <ul className="space-y-3">
            {priceSpikes.map((s) => (
              <li
                key={s.normalizedKey}
                className="flex flex-col gap-4 rounded-xl border border-amber-100 bg-white p-5 md:flex-row md:items-center md:justify-between shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 text-base">{s.description || s.normalizedKey}</p>
                  <p className="mt-1 text-sm text-slate-500 flex items-center gap-2">
                    <span className="inline-flex rounded-full bg-rose-100 px-2 py-0.5 text-xs font-black text-rose-700">
                      {t("erpDash.spikeRise", { pct: s.changePercent.toFixed(1) })}
                    </span>
                    <span>
                      {t("erpDash.spikeRange", {
                        from: s.previousPrice.toFixed(2),
                        to: s.latestPrice.toFixed(2),
                      })}
                    </span>
                  </p>
                  {insightByKey[s.normalizedKey] ? (
                    <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm leading-relaxed text-slate-700 border border-slate-100">
                      <strong className="text-blue-600 block mb-1 text-xs">AI Insight:</strong>
                      {insightByKey[s.normalizedKey]}
                    </div>
                  ) : null}
                </div>
                <button
                  type="button"
                  disabled={isAiPending}
                  onClick={() => runAiForKey(s.normalizedKey)}
                  className="btn-secondary flex shrink-0 items-center gap-2 border-amber-200 text-amber-700 hover:bg-amber-50"
                >
                  <Sparkles size={16} className={isAiPending ? "animate-pulse" : ""} />
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
            className="card-avenue rounded-2xl p-6"
          >
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{stat.label}</p>
            <p className={`mt-2 text-3xl font-black text-slate-800`}>{stat.value}</p>
            <div className="mt-4 inline-block rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500">
              {stat.trend}
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Chart ── */}
      <div className="card-avenue rounded-2xl p-6 md:p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black italic text-slate-900 flex items-center gap-2">
              <BarChart3 className="text-blue-600" size={22} aria-hidden />
              {t("erpDash.chartTitle")}
            </h2>
            <p className="mt-1 text-sm text-slate-500">הוצאות לפי תקופה — נתוני ERP משולבים</p>
          </div>
        </div>
        
        {chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
            <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-sm">
                <BarChart3 className="text-slate-300" size={32} strokeWidth={2} aria-hidden />
            </div>
            <div>
              <p className="font-bold text-slate-600">אין עדיין נתוני תרשים</p>
              <p className="mt-1 text-sm text-slate-400">{t("erpDash.chartEmpty")}</p>
            </div>
            <Link
              href="/dashboard/erp#erp-multi-scanner"
              className="btn-primary mt-2"
            >
              {t("erpDash.scannerCta")}
            </Link>
          </div>
        ) : (
          <RechartsBounded height={380}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 8 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12, fontWeight: 600 }}
                  tickMargin={12}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  width={60}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    background: "#ffffff",
                    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                    fontSize: "13px",
                    fontWeight: "bold",
                    color: "#0f172a",
                  }}
                  formatter={(value: number) => [
                    `₪${value.toLocaleString(intlTag)}`,
                    t("erpDash.chartTooltipExpenses"),
                  ]}
                />
                <Bar dataKey="value" fill="#2563eb" radius={[6, 6, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </RechartsBounded>
        )}
      </div>
    </div>
  );
}
