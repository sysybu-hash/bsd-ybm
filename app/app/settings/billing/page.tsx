import SubscriptionManagementWorkspace from "@/components/billing/SubscriptionManagementWorkspace";
import SettingsPageHeader from "@/components/settings/SettingsPageHeader";
import { getSettingsHubNavItem } from "@/lib/settings-hub-nav";
import { loadSubscriptionManagementWorkspaceProps } from "@/lib/load-billing-workspace-props";

export const dynamic = "force-dynamic";

type BillingSearchParams = Promise<{ tab?: string; orgId?: string }>;

export default async function SettingsBillingPage({
  searchParams,
}: {
  searchParams: BillingSearchParams;
}) {
  const props = await loadSubscriptionManagementWorkspaceProps(searchParams);
  const meta = getSettingsHubNavItem("billing", false);

  return (
    <>
      {meta ? <SettingsPageHeader title={meta.label} description={meta.description} /> : null}
      <SubscriptionManagementWorkspace {...props} />
    </>
  );
}
