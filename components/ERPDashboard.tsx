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
} from "lucide-react";
import { compareSupplierPrices } from "@/app/actions/erp-compare";
import type { PriceSpikeAlert } from "@/lib/erp-price-spikes";

const primary = "var(--primary-color, #3b82f6)";

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
          <h1
            className="text-4xl font-black italic tracking-tighter"
            style={{ color: primary }}
          >
            {t("erpDash.pageTitle")}
          </h1>
          <p className="text-slate-500 font-medium mt-1">{t("erpDash.pageSubtitle")}</p>
          {netFlow != null && (
            <p className="text-sm font-bold text-slate-600 mt-2 flex items-center gap-2 flex-wrap">
              <TrendingUp size={16} className="text-emerald-600 shrink-0" />
              {t("erpDash.netFlowIntro")}{" "}
              <span className={netFlow >= 0 ? "text-emerald-600" : "text-red-600"}>
                ₪{netFlow.toLocaleString(intlTag)}
              </span>
            </p>
          )}
        </div>

        <div className="bg-white border border-slate-200 p-6 rounded-[2rem] shadow-sm shrink-0">
          <p className="text-xs text-slate-400 font-bold uppercase mb-1">{t("erpDash.quotaCaption")}</p>
          <p className="text-xl font-black text-slate-900 leading-snug">{quotaLabel}</p>
        </div>
      </div>

      {flowSummary ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40">
            <div className="flex justify-between items-center mb-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                <Box />
              </div>
              <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-3 py-1 rounded-full uppercase">
                {t("erpDash.badgeInventory")}
              </span>
            </div>
            <p className="text-slate-500 font-bold text-sm">{t("erpDash.flowItemsLabel")}</p>
            <h2 className="text-3xl font-black text-slate-900 mt-1">
              {flowSummary.totalItems}
            </h2>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 border-r-4 border-r-green-500">
            <div className="flex justify-between items-center mb-4">
              <div className="p-3 bg-green-50 text-green-600 rounded-2xl">
                <ArrowUpRight />
              </div>
              <span className="text-[10px] font-black bg-green-100 text-green-700 px-3 py-1 rounded-full uppercase">
                {t("erpDash.badgeIncome")}
              </span>
            </div>
            <p className="text-slate-500 font-bold text-sm">{t("erpDash.flowIssuedLabel")}</p>
            <h2 className="text-3xl font-black text-slate-900 mt-1">
              ₪{flowSummary.totalIssued.toLocaleString(intlTag)}
            </h2>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 border-r-4 border-r-red-500">
            <div className="flex justify-between items-center mb-4">
              <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
                <ArrowDownLeft />
              </div>
              <span className="text-[10px] font-black bg-red-100 text-red-700 px-3 py-1 rounded-full uppercase">
                {t("erpDash.badgeExpense")}
              </span>
            </div>
            <p className="text-slate-500 font-bold text-sm">{t("erpDash.flowExpenseLabel")}</p>
            <h2 className="text-3xl font-black text-slate-900 mt-1">
              ₪{flowSummary.totalExpenses.toLocaleString(intlTag)}
            </h2>
          </div>
        </div>
      ) : null}

      <div className="bg-slate-950 text-white p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="bg-blue-600 p-6 rounded-[2rem] shadow-xl shadow-blue-500/20 animate-pulse">
            <FileSearch size={40} />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-black italic tracking-tighter">{t("erpDash.scannerTitle")}</h3>
            <p className="text-slate-400 font-medium mt-1">{t("erpDash.scannerDesc")}</p>
          </div>
          <Link
            href="/dashboard/erp#erp-multi-scanner"
            className="bg-white text-slate-950 px-10 py-4 rounded-2xl font-black hover:scale-105 transition-all flex items-center gap-2"
          >
            <Layers size={20} /> {t("erpDash.scannerCta")}
          </Link>
        </div>
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-600/10 rounded-full -ml-20 -mt-20 blur-3xl pointer-events-none" />
      </div>

      {priceSpikes.length > 0 ? (
        <div className="rounded-[2rem] border border-amber-200 bg-amber-50/60 p-6 md:p-8 space-y-4">
          <div className="flex items-center gap-2 text-amber-900 font-black">
            <AlertTriangle size={22} className="shrink-0" />
            {t("erpDash.spikesTitle")}
          </div>
          <ul className="space-y-3 text-sm">
            {priceSpikes.map((s) => (
              <li
                key={s.normalizedKey}
                className="flex flex-col gap-2 rounded-2xl bg-white/80 border border-amber-100 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-bold text-slate-900">{s.description || s.normalizedKey}</p>
                  <p className="text-slate-600 mt-1">
                    <span className="font-black text-red-600">
                      {t("erpDash.spikeRise", { pct: s.changePercent.toFixed(1) })}
                    </span>{" "}
                    {t("erpDash.spikeRange", {
                      from: s.previousPrice.toFixed(2),
                      to: s.latestPrice.toFixed(2),
                    })}
                  </p>
                  {insightByKey[s.normalizedKey] ? (
                    <p className="text-slate-700 mt-2 leading-relaxed border-t border-amber-100 pt-2">
                      {insightByKey[s.normalizedKey]}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  disabled={isAiPending}
                  onClick={() => runAiForKey(s.normalizedKey)}
                  className="shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 text-white px-4 py-2.5 font-bold hover:bg-slate-800 disabled:opacity-50"
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
            className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40"
          >
            <p className="text-slate-500 text-sm mb-2 font-bold">{stat.label}</p>
            <p className={`text-3xl font-black ${stat.valueClass}`}>{stat.value}</p>
            <div className="mt-4 text-xs font-bold bg-slate-50 inline-block px-3 py-1 rounded-full text-slate-500">
              {stat.trend}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/30">
        <h3 className="text-xl font-black mb-8 italic text-slate-900">{t("erpDash.chartTitle")}</h3>
        {chartData.length === 0 ? (
          <p className="text-slate-400 text-center py-20">{t("erpDash.chartEmpty")}</p>
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
