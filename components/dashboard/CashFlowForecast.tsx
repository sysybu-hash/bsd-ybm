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

export default function CashFlowForecast() {
  const [data, setData] = useState<CashFlowData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const result = await getFinancialForecastAction();
      setData(result);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="h-64 rounded-2xl bg-white border border-slate-100 animate-pulse flex items-center justify-center">
        <div className="text-slate-400 font-bold">מעבד נתונים פיננסיים...</div>
      </div>
    );
  }

  const d = data || { actual: 0, pending: 0, forecast: 0, totalProjected: 0 };

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-indigo-100 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:shadow-indigo-500/5 ring-4 ring-transparent hover:ring-indigo-50/50">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200">
            <TrendingUp size={20} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 leading-none">תחזית תזרים מזומנים (AI)</h3>
            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">משולב CRM + ERP</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 text-[11px] font-black">
          <Sparkles size={12} />
          מעודכן בזמן אמת
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Actual */}
        <div className="space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Wallet size={12} /> כסף בקופה
          </p>
          <p className="text-2xl font-black text-slate-900">₪{d.actual.toLocaleString()}</p>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }} />
          </div>
        </div>

        {/* Pending */}
        <div className="space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <ArrowUpRight size={12} /> חשבוניות פתוחות
          </p>
          <p className="text-2xl font-black text-slate-900">₪{d.pending.toLocaleString()}</p>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
             <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(d.pending / (d.totalProjected || 1)) * 100}%` }} />
          </div>
        </div>

        {/* CRM Forecast */}
        <div className="space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Target size={12} /> תחזית מכירות CRM
          </p>
          <p className="text-2xl font-black text-indigo-600">₪{d.forecast.toLocaleString()}</p>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
             <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${(d.forecast / (d.totalProjected || 1)) * 100}%` }} />
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-slate-400">סה״כ צפוי (חודש קרוב)</p>
          <p className="text-3xl font-black text-slate-900">₪{d.totalProjected.toLocaleString()}</p>
        </div>
        <div className="hidden sm:flex items-start gap-3 max-w-[200px] bg-slate-50 p-3 rounded-2xl">
           <Info size={14} className="text-slate-400 shrink-0 mt-0.5" />
           <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
             התחזית מחושבת לפי הסתברות סגירה מוגדרת בכל שלב במשפך המכירות ב-CRM.
           </p>
        </div>
      </div>
    </div>
  );
}
