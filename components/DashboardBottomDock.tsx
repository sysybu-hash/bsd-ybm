"use client";

import { useState } from "react";
import AccessibilityMenu from "@/components/AccessibilityMenu";
import DashboardUnifiedAi from "@/components/DashboardUnifiedAi";
import Link from "next/link";
import { Zap, ChevronRight, Settings2 } from "lucide-react";

export default function DashboardBottomDock({ orgId = "" }: { orgId?: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={`fixed left-0 top-1/2 z-[300] -translate-y-1/2 flex items-center transition-all duration-500 ease-[cubic-bezier(0.87,0,0.13,1)] ${
        isExpanded ? "pl-4" : "translate-x-[-85%]"
      }`}
    >
      {/* THE TOOLKIT DRAWER */}
      <div className="flex flex-col items-center gap-6 rounded-[3rem] border border-white/30 bg-white/70 p-3.5 shadow-[0_25px_60px_rgba(0,0,0,0.2)] backdrop-blur-3xl ring-1 ring-white/50 group/dock relative">
        
        {/* ACCESSIBILITY */}
        <AccessibilityMenu dock />
        
        <div className="h-px w-8 bg-black/10 mx-auto" />

        {/* QUICK AI SCANNER */}
        <Link 
          href="/dashboard/ai"
          className="group/btn relative flex h-14 w-14 items-center justify-center rounded-[1.5rem] bg-[var(--primary-brand,#4f46e5)] text-white shadow-2xl transition-all duration-500 hover:scale-110 hover:shadow-[0_0_30px_var(--primary-brand)] hover:-rotate-6 active:scale-90 overflow-hidden"
          title="אשף סריקה"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity" />
          <Zap size={24} className="relative z-10 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
        </Link>

        {/* UNIFIED AI ASSISTANT LAYER */}
        <DashboardUnifiedAi orgId={orgId} />

      </div>

      {/* THE HANDLE (TRIGGER) */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex h-16 w-8 items-center justify-center rounded-r-2xl bg-white shadow-xl border border-l-0 border-gray-200 transition-all hover:w-10 group ${
          isExpanded ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <ChevronRight 
          size={18} 
          className={`text-slate-400 group-hover:text-[var(--primary-brand)] transition-transform duration-500 ${isExpanded ? "rotate-180" : ""}`} 
        />
      </button>

      {/* CLOSE TAB (WHEN EXPANDED) */}
      {isExpanded && (
        <button 
          onClick={() => setIsExpanded(false)}
          className="absolute -right-4 top-1/2 -translate-y-1/2 h-12 w-8 bg-white/50 backdrop-blur-md rounded-l-xl flex items-center justify-center border border-r-0 border-slate-200/50 hover:bg-white transition-colors"
        >
          <ChevronRight size={16} className="rotate-180 text-slate-400" />
        </button>
      )}
    </div>
  );
}
