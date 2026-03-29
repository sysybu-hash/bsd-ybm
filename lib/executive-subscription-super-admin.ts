/** ניהול מנויים מתקדם (הזמנות טוקן, יצירת משתמש ידנית) — רק אימייל זה */
export const EXECUTIVE_SUBSCRIPTION_SUPER_ADMIN_EMAIL = "sysybu@gmail.com";

export function isExecutiveSubscriptionSuperAdmin(
  email: string | null | undefined,
): boolean {
  return email?.trim().toLowerCase() === EXECUTIVE_SUBSCRIPTION_SUPER_ADMIN_EMAIL;
}
