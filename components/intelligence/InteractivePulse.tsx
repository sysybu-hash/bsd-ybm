"use client";

import { useState } from "react";
import { Mic } from "lucide-react";

export default function InteractivePulse() {
  const [voicePanelOpen, setVoicePanelOpen] = useState(false);
  
  return (
    <div
      className="space-y-8 rounded-2xl border border-gray-200 bg-white p-10 text-gray-900 shadow-sm"
      dir="rtl"
    >
      <div className="flex justify-between items-center gap-4">
        <div className="text-start">
          <h3 className="text-xl font-black italic text-slate-900">Business Pulse</h3>
          <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-1">ניטור ביצועים בזמן אמת</p>
        </div>
        <button
          type="button"
          onClick={() => setVoicePanelOpen((v) => !v)}
          aria-expanded={voicePanelOpen}
          aria-label={voicePanelOpen ? "סגור פאנל קול" : "פתח פאנל קול"}
          className={`rounded-full p-4 transition-all duration-300 shadow-lg ${
            voicePanelOpen ? "bg-rose-500 text-white rotate-12 scale-110" : "bg-indigo-600 text-white hover:scale-110 active:scale-95"
          }`}
        >
          <Mic size={24} />
        </button>
      </div>

      {voicePanelOpen && (
        <div
          className="overflow-hidden rounded-2xl border border-indigo-500/20 bg-indigo-50/50 p-5 animate-in fade-in slide-in-from-top-2 duration-300"
        >
          <p className="text-sm font-bold text-indigo-900 leading-relaxed text-start">
             <span className="inline-block h-2 w-2 rounded-full bg-rose-500 animate-pulse me-2" />
            מצב קול (הדגמה): בתשתית מלאה יחובר למנוע תמלול ולפעולות במערכת. לחצו שוב על המיקרופון לסגירה.
          </p>
        </div>
      )}

      <div>
        <div className="flex justify-between text-xs mb-3 uppercase font-black tracking-widest text-slate-500">
          <span>יעד הכנסות חודשי</span>
          <span className="text-indigo-600">80% הושלם</span>
        </div>
        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full bg-indigo-600 transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(79,70,229,0.3)]"
            style={{ width: "80%" }}
          />
        </div>
        <p className="mt-4 text-xs italic text-slate-400 font-medium text-start">
          עוד <span className="font-black text-slate-700">₪10,000</span> להשגת בונוס &quot;צמיחה מהירה&quot;!
        </p>
      </div>
    </div>
  );
}
