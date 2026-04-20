import AutomationsPageContent from "@/components/automations/AutomationsPageContent";
import SettingsPageHeader from "@/components/settings/SettingsPageHeader";
import { getSettingsHubNavItem } from "@/lib/settings-hub-nav";

export const dynamic = "force-dynamic";

export default function SettingsAutomationsPage() {
  const meta = getSettingsHubNavItem("automations", false);

  return (
    <>
      {meta ? <SettingsPageHeader title={meta.label} description={meta.description} /> : null}
      <AutomationsPageContent />
    </>
  );
}
