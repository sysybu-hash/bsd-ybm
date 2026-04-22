import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import FinanceHubContent from "@/components/finance/FinanceHubContent";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readRequestMessages } from "@/lib/i18n/server-messages";
import { getIndustryProfile } from "@/lib/professions/runtime";
import { loadCommercialHubSnapshot } from "@/lib/workspace/load-commercial-hub";
import WorkspaceEngineeringShell from "@/components/workspace/WorkspaceEngineeringShell";

export const dynamic = "force-dynamic";

export default async function AppFinancePage() {
  const session = await getServerSession(authOptions);
  const organizationId = session?.user?.organizationId;

  if (!organizationId) {
    redirect("/login");
  }

  const [snapshot, organization] = await Promise.all([
    loadCommercialHubSnapshot(organizationId),
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: { industry: true, constructionTrade: true, industryConfigJson: true },
    }),
  ]);

  const messages = await readRequestMessages();
  const industryProfile = getIndustryProfile(
    organization?.industry ?? "CONSTRUCTION",
    organization?.industryConfigJson,
    organization?.constructionTrade,
    messages,
  );

  const userFirstName =
    (session.user?.name ?? "").trim().split(" ")[0] ||
    session.user?.email?.split("@")[0] ||
    "";

  return (
    <WorkspaceEngineeringShell>
      <FinanceHubContent
        snapshot={snapshot}
        organizationId={organizationId}
        industryProfile={industryProfile}
        userFirstName={userFirstName}
      />
    </WorkspaceEngineeringShell>
  );
}
