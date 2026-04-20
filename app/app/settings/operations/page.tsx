import OperationsWorkspaceV2 from "@/components/operations/OperationsWorkspaceV2";
import SettingsPageHeader from "@/components/settings/SettingsPageHeader";
import { getSettingsHubNavItem } from "@/lib/settings-hub-nav";
import { loadOperationsWorkspaceProps } from "@/lib/load-operations-workspace-props";

export const dynamic = "force-dynamic";

export default async function SettingsOperationsPage() {
  const props = await loadOperationsWorkspaceProps();
  const meta = getSettingsHubNavItem("operations", false);

  return (
    <>
      {meta ? <SettingsPageHeader title={meta.label} description={meta.description} /> : null}
      <OperationsWorkspaceV2 {...props} />
    </>
  );
}
