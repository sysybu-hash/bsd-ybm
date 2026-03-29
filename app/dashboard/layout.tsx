import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessMeckanoPage } from "@/lib/meckano-access";
import { prisma } from "@/lib/prisma";
import { freeTrialDaysRemaining } from "@/lib/trial";
import DashboardLayoutClient from "@/components/DashboardLayoutClient";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  let trialBannerDaysLeft: number | null = null;
  const orgId = session.user.organizationId;
  if (orgId) {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { plan: true, trialEndsAt: true },
    });
    const plan = (org?.plan || "").toUpperCase();
    if (plan === "FREE" && org?.trialEndsAt) {
      const days = freeTrialDaysRemaining(org.trialEndsAt);
      if (days !== null && days > 0) {
        trialBannerDaysLeft = days;
      }
    }
  }

  return (
    <DashboardLayoutClient
      orgId={session?.user?.organizationId || ""}
      showAdminLink={session?.user?.email === "sysybu@gmail.com"}
      userRole={session.user.role}
      showMeckanoLink={canAccessMeckanoPage(
        session.user.role,
        session.user.email,
      )}
      trialBannerDaysLeft={trialBannerDaysLeft}
    >
      {children}
    </DashboardLayoutClient>
  );
}
