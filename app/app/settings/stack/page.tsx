import StackSettingsPanel from "@/components/settings/panels/StackSettingsPanel";
import SettingsPageHeader from "@/components/settings/SettingsPageHeader";
import { getSettingsHubNavItem } from "@/lib/settings-hub-nav";
import { loadSettingsHubPageData } from "@/lib/settings-hub-server";

export const dynamic = "force-dynamic";

export default async function SettingsStackPage() {
  const data = await loadSettingsHubPageData();
  const meta = getSettingsHubNavItem("stack", false);

  return (
    <>
      {meta ? <SettingsPageHeader title={meta.label} description={meta.description} /> : null}
      <StackSettingsPanel
        organization={data.organization}
        integrations={data.integrations}
        meckanoEnabled={data.meckanoEnabled}
        viewer={data.viewer}
      />
    </>
  );
}
