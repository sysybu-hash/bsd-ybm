import PresenceSettingsPanel from "@/components/settings/panels/PresenceSettingsPanel";
import SettingsPageHeader from "@/components/settings/SettingsPageHeader";
import { getSettingsHubNavItem } from "@/lib/settings-hub-nav";
import { loadSettingsHubPageData } from "@/lib/settings-hub-server";

export const dynamic = "force-dynamic";

export default async function SettingsPresencePage() {
  const data = await loadSettingsHubPageData();
  const meta = getSettingsHubNavItem("presence", false);

  return (
    <>
      {meta ? <SettingsPageHeader title={meta.label} description={meta.description} /> : null}
      <PresenceSettingsPanel organization={data.organization} viewer={data.viewer} />
    </>
  );
}
