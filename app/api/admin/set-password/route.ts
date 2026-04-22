import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { jsonBadRequest, jsonForbidden, jsonNotFound } from "@/lib/api-json";
import { isAdmin } from "@/lib/is-admin";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

/**
 * POST /api/admin/set-password
 * Body: { email: string, password: string }
 * Admin-only: sets a password for any user so they can log in with email+password.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session?.user?.email)) {
    return jsonForbidden("נדרשת הרשאת מנהל פלטפורמה.");
  }

  const body = await req.json().catch(() => null);
  const email = (body?.email ?? "").trim().toLowerCase();
  const password = (body?.password ?? "").trim();

  if (!email || password.length < 4) {
    return jsonBadRequest("נדרש אימייל וסיסמה (מינ׳ 4 תווים)", "invalid_credentials_payload");
  }

  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true, email: true, name: true },
  });

  if (!user) {
    return jsonNotFound("משתמש לא נמצא");
  }

  const hashed = await hashPassword(password);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: hashed },
  });

  return NextResponse.json({
    ok: true,
    message: `Password set for ${user.email}`,
  });
}
