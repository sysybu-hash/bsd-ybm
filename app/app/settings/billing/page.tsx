import SubscriptionManagementWorkspace from "@/components/billing/SubscriptionManagementWorkspace";
import { SubscriptionPlansComparison } from "@/components/billing/SubscriptionPlansComparison";
import { BillingWorkspaceUI } from "@/components/billing/BillingWorkspaceUI";
import BillingCreditsSnapshot from "@/components/billing/BillingCreditsSnapshot";
import { mapSubscriptionTierToBillingPlan } from "@/lib/billing-workspace-plan";
import { loadSubscriptionManagementWorkspaceProps } from "@/lib/load-billing-workspace-props";
import { tierAllowance } from "@/lib/subscription-tier-config";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type BillingSearchParams = Promise<{ tab?: string; orgId?: string }>;

export default async function SettingsBillingPage({
  searchParams,
}: {
  searchParams: BillingSearchParams;
}) {
  const props = await loadSubscriptionManagementWorkspaceProps(searchParams);
  const org = props.currentOrganization;
  const allow = tierAllowance(org.subscriptionTier);
  const scanQuotaTotal = Math.max(1, allow.cheapScans + allow.premiumScans);
  const scanQuotaUsed = Math.max(
    0,
    allow.cheapScans - org.cheapScansRemaining + (allow.premiumScans - org.premiumScansRemaining),
  );

  const billingPlan = mapSubscriptionTierToBillingPlan(org.subscriptionTier);

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const creditActivity = await prisma.activityLog.findMany({
    where: { organizationId: org.id, createdAt: { gte: thirtyDaysAgo } },
    orderBy: { createdAt: "desc" },
    take: 40,
    select: { action: true, details: true, createdAt: true },
  });

  return (
    <div className="w-full min-w-0 space-y-8" dir="rtl">
      <BillingCreditsSnapshot
        cheap={org.cheapScansRemaining}
        premium={org.premiumScansRemaining}
        tier={org.subscriptionTier}
        recent={creditActivity}
      />
      <BillingWorkspaceUI
        organizationName={org.name}
        subscriptionPlan={billingPlan}
        scanQuotaTotal={scanQuotaTotal}
        scanQuotaUsed={scanQuotaUsed}
        nextBillingDate={org.trialEndsAt}
      />
      <SubscriptionPlansComparison currentPlan={billingPlan} />
      <SubscriptionManagementWorkspace {...props} />
    </div>
  );
}
