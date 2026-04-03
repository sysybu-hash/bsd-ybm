import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getToken } from "next-auth/jwt";
import { headers, cookies } from "next/headers";

/**
 * GET /api/auth/debug-session
 * מחזיר את מצב הסשן הנוכחי — לצורך דיבאג בלבד.
 * לא חושף סיסמאות או מפתחות — רק email, role, id, orgId.
 */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  /* Read JWT directly for comparison */
  let jwtEmail: string | null = null;
  let jwtRole: string | null = null;
  let jwtId: string | null = null;
  try {
    const token = await getToken({
      req: req as any,
      secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
    });
    jwtEmail = typeof token?.email === "string" ? token.email : null;
    jwtRole = typeof token?.role === "string" ? token.role : null;
    jwtId = typeof token?.id === "string" ? token.id : null;
  } catch {
    /* ignore */
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    session: session
      ? {
          email: session.user?.email ?? null,
          name: session.user?.name ?? null,
          role: session.user?.role ?? null,
          id: session.user?.id ?? null,
          organizationId: session.user?.organizationId ?? null,
        }
      : null,
    jwt: {
      email: jwtEmail,
      role: jwtRole,
      id: jwtId,
    },
    match: session?.user?.email === jwtEmail,
  });
}
