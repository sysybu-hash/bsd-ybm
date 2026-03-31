import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAiProvidersPublic } from "@/lib/ai-providers";
import { getAllowedAiProvidersForPlan } from "@/lib/ai-engine-access";
import { isAdmin } from "@/lib/is-admin";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [userEmailRow, orgPlan] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true },
    }),
    session.user.organizationId
      ? prisma.organization.findUnique({
          where: { id: session.user.organizationId },
          select: { subscriptionTier: true },
        })
      : Promise.resolve(null),
  ]);

  const plan = orgPlan?.subscriptionTier ?? "FREE";
  const platformAiBypass = !!(userEmailRow?.email && isAdmin(userEmailRow.email));
  const allowedIds = getAllowedAiProvidersForPlan(plan, platformAiBypass);

  const providers = getAiProvidersPublic().map((p) => ({
    ...p,
    allowedByPlan: allowedIds.includes(p.id),
  }));

  return NextResponse.json({
    providers,
    plan,
    subscriptionTier: plan,
    allowedProviderIds: allowedIds,
  });
}
