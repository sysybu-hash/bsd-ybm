import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jsonBadRequest, jsonForbidden } from "@/lib/api-json";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/is-admin";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session?.user?.email)) {
    return jsonForbidden("נדרשת הרשאת מנהל פלטפורמה.");
  }

  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email")?.trim().toLowerCase();
  if (!email) {
    return jsonBadRequest("חסר פרמטר email", "missing_email");
  }

  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      accountStatus: true,
      organizationId: true,
      lastLoginAt: true,
    },
  });

  if (!user) return NextResponse.json({ found: false });

  return NextResponse.json({ found: true, user });
}
