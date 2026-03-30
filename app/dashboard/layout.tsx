import type { ReactNode } from "react";
import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { freeTrialDaysRemaining } from "@/lib/trial";
import DashboardLayoutClient from "@/components/DashboardLayoutClient";

/** מניעת מטמון RSC/CDN — ללא גרסת „אדמין” שנשמרת למשתמש רגיל */
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  noStore();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  let trialBannerDaysLeft: number | null = null;
  const orgId = session.user.organizationId;
  if (orgId) {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { subscriptionTier: true, trialEndsAt: true },
    });
    const tier = org?.subscriptionTier ?? "FREE";
    if (tier === "FREE" && org?.trialEndsAt) {
      const days = freeTrialDaysRemaining(org.trialEndsAt);
      if (days !== null && days > 0) {
        trialBannerDaysLeft = days;
      }
    }
  }

  return (
    <DashboardLayoutClient
      orgId={session?.user?.organizationId || ""}
      userRole={session.user.role}
      trialBannerDaysLeft={trialBannerDaysLeft}
      serverUser={{
        email: session.user.email ?? "",
        name: session.user.name ?? null,
        image: session.user.image ?? null,
      }}
    >
      {children}
    </DashboardLayoutClient>
  );
}
