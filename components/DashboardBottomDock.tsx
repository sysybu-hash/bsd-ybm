"use client";

import { useState } from "react";
import AccessibilityMenu from "@/components/AccessibilityMenu";
import DashboardUnifiedAi from "@/components/DashboardUnifiedAi";
import Link from "next/link";
import { Zap, ChevronRight } from "lucide-react";

export default function DashboardBottomDock({ orgId = "" }: { orgId?: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className="fixed left-0 top-1/2 z-[300] -translate-y-1/2 flex items-center h-auto"
      aria-label="מרכז כלי עבודה BSD-YBM פתרונות AI"
    >
      {/* THE TOOLKIT DRAWER */}
      <div 
        className={`flex flex-col items-center gap-6 rounded-r-[3rem] border border-white/30 bg-white/70 p-3.5 shadow-[0_25px_60px_rgba(0,0,0,0.2)] backdrop-blur-3xl ring-1 ring-white/50 transition-all duration-700 ${
          isExpanded ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"
        }`}
        style={{ transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)" }}
      >
        {/* ACCESSIBILITY */}
        <AccessibilityMenu dock />
        
        <div className="h-px w-8 bg-black/10 mx-auto" />

        {/* QUICK AI SCANNER */}
        <Link 
      href="/app/insights"
          className="group/btn relative flex h-14 w-14 items-center justify-center rounded-[1.5rem] bg-[var(--primary-brand,#4f46e5)] text-white shadow-2xl transition-all duration-500 hover:scale-110 hover:shadow-[0_0_30px_var(--primary-brand)] hover:-rotate-6 active:scale-90 overflow-hidden"
          title="אשף סריקה"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity" />
          <Zap size={24} className="relative z-10 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
        </Link>

        {/* UNIFIED AI ASSISTANT LAYER */}
        <DashboardUnifiedAi orgId={orgId} />
      </div>

      {/* THE HANDLE (TRIGGER) - STAY AT THE EDGE */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`absolute left-0 top-1/2 -translate-y-1/2 flex h-24 w-10 items-center justify-center rounded-r-3xl bg-white shadow-2xl border border-l-0 border-gray-200 transition-all hover:w-12 group ${
          isExpanded ? "translate-x-[72px]" : "translate-x-0"
        }`}
        style={{ transitionDuration: '600ms' }}
      >
        <ChevronRight 
          size={20} 
          className={`text-slate-400 group-hover:text-[var(--primary-brand)] transition-transform duration-500 ${
            isExpanded ? "rotate-180" : ""
          }`} 
        />
        <div className="absolute right-1 top-2 bottom-2 w-1 rounded-full bg-slate-100 group-hover:bg-[var(--primary-brand)]/20 transition-colors" />
      </button>
    </div>
  );
}
