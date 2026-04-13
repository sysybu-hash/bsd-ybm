import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import SubscriptionManagementWorkspace from "@/components/billing/SubscriptionManagementWorkspace";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/is-admin";
import { prisma } from "@/lib/prisma";
import { getIndustryProfile } from "@/lib/professions/runtime";

export const dynamic = "force-dynamic";

export default async function AppBillingPage() {
  const session = await getServerSession(authOptions);
  const organizationId = session?.user?.organizationId;

  if (!organizationId) {
    redirect("/login");
  }

  const [organization, openIssuedCount, paidIssuedTotal, adminOrganizations] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        cheapScansRemaining: true,
        premiumScansRemaining: true,
        maxCompanies: true,
        trialEndsAt: true,
        industry: true,
        industryConfigJson: true,
        tenantPublicDomain: true,
      },
    }),
    prisma.issuedDocument.count({
      where: { organizationId, status: "PENDING" },
    }),
    prisma.issuedDocument.aggregate({
      where: { organizationId, status: "PAID" },
      _sum: { total: true },
    }),
    isAdmin(session?.user?.email)
      ? prisma.organization.findMany({
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            subscriptionTier: true,
            subscriptionStatus: true,
            cheapScansRemaining: true,
            premiumScansRemaining: true,
            maxCompanies: true,
            tenantPublicDomain: true,
            users: {
              take: 1,
              orderBy: { createdAt: "asc" },
              select: { email: true },
            },
          },
        })
      : Promise.resolve([]),
  ]);

  if (!organization) {
    redirect("/login");
  }

  const industryProfile = getIndustryProfile(organization.industry, organization.industryConfigJson);

  return (
    <SubscriptionManagementWorkspace
      currentOrganization={{
        ...organization,
        trialEndsAt: organization.trialEndsAt?.toISOString() ?? null,
      }}
      industryProfile={industryProfile}
      openIssuedCount={openIssuedCount}
      paidIssuedTotal={paidIssuedTotal._sum.total ?? 0}
      adminOrganizations={adminOrganizations.map((organizationRow) => ({
        id: organizationRow.id,
        name: organizationRow.name,
        subscriptionTier: organizationRow.subscriptionTier,
        subscriptionStatus: organizationRow.subscriptionStatus,
        cheapScansRemaining: organizationRow.cheapScansRemaining,
        premiumScansRemaining: organizationRow.premiumScansRemaining,
        maxCompanies: organizationRow.maxCompanies,
        tenantPublicDomain: organizationRow.tenantPublicDomain,
        primaryEmail: organizationRow.users[0]?.email ?? null,
      }))}
    />
  );
}
