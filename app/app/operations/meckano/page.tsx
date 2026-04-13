import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import MeckanoHub from "@/components/meckano/MeckanoHub";
import { authOptions } from "@/lib/auth";
import { canAccessMeckano } from "@/lib/meckano-access";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata = { title: "מקאנו | BSD-YBM" };

export default async function OperationsMeckanoPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  if (!(await canAccessMeckano(session))) redirect("/app/operations");

  const orgId = session.user.organizationId;
  let hasMeckanoKey = false;

  if (orgId) {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { meckanoApiKey: true },
    });
    hasMeckanoKey = Boolean(org?.meckanoApiKey);
  }

  return <MeckanoHub hasMeckanoKey={hasMeckanoKey} />;
}
