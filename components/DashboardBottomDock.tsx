"use client";

import AccessibilityMenu from "@/components/AccessibilityMenu";
import DashboardUnifiedAi from "@/components/DashboardUnifiedAi";
import Link from "next/link";
import { Zap, Brain } from "lucide-react";

export default function DashboardBottomDock({ orgId = "" }: { orgId?: string }) {
  return (
    <div
      className="fixed left-0 top-1/2 z-[300] -translate-y-1/2 flex flex-col items-center justify-center pl-4"
      aria-label="מרכז כלי עבודה BSD-YBM פתרונות AI"
    >
      <div className="flex flex-col items-center gap-6 rounded-[3rem] border border-white/30 bg-white/40 p-3.5 shadow-[0_25px_60px_rgba(0,0,0,0.15)] backdrop-blur-3xl ring-1 ring-white/50 group/dock">
        
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
    </div>
  );
}
  );
}
