"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

type Props = {
  text?: string;
  /** גובה מינימלי לאזור הטעינה */
  minHeightClass?: string;
};

/**
 * טוען ויזואלי ל־loading.tsx / Suspense — מיושר לטוקנים של ערכת Claude ב-workspace.
 */
export function PolishedLoader({
  text = "טוען…",
  minHeightClass = "min-h-[40vh]",
}: Props) {
  return (
    <div
      className={`flex w-full flex-col items-center justify-center px-4 py-16 ${minHeightClass}`}
      aria-busy
      aria-live="polite"
    >
      <div className="relative flex items-center justify-center">
        <motion.div
          className="absolute h-16 w-16 rounded-full border-2 border-[color:var(--line-strong)] opacity-40"
          animate={{ scale: [1, 1.08, 1], opacity: [0.35, 0.55, 0.35] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden
        />
        <Loader2
          className="relative z-[1] h-8 w-8 animate-spin text-[color:var(--axis-clients)]"
          aria-hidden
        />
      </div>
      <p className="mt-4 text-sm font-semibold tracking-wide text-[color:var(--ink-600)]">
        {text}
      </p>
    </div>
  );
}
