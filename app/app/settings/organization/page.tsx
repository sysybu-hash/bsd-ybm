import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import OrganizationSettingsPanel from "@/components/settings/panels/OrganizationSettingsPanel";
import { OrganizationSettingsUI } from "@/components/settings/OrganizationSettingsUI";
import SettingsPageHeader from "@/components/settings/SettingsPageHeader";
import { authOptions } from "@/lib/auth";
import { getSettingsHubNavItem } from "@/lib/settings-hub-nav";
import { loadSettingsHubPageData } from "@/lib/settings-hub-server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SettingsOrganizationPage() {
  const session = await getServerSession(authOptions);
  const orgId = session?.user?.organizationId;
  if (!orgId) redirect("/login");

  const [data, teamUsers] = await Promise.all([
    loadSettingsHubPageData(),
    prisma.user.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, email: true, role: true },
    }),
  ]);

  const meta = getSettingsHubNavItem("organization", false);
  const o = data.organization;
  const meckanoKeyExists = Boolean(o.meckanoApiKey && String(o.meckanoApiKey).trim().length > 0);

  return (
    <>
      {meta ? <SettingsPageHeader title={meta.label} description={meta.description} /> : null}
      <OrganizationSettingsUI
        orgName={o.name}
        taxId={o.taxId ?? ""}
        constructionTrade={o.constructionTrade}
        canUpdateTrade={data.viewer.canManageOrganization}
        meckanoKeyExists={meckanoKeyExists}
        readOnly
        teamMembers={teamUsers.map((u) => ({
          id: u.id,
          name: u.name?.trim() || u.email,
          email: u.email,
          role: u.role,
        }))}
      />
      <OrganizationSettingsPanel organization={data.organization} viewer={data.viewer} />
    </>
  );
}
