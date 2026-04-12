import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/is-admin";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = session.user.organizationId;
    if (!orgId) {
      return NextResponse.json({ error: "No organization context" }, { status: 400 });
    }

    // רק מנהל הארגון או סופר אדמין יכולים לראות את היומן
    // כאן נוסיף גם בדיקת isAdmin על המייל לצורך פלטפורמה
    const isPlatformAdmin = isAdmin(session.user.email);
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (user?.role !== "ORG_ADMIN" && !isPlatformAdmin) {
      return NextResponse.json({ error: "Access Denied - For Admins only" }, { status: 403 });
    }

    const logs = await prisma.activityLog.findMany({
      where: { organizationId: orgId },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 100
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Audit LOG API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
