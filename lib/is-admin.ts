import type { UserRole } from "@prisma/client";

/** ברירת מחדל בקוד — אם אין STEEL_ADMIN_EMAIL ב־.env */
export const DEFAULT_STEEL_ADMIN_EMAIL = "sysybu@gmail.com";

/**
 * כתובת בעל הפלטפורמה (Steel Lock) — אימייל יחיד שמקבל SUPER_ADMIN אמיתי ו־Master Admin.
 *
 * אפשר לעקוף ב־`STEEL_ADMIN_EMAIL` (משתנה סביבה) אם חשבון Google/DB נרשם עם כתובת אחרת
 * (למשל sysybug@gmail.com במקום sysybu) — בלי לשנות קוד.
 */
export function steelPlatformOwnerEmail(): string {
  const raw = process.env.STEEL_ADMIN_EMAIL?.trim().toLowerCase();
  if (raw && raw.includes("@")) return raw;
  return DEFAULT_STEEL_ADMIN_EMAIL;
}

/**
 * @deprecated השתמשו ב־`steelPlatformOwnerEmail()` — הקבוע משקף רק את ברירת המחדל, לא עקיפת env
 */
export const STEEL_ADMIN_EMAIL = DEFAULT_STEEL_ADMIN_EMAIL;

/** @deprecated השתמשו ב־`steelPlatformOwnerEmail()` */
export const PLATFORM_SUPER_ADMIN_EMAIL = DEFAULT_STEEL_ADMIN_EMAIL;

export function isAdmin(email: string | null | undefined): boolean {
  return (email ?? "").trim().toLowerCase() === steelPlatformOwnerEmail();
}

/**
 * תפקיד ב-JWT/סשן: רק בעל הפלטפורמה (steelPlatformOwnerEmail) כ־SUPER_ADMIN.
 * SUPER_ADMIN שגוי ב־DB → מנורמל ל־ORG_ADMIN.
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
