import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import OrganizationSettingsPanel from "@/components/settings/panels/OrganizationSettingsPanel";
import SettingsPageHeader from "@/components/settings/SettingsPageHeader";
import { authOptions } from "@/lib/auth";
import { getSettingsHubNavItem } from "@/lib/settings-hub-nav";
import { loadSettingsHubPageData } from "@/lib/settings-hub-server";

export const dynamic = "force-dynamic";

export default async function SettingsOrganizationPage() {
  const session = await getServerSession(authOptions);
  const orgId = session?.user?.organizationId;
  if (!orgId) redirect("/login");

  const data = await loadSettingsHubPageData();

  const meta = getSettingsHubNavItem("organization", false);

  return (
    <>
      {meta ? <SettingsPageHeader title={meta.label} description={meta.description} /> : null}
      <OrganizationSettingsPanel organization={data.organization} viewer={data.viewer} />
    </>
  );
}
