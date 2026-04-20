import ProfessionSettingsPanel from "@/components/settings/panels/ProfessionSettingsPanel";
import SettingsPageHeader from "@/components/settings/SettingsPageHeader";
import { getSettingsHubNavItem } from "@/lib/settings-hub-nav";
import { loadSettingsHubPageData } from "@/lib/settings-hub-server";

export const dynamic = "force-dynamic";

export default async function SettingsProfessionPage() {
  const data = await loadSettingsHubPageData();
  const meta = getSettingsHubNavItem("profession", false);

  return (
    <>
      {meta ? <SettingsPageHeader title={meta.label} description={meta.description} /> : null}
      <ProfessionSettingsPanel organization={data.organization} viewer={data.viewer} />
    </>
  );
}
