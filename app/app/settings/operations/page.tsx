import OperationsWorkspaceV2 from "@/components/operations/OperationsWorkspaceV2";
import SettingsPageHeader from "@/components/settings/SettingsPageHeader";
import { getSettingsHubNavItem } from "@/lib/settings-hub-nav";
import { loadOperationsWorkspaceProps } from "@/lib/load-operations-workspace-props";
import { BentoGrid, ProgressBar, Tile, TileHeader } from "@/components/ui/bento";

export const dynamic = "force-dynamic";

export default async function SettingsOperationsPage() {
  const props = await loadOperationsWorkspaceProps();
  const meta = getSettingsHubNavItem("operations", false);

  return (
    <div className="w-full min-w-0 space-y-8" dir="rtl">
      {meta ? <SettingsPageHeader title={meta.label} description={meta.description} eyebrow="Operations" /> : null}
      <BentoGrid>
        <Tile tone="clients" span={8}>
          <TileHeader eyebrow="Field & workflows" />
          <p className="mt-3 text-[14px] leading-7 text-[color:var(--axis-clients-ink)]">
            תפעול, צוות ושטח — עם אותה שפה ויזואלית כמו שאר מרחב העבודה.
          </p>
          <div className="mt-4">
            <ProgressBar value={props.organizationName ? 88 : 40} axis="clients" />
          </div>
        </Tile>
        <Tile tone="neutral" span={4}>
          <TileHeader eyebrow="Org" />
          <p className="mt-3 text-sm font-black text-[color:var(--ink-900)]">{props.organizationName ?? "—"}</p>
        </Tile>
      </BentoGrid>
      <OperationsWorkspaceV2 {...props} />
    </div>
  );
}
