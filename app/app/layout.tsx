import type { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import AppShellV2 from "@/components/app-shell/AppShellV2";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/is-admin";
import { canAccessMeckano } from "@/lib/meckano-access";
import { prisma } from "@/lib/prisma";
import { getIndustryProfile } from "@/lib/professions/runtime";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function AppWorkspaceLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const organizationId = session.user.organizationId ?? null;
  const [organization, hasMeckanoAccess] = await Promise.all([
    organizationId
      ? prisma.organization.findUnique({
          where: { id: organizationId },
          select: {
            industry: true,
            constructionTrade: true,
            industryConfigJson: true,
            subscriptionTier: true,
            subscriptionStatus: true,
          },
        })
      : Promise.resolve(null),
    canAccessMeckano(session),
  ]);
  const industryProfile = getIndustryProfile(
    organization?.industry ?? session.user.organizationIndustry ?? "CONSTRUCTION",
    organization?.industryConfigJson,
    organization?.constructionTrade ?? session.user.organizationConstructionTrade,
  );

  return (
    <AppShellV2
      user={{
        name: session.user.name?.trim() || session.user.email.split("@")[0],
        email: session.user.email,
        organizationId,
        role: session.user.role ?? "",
        isPlatformAdmin: isAdmin(session.user.email),
        subscriptionTier: organization?.subscriptionTier ?? "FREE",
        subscriptionStatus: organization?.subscriptionStatus ?? "INACTIVE",
        hasMeckanoAccess,
        industryProfile,
      }}
    >
      {children}
    </AppShellV2>
  );
}
