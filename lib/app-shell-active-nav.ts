import type { AppNavCollection, AppNavItem, AppRouteId } from "@/components/app-shell/app-nav";
import { pathnameToWorkspacePrimaryRoute } from "@/lib/workspace-features";

/**
 * התאמת נתיב לפריט בסרגל — `/app` רק במדויק; אחרת שוויון מלא או קידומת עם `/`
 * (מונע סימון שגוי של מקטעים).
 */
export function isAppNavPathActive(pathname: string, href: string): boolean {
  const current = pathname.split("?")[0].replace(/\/$/, "") || "/";
  const target = href.replace(/\/$/, "") || "/";
  if (target === "/app") return current === "/app";
  return current === target || current.startsWith(`${target}/`);
}

const UTILITY_SEGMENT_TO_ID: Partial<
  Record<string, Extract<AppRouteId, "help" | "business" | "intelligence" | "admin" | "success">>
> = {
  help: "help",
  business: "business",
  intelligence: "intelligence",
  admin: "admin",
  success: "success",
};

/**
 * קובע איזה פריט ניווט משקף את המסך הנוכחי — לכותרת עליונה ולדוק.
 * עדיפות: מקטע ראשי לפי `/app/{segment}` → utility → התאמה הכי ספציפית (הכי ארוכה).
 */
export function resolveActiveAppNavItem(pathname: string, nav: AppNavCollection): AppNavItem {
  const clean = pathname.split("?")[0] || "/";

  const primaryRoute = pathnameToWorkspacePrimaryRoute(clean);
  if (primaryRoute) {
    const hit = nav.primary.find((item) => item.id === primaryRoute);
    if (hit) return hit;
  }

  const parts = clean.replace(/\/$/, "").split("/").filter(Boolean);
  if (parts[0] === "app" && parts[1]) {
    const utilId = UTILITY_SEGMENT_TO_ID[parts[1]];
    if (utilId) {
      const util = nav.utility.find((item) => item.id === utilId);
      if (util) return util;
    }
  }

  const matches = nav.all.filter((item) => isAppNavPathActive(clean, item.href));
  if (matches.length === 0) {
    return nav.primary[0] ?? nav.all[0];
  }
  if (matches.length === 1) return matches[0];
  return matches.reduce((best, cur) =>
    cur.href.replace(/\/$/, "").length > best.href.replace(/\/$/, "").length ? cur : best,
  );
}
