import { redirect } from "next/navigation";
import type { WorkspaceFeatureInput } from "@/lib/workspace-features";
import { shouldBlockWorkspacePrimaryPath } from "@/lib/workspace-features";

/**
 * הגנת שרת משלימה ל-middleware — כשנתיב ה־URL ידוע ב-RSC (למשל מפרמטרים).
 * אל תסתמך על זה כדי לקבל pathname בלי להעביר אותו במפורש (layout לא מקבל pathname).
 */
export function redirectIfWorkspacePrimaryBlocked(
  pathname: string,
  input: WorkspaceFeatureInput,
): void {
  if (shouldBlockWorkspacePrimaryPath(pathname, input)) {
    redirect("/app");
  }
}

/** דף `/app/admin` מוגן בקומפוננטות (למשל AdminPlatformDashboard); פונקציית עזר לאחידות */
export function redirectIfNotPlatformAdmin(isPlatformAdmin: boolean): void {
  if (!isPlatformAdmin) {
    redirect("/app");
  }
}
