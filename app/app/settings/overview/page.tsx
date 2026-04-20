import OverviewSettingsPanel from "@/components/settings/panels/OverviewSettingsPanel";
import { loadSettingsHubPageData } from "@/lib/settings-hub-server";

export const dynamic = "force-dynamic";

export default async function SettingsOverviewPage() {
  const data = await loadSettingsHubPageData();

  return (
    <OverviewSettingsPanel
      organization={data.organization}
      usersTotal={data.usersTotal}
      activeUsers={data.activeUsers}
      viewer={data.viewer}
    />
  );
}
