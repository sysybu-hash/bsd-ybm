import { canAccessMeckano } from "@/lib/intelligence-access";

/**
 * גישה לדף מקאנו ול־API:
 * אם מוגדר MECKANO_PAGE_ALLOWLIST_EMAILS — רק אימיילים ברשימה (מופרדים בפסיקים).
 * אחרת — לפי תפקיד (כמו קודם): SUPER_ADMIN / ORG_ADMIN / PROJECT_MGR.
 */
export function canAccessMeckanoPage(
  role: string | undefined,
  email: string | null | undefined,
): boolean {
  const raw = process.env.MECKANO_PAGE_ALLOWLIST_EMAILS?.trim();
  if (raw) {
    const allow = new Set(
      raw
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean),
    );
    const n = email?.trim().toLowerCase() ?? "";
    return n.length > 0 && allow.has(n);
  }
  return canAccessMeckano(role);
}
