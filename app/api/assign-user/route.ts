import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPlatformDeveloperEmail } from "@/lib/platform-developers";
import { hasMeckanoAccess } from "@/lib/meckano-access";
import type { UserRole } from "@prisma/client";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "נדרשת התחברות" }, { status: 401 });
  }

  if (hasMeckanoAccess(session.user.email)) {
    return NextResponse.json(
      { error: "מפעילי מקאנו אינם רשאים לשייך משתמשים." },
      { status: 403 },
    );
  }

  const caller = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { organizationId: true, role: true },
  });

  const isPlatformOwner = isPlatformDeveloperEmail(session.user.email);

  if (!caller) {
    return NextResponse.json({ error: "משתמש לא נמצא" }, { status: 403 });
  }

  const body = (await req.json()) as {
    email?: string;
    organizationId?: string;
    role?: string;
  };
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const organizationId = typeof body.organizationId === "string" ? body.organizationId : "";

  if (!email || !organizationId) {
    return NextResponse.json({ error: "חסר אימייל או מזהה ארגון" }, { status: 400 });
  }

  if (!isPlatformOwner && caller.role !== "ORG_ADMIN") {
    return NextResponse.json(
      { error: "רק מנהל ארגון רשאי לשייך משתמשים לצוות" },
      { status: 403 },
    );
  }

  if (!isPlatformOwner && caller.organizationId !== organizationId) {
    return NextResponse.json({ error: "אסור לשייך מחוץ לארגון שלך" }, { status: 403 });
  }

  if (isPlatformDeveloperEmail(email)) {
    return NextResponse.json(
      { error: "לא ניתן לשנות שיוך ארגון למשתמשי מפתח פלטפורמה." },
      { status: 403 },
    );
  }

  let newRole: UserRole = "EMPLOYEE";
  if (body.role === "ORG_ADMIN" && (caller.role === "ORG_ADMIN" || isPlatformOwner)) {
    newRole = "ORG_ADMIN";
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { organizationId, role: newRole, accountStatus: "ACTIVE" },
    });

    return NextResponse.json({ success: true, user: updatedUser.name, role: updatedUser.role });
  } catch {
    return NextResponse.json(
      { error: "המשתמש חייב להתחבר למערכת לפחות פעם אחת לפני השיוך" },
      { status: 400 },
    );
  }
}

