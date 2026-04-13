"use client";

import { usePathname } from "next/navigation";
import AccessibilityMenu from "@/components/AccessibilityMenu";

/** סרגל גישות לדפים הציבוריים. סביבת העבודה עצמה משתמשת ב-WorkspaceUtilityDock. */
export default function GlobalFloatingChrome() {
  const pathname = usePathname() ?? "";
  const isWorkspace = /^\/(?:app|dashboard)(?:\/|$)/.test(pathname);

  if (isWorkspace) {
    return null;
  }

  return <AccessibilityMenu />;
}
