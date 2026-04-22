import AdminPlatformDashboard from "@/components/admin/AdminPlatformDashboard";
import SettingsPageHeader from "@/components/settings/SettingsPageHeader";
import { getSettingsHubNavItem } from "@/lib/settings-hub-nav";
import { BentoGrid, ProgressBar, Tile, TileHeader } from "@/components/ui/bento";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ section?: string }>;

export default function SettingsPlatformPage({ searchParams }: { searchParams: SearchParams }) {
  const meta = getSettingsHubNavItem("platform", true);

  return (
    <div className="w-full min-w-0 space-y-8" dir="rtl">
      {meta ? <SettingsPageHeader title={meta.label} description={meta.description} eyebrow="Platform" /> : null}
      <BentoGrid>
        <Tile tone="ai" span={8}>
          <TileHeader eyebrow="Control plane" />
          <p className="mt-3 text-[14px] leading-7 text-[color:var(--axis-ai-ink)]">
            מרכז השליטה בפלטפורמה — בריאות, מנויים ושידורים. הרכיבים המלאים נטענים מתחת לכרטיסים.
          </p>
          <div className="mt-4">
            <ProgressBar value={100} axis="ai" />
          </div>
        </Tile>
        <Tile tone="neutral" span={4}>
          <TileHeader eyebrow="Access" />
          <p className="mt-3 text-sm font-semibold text-[color:var(--ink-700)]">מנהלי פלטפורמה בלבד</p>
        </Tile>
      </BentoGrid>
      <AdminPlatformDashboard searchParams={searchParams} platformBasePath="/app/settings/platform" />
    </div>
  );
}
