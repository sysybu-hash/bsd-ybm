"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic } from "lucide-react";

export default function InteractivePulse() {
  const [voicePanelOpen, setVoicePanelOpen] = useState(false);
  return (
    <div
      className="space-y-8 rounded-2xl border border-white/[0.08] bg-[#0a0b14] p-10 text-white shadow-sm"
      dir="rtl"
    >
      <div className="flex justify-between items-center gap-4">
        <h3 className="text-xl font-black italic">Business Pulse</h3>
        <button
          type="button"
          onClick={() => setVoicePanelOpen((v) => !v)}
          aria-expanded={voicePanelOpen}
          aria-label={voicePanelOpen ? "סגור פאנל קול" : "פתח פאנל קול"}
          className="rounded-full bg-indigo-600 p-4 shadow-sm transition-all hover:scale-110"
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
            className="overflow-hidden rounded-2xl border border-indigo-500/20 bg-indigo-500/15 text-sm text-white px-4 py-3"
          >
            מצב קול (הדגמה): בתשתית מלאה יחובר למנוע תמלול ולפעולות במערכת. לחצו שוב על המיקרופון
            לסגירה.
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div>
        <div className="flex justify-between text-xs mb-2 uppercase font-black tracking-widest text-indigo-300">
          <span>יעד הכנסות חודשי</span>
          <span>80% הושלם</span>
        </div>
        <div className="h-2 w-full bg-white/[0.08] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "80%" }}
            className="h-full bg-indigo-500/15 shadow-[0_0_15px_#3b82f6]"
          />
        </div>
        <p className="mt-4 text-xs italic text-white/45">
          עוד ₪10,000 להשגת בונוס &quot;צמיחה מהירה&quot;!
        </p>
      </div>
    </div>
  );
}
