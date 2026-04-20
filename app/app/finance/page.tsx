import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import FinanceHubContent from "@/components/finance/FinanceHubContent";
import { authOptions } from "@/lib/auth";
import { loadFinanceForecast } from "@/lib/finance-forecast";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AppFinancePage() {
  const session = await getServerSession(authOptions);
  const organizationId = session?.user?.organizationId;

  if (!organizationId) {
    redirect("/login");
  }

  const [pendingAgg, paidAgg, forecast] = await Promise.all([
    prisma.issuedDocument.aggregate({
      where: { organizationId, status: "PENDING" },
      _sum: { total: true },
      _count: true,
    }),
    prisma.issuedDocument.aggregate({
      where: { organizationId, status: "PAID" },
      _sum: { total: true },
    }),
    loadFinanceForecast(organizationId),
  ]);

  return (
    <FinanceHubContent
      pendingIssuedCount={pendingAgg._count}
      pendingIssuedTotal={pendingAgg._sum.total ?? 0}
      paidIssuedTotal={paidAgg._sum.total ?? 0}
      forecast={forecast}
    />
  );
}
