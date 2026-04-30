import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import ScanWizardWorkspace from "@/components/documents/ScanWizardWorkspace";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readRequestMessages } from "@/lib/i18n/server-messages";
import { getIndustryProfile } from "@/lib/professions/runtime";
import AppPageChrome from "@/components/workspace/AppPageChrome";

export const dynamic = "force-dynamic";

export default async function ScanPage() {
  const session = await getServerSession(authOptions);
  const organizationId = session?.user?.organizationId;

  if (!organizationId) {
    redirect("/login");
  }

  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      industry: true,
      constructionTrade: true,
      industryConfigJson: true,
    },
  });

  const messages = await readRequestMessages();
  const industryProfile = getIndustryProfile(
    organization?.industry ?? "CONSTRUCTION",
    organization?.industryConfigJson,
    organization?.constructionTrade,
    messages,
  );

  return (
    <AppPageChrome>
      <ScanWizardWorkspace industryProfile={industryProfile} />
    </AppPageChrome>
  );
}
