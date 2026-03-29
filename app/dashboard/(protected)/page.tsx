import BsdYbmDashboard from "@/app/components/BsdYbmDashboard";
import FinancialInsightsWidget from "@/components/FinancialInsightsWidget";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function DashboardHomePage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="space-y-8">
      <FinancialInsightsWidget organizationId={session?.user?.organizationId} />
      <BsdYbmDashboard />
    </div>
  );
}
