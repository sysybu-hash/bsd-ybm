import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isFreeTrialExpired } from "@/lib/trial";

/**
 * כל דפי הדשבורד מלבד billing ו-trial-expired.
 * חסימת גישה כשתוכנית FREE ותאריך הניסיון עבר.
 */
export default async function ProtectedDashboardSectionLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const orgId = session.user.organizationId;
  if (!orgId) {
    return <>{children}</>;
  }

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { plan: true, trialEndsAt: true },
  });

  if (
    session.user.role !== "SUPER_ADMIN" &&
    org &&
    isFreeTrialExpired(org)
  ) {
    redirect("/dashboard/trial-expired");
  }

  return <>{children}</>;
}
