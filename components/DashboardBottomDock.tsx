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
      className="pointer-events-none absolute bottom-[max(0.5rem,env(safe-area-inset-bottom,0px))] left-1/2 z-[108] flex -translate-x-1/2 flex-row items-end justify-center"
      aria-label="כלים צפים"
    >
      <div className="pointer-events-auto flex flex-row items-center gap-2 rounded-full border border-slate-200/90 bg-white/95 px-2 py-2 shadow-lg shadow-slate-300/40 backdrop-blur-md ring-1 ring-white/60 sm:gap-3 sm:px-3">
        <AccessibilityMenu dock />
        <DashboardUnifiedAi orgId={orgId} />
        <ScannerBubble variant="light" dock />
      </div>
    </div>
  );
}
