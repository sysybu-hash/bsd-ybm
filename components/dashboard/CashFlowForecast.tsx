"use client";

import { useEffect, useState } from "react";
import { 
  TrendingUp, 
  ArrowUpRight, 
  Target, 
  Wallet, 
  Sparkles,
  Info
} from "lucide-react";
import { getFinancialForecastAction, type CashFlowData } from "@/app/actions/finance-stats";
import { useI18n } from "@/components/I18nProvider";

/**
 * 🚀 BSD-YBM BSD-YBM: FINANCIAL FORECAST
 * 100% Multi-lingual.
 */

export default function CashFlowForecast() {
  const { t } = useI18n();
  const [data, setData] = useState<CashFlowData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const result = await getFinancialForecastAction();
        setData(result);
      } catch (e) {
        console.error("Forecast load error:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="h-64 rounded-2xl bg-white border border-slate-100 animate-pulse flex items-center justify-center">
        <div className="text-slate-400 font-bold text-xs uppercase tracking-widest">{t("dashboard.forecast.processing")}</div>
      </div>
    );
  }

  const d = data || { actual: 0, pending: 0, forecast: 0, totalProjected: 0 };

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-8 shadow-sm transition-all hover:shadow-xl hover:shadow-indigo-500/5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100 italic">
            <TrendingUp size={22} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 leading-none italic uppercase tracking-tighter">{t("dashboard.forecast.title")}</h3>
            <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest">{t("dashboard.forecast.subtitle")}</p>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 text-[9px] font-black uppercase tracking-widest self-start">
          <Sparkles size={12} />
          {t("dashboard.forecast.status")}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Actual */}
        <div className="space-y-3">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Wallet size={12} /> {t("dashboard.forecast.actual")}
          </p>
          <p className="text-2xl font-black text-slate-900 italic">₪{d.actual.toLocaleString()}</p>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]" style={{ width: '100%' }} />
          </div>
        </div>

        {/* Pending */}
        <div className="space-y-3">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <ArrowUpRight size={12} /> {t("dashboard.forecast.pending")}
          </p>
          <p className="text-2xl font-black text-slate-900 italic">₪{d.pending.toLocaleString()}</p>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
             <div className="h-full bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.2)]" style={{ width: `${Math.min(100, (d.pending / (d.totalProjected || 1)) * 100)}%` }} />
          </div>
        </div>

        {/* CRM Forecast */}
        <div className="space-y-3">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Target size={12} /> {t("dashboard.forecast.crm")}
          </p>
          <p className="text-2xl font-black text-indigo-600 italic">₪{d.forecast.toLocaleString()}</p>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
             <div className="h-full bg-indigo-400 rounded-full shadow-[0_0_10px_rgba(129,140,248,0.2)]" style={{ width: `${Math.min(100, (d.forecast / (d.totalProjected || 1)) * 100)}%` }} />
          </div>
        </div>
      </div>

      <div className="mt-10 pt-8 border-t border-slate-50 flex flex-col md:flex-row items-center justify-between gap-8">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t("dashboard.forecast.total")}</p>
          <p className="text-4xl font-black text-slate-900 italic tracking-tighter">₪{d.totalProjected.toLocaleString()}</p>
        </div>
        <div className="flex items-start gap-4 max-w-sm bg-slate-50 p-5 rounded-3xl border border-slate-100/50">
           <Info size={16} className="text-indigo-400 shrink-0 mt-0.5" />
           <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
             {t("dashboard.forecast.hint")}
           </p>
        </div>
      </div>
    </div>
  );
}
