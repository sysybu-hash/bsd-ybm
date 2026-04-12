"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
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
import Link from "next/link";

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
  const [isAiPending, setIsAiPending] = useState(false);

  const runAiForKey = async (normalizedKey: string) => {
    setIsAiPending(true);
    try {
      const r = await compareSupplierPrices(normalizedKey);
      setInsightByKey((prev) => ({
        ...prev,
        [normalizedKey]: r.ok ? r.insight : r.error,
      }));
    } finally {
      setIsAiPending(false);
    }
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
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm font-semibold">
              {netFlow >= 0 ? (
                <TrendingUp size={16} className="text-emerald-500 shrink-0" />
              ) : (
                <TrendingDown size={16} className="text-rose-500 shrink-0" />
              )}
              <span className="text-slate-600">{t("erpDash.netFlowIntro")}</span>{" "}
              <span className={`font-black ${netFlow >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                ₪{netFlow.toLocaleString(intlTag)}
              </span>
            </div>
          )}
        </div>

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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{stat.label}</p>
            <p className={`mt-2 text-3xl font-black text-slate-800`}>{stat.value}</p>
            <div className="mt-4 inline-block rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500">
              {stat.trend}
            </div>
          </div>
        ))}
      </div>

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
        
        <RechartsBounded height={380}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 8 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12, fontWeight: 600 }} tickMargin={12} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} width={60} />
              <Tooltip
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", background: "#ffffff", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", fontSize: "13px", fontWeight: "bold", color: "#0f172a" }}
                formatter={(value: number) => [`₪${value.toLocaleString(intlTag)}`, t("erpDash.chartTooltipExpenses")]}
              />
              <Bar dataKey="value" fill="#2563eb" radius={[6, 6, 0, 0]} maxBarSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </RechartsBounded>
      </div>
    </div>
  );
}
