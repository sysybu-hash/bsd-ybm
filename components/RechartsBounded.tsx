"use client";

import type { ReactNode } from "react";

/**
 * עטיפה ל-Recharts בתוך דפי RTL / flex:
 * גובה קבוע, חיתוך overflow, ו־dir=ltr לצירים כדי למנוע מתיחת עמוד ו-SVG שבור.
 */
export default function RechartsBounded({
  height,
  className = "",
  children,
}: {
  height: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`recharts-bounded w-full max-w-full min-h-0 overflow-hidden ${className}`}
      style={{ height, minHeight: height, maxHeight: height }}
      dir="ltr"
    >
      {children}
    </div>
  );
}
