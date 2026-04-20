import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import FinanceHubContent from "@/components/finance/FinanceHubContent";
import { authOptions } from "@/lib/auth";
import { loadCommercialHubSnapshot } from "@/lib/workspace/load-commercial-hub";

export const dynamic = "force-dynamic";

export default async function AppFinancePage() {
  const session = await getServerSession(authOptions);
  const organizationId = session?.user?.organizationId;

  if (!organizationId) {
    redirect("/login");
  }

  const snapshot = await loadCommercialHubSnapshot(organizationId);

  return (
    <FinanceHubContent
      snapshot={snapshot}
    />
  );
}
