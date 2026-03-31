"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Play, RotateCcw, TrendingDown } from "lucide-react";

export default function SimulationMode() {
  const [isSimulating, setIsSimulating] = useState(false);

  return (
    <div
      className={`p-8 rounded-[3rem] border transition-all duration-500 ${
        isSimulating
          ? "bg-blue-600 border-blue-400 text-white"
          : "bg-slate-50 border-slate-100 text-slate-900"
      }`}
      dir="rtl"
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-black italic flex items-center gap-2">
          {isSimulating ? (
            <RotateCcw className="animate-spin" aria-hidden />
          ) : (
            <Play aria-hidden />
          )}{" "}
          מצב סימולציה (What If?)
        </h3>
        <button
          type="button"
          onClick={() => setIsSimulating(!isSimulating)}
          className={`px-6 py-2 rounded-full font-bold text-sm shadow-lg transition-all ${
            isSimulating
              ? "bg-white text-blue-600"
              : "bg-blue-600 text-white"
          }`}
        >
          {isSimulating ? 'בטל סימולציה' : 'הפעל מצב "מה אם?"'}
        </button>
      </div>

      <div className="space-y-4">
        <p
          className={`text-sm ${isSimulating ? "text-blue-100" : "text-slate-500"}`}
        >
          הוסף הוצאה או הכנסה דמיונית כדי לראות איך היא תשפיע על תזרים המזומנים של
          BSD-YBM בחצי השנה הקרובה.
        </p>

        {isSimulating ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6"
          >
            <input
              type="number"
              placeholder="סכום (₪)"
              className="p-3 rounded-xl bg-white/95 border border-white/50 text-slate-900 placeholder:text-slate-400 shadow-sm"
            />
            <select className="p-3 rounded-xl bg-white/95 border border-white/50 text-slate-900 shadow-sm">
              <option className="text-slate-900">הוצאה חד פעמית</option>
              <option className="text-slate-900">הוצאה חודשית קבועה</option>
              <option className="text-slate-900">הכנסה חזויה</option>
            </select>
          </motion.div>
        ) : null}
      </div>

      {isSimulating ? (
        <div className="mt-8 p-4 bg-white/20 rounded-2xl flex items-start gap-3 border border-white/25">
          <TrendingDown className="text-rose-200 flex-shrink-0" aria-hidden />
          <p className="text-xs italic text-white/95">
            שים לב: הוספת הוצאה קבועה של ₪5,000 תוריד את יתרת המזומנים שלך מתחת
            ל&quot;קו האדום&quot; בחודש יולי. כדאי לשקול דחייה.
          </p>
        </div>
      ) : null}
    </div>
  );
}
