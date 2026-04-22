import SubscriptionManagementWorkspace from "@/components/billing/SubscriptionManagementWorkspace";
import SettingsPageHeader from "@/components/settings/SettingsPageHeader";
import { getSettingsHubNavItem } from "@/lib/settings-hub-nav";
import { loadSubscriptionManagementWorkspaceProps } from "@/lib/load-billing-workspace-props";
import { BentoGrid, ProgressBar, Tile, TileHeader } from "@/components/ui/bento";

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
    <div className="w-full min-w-0 space-y-8" dir="rtl">
      {meta ? <SettingsPageHeader title={meta.label} description={meta.description} eyebrow="Billing Center" /> : null}
      <BentoGrid>
        <Tile tone="finance" span={8}>
          <TileHeader eyebrow="Subscription Overview" />
          <p className="mt-3 text-[14px] leading-7 text-[color:var(--axis-finance-ink)]">
            מרכז המנויים מנהל את מסלול הפלטפורמה, מכסות הסריקה, השליטה בארגונים ותשלומי BSD-YBM — בלי לבלבל עם PayPal של הלקוחות.
          </p>
          <div className="mt-4">
            <ProgressBar value={props.currentOrganization.subscriptionStatus === "ACTIVE" ? 100 : 40} axis="finance" />
          </div>
        </Tile>
        <Tile tone="neutral" span={4}>
          <TileHeader eyebrow="Current Org" />
          <div className="mt-3 grid gap-2">
            <div className="rounded-lg bg-[color:var(--canvas-sunken)] px-3 py-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[color:var(--ink-400)]">ארגון</p>
              <p className="mt-1 text-sm font-black text-[color:var(--ink-900)]">{props.currentOrganization.name}</p>
            </div>
            <div className="rounded-lg bg-[color:var(--canvas-sunken)] px-3 py-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[color:var(--ink-400)]">מסלול</p>
              <p className="mt-1 text-sm font-black text-[color:var(--ink-900)]">{props.currentOrganization.subscriptionTier}</p>
            </div>
          </div>
        </Tile>
      </BentoGrid>
      <SubscriptionManagementWorkspace {...props} />
    </div>
  );
}
