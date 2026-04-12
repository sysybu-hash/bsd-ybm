import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import MeckanoHub from "@/components/meckano/MeckanoHub";

export const dynamic = "force-dynamic";

export const metadata = { title: "מקאנו | BSD-YBM" };

export default async function MeckanoPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const orgId = session.user.organizationId;
  let hasMeckanoKey = false;

  if (orgId) {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { meckanoApiKey: true },
    });
    hasMeckanoKey = !!org?.meckanoApiKey;
  }

  return <MeckanoHub hasMeckanoKey={hasMeckanoKey} />;
}
