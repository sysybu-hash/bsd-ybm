"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * מעבר עדין בין נתיבי /app.
 * נשמר רק fade באטימות — ללא transform על המעטפת, כדי שלא יישברו מודאלים/שכבות עם position:fixed.
 */
export default function WorkspacePageMotion({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const segment = pathname?.replace(/^\/app/, "") || "home";

  return (
    <div key={segment} className="min-w-0 animate-workspace-page-enter">
      {children}
    </div>
  );
}
