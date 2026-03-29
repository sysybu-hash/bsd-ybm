import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AccountStatus, CustomerType } from "@prisma/client";
import { trialEndsAtFromNow } from "@/lib/trial";
import { sendWelcomeEmail } from "@/lib/mail";
import { defaultScanBalancesForTier } from "@/lib/subscription-tier-config";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      email?: string;
      name?: string;
      organizationName?: string;
      orgType?: string;
      inviteToken?: string;
    };

    const emailRaw = String(body.email ?? "").trim();
    const name = String(body.name ?? "").trim() || null;
    const organizationName = String(body.organizationName ?? "").trim();
    const typeRaw = String(body.orgType ?? "COMPANY").toUpperCase();
    const inviteToken = String(body.inviteToken ?? "").trim();

    if (!EMAIL_RE.test(emailRaw)) {
      return NextResponse.json({ error: "אימייל לא תקין" }, { status: 400 });
    }
    if (organizationName.length < 2) {
      return NextResponse.json({ error: "נא למלא שם ארגון או עסק" }, { status: 400 });
    }

    const normalized = emailRaw.toLowerCase();
    const existing = await prisma.user.findFirst({
      where: { email: { equals: normalized, mode: "insensitive" } },
    });
    if (existing) {
      return NextResponse.json(
        { error: "כתובת האימייל כבר רשומה במערכת" },
        { status: 409 },
      );
    }

    const orgType = Object.values(CustomerType).includes(typeRaw as CustomerType)
      ? (typeRaw as CustomerType)
      : CustomerType.COMPANY;

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

      void sendWelcomeEmail(normalized, name).catch((err) =>
        console.error("sendWelcomeEmail after register (invite)", err),
      );

      return NextResponse.json({
        ok: true,
        message:
          "ההרשמה הושלמה. ניתן להתחבר עם האימייל (הגדרת סיסמה דרך התחברות או מנהל המערכת).",
      });
    }

    const freeB = defaultScanBalancesForTier("FREE");

    await prisma.organization.create({
      data: {
        name: organizationName,
        type: orgType,
        subscriptionTier: "FREE",
        trialEndsAt: trialEndsAtFromNow(),
        subscriptionStatus: "PENDING_APPROVAL",
        cheapScansRemaining: freeB.cheapScansRemaining,
        premiumScansRemaining: freeB.premiumScansRemaining,
        maxCompanies: freeB.maxCompanies,
        users: {
          create: {
            email: normalized,
            name,
            role: "ORG_ADMIN",
            accountStatus: AccountStatus.PENDING_APPROVAL,
          },
        },
      },
    });

    void sendWelcomeEmail(normalized, name).catch((err) =>
      console.error("sendWelcomeEmail after register", err),
    );

    return NextResponse.json({
      ok: true,
      message: "הבקשה נקלטה. מנהל המערכת יאשר את המנוי וישלח לך פרטי כניסה.",
    });
  } catch (e) {
    console.error("register", e);
    return NextResponse.json({ error: "שגיאת שרת" }, { status: 500 });
  }
}
