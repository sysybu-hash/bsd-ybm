/**
 * נעילת הרשאות פלטפורמה (Steel Lock) — בדיקה בצד שרת בלבד.
 * רק האימייל המפורש מטה נחשב „מנהל פלטפורמה” — כפתורי ניהול ו־API מוגנים.
 */
export const STEEL_ADMIN_EMAIL = "sysybu@gmail.com";

export function isAdmin(email: string | null | undefined): boolean {
  return (email ?? "").trim().toLowerCase() === STEEL_ADMIN_EMAIL;
}
