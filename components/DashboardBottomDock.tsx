"use client";

import AccessibilityMenu from "@/components/AccessibilityMenu";
import DashboardUnifiedAi from "@/components/DashboardUnifiedAi";
import Link from "next/link";
import { Zap, Brain } from "lucide-react";

export default function DashboardBottomDock({ orgId = "" }: { orgId?: string }) {
  return (
    <div
      className="pointer-events-none fixed left-1/2 z-[300] flex -translate-x-1/2 flex-row items-end justify-center bottom-[max(2rem,env(safe-area-inset-bottom,0px))]"
      aria-label="מרכז כלי עבודה BSD-YBM פתרונות AI"
    >
      <div className="pointer-events-auto flex flex-row items-center gap-2 rounded-2xl border border-gray-200 bg-white/90 p-2 shadow-2xl backdrop-blur-xl ring-1 ring-black/5 sm:gap-4 sm:px-4">
        
        {/* ACCESSIBILITY */}
        <AccessibilityMenu dock />
        
        <div className="h-6 w-px bg-gray-200 mx-1" />

        {/* QUICK AI SCANNER */}
        <Link 
          href="/dashboard/ai"
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-600 text-white shadow-lg shadow-violet-600/20 hover:scale-105 active:scale-95 transition-all"
          title="אשף סריקה"
        >
          <Zap size={20} />
        </Link>

        {/* UNIFIED AI ASSISTANT LAYER */}
        <DashboardUnifiedAi orgId={orgId} />

      </div>
    </div>
  );
}
