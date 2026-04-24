import SubscriptionManagementWorkspace from "@/components/billing/SubscriptionManagementWorkspace";
import { SubscriptionPlansComparison } from "@/components/billing/SubscriptionPlansComparison";
import { BillingWorkspaceUI } from "@/components/billing/BillingWorkspaceUI";
import { mapSubscriptionTierToBillingPlan } from "@/lib/billing-workspace-plan";
import { loadSubscriptionManagementWorkspaceProps } from "@/lib/load-billing-workspace-props";
import { tierAllowance } from "@/lib/subscription-tier-config";

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

  return (
    <div className="w-full min-w-0 space-y-8" dir="rtl">
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
