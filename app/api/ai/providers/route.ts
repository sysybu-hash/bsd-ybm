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

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: true,
      email: true,
      organization: { select: { plan: true } },
    },
  });

  const plan = user?.organization?.plan ?? "FREE";
  const superAdmin = user?.role === "SUPER_ADMIN";
  const dev = !!(user?.email && isPlatformDeveloperEmail(user.email));
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
