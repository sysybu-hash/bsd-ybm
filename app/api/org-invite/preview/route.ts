import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** תצוגה בלבד לטופס הרשמה — ללא מידע רגיש מעבר לשם הארגון */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = String(url.searchParams.get("token") ?? "").trim();
  if (!token) {
    return NextResponse.json({ error: "חסר טוקן" }, { status: 400 });
  }

  const inv = await prisma.organizationInvite.findUnique({
    where: { token },
    select: {
      email: true,
      role: true,
      expiresAt: true,
      usedAt: true,
      organization: { select: { name: true } },
    },
  });

  if (!inv) {
    return NextResponse.json({ error: "הזמנה לא נמצאה" }, { status: 404 });
  }
  if (inv.usedAt) {
    return NextResponse.json({ error: "ההזמנה כבר נוצלה" }, { status: 410 });
  }
  if (inv.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: "תוקף ההזמנה פג" }, { status: 410 });
  }

  return NextResponse.json({
    orgName: inv.organization.name,
    role: inv.role,
    emailHint: inv.email,
  });
}
