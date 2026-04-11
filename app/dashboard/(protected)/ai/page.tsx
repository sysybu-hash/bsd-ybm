import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardAiHub from "@/components/DashboardAiHub";

export const metadata = { title: "AI Hub — BSD-YBM" };

export default async function DashboardAiPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { organizationId: true },
  });
  const orgId = dbUser?.organizationId ?? session.user.organizationId ?? "default";

  return (
    <div className="mx-auto w-full max-w-[1500px]">
      <DashboardAiHub orgId={orgId} />
    </div>
  );
}
