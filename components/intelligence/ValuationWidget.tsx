"use client";

import { motion } from "framer-motion";
import { TrendingUp, Award, ArrowUpRight } from "lucide-react";

export default function ValuationWidget({ value = 1250000 }: { value?: number }) {
  const primaryColor = "var(--primary-color, #3b82f6)";

  return (
    <div
      className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl relative overflow-hidden group"
      dir="rtl"
    >
      <div className="absolute -top-10 -left-10 w-32 h-32 bg-blue-50 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity" />

      <div className="relative z-10">
        <div className="flex justify-between items-center mb-6">
          <div className="p-3 bg-blue-50 rounded-2xl">
            <Award style={{ color: primaryColor }} size={24} />
          </div>
          <div className="flex items-center gap-1 text-emerald-500 font-black text-sm">
            <ArrowUpRight size={16} aria-hidden /> 14% החודש
          </div>
        </div>

        <h4 className="text-slate-500 text-xs font-black uppercase tracking-widest mb-2">
          שווי שוק מוערך (AI)
        </h4>
        <div className="flex items-baseline gap-2">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-4xl font-black italic tracking-tighter text-slate-900"
          >
            ₪{value.toLocaleString()}
          </motion.span>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-50 flex items-center gap-2">
          <TrendingUp size={14} className="text-slate-400" aria-hidden />
          <p className="text-[10px] text-slate-400 font-medium italic">
            מבוסס על מכפיל רווח X4 וצמיחת לקוחות ב-CRM.
          </p>
        </div>
      </div>
    </div>
  );
}
