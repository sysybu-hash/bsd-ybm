import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AccountStatus, CustomerType } from "@prisma/client";
import { trialEndsAtFromNow } from "@/lib/trial";
import { sendRegistrationWelcomeEmail } from "@/lib/mail";
import { defaultScanBalancesForTier, tierLabelHe } from "@/lib/subscription-tier-config";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      email?: string;
      name?: string;
      organizationName?: string;
      orgType?: string;
      industry?: string;
      inviteToken?: string;
      orgInviteToken?: string;
      plan?: string;
    };

    const emailRaw = String(body.email ?? "").trim();
    const name = String(body.name ?? "").trim() || null;
    const organizationName = String(body.organizationName ?? "").trim();
    const typeRaw = String(body.orgType ?? "COMPANY").toUpperCase();
    const industry = String(body.industry ?? "GENERAL").toUpperCase();
    const inviteToken = String(body.inviteToken ?? "").trim();
    const orgInviteToken = String(body.orgInviteToken ?? "").trim();

    if (!EMAIL_RE.test(emailRaw)) {
      return NextResponse.json({ error: "אימייל לא תקין" }, { status: 400 });
    }

    const normalized = emailRaw.toLowerCase();

    /** הזמנה לצוות — הצטרפות לארגון קיים עם תפקיד; לא נוצר ארגון חדש */
    if (orgInviteToken) {
      const inv = await prisma.organizationInvite.findUnique({
        where: { token: orgInviteToken },
      });
      if (!inv) {
        return NextResponse.json({ error: "קישור הזמנה לא תקף" }, { status: 400 });
      }
      if (inv.usedAt) {
        return NextResponse.json({ error: "ההזמנה כבר נוצלה" }, { status: 409 });
      }
      if (inv.expiresAt.getTime() < Date.now()) {
        return NextResponse.json({ error: "תוקף ההזמנה פג" }, { status: 400 });
      }
      if (inv.email.toLowerCase() !== normalized) {
        return NextResponse.json(
          { error: "יש להירשם עם אותו אימייל שאליו נשלחה ההזמנה" },
          { status: 400 },
        );
      }

      const existing = await prisma.user.findFirst({
        where: { email: { equals: normalized, mode: "insensitive" } },
      });

      if (existing?.organizationId && existing.organizationId !== inv.organizationId) {
        return NextResponse.json(
          {
            error:
              "האימייל כבר משויך לארגון אחר. יש לפנות למנהל או להשתמש באימייל אחר.",
          },
          { status: 409 },
        );
      }

      try {
        await prisma.$transaction(async (tx) => {
          if (existing) {
            await tx.user.update({
              where: { id: existing.id },
              data: {
                organizationId: inv.organizationId,
                role: inv.role,
                accountStatus: AccountStatus.ACTIVE,
                ...(name ? { name } : {}),
              },
            });
          } else {
            await tx.user.create({
              data: {
                email: normalized,
                name,
                organizationId: inv.organizationId,
                role: inv.role,
                accountStatus: AccountStatus.ACTIVE,
              },
            });
          }
          await tx.organizationInvite.update({
            where: { id: inv.id },
            data: { usedAt: new Date() },
          });
        });
      } catch (e) {
        console.error("register orgInvite", e);
        return NextResponse.json({ error: "שגיאה בשמירת המשתמש" }, { status: 500 });
      }

      const joinedOrg = await prisma.organization.findUnique({
        where: { id: inv.organizationId },
        select: { subscriptionTier: true },
      });
      const tier = joinedOrg?.subscriptionTier ?? "FREE";
      void sendRegistrationWelcomeEmail(normalized, name, {
        tierLabelHe: tierLabelHe(tier),
        tierKey: tier,
        accountActive: true,
        extraNote:
          "הצטרפתם לארגון קיים כחברי צוות. Welcome to BSD-YBM — הרשאות לפי ההזמנה.",
      }).catch((err) => console.error("sendRegistrationWelcomeEmail (orgInvite)", err));

      return NextResponse.json({
        ok: true,
        message:
          "ההרשמה הושלמה. התחברו עם Google באותו אימייל — התפקיד שנקבע בהזמנה הוחל.",
      });
    }

    if (organizationName.length < 2) {
      return NextResponse.json({ error: "נא למלא שם ארגון או עסק" }, { status: 400 });
    }

    const existingUser = await prisma.user.findFirst({
      where: { email: { equals: normalized, mode: "insensitive" } },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "כתובת האימייל כבר רשומה במערכת" },
        { status: 409 },
      );
    }

    const orgType = Object.values(CustomerType).includes(typeRaw as CustomerType)
      ? (typeRaw as CustomerType)
      : CustomerType.COMPANY;

    /** הזמנת מנוי (Executive) — נפתח ארגון חדש; הנרשם הוא מנהל הארגון */
    if (inviteToken) {
      const inv = await prisma.subscriptionInvitation.findUnique({
        where: { token: inviteToken },
      });
      if (!inv) {
        return NextResponse.json({ error: "קישור הזמנה לא תקף" }, { status: 400 });
      }
      if (inv.usedAt) {
        return NextResponse.json({ error: "ההזמנה כבר נוצלה" }, { status: 409 });
      }
      if (inv.expiresAt.getTime() < Date.now()) {
        return NextResponse.json({ error: "תוקף ההזמנה פג" }, { status: 400 });
      }
      if (inv.email.toLowerCase() !== normalized) {
        return NextResponse.json(
          { error: "יש להירשם עם אותו אימייל שאליו נשלחה ההזמנה" },
          { status: 400 },
        );
      }

      const balances = defaultScanBalancesForTier(inv.subscriptionTier);

      await prisma.$transaction(async (tx) => {
        await tx.organization.create({
          data: {
            name: organizationName,
            type: orgType,
            industry,
            subscriptionTier: inv.subscriptionTier,
            subscriptionStatus: "ACTIVE",
            cheapScansRemaining: balances.cheapScansRemaining,
            premiumScansRemaining: balances.premiumScansRemaining,
            maxCompanies: balances.maxCompanies,
            trialEndsAt:
              inv.subscriptionTier === "FREE" ? trialEndsAtFromNow() : null,
            users: {
              create: {
                email: normalized,
                name,
                role: "ORG_ADMIN",
                accountStatus: AccountStatus.ACTIVE,
              },
            },
          },
        });
        await tx.subscriptionInvitation.update({
          where: { id: inv.id },
          data: { usedAt: new Date() },
        });
      });

      void sendRegistrationWelcomeEmail(normalized, name, {
        tierLabelHe: tierLabelHe(inv.subscriptionTier),
        tierKey: inv.subscriptionTier,
        accountActive: true,
        extraNote:
          inv.subscriptionTier === "FREE"
            ? "Welcome to BSD-YBM! You are currently on the FREE tier with an active trial window where applicable."
            : undefined,
      }).catch((err) => console.error("sendRegistrationWelcomeEmail (invite)", err));

      return NextResponse.json({
        ok: true,
        message:
          "ההרשמה הושלמה — נוצר ארגון חדש ואתם מנהליו. ניתן להתחבר עם Google באותו אימייל.",
      });
    }

    const planRaw = String(body.plan ?? "").toUpperCase();
    const isDirectPlan = !!body.plan;

    // Mapping plan string to SubscriptionTier enum
    const tier = ["FREE", "HOUSEHOLD", "DEALER", "COMPANY", "CORPORATE"].includes(planRaw)
       ? (planRaw as import("@prisma/client").SubscriptionTier)
       : "FREE";

    // Only general signup (no plan, no invite) goes to PENDING_APPROVAL
    const shouldApprove = isDirectPlan || !!inviteToken || !!orgInviteToken;
    const initialStatus = shouldApprove ? AccountStatus.ACTIVE : AccountStatus.PENDING_APPROVAL;
    const initialSubStatus = shouldApprove ? "ACTIVE" : "PENDING_APPROVAL";

    const balances = defaultScanBalancesForTier(tier);

    await prisma.organization.create({
      data: {
        name: organizationName,
        type: orgType,
        industry,
        subscriptionTier: tier,
        trialEndsAt: tier === "FREE" ? trialEndsAtFromNow() : null,
        subscriptionStatus: initialSubStatus,
        cheapScansRemaining: balances.cheapScansRemaining,
        premiumScansRemaining: balances.premiumScansRemaining,
        maxCompanies: balances.maxCompanies,
        users: {
          create: {
            email: normalized,
            name,
            role: "ORG_ADMIN",
            accountStatus: initialStatus,
          },
        },
      },
    });

    void sendRegistrationWelcomeEmail(normalized, name, {
      tierLabelHe: tierLabelHe(tier),
      tierKey: tier,
      accountActive: shouldApprove,
      extraNote: shouldApprove
        ? `Welcome to BSD-YBM! Your ${tierLabelHe(tier)} account is now ACTIVE.`
        : "Welcome to BSD-YBM! You are currently on the FREE tier pending admin approval — you will receive full access once approved.",
    }).catch((err) => console.error("sendRegistrationWelcomeEmail (signup)", err));

    return NextResponse.json({
      ok: true,
      message: shouldApprove 
        ? "ההרשמה הושלמה בהצלחה! ניתן להתחבר כעת."
        : "הבקשה נקלטה. מנהל המערכת יאשר את המנוי וישלח לך פרטי כניסה.",
    });
  } catch (e) {
    console.error("register", e);
    return NextResponse.json({ error: "שגיאת שרת" }, { status: 500 });
  }
}
