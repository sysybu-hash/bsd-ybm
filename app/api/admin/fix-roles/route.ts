import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/is-admin";

/**
 * POST /api/admin/fix-roles
 *
 * תיקון חד-פעמי: מוריד כל משתמש שאינו Steel Admin שיש לו SUPER_ADMIN ב-DB → ORG_ADMIN.
 * זמין רק לבעל הפלטפורמה (isAdmin).
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminEmail = session!.user!.email!.trim().toLowerCase();

  // מוצא את כל המשתמשים עם SUPER_ADMIN שהם לא Steel Admin
  const wrongSuperAdmins = await prisma.user.findMany({
    where: {
      role: "SUPER_ADMIN",
      NOT: { email: { equals: adminEmail, mode: "insensitive" } },
    },
    select: { id: true, email: true, role: true },
  });

  if (wrongSuperAdmins.length === 0) {
    return NextResponse.json({ fixed: 0, message: "הכל תקין — אין משתמשים עם role שגוי" });
  }

  // מתקן את כולם ל-ORG_ADMIN
  const ids = wrongSuperAdmins.map((u) => u.id);
  await prisma.user.updateMany({
    where: { id: { in: ids } },
    data: { role: "ORG_ADMIN" },
  });

  return NextResponse.json({
    fixed: wrongSuperAdmins.length,
    users: wrongSuperAdmins.map((u) => ({ email: u.email, wasRole: u.role, nowRole: "ORG_ADMIN" })),
    message: `תוקנו ${wrongSuperAdmins.length} משתמשים`,
  });
}
