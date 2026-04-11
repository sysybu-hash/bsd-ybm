"use client";

import { usePathname } from "next/navigation";
import AccessibilityMenu from "@/components/AccessibilityMenu";
import AiBubble from "@/components/AiBubble";
import ScannerBubble from "@/components/ScannerBubble";

/** בועות נגישות + AI בדפים הציבוריים בלבד — בדשבורד הכל ב־DashboardBottomDock */
export default function GlobalFloatingChrome() {
  const pathname = usePathname() ?? "";
  const isDashboard = pathname.startsWith("/dashboard");

  if (isDashboard) {
    return null;
  }

  return (
    <>
      <AccessibilityMenu />
      <AiBubble />
      <ScannerBubble />
    </>
  );
}
