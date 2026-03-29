import { prisma } from "@/lib/prisma";
import { isPlatformDeveloperEmail } from "@/lib/platform-developers";
import { trialEndsAtFromNow } from "@/lib/trial";

/**
 * מוודא שיש orgId תקף: אם חסר בטוקן — נטען מהמשתמש במסד.
 * אם אין ארגון בכלל — נוצר ארגון אישי (מכסה מהסכימה).
 */
/** פותח/מאמת ארגון למשתמש — לשימוש בסריקה וקאש בלי חיוב מכסה */
export async function resolveOrganizationForUser(
  orgId: string,
  userId: string,
): Promise<{ id: string } | null> {
  if (orgId) {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true },
    });
    if (org) return org;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true, email: true, name: true },
  });

  if (user?.organizationId) {
    return { id: user.organizationId };
  }

  const label =
    user?.name?.trim() ||
    user?.email?.split("@")[0]?.trim() ||
    "ארגון אישי";

  const created = await prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: {
        name: `${label} — BSD-YBM`,
        trialEndsAt: trialEndsAtFromNow(),
      },
      select: { id: true },
    });
    await tx.user.update({
      where: { id: userId },
      data: { organizationId: org.id },
    });
    return org;
  });

  return created;
}

export async function checkAndDeductCredit(orgId: string, userId: string) {
  const userRow = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  if (userRow?.email && isPlatformDeveloperEmail(userRow.email)) {
    const resolved = await resolveOrganizationForUser(orgId, userId);
    if (!resolved) {
      return { allowed: false as const, error: "משתמש לא נמצא במערכת." };
    }
    return { allowed: true as const, organizationId: resolved.id };
  }

  const resolved = await resolveOrganizationForUser(orgId, userId);
  if (!resolved) {
    return { allowed: false as const, error: "משתמש לא נמצא במערכת." };
  }

  const org = await prisma.organization.findUnique({
    where: { id: resolved.id },
    select: { creditsRemaining: true, isPayAsYouGo: true },
  });

  if (!org) {
    return { allowed: false as const, error: "ארגון לא נמצא." };
  }

  if (org.creditsRemaining <= 0 && !org.isPayAsYouGo) {
    return {
      allowed: false as const,
      error: "נגמרה מכסת הסריקות. נא לשדרג חבילה או לפנות לתמיכה.",
    };
  }

  await prisma.organization.update({
    where: { id: resolved.id },
    data: { creditsRemaining: { decrement: 1 } },
  });

  return { allowed: true as const, organizationId: resolved.id };
}
