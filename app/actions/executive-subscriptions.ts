"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { Prisma, type SubscriptionTier } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPlatformDeveloperEmail } from "@/lib/platform-developers";
import {
  defaultScanBalancesForTier,
  parseSubscriptionTier,
  tierLabelHe,
} from "@/lib/subscription-tier-config";
import { sendSubscriptionJoinInviteEmail } from "@/lib/mail";
import { trialEndsAtFromNow } from "@/lib/trial";
import { PLATFORM_UNLIMITED_CREDITS } from "@/lib/platform-developers";

async function requireExecutive() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !isPlatformDeveloperEmail(session.user.email)) {
    return null;
  }
  return session;
}

export type ExecutiveOrgRow = {
  id: string;
  name: string;
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: string;
  cheapScansLeft: number;
  premiumScansLeft: number;
  maxCompanies: number;
  trialEndsAt: Date | null;
  primaryEmail: string | null;
};

export async function executiveListOrganizationsAction(): Promise<
  ExecutiveOrgRow[] | { error: string }
> {
  const s = await requireExecutive();
  if (!s) return { error: "אין הרשאה" };

  const orgs = await prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      subscriptionTier: true,
      subscriptionStatus: true,
      cheapScansLeft: true,
      premiumScansLeft: true,
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
    cheapScansLeft: o.cheapScansLeft,
    premiumScansLeft: o.premiumScansLeft,
    maxCompanies: o.maxCompanies,
    trialEndsAt: o.trialEndsAt,
    primaryEmail: o.users[0]?.email ?? null,
  }));
}

export type ManualTierMode = "standard" | "vip" | "trial";

/** עדכון מנוי ידני: רגיל (לפי מכסות רמה), VIP (מכסות גבוהות), או הרצה (FREE + ניסיון) */
export async function executiveApplyManualSubscriptionAction(
  organizationId: string,
  tierRaw: string,
  mode: ManualTierMode,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const s = await requireExecutive();
  if (!s) return { ok: false, error: "אין הרשאה" };

  const tier = parseSubscriptionTier(tierRaw);
  if (!tier) return { ok: false, error: "רמה לא חוקית" };

  try {
    if (mode === "trial") {
      await prisma.organization.update({
        where: { id: organizationId },
        data: {
          subscriptionTier: "FREE",
          subscriptionStatus: "ACTIVE",
          trialEndsAt: trialEndsAtFromNow(),
          ...defaultScanBalancesForTier("FREE"),
        },
      });
    } else if (mode === "vip") {
      await prisma.organization.update({
        where: { id: organizationId },
        data: {
          subscriptionTier: "CORPORATE",
          subscriptionStatus: "ACTIVE",
          cheapScansLeft: PLATFORM_UNLIMITED_CREDITS,
          premiumScansLeft: PLATFORM_UNLIMITED_CREDITS,
          maxCompanies: 999,
        },
      });
    } else {
      const b = defaultScanBalancesForTier(tier);
      await prisma.organization.update({
        where: { id: organizationId },
        data: {
          subscriptionTier: tier,
          subscriptionStatus: "ACTIVE",
          cheapScansLeft: b.cheapScansLeft,
          premiumScansLeft: b.premiumScansLeft,
          maxCompanies: b.maxCompanies,
        },
      });
    }
    revalidatePath("/dashboard/executive/subscriptions");
    revalidatePath("/dashboard/billing");
    revalidatePath("/dashboard/crm");
    return { ok: true };
  } catch {
    return { ok: false, error: "עדכון נכשל" };
  }
}

export async function executiveSaveBillingConfigAction(formData: FormData): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const s = await requireExecutive();
  if (!s) return { ok: false, error: "אין הרשאה" };

  const paypalRaw = String(formData.get("paypalClientId") ?? "").trim();
  const pricesRaw = String(formData.get("tierPricesJson") ?? "").trim();

  let tierMonthlyPricesJson: Prisma.InputJsonValue | typeof Prisma.JsonNull = Prisma.JsonNull;
  if (pricesRaw) {
    try {
      tierMonthlyPricesJson = JSON.parse(pricesRaw) as Prisma.InputJsonValue;
    } catch {
      return { ok: false, error: "JSON מחירים לא תקין" };
    }
  }

  try {
    await prisma.platformBillingConfig.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        paypalClientIdPublic: paypalRaw || null,
        tierMonthlyPricesJson,
      },
      update: {
        paypalClientIdPublic: paypalRaw || null,
        tierMonthlyPricesJson,
      },
    });
    revalidatePath("/dashboard/executive/subscriptions");
    revalidatePath("/dashboard/billing");
    return { ok: true };
  } catch {
    return { ok: false, error: "שמירה נכשלה" };
  }
}

export async function executiveSendJoinInviteAction(formData: FormData): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const s = await requireExecutive();
  if (!s) return { ok: false, error: "אין הרשאה" };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const headline = String(formData.get("headline") ?? "").trim() || "הוזמנתם ל-BSD-YBM";
  const bodyText = String(formData.get("bodyText") ?? "").trim();
  const tierHint = String(formData.get("tierHint") ?? "").trim();

  if (!email || !email.includes("@")) {
    return { ok: false, error: "אימייל לא תקין" };
  }

  const tierLine = tierHint
    ? `\n\nרמת מנוי מוצעת: ${tierLabelHe(tierHint)} (${tierHint}).`
    : "";
  const fullBody =
    bodyText ||
    `שלום,

הוזמנתם להצטרף לפלטפורמת BSD-YBM — ניהול ERP, סריקות AI וחיוב בחשבון אחד.${tierLine}

בברכה,
צוות BSD-YBM`;

  const r = await sendSubscriptionJoinInviteEmail(email, {
    headline,
    bodyText: fullBody,
    ctaPath: "/login",
  });
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true };
}

export async function executiveUpdateBundlePriceAction(
  bundleId: string,
  priceIls: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const s = await requireExecutive();
  if (!s) return { ok: false, error: "אין הרשאה" };
  if (!Number.isFinite(priceIls) || priceIls <= 0) {
    return { ok: false, error: "מחיר לא חוקי" };
  }
  try {
    await prisma.scanBundle.update({
      where: { id: bundleId },
      data: { priceIls },
    });
    revalidatePath("/dashboard/executive/subscriptions");
    revalidatePath("/dashboard/billing");
    return { ok: true };
  } catch {
    return { ok: false, error: "עדכון נכשל" };
  }
}
