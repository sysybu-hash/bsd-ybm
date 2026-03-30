"use client";

import AccessibilityMenu from "@/components/AccessibilityMenu";
import DashboardUnifiedAi from "@/components/DashboardUnifiedAi";
import ScannerBubble from "@/components/ScannerBubble";

/**
 * שורה אחת בתחתית אזור התוכן: נגישות + AI מאוחד + סריקה — בלי לכסות תפריט צד / התנתקות.
 */
export default function DashboardBottomDock({ orgId }: { orgId: string }) {
  if (!orgId) return null;

  return (
    <div
      className="pointer-events-none fixed left-1/2 z-50 flex -translate-x-1/2 flex-row items-end justify-center bottom-[max(2rem,env(safe-area-inset-bottom,0px))]"
      aria-label="כלים צפים"
    >
      <div className="pointer-events-auto flex flex-row items-center gap-2 rounded-[1.25rem] border border-white/50 bg-white/80 px-2 py-2 shadow-2xl shadow-slate-400/35 backdrop-blur-md ring-1 ring-slate-200/60 sm:gap-3 sm:px-3 [&_button]:transition-transform [&_button]:duration-200 [&_button:hover]:scale-105">
        <AccessibilityMenu dock />
        <DashboardUnifiedAi orgId={orgId} />
        <ScannerBubble variant="light" dock />
      </div>
    </div>
  );
}
