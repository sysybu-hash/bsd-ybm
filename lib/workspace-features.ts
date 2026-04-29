/**
 * מפת תכונות + מדיניות ניווט לפי תפקיד/תעשייה/מקצוע בנייה.
 *
 * **סנכרון UI אחרי שינוי מקצוע בהגדרות:** עדכון DB → `await update()` מ־`next-auth/react` → `router.refresh()` — כדי ש־RSC (`layout`) יטען מחדש את `getIndustryProfile` והניווט המסונן.
 */
import type { AppRouteId } from "@/components/app-shell/app-nav";
import type { ConstructionTradeId } from "@/lib/construction-trades";
import type { IndustryType } from "@/lib/professions/config";
import type { IndustryProfile } from "@/lib/professions/runtime";
import { normalizeConstructionTrade } from "@/lib/construction-trades";
import type { WorkspaceAccessContext } from "@/lib/workspace-access";

/**
 * מפתחות תכונה גסים — מאפשרים להסתיר מודולים ב-UI ולבדוק הרשאה לפני רינדור.
 * ניתן להרחיב (למשל `scanner.electrical_only`) ללא שינוי חוזה הניווט.
 */
export type WorkspaceFeatureKey =
  | "module_crm"
  | "module_erp"
  | "module_operations";

/** קלט לאיחוד RBAC + תעשייה + מקצוע בנייה (מיושר ל־getIndustryProfile / session) */
export type WorkspaceFeatureInput = WorkspaceAccessContext & {
  industryId: IndustryType;
  /** מ־IndustryProfile.constructionTradeId — רלוונטי בעיקר ל־CONSTRUCTION */
  constructionTradeId?: ConstructionTradeId;
};

const ALL_MODULES: WorkspaceFeatureKey[] = [
  "module_crm",
  "module_erp",
  "module_operations",
];

/** כפול קל מ־`professions/config` — בלי ייבוא כבד (React/אייקונים) ל־Edge middleware */
function normalizeIndustryTypeForJwt(id?: string | null): IndustryType {
  const normalized = String(id ?? "GENERAL").trim().toUpperCase();
  const aliases: Record<string, IndustryType> = {
    GENERAL: "GENERAL",
    LAWYER: "LEGAL",
    LEGAL: "LEGAL",
    ACCOUNTANT: "ACCOUNTING",
    ACCOUNTING: "ACCOUNTING",
    CONTRACTOR: "CONSTRUCTION",
    CONSTRUCTION: "CONSTRUCTION",
    HEALTH: "MEDICAL",
    MEDICAL: "MEDICAL",
    RETAIL: "RETAIL",
    REAL_ESTATE: "REAL_ESTATE",
  };
  return aliases[normalized] ?? "GENERAL";
}

const ROUTE_FEATURE: Partial<Record<AppRouteId, WorkspaceFeatureKey>> = {
  crm: "module_crm",
  erp: "module_erp",
  operations: "module_operations",
};

/**
 * מפת הסתרת נתיבים לפי מקצוע בנייה — ברירת מחדל ריקה (הכול גלוי).
 * דוגמה: `PLUMBING: ["ai"]` כדי להסתיר מסך AI למקצוע מסוים.
 */
export const TRADE_HIDDEN_PRIMARY_ROUTES: Partial<Readonly<Record<ConstructionTradeId, readonly AppRouteId[]>>> =
  {
    // דוגמה להרחבה:
    // PLUMBING: ["ai"],
  };

/**
 * מגבלות לפי תפקיד מערכת (בנוסף ל־trade).
 * ברירת מחדל ריקה — מלא לפי מדיניות מוצר (למשל CLIENT).
 */
const ROLE_DISABLED_MODULES: Partial<Record<string, readonly WorkspaceFeatureKey[]>> = {};

/**
 * פותר אילו מפתחות תכונה פעילים למשתמש הנוכחי.
 */
export function resolveWorkspaceFeatures(input: WorkspaceFeatureInput): ReadonlySet<WorkspaceFeatureKey> {
  const set = new Set<WorkspaceFeatureKey>(ALL_MODULES);
  const role = String(input.role ?? "").trim().toUpperCase();
  const disabled = ROLE_DISABLED_MODULES[role];
  if (disabled?.length) {
    for (const k of disabled) {
      set.delete(k);
    }
  }

  /** תפעול זמין לכל התעשיות — לוח הפיקוח, מסמכים וזרימות צוות רלוונטיות גם מחוץ לבנייה */
  return set;
}

function applyTradeRouteDenylist(
  hidden: Set<AppRouteId>,
  tradeId: ConstructionTradeId | undefined,
) {
  if (!tradeId) return;
  const extra = TRADE_HIDDEN_PRIMARY_ROUTES[tradeId];
  if (!extra) return;
  for (const id of extra) {
    hidden.add(id);
  }
}

/**
 * מחזירה את קבוצת נתיבי ה-primary להסתרה מלאה מהניווט.
 * משלבת: מפת תכונות (תפקיד/תעשייה) + denylist לפי constructionTrade.
 */
export function getHiddenPrimaryRouteIds(input: WorkspaceFeatureInput): Set<AppRouteId> {
  const features = resolveWorkspaceFeatures(input);
  const hidden = new Set<AppRouteId>();

  for (const [routeId, feat] of Object.entries(ROUTE_FEATURE) as [AppRouteId, WorkspaceFeatureKey][]) {
    if (!feat || (["home", "settings"] as AppRouteId[]).includes(routeId)) continue;
    if (!features.has(feat)) {
      hidden.add(routeId);
    }
  }

  if (input.industryId === "CONSTRUCTION") {
    applyTradeRouteDenylist(hidden, input.constructionTradeId);
  }

  return hidden;
}

export function hasWorkspaceFeature(
  features: ReadonlySet<WorkspaceFeatureKey>,
  key: WorkspaceFeatureKey,
): boolean {
  return features.has(key);
}

/** בניית קלט אחיד מ־AppShell / דפי RSC — מיושר ל־getIndustryProfile */
export function toWorkspaceFeatureInput(
  access: WorkspaceAccessContext,
  industryProfile: IndustryProfile,
): WorkspaceFeatureInput {
  return {
    ...access,
    industryId: industryProfile.id,
    constructionTradeId: industryProfile.constructionTradeId,
  };
}

const APP_SEGMENT_TO_ROUTE: Record<string, AppRouteId> = {
  scan: "scan",
  crm: "crm",
  erp: "erp",
  operations: "operations",
  settings: "settings",
};

/**
 * ממיר נתיב `/app/...` למזהה ניווט ראשי (או `home` ל־`/app`).
 * נתיבי utility (`/app/admin`, …) מחזירים `null` — אין להם חסימה במפת ה־primary.
 */
export function pathnameToWorkspacePrimaryRoute(pathname: string): AppRouteId | null {
  const path = pathname.split("?")[0].replace(/\/$/, "") || "/";
  if (!path.startsWith("/app")) return null;
  const parts = path.split("/").filter(Boolean);
  if (parts.length === 0) return null;
  if (parts[0] !== "app") return null;
  if (parts.length === 1) return "home";
  const seg = parts[1];
  if (!seg) return "home";
  if (seg === "insights" || seg === "intelligence" || seg === "documents" || seg === "finance") {
    return "erp";
  }
  if (seg === "clients" || seg === "projects") {
    return "crm";
  }
  if (seg === "ai" || seg === "inbox" || seg === "business" || seg === "advanced") {
    return "home";
  }
  return APP_SEGMENT_TO_ROUTE[seg] ?? null;
}

/**
 * קלט זהה ל־`getHiddenPrimaryRouteIds` מטענות JWT (middleware) — ללא DB.
 * `subscription` / Meckano לא משפיעים כרגע על הסתרת primary ב־`resolveWorkspaceFeatures`.
 */
export function workspaceFeatureInputFromJwtClaims(token: {
  role?: unknown;
  organizationId?: unknown;
  organizationIndustry?: unknown;
  organizationConstructionTrade?: unknown;
}): WorkspaceFeatureInput | null {
  const orgId = token.organizationId;
  if (typeof orgId !== "string" || orgId.length === 0) {
    return null;
  }
  const industryRaw = typeof token.organizationIndustry === "string" ? token.organizationIndustry : null;
  const tradeRaw = typeof token.organizationConstructionTrade === "string" ? token.organizationConstructionTrade : null;
  return {
    role: typeof token.role === "string" ? token.role : "",
    isPlatformAdmin: false,
    subscriptionTier: "FREE",
    subscriptionStatus: "ACTIVE",
    hasOrganization: true,
    hasMeckanoAccess: true,
    industryId: normalizeIndustryTypeForJwt(industryRaw),
    constructionTradeId: normalizeConstructionTrade(tradeRaw),
  };
}

export function shouldBlockWorkspacePrimaryPath(pathname: string, input: WorkspaceFeatureInput): boolean {
  const route = pathnameToWorkspacePrimaryRoute(pathname);
  if (!route || route === "home" || route === "settings") return false;
  return getHiddenPrimaryRouteIds(input).has(route);
}

