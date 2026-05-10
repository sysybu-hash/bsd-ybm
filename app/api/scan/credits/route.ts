import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jsonUnauthorized } from "@/lib/api-json";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/scan/credits
 * מחזיר את יתרת הסריקות של הארגון של המשתמש המחובר.
 * משמש את ה-CreditsChip באשף הסריקה לחיווי חי.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  const orgId = session?.user?.organizationId;
  if (!orgId) {
    return jsonUnauthorized();
  }

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: {
      cheapScansRemaining: true,
      premiumScansRemaining: true,
      isVip: true,
      subscriptionTier: true,
    },
  });

  if (!org) {
    return NextResponse.json({ ok: false, error: "ARG_NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    cheap: org.cheapScansRemaining,
    premium: org.premiumScansRemaining,
    total: org.cheapScansRemaining + org.premiumScansRemaining,
    isVip: org.isVip,
    tier: org.subscriptionTier,
  });
}
