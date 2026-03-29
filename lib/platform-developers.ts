import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** מפתחי פלטפורמה — הרשאות מלאות (ברירת מחדל). ניתן לעקוף ב־PLATFORM_DEVELOPER_EMAILS (מופרד בפסיקים). */
const DEFAULT_PLATFORM_DEVELOPER_EMAILS = [
  "sysybu@gmail.com",
  "yb@bsd-ybm.co.il",
] as const;

/** PostgreSQL INT — ערך גבוה ללא ניכוי מעשי */
export const PLATFORM_UNLIMITED_CREDITS = 2_147_483_647;

export function getPlatformDeveloperEmails(): string[] {
  const raw = process.env.PLATFORM_DEVELOPER_EMAILS?.trim();
  if (raw) {
    return raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
  }
  return [...DEFAULT_PLATFORM_DEVELOPER_EMAILS];
}

export function isPlatformDeveloperEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const n = email.trim().toLowerCase();
  return getPlatformDeveloperEmails().includes(n);
}

/**
 * מעדכן משתמש מפתח: SUPER_ADMIN, ארגון עם מכסה מקסימימלית.
 * מחזיר נתונים לטוקן אם האימייל ברשימה; אחרת null.
 */
export async function ensurePlatformDeveloperAccount(
  rawEmail: string | null | undefined,
): Promise<{ id: string; role: UserRole; organizationId: string | null } | null> {
  if (!rawEmail) return null;
  const normalized = rawEmail.trim().toLowerCase();
  if (!isPlatformDeveloperEmail(normalized)) return null;

  const user = await prisma.user.findFirst({
    where: { email: { equals: normalized, mode: "insensitive" } },
  });
  if (!user) return null;

  if (user.role === "SUPER_ADMIN" && user.organizationId) {
    const orgQuick = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: { cheapScansLeft: true },
    });
    if (orgQuick && orgQuick.cheapScansLeft >= 1_000_000_000) {
      return {
        id: user.id,
        role: user.role,
        organizationId: user.organizationId,
      };
    }
  }

  let orgId = user.organizationId;

  if (!orgId) {
    const org = await prisma.organization.create({
      data: {
        name: "BSD-YBM — מפתחי פלטפורמה",
        type: "ENTERPRISE",
        subscriptionTier: "CORPORATE",
        subscriptionStatus: "ACTIVE",
        cheapScansLeft: PLATFORM_UNLIMITED_CREDITS,
        premiumScansLeft: PLATFORM_UNLIMITED_CREDITS,
        maxCompanies: 999,
      },
      select: { id: true },
    });
    orgId = org.id;
  } else {
    await prisma.organization.update({
      where: { id: orgId },
      data: {
        cheapScansLeft: PLATFORM_UNLIMITED_CREDITS,
        premiumScansLeft: PLATFORM_UNLIMITED_CREDITS,
        maxCompanies: 999,
        subscriptionTier: "CORPORATE",
        subscriptionStatus: "ACTIVE",
      },
    });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      role: "SUPER_ADMIN",
      organizationId: orgId,
      email: normalized,
      accountStatus: "ACTIVE",
    },
  });

  return {
    id: user.id,
    role: "SUPER_ADMIN",
    organizationId: orgId,
  };
}
