import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SettingsHubClient from "./SettingsPageClient";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.organizationId) {
    redirect("/dashboard");
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
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-slate-50/30">
      <SettingsHubClient initialOrg={org} />
    </div>
  );
}
