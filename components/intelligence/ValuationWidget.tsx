"use client";

import { motion } from "framer-motion";
import { TrendingUp, Award, ArrowUpRight } from "lucide-react";

export default function ValuationWidget({ value = 1250000 }: { value?: number }) {
  const primaryColor = "var(--primary-color, #4f46e5)";

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
      dir="rtl"
    >
      <div className="absolute -top-10 -left-10 w-32 h-32 bg-indigo-500/15 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity" />

      <div className="relative z-10">
        <div className="flex justify-between items-center mb-6">
          <div className="p-3 bg-indigo-500/15 rounded-2xl">
            <Award style={{ color: primaryColor }} size={24} />
          </div>
          <div className="flex items-center gap-1 text-emerald-500 font-black text-sm">
            <ArrowUpRight size={16} aria-hidden /> 14% החודש
          </div>
        </div>

        <h4 className="text-gray-400 text-xs font-black uppercase tracking-widest mb-2">
          שווי שוק מוערך (AI)
        </h4>
        <div className="flex items-baseline gap-2">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-4xl font-black italic tracking-tighter text-gray-900"
          >
            ₪{value.toLocaleString()}
          </motion.span>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-100 flex items-center gap-2">
          <TrendingUp size={14} className="text-gray-400" aria-hidden />
          <p className="text-[10px] text-gray-400 font-medium italic">
            מבוסס על מכפיל רווח X4 וצמיחת לקוחות ב-CRM.
          </p>
        </div>
      </div>
    </div>
  );
}
