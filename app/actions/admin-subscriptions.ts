"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { AccountStatus, type UserRole } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword, generateProvisionPassword } from "@/lib/password";
import { planDefaultCredits, ADMIN_PLAN_OPTIONS } from "@/lib/subscription-plans";
import { sendProvisionCredentialsEmail } from "@/app/actions/send-credentials-email";
import { isPlatformDeveloperEmail } from "@/lib/platform-developers";

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "SUPER_ADMIN") {
    return null;
  }
  return session;
}

export async function approveOrganizationAction(
  organizationId: string,
  plan: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await requireSuperAdmin();
  if (!session) {
    return { ok: false, error: "אין הרשאה" };
  }

  if (!ADMIN_PLAN_OPTIONS.includes(plan as (typeof ADMIN_PLAN_OPTIONS)[number])) {
    return { ok: false, error: "חבילה לא חוקית" };
  }

  const credits = planDefaultCredits(plan);
  try {
    await prisma.$transaction([
      prisma.organization.update({
        where: { id: organizationId },
        data: {
          subscriptionStatus: "ACTIVE",
          plan,
          monthlyAllowance: credits,
          creditsRemaining: credits,
        },
      }),
      prisma.user.updateMany({
        where: {
          organizationId,
          accountStatus: AccountStatus.PENDING_APPROVAL,
        },
        data: { accountStatus: AccountStatus.ACTIVE },
      }),
    ]);
    revalidatePath("/dashboard/admin");
    return { ok: true };
  } catch {
    return { ok: false, error: "עדכון נכשל" };
  }
}

const PROVISION_ROLES: UserRole[] = [
  "ORG_ADMIN",
  "PROJECT_MGR",
  "EMPLOYEE",
  "CLIENT",
];

export async function approvePendingRegistrationAction(
  userId: string,
  role: string,
  plan: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await requireSuperAdmin();
  if (!session) return { ok: false, error: "אין הרשאה" };
  if (!userId) return { ok: false, error: "חסר מזהה משתמש" };

  if (!ADMIN_PLAN_OPTIONS.includes(plan as (typeof ADMIN_PLAN_OPTIONS)[number])) {
    return { ok: false, error: "חבילה לא חוקית" };
  }
  if (!PROVISION_ROLES.includes(role as UserRole)) {
    return { ok: false, error: "תפקיד לא חוקי" };
  }
  const nextRole = role as UserRole;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, organizationId: true, accountStatus: true, email: true },
  });
  if (!user?.organizationId) {
    return { ok: false, error: "משתמש/ארגון לא נמצא" };
  }
  if (isPlatformDeveloperEmail(user.email)) {
    return { ok: false, error: "לא ניתן לאשר משתמש מפתח פלטפורמה" };
  }

  const credits = planDefaultCredits(plan);
  try {
    await prisma.$transaction([
      prisma.organization.update({
        where: { id: user.organizationId },
        data: {
          subscriptionStatus: "ACTIVE",
          plan,
          monthlyAllowance: credits,
          creditsRemaining: credits,
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { accountStatus: AccountStatus.ACTIVE, role: nextRole },
      }),
    ]);
    revalidatePath("/dashboard/admin");
    return { ok: true };
  } catch {
    return { ok: false, error: "אישור הרשמה נכשל" };
  }
}

export async function provisionUserAction(formData: FormData): Promise<
  | { ok: true; password?: string; emailed: boolean }
  | { ok: false; error: string }
> {
  const session = await requireSuperAdmin();
  if (!session) {
    return { ok: false, error: "אין הרשאה" };
  }

  const emailRaw = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim() || null;
  const organizationId = String(formData.get("organizationId") ?? "").trim();
  const roleStr = String(formData.get("role") ?? "EMPLOYEE");
  const sendEmail = formData.get("sendEmail") === "on";
  const useGenerated = formData.get("useGenerated") === "on";
  const passwordManual = String(formData.get("passwordManual") ?? "").trim();

  if (!emailRaw || !organizationId) {
    return { ok: false, error: "חסר אימייל או ארגון" };
  }
  if (isPlatformDeveloperEmail(emailRaw)) {
    return { ok: false, error: "לא ניתן לספק סיסמה למשתמשי פלטפורמה" };
  }

  const role = PROVISION_ROLES.includes(roleStr as UserRole) ? (roleStr as UserRole) : "EMPLOYEE";

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { name: true },
  });
  if (!org) {
    return { ok: false, error: "ארגון לא נמצא" };
  }

  const plain = useGenerated
    ? generateProvisionPassword(14)
    : passwordManual;

  if (!plain || plain.length < 8) {
    return { ok: false, error: "סיסמה קצרה מדי או חסרה (מינ׳ 8 תווים) — או סמנו מחולל אוטומטי" };
  }

  const passwordHash = await hashPassword(plain);

  const existing = await prisma.user.findFirst({
    where: { email: { equals: emailRaw, mode: "insensitive" } },
  });
  if (existing) {
    if (existing.organizationId !== organizationId) {
      return { ok: false, error: "האימייל משויך לארגון אחר" };
    }
    try {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          passwordHash,
          accountStatus: AccountStatus.ACTIVE,
          name: name ?? existing.name,
          role,
        },
      });
    } catch {
      return { ok: false, error: "עדכון סיסמה נכשל" };
    }
  } else {
    try {
      await prisma.user.create({
        data: {
          email: emailRaw,
          name,
          organizationId,
          role,
          accountStatus: AccountStatus.ACTIVE,
          passwordHash,
        },
      });
    } catch {
      return { ok: false, error: "יצירת משתמש נכשלה" };
    }
  }

  let emailed = false;
  if (sendEmail) {
    const r = await sendProvisionCredentialsEmail(emailRaw, name, plain, org.name);
    emailed = r.ok;
  }

  revalidatePath("/dashboard/admin");
  return { ok: true, password: sendEmail ? undefined : plain, emailed };
}
