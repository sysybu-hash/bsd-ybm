import type { ReactNode } from "react";
import DashboardLayoutClient from "@/components/DashboardLayoutClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/is-admin";
import { canAccessMeckano } from "@/lib/meckano-access";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getIndustryProfile } from "@/lib/professions/runtime";

/** מניעת מטמון RSC/CDN — ללא גרסת „אדמין” שנשמרת למשתמש רגיל */
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  // 🛡️ BSD-YBM BSD-YBM: REAL IDENTITY PROTECTION
  // We use the real server session to determine identity and roles.
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return redirect("/login");
  }

  const serverEmail = session.user.email;
  const userName = session.user.name ?? "User";
  const userRole = session.user.role ?? "USER";
  const isAdminUser = isAdmin(serverEmail);
  const orgId = session.user.organizationId ?? "platform-lock-BSD-YBM";
  const trialBannerDaysLeft = null;
  const hasMeckanoAccess = await canAccessMeckano(session);
  const organization = session.user.organizationId
    ? await prisma.organization.findUnique({
        where: { id: session.user.organizationId },
        select: {
          industry: true,
          constructionTrade: true,
          industryConfigJson: true,
        },
      })
    : null;
  const industryProfile = getIndustryProfile(
    organization?.industry ?? session.user.organizationIndustry ?? "CONSTRUCTION",
    organization?.industryConfigJson,
    organization?.constructionTrade ?? session.user.organizationConstructionTrade,
  );

  return (
    <DashboardLayoutClient
      orgId={orgId}
      userRole={userRole}
      isAdminUser={isAdminUser}
      hasMeckanoAccess={hasMeckanoAccess}
      industryProfile={industryProfile}
      trialBannerDaysLeft={trialBannerDaysLeft}
      serverUser={{
        email: serverEmail,
        name: userName,
        image: session.user.image ?? null,
      }}
    >
      {children}
    </DashboardLayoutClient>
  );
}
