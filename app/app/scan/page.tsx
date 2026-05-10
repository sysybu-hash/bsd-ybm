import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import ScanWizardWorkspace from "@/components/documents/ScanWizardWorkspace";
import ScanWizardShell from "@/components/scan/wizard/ScanWizardShell";
import { authOptions } from "@/lib/auth";
import { isGeminiConfigured } from "@/lib/ai-providers";
import { prisma } from "@/lib/prisma";
import { readRequestMessages } from "@/lib/i18n/server-messages";
import { getIndustryProfile } from "@/lib/professions/runtime";
import AppPageChrome from "@/components/workspace/AppPageChrome";

export const dynamic = "force-dynamic";

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ScanPage({ searchParams }: Props) {
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

  const params = (await searchParams) ?? {};
  const isLegacy = params.legacy === "1";

  return (
    <AppPageChrome>
      {isLegacy ? (
        <ScanWizardWorkspace industryProfile={industryProfile} geminiConfigured={isGeminiConfigured()} />
      ) : (
        <ScanWizardShell industryProfile={industryProfile} geminiConfigured={isGeminiConfigured()} />
      )}
    </AppPageChrome>
  );
}
