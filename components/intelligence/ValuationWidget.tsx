"use client";

import { TrendingUp, Award, ArrowUpRight } from "lucide-react";

export default function ValuationWidget({ value = 1250000 }: { value?: number }) {
  const primaryColor = "#4f46e5";

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
      dir="rtl"
    >
      <div className="absolute -top-10 -left-10 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity" />

      <div className="relative z-10 text-start">
        <div className="flex justify-between items-center mb-6">
          <div className="p-3 bg-teal-500/15 rounded-2xl">
            <Award className="text-teal-600" size={24} />
          </div>
          <div className="flex items-center gap-1 text-emerald-600 font-black text-sm">
            <ArrowUpRight size={16} aria-hidden /> 14% החודש
          </div>
        </div>

        <h4 className="text-gray-400 text-xs font-black uppercase tracking-widest mb-2">
          שווי שוק מוערך (AI)
        </h4>
        <div className="flex items-baseline gap-2">
          <span
            className="text-4xl font-black italic tracking-tighter text-slate-900 animate-in fade-in duration-500"
          >
            ₪{value.toLocaleString()}
          </span>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-100 flex items-center gap-2">
          <TrendingUp size={14} className="text-slate-400" aria-hidden />
          <p className="text-[10px] text-slate-400 font-medium italic">
            מבוסס על מכפיל רווח X4 וצמיחת לקוחות ב-CRM.
          </p>
        </div>
      </div>
    </div>
  );
}
