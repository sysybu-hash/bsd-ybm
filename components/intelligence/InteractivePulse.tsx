"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic } from "lucide-react";

export default function InteractivePulse() {
  const [voicePanelOpen, setVoicePanelOpen] = useState(false);
  return (
    <div
      className="bg-white p-10 rounded-[3.5rem] text-slate-900 border border-slate-100 shadow-xl shadow-slate-200/40 space-y-8"
      dir="rtl"
    >
      <div className="flex justify-between items-center gap-4">
        <h3 className="text-xl font-black italic">Business Pulse</h3>
        <button
          type="button"
          onClick={() => setVoicePanelOpen((v) => !v)}
          aria-expanded={voicePanelOpen}
          aria-label={voicePanelOpen ? "סגור פאנל קול" : "פתח פאנל קול"}
          className="p-4 bg-blue-600 rounded-full hover:scale-110 transition-all shadow-lg shadow-blue-500/40"
        >
          <Mic size={24} />
        </button>
      </div>

      <AnimatePresence>
        {voicePanelOpen ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden rounded-2xl border border-blue-100 bg-blue-50 text-sm text-blue-900 px-4 py-3"
          >
            מצב קול (הדגמה): בתשתית מלאה יחובר למנוע תמלול ולפעולות במערכת. לחצו שוב על המיקרופון
            לסגירה.
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div>
        <div className="flex justify-between text-xs mb-2 uppercase font-black tracking-widest text-blue-700">
          <span>יעד הכנסות חודשי</span>
          <span>80% הושלם</span>
        </div>
        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "80%" }}
            className="h-full bg-blue-500 shadow-[0_0_15px_#3b82f6]"
          />
        </div>
        <p className="mt-4 text-xs italic text-slate-500">
          עוד ₪10,000 להשגת בונוס &quot;צמיחה מהירה&quot;!
        </p>
      </div>
    </div>
  );
}
