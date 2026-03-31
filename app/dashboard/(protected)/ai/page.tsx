import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import DashboardAiHub from "@/components/DashboardAiHub";

export default async function DashboardAiPage() {
  const session = await getServerSession(authOptions);
  const orgId = session?.user?.organizationId;
  if (!session?.user?.id || !orgId) {
    redirect("/login");
  }

  return <DashboardAiHub orgId={orgId} />;
}
