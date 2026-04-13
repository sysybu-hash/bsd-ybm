import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import SettingsHubClient from "@/app/dashboard/(protected)/settings/SettingsPageClient";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function SettingsAdvancedPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.organizationId) {
    redirect("/app");
  }

  const org = await prisma.organization.findUnique({
    where: { id: session.user.organizationId },
    select: {
      id: true,
      name: true,
      type: true,
      companyType: true,
      taxId: true,
      address: true,
      isReportable: true,
      calendarGoogleEnabled: true,
      tenantPublicDomain: true,
      tenantSiteBrandingJson: true,
      paypalMerchantEmail: true,
      paypalMeSlug: true,
      liveDataTier: true,
      industryConfigJson: true,
    },
  });

  if (!org) {
    redirect("/app");
  }

  return (
    <div className="min-h-screen bg-slate-50/30">
      <SettingsHubClient initialOrg={org} />
    </div>
  );
}
