"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { AccountStatus, CustomerType } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isExecutiveSubscriptionSuperAdmin } from "@/lib/executive-subscription-super-admin";
import {
  CORPORATE_MAX_COMPANIES_EFFECTIVE,
  defaultScanBalancesForTier,
  parseSubscriptionTier,
  tierLabelHe,
} from "@/lib/subscription-tier-config";
import { PLATFORM_UNLIMITED_CREDITS } from "@/lib/platform-developers";
import { hashPassword, generateProvisionPassword } from "@/lib/password";
import { sendProvisionCredentialsEmail } from "@/app/actions/send-credentials-email";
import { sendSubscriptionTierInvitationEmail } from "@/lib/mail";
import { trialEndsAtFromNow } from "@/lib/trial";
import type { ExecutiveOrgRow } from "@/app/actions/executive-subscriptions";

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !isExecutiveSubscriptionSuperAdmin(session.user.email)) {
    return null;
  }
  return session;
}

export async function manageSubsListOrganizationsAction(): Promise<
  ExecutiveOrgRow[] | { error: string }
> {
  const s = await requireSuperAdmin();
  if (!s) return { error: "אין הרשאה" };

  const orgs = await prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      subscriptionTier: true,
      subscriptionStatus: true,
      cheapScansRemaining: true,
      premiumScansRemaining: true,
      maxCompanies: true,
      trialEndsAt: true,
      users: {
        take: 1,
        orderBy: { createdAt: "asc" },
        select: { email: true },
      },
    },
  });

  return orgs.map((o) => ({
    id: o.id,
    name: o.name,
    subscriptionTier: o.subscriptionTier,
    subscriptionStatus: o.subscriptionStatus,
    cheapScansRemaining: o.cheapScansRemaining,
    premiumScansRemaining: o.premiumScansRemaining,
    maxCompanies: o.maxCompanies,
    trialEndsAt: o.trialEndsAt,
    primaryEmail: o.users[0]?.email ?? null,
  }));
}

export async function manageSubsCreateManualUserAction(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const s = await requireSuperAdmin();
  if (!s) return { ok: false, error: "אין הרשאה" };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim() || null;
  const organizationName = String(formData.get("organizationName") ?? "").trim();
  const tierRaw = String(formData.get("tier") ?? "FREE");
  const vip = formData.get("vip") === "on" || formData.get("vip") === "true";
  const typeRaw = String(formData.get("orgType") ?? "COMPANY").toUpperCase();

  if (!email.includes("@")) return { ok: false, error: "אימייל לא תקין" };
  if (organizationName.length < 2) return { ok: false, error: "שם ארגון קצר מדי" };

  const orgType = Object.values(CustomerType).includes(typeRaw as CustomerType)
    ? (typeRaw as CustomerType)
    : CustomerType.COMPANY;

  const existing = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true },
  });
  if (existing) return { ok: false, error: "משתמש עם אימייל זה כבר קיים" };

  const plain = generateProvisionPassword();
  const passwordHash = await hashPassword(plain);

  try {
    if (vip) {
      await prisma.organization.create({
        data: {
          name: organizationName,
          type: orgType,
          subscriptionTier: "CORPORATE",
          subscriptionStatus: "ACTIVE",
          isVip: true,
          cheapScansRemaining: PLATFORM_UNLIMITED_CREDITS,
          premiumScansRemaining: PLATFORM_UNLIMITED_CREDITS,
          maxCompanies: CORPORATE_MAX_COMPANIES_EFFECTIVE,
          users: {
            create: {
              email,
              name,
              role: "ORG_ADMIN",
              accountStatus: AccountStatus.ACTIVE,
              passwordHash,
            },
          },
        },
      });
    } else {
      const tier = parseSubscriptionTier(tierRaw) ?? "FREE";
      const b = defaultScanBalancesForTier(tier);
      await prisma.organization.create({
        data: {
          name: organizationName,
          type: orgType,
          subscriptionTier: tier,
          subscriptionStatus: "ACTIVE",
          isVip: false,
          trialEndsAt: tier === "FREE" ? trialEndsAtFromNow() : null,
          cheapScansRemaining: b.cheapScansRemaining,
          premiumScansRemaining: b.premiumScansRemaining,
          maxCompanies: b.maxCompanies,
          users: {
            create: {
              email,
              name,
              role: "ORG_ADMIN",
              accountStatus: AccountStatus.ACTIVE,
              passwordHash,
            },
          },
        },
      });
    }

    void sendProvisionCredentialsEmail(email, name, plain, organizationName).catch((err) =>
      console.error("sendProvisionCredentialsEmail manage-subscriptions", err),
    );

    revalidatePath("/dashboard/billing");
    revalidatePath("/dashboard/billing");
    return { ok: true };
  } catch (e) {
    console.error("manageSubsCreateManualUserAction", e);
    return { ok: false, error: "יצירת משתמש נכשלה" };
  }
}

export async function manageSubsAdjustScansAction(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const s = await requireSuperAdmin();
  if (!s) return { ok: false, error: "אין הרשאה" };

  const organizationId = String(formData.get("organizationId") ?? "").trim();
  const cheapDelta = Number(formData.get("cheapDelta") ?? 0);
  const premiumDelta = Number(formData.get("premiumDelta") ?? 0);

  if (!organizationId) return { ok: false, error: "חסר ארגון" };
  if (!Number.isFinite(cheapDelta) || !Number.isFinite(premiumDelta)) {
    return { ok: false, error: "מספרים לא חוקיים" };
  }

  try {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { cheapScansRemaining: true, premiumScansRemaining: true },
    });
    if (!org) return { ok: false, error: "ארגון לא נמצא" };

    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        cheapScansRemaining: Math.max(0, org.cheapScansRemaining + cheapDelta),
        premiumScansRemaining: Math.max(0, org.premiumScansRemaining + premiumDelta),
      },
    });

    revalidatePath("/dashboard/billing");
    revalidatePath("/dashboard/billing");
    return { ok: true };
  } catch {
    return { ok: false, error: "עדכון יתרה נכשל" };
  }
}

export async function manageSubsSendTierInviteAction(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const s = await requireSuperAdmin();
  if (!s) return { ok: false, error: "אין הרשאה" };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const tierRaw = String(formData.get("tier") ?? "").trim();
  const daysRaw = Number(formData.get("validDays") ?? 14);

  if (!email.includes("@")) return { ok: false, error: "אימייל לא תקין" };
  const tier = parseSubscriptionTier(tierRaw);
  if (!tier) {
    return { ok: false, error: "רמת מנוי לא חוקית" };
  }

  const days = Number.isFinite(daysRaw) && daysRaw > 0 && daysRaw <= 90 ? daysRaw : 14;
  const token = randomBytes(24).toString("base64url");
  const expiresAt = new Date(Date.now() + days * 86_400_000);

  try {
    await prisma.subscriptionInvitation.create({
      data: {
        token,
        email,
        subscriptionTier: tier,
        expiresAt,
        createdByEmail: s.user?.email?.trim().toLowerCase() ?? null,
      },
    });

    const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://bsd-ybm.co.il";
    const registerUrl = `${base}/register?invite=${encodeURIComponent(token)}`;

    const mail = await sendSubscriptionTierInvitationEmail(email, {
      tierLabel: `${tierLabelHe(tier)} (${tier})`,
      registerUrl,
      expiresNote: `הקישור תקף כ־${days} ימים. יש להירשם עם אותו אימייל.`,
    });
    if (!mail.ok) return { ok: false, error: mail.error };

    revalidatePath("/dashboard/billing");
    return { ok: true };
  } catch (e) {
    console.error("manageSubsSendTierInviteAction", e);
    return { ok: false, error: "שמירת הזמנה או שליחת מייל נכשלה" };
  }
}
