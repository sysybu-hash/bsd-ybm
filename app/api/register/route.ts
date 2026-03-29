import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AccountStatus, CustomerType } from "@prisma/client";
import { trialEndsAtFromNow } from "@/lib/trial";
import { sendWelcomeEmail } from "@/lib/mail";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      email?: string;
      name?: string;
      organizationName?: string;
      orgType?: string;
    };

    const emailRaw = String(body.email ?? "").trim();
    const name = String(body.name ?? "").trim() || null;
    const organizationName = String(body.organizationName ?? "").trim();
    const typeRaw = String(body.orgType ?? "COMPANY").toUpperCase();

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

    await prisma.organization.create({
      data: {
        name: organizationName,
        type: orgType,
        plan: "FREE",
        trialEndsAt: trialEndsAtFromNow(),
        subscriptionStatus: "PENDING_APPROVAL",
        creditsRemaining: 0,
        monthlyAllowance: 0,
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
