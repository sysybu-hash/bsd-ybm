import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { freeTrialDaysRemaining } from "@/lib/trial";
import DashboardLayoutClient from "@/components/DashboardLayoutClient";
import { hasMeckanoAccess } from "@/lib/meckano-access";
import { isPlatformDeveloperEmail } from "@/lib/platform-developers";

/** מניעת מטמון RSC/CDN לתפריט לפי משתמש */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const email = session.user.email;
  /** חדר מצב / מאסטר — רק בעלי פלטפורמה מפורשים (PLATFORM_DEVELOPER_EMAILS). לא מספיק SUPER_ADMIN ב-DB. */
  const showAdminNav =
    Boolean(email) && !hasMeckanoAccess(email) && isPlatformDeveloperEmail(email);

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
      userRole={session.user.role}
      userEmail={session.user.email ?? null}
      trialBannerDaysLeft={trialBannerDaysLeft}
      showAdminNav={showAdminNav}
    >
      {children}
    </DashboardLayoutClient>
  );
}
