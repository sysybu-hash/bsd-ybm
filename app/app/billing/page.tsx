import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import SubscriptionManagementWorkspace from "@/components/billing/SubscriptionManagementWorkspace";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/is-admin";
import { prisma } from "@/lib/prisma";
import { readRequestMessages } from "@/lib/i18n/server-messages";
import { getIndustryProfile } from "@/lib/professions/runtime";
import {
  canAccessPlatformBillingControl,
  canManageOrganization,
  getWorkspaceRoleLabel,
  type WorkspaceAccessContext,
} from "@/lib/workspace-access";

export const dynamic = "force-dynamic";

type BillingSearchParams = Promise<{ tab?: string; orgId?: string }>;

export default async function AppBillingPage({
  searchParams,
}: {
  searchParams: BillingSearchParams;
}) {
  const session = await getServerSession(authOptions);
  const organizationId = session?.user?.organizationId;

  if (!organizationId) {
    redirect("/login");
  }

  const organization = await prisma.organization.findUnique({
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
      constructionTrade: true,
      industryConfigJson: true,
      tenantPublicDomain: true,
    },
  });

  if (!organization) {
    redirect("/login");
  }

  const platformAdmin = isAdmin(session?.user?.email);
  const accessContext: WorkspaceAccessContext = {
    role: session?.user?.role ?? "",
    isPlatformAdmin: platformAdmin,
    subscriptionTier: organization.subscriptionTier,
    subscriptionStatus: organization.subscriptionStatus,
    hasOrganization: true,
  };

  const [openIssuedCount, paidIssuedTotal, adminOrganizations, params] = await Promise.all([
    prisma.issuedDocument.count({
      where: { organizationId, status: "PENDING" },
    }),
    prisma.issuedDocument.aggregate({
      where: { organizationId, status: "PAID" },
      _sum: { total: true },
    }),
    platformAdmin
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
    searchParams,
  ]);

  const messages = await readRequestMessages();
  const industryProfile = getIndustryProfile(
    organization.industry,
    organization.industryConfigJson,
    organization.constructionTrade,
    messages,
  );
  const initialSection =
    canAccessPlatformBillingControl(accessContext) && params.tab?.trim().toLowerCase() === "control"
      ? "control"
      : "overview";

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
      viewer={{
        role: session?.user?.role ?? "",
        roleLabel: getWorkspaceRoleLabel(accessContext),
        canManageCurrentOrganization: canManageOrganization(accessContext),
        canAccessPlatformControls: canAccessPlatformBillingControl(accessContext),
      }}
      initialSection={initialSection}
      focusedOrganizationId={params.orgId?.trim() || null}
    />
  );
}
