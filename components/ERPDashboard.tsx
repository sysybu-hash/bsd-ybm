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
  AlertTriangle,
  Sparkles,
  BarChart3,
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
  /** תיאור מכסות סריקה (זולות / פרימיום) */
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
    <div className="space-y-12 text-right" dir={dir}>
      <div className="flex flex-col gap-6 lg:flex-row lg:justify-between lg:items-end">
        <div>
          <h1 className="text-2xl font-black italic tracking-tight text-slate-900 md:text-3xl">
            {t("erpDash.pageTitle")}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{t("erpDash.pageSubtitle")}</p>
          {netFlow != null && (
            <p className="text-sm font-bold text-slate-600 mt-2 flex items-center gap-2 flex-wrap">
              <TrendingUp size={16} className="text-emerald-600 shrink-0" />
              {t("erpDash.netFlowIntro")}{" "}
              <span className={netFlow >= 0 ? "text-emerald-600" : "text-rose-600"}>
                ₪{netFlow.toLocaleString(intlTag)}
              </span>
            </p>
          )}
        </div>

        <div className="card-avenue shrink-0 p-6">
          <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">{t("erpDash.quotaCaption")}</p>
          <p className="text-xl font-black leading-snug text-slate-900">{quotaLabel}</p>
        </div>
      </div>

      {flowSummary ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
          <div className="card-avenue p-6 md:p-8">
            <div className="mb-4 flex items-center justify-between">
              <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
                <Box aria-hidden />
              </div>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-[10px] font-black uppercase text-blue-700">
                {t("erpDash.badgeInventory")}
              </span>
            </div>
            <p className="text-sm font-bold text-slate-500">{t("erpDash.flowItemsLabel")}</p>
            <h2 className="mt-1 text-3xl font-black text-slate-900">{flowSummary.totalItems}</h2>
          </div>

          <div className="card-avenue border-e-4 border-e-emerald-500 p-6 md:p-8">
            <div className="mb-4 flex items-center justify-between">
              <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                <ArrowUpRight aria-hidden />
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black uppercase text-emerald-800">
                {t("erpDash.badgeIncome")}
              </span>
            </div>
            <p className="text-sm font-bold text-slate-500">{t("erpDash.flowIssuedLabel")}</p>
            <h2 className="mt-1 text-3xl font-black text-slate-900">
              ₪{flowSummary.totalIssued.toLocaleString(intlTag)}
            </h2>
          </div>

          <div className="card-avenue border-e-4 border-e-rose-500 p-6 md:p-8">
            <div className="mb-4 flex items-center justify-between">
              <div className="rounded-2xl bg-rose-50 p-3 text-rose-600">
                <ArrowDownLeft aria-hidden />
              </div>
              <span className="rounded-full bg-rose-100 px-3 py-1 text-[10px] font-black uppercase text-rose-800">
                {t("erpDash.badgeExpense")}
              </span>
            </div>
            <p className="text-sm font-bold text-slate-500">{t("erpDash.flowExpenseLabel")}</p>
            <h2 className="mt-1 text-3xl font-black text-slate-900">
              ₪{flowSummary.totalExpenses.toLocaleString(intlTag)}
            </h2>
          </div>
        </div>
      ) : null}

      <div className="card-avenue relative overflow-hidden p-8 md:p-10">
        <div className="relative z-10 flex flex-col items-center gap-8 md:flex-row">
          <div className="rounded-3xl bg-blue-600 p-6 text-white shadow-xl shadow-blue-600/25 ring-1 ring-blue-500/30">
            <FileSearch size={40} aria-hidden />
          </div>
          <div className="min-w-0 flex-1 text-center md:text-start">
            <h2 className="text-xl font-black italic text-slate-900 md:text-2xl">{t("erpDash.scannerTitle")}</h2>
            <p className="mt-1 text-sm font-medium text-slate-600">{t("erpDash.scannerDesc")}</p>
          </div>
          <Link href="/dashboard/erp#erp-multi-scanner" className="btn-primary shrink-0 px-8 py-3.5 text-sm md:px-10 md:py-4">
            <Layers size={20} aria-hidden />
            {t("erpDash.scannerCta")}
          </Link>
        </div>
        <div
          className="pointer-events-none absolute -start-20 -top-20 h-64 w-64 rounded-full bg-blue-600/10 blur-3xl"
          aria-hidden
        />
      </div>

      {priceSpikes.length > 0 ? (
        <div className="rounded-[2rem] border border-blue-200 bg-blue-50/60 p-6 md:p-8 space-y-4">
          <div className="flex items-center gap-2 text-blue-800 font-black">
            <AlertTriangle size={22} className="shrink-0" />
            {t("erpDash.spikesTitle")}
          </div>
          <ul className="space-y-3 text-sm">
            {priceSpikes.map((s) => (
              <li
                key={s.normalizedKey}
                className="flex flex-col gap-2 rounded-2xl bg-white/80 border border-blue-100 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-bold text-slate-900">{s.description || s.normalizedKey}</p>
                  <p className="text-slate-600 mt-1">
                    <span className="font-black text-rose-600">
                      {t("erpDash.spikeRise", { pct: s.changePercent.toFixed(1) })}
                    </span>{" "}
                    {t("erpDash.spikeRange", {
                      from: s.previousPrice.toFixed(2),
                      to: s.latestPrice.toFixed(2),
                    })}
                  </p>
                  {insightByKey[s.normalizedKey] ? (
                    <p className="text-slate-700 mt-2 leading-relaxed border-t border-blue-100 pt-2">
                      {insightByKey[s.normalizedKey]}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  disabled={isAiPending}
                  onClick={() => runAiForKey(s.normalizedKey)}
                  className="btn-primary shrink-0 px-4 py-2.5 text-sm disabled:opacity-50"
                >
                  <Sparkles size={18} />
                  {t("erpDash.analyzeAi")}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            whileHover={{ y: -5 }}
            className="card-avenue p-6 md:p-8"
          >
            <p className="text-slate-500 text-sm mb-2 font-bold">{stat.label}</p>
            <p className={`text-3xl font-black ${stat.valueClass}`}>{stat.value}</p>
            <div className="mt-4 text-xs font-bold bg-slate-50 inline-block px-3 py-1 rounded-full text-slate-500">
              {stat.trend}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="card-avenue p-8 md:p-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-black italic text-slate-900">
              <BarChart3 className="text-blue-600" size={22} aria-hidden />
              {t("erpDash.chartTitle")}
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">הוצאות לפי תקופה — נתוני ERP</p>
          </div>
        </div>
        {chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <BarChart3 className="text-slate-200" size={48} strokeWidth={1} aria-hidden />
            <p className="max-w-md text-sm font-medium text-slate-500">{t("erpDash.chartEmpty")}</p>
            <Link href="/dashboard/erp#erp-multi-scanner" className="btn-secondary text-sm">
              {t("erpDash.scannerCta")}
            </Link>
          </div>
        ) : (
          <RechartsBounded height={400}>
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
                    borderRadius: "20px",
                    border: "none",
                    boxShadow: "0 20px 50px rgba(0,0,0,0.1)",
                  }}
                  formatter={(value: number) => [
                    `₪${value.toLocaleString(intlTag)}`,
                    t("erpDash.chartTooltipExpenses"),
                  ]}
                />
                <Bar dataKey="value" fill={primary} radius={[10, 10, 0, 0]} maxBarSize={72} />
              </BarChart>
            </ResponsiveContainer>
          </RechartsBounded>
        )}
      </div>
    </div>
  );
}
