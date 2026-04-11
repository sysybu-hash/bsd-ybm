"use client";

import AccessibilityMenu from "@/components/AccessibilityMenu";
import DashboardUnifiedAi from "@/components/DashboardUnifiedAi";
import Link from "next/link";
import { Zap, Brain } from "lucide-react";

export default function DashboardBottomDock({ orgId = "" }: { orgId?: string }) {
  return (
    <div
      className="fixed right-0 top-1/2 z-[300] -translate-y-1/2 flex flex-col items-center justify-center pr-2"
      aria-label="מרכז כלי עבודה BSD-YBM פתרונות AI"
    >
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-gray-200 bg-white/90 p-2 shadow-2xl backdrop-blur-xl ring-1 ring-black/5">
        
        {/* ACCESSIBILITY */}
        <AccessibilityMenu dock />
        
        <div className="h-px w-6 bg-gray-200" />

        {/* QUICK AI SCANNER */}
        <Link 
          href="/dashboard/ai"
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--primary-brand,#8b5cf6)] text-white shadow-lg shadow-black/10 hover:translate-x-[-4px] active:scale-95 transition-all"
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
