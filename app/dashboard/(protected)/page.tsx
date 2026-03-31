import BsdYbmDashboard from "@/app/components/BsdYbmDashboard";
import FinancialInsightsWidget from "@/components/FinancialInsightsWidget";
import { getOrgDashboardHomeData } from "@/lib/dashboard-home-data";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function DashboardHomePage() {
  const session = await getServerSession(authOptions);
  const homeData = await getOrgDashboardHomeData(session?.user?.organizationId);

  return (
    <div className="space-y-8">
      <FinancialInsightsWidget organizationId={session?.user?.organizationId} />
      <BsdYbmDashboard homeData={homeData} />
    </div>
  );
}
