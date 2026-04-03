"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ScanLine } from "lucide-react";

/**
 * כפתור צף שפותח את דף הסריקה המלא (/dashboard/ai).
 * dock: ללא מעטפת fixed — לשימוש ב־DashboardBottomDock.
 */
export default function ScannerBubble({
  variant = "light",
  dock = false,
}: {
  variant?: "dark" | "light";
  dock?: boolean;
}) {
  void variant;
  const router = useRouter();

  const wrapClass = dock
    ? "relative z-[2] inline-block"
    : "fixed bottom-[max(1rem,env(safe-area-inset-bottom,0px))] right-4 z-[100] sm:bottom-8 sm:right-8";

  return (
    <div className={wrapClass} dir="rtl">
      <motion.button
        type="button"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => router.push("/dashboard/ai")}
        aria-label="פתח מרכז סריקה"
        className="relative overflow-hidden rounded-full bg-indigo-600 p-4 text-white shadow-lg shadow-indigo-600/30 transition-colors hover:bg-indigo-700 group"
      >
        <ScanLine size={24} />
        <div className="absolute inset-0 bg-white/15 translate-y-full group-hover:translate-y-0 transition-transform pointer-events-none" />
      </motion.button>
    </div>
  );
}
