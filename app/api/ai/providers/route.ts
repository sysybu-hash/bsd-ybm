import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAiProvidersPublic } from "@/lib/ai-providers";
import { getAllowedAiProvidersForPlan } from "@/lib/ai-engine-access";
import { isPlatformDeveloperEmail } from "@/lib/platform-developers";

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
          select: { plan: true },
        })
      : Promise.resolve(null),
  ]);

  const plan = orgPlan?.plan ?? "FREE";
  const superAdmin = session.user.role === "SUPER_ADMIN";
  const dev = !!(
    userEmailRow?.email && isPlatformDeveloperEmail(userEmailRow.email)
  );
  const allowedIds = getAllowedAiProvidersForPlan(plan, superAdmin || dev);

  const providers = getAiProvidersPublic().map((p) => ({
    ...p,
    allowedByPlan: allowedIds.includes(p.id),
  }));

  return NextResponse.json({
    providers,
    plan,
    allowedProviderIds: allowedIds,
  });
}
