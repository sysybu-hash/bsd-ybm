import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardAiHub from "@/components/DashboardAiHub";
import { readRequestMessages } from "@/lib/i18n/server-messages";
import { getIndustryProfile } from "@/lib/professions/runtime";

export const metadata = { title: "AI Hub Advanced - BSD-YBM" };

export default async function LegacyDashboardAiPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { organizationId: true },
  });
  const orgId = dbUser?.organizationId ?? session.user.organizationId ?? "default";

  const organization = orgId
    ? await prisma.organization.findUnique({
        where: { id: orgId },
        select: { industry: true, constructionTrade: true, industryConfigJson: true },
      })
    : null;

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
    <div className="w-full min-w-0">
      <DashboardAiHub orgId={orgId} industryProfile={industryProfile} userFirstName={userFirstName} />
    </div>
  );
}
