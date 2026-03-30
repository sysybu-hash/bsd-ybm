import type { UserRole } from "@prisma/client";

/**
 * נעילת זהות פלטפורמה (Steel Lock) — SuperAdmin יחיד.
 *
 * רק האימייל המפורט נחשב בעל פלטפורמה לצורכי UI ו־API (חדר מצב, לשוניות ניהול בבילינג, שידור וכו׳).
 * משתמשים עם SUPER_ADMIN ב־DB שאינם כתובת זו — מקבלים בטוקן ORG_ADMIN (לא SUPER_ADMIN) — ראו `jwtRoleForSession`.
 *
 * אין כאן מטמון — תמיד השוואת מחרוזת מנורמלת.
 */
export const STEEL_ADMIN_EMAIL = "sysybu@gmail.com";

/** SuperAdmin הפלטפורמה (Yohanan / חשבון הבעלים) — לבדיקות מפורשות */
export const PLATFORM_SUPER_ADMIN_EMAIL = STEEL_ADMIN_EMAIL;

export function isAdmin(email: string | null | undefined): boolean {
  return (email ?? "").trim().toLowerCase() === STEEL_ADMIN_EMAIL;
}

/**
 * תפקיד ב-JWT/סשן: רק sysybu@gmail.com כ־SUPER_ADMIN.
 * SUPER_ADMIN שגוי ב־DB → מנורמל ל־ORG_ADMIN (יכולות מנהל ארגון בלי מפתח פלטפורמה).
 */
export function jwtRoleForSession(
  email: string | null | undefined,
  dbRole: UserRole | string,
): string {
  const e = (email ?? "").trim().toLowerCase();
  if (!e) return String(dbRole);
  if (isAdmin(e)) return "SUPER_ADMIN";
  if (String(dbRole) === "SUPER_ADMIN") return "ORG_ADMIN";
  return String(dbRole);
}
