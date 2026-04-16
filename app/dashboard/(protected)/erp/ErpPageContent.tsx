import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getServerTranslator } from "@/lib/i18n/server";
import {
  buildMonthlyExpenseSeries,
  sumExpensesInCalendarMonth,
  formatExpenseTrendVsPrevious,
} from "@/lib/erp-stats";
import { getPriceSpikeAlerts } from "@/lib/erp-price-spikes";
import { getErpPriceComparisonForOrg } from "@/lib/erp-price-comparison-data";
import { tierAllowance } from "@/lib/subscription-tier-config";
import { formatCreditsForDisplay } from "@/lib/org-credits-display";
import ErpClient from "./ErpClient";

export const metadata = { title: "Automated ERP — BSD-YBM" };

export default async function ERPPage() {
  const { t, locale } = await getServerTranslator();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const orgId = session.user.organizationId;
  const userId = session.user.id;

  if (!orgId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
         <h1 className="text-2xl font-black text-slate-900 mb-2">לא נמצא ארגון משויך</h1>
         <p className="text-sm text-slate-500 max-w-sm">על מנת להשתמש במודול ה-ERP, עליך להיות משויך לארגון פעיל.</p>
      </div>
    );
  }

  /* ── ERP data ──────────────────────────────────── */
  const rawDocs = await prisma.document.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
  });

  const totalExpenses = rawDocs.reduce((s, d) => s + ((d.aiData as { total?: number })?.total ?? 0), 0);
  const now = new Date();
  const expenseThisMonth = sumExpensesInCalendarMonth(rawDocs, now.getFullYear(), now.getMonth());
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const expensePrevMonth = sumExpensesInCalendarMonth(rawDocs, prevMonth.getFullYear(), prevMonth.getMonth());
  const avgPerDoc = rawDocs.length > 0 ? Math.round(totalExpenses / rawDocs.length) : 0;

  const stats = [
    { label: t("erpPage.statMonthExpenses"), value: `₪${expenseThisMonth.toLocaleString()}`, trend: formatExpenseTrendVsPrevious(expenseThisMonth, expensePrevMonth, t), valueClass: "text-teal-600" },
    { label: t("erpPage.statDocsInView"), value: String(rawDocs.length), trend: t("erpPage.trendAllDocs"), valueClass: "text-slate-900" },
    { label: t("erpPage.statAvgInvoice"), value: rawDocs.length ? `₪${avgPerDoc.toLocaleString()}` : "—", trend: t("erpPage.statAvgTrend"), valueClass: "text-emerald-600" },
  ];

  const chartData = buildMonthlyExpenseSeries(rawDocs, 6, locale);
  const priceSpikes = await getPriceSpikeAlerts(orgId, 6);
  const priceComparison = await getErpPriceComparisonForOrg(orgId);

  const orgQuota = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { cheapScansRemaining: true, premiumScansRemaining: true, subscriptionTier: true },
  });

  const scanQuotaSummary = orgQuota ? (() => {
    const a = tierAllowance(orgQuota.subscriptionTier);
    return `זולות ${formatCreditsForDisplay(orgQuota.cheapScansRemaining)} / ${a.cheapScans} · פרימיום ${formatCreditsForDisplay(orgQuota.premiumScansRemaining)} / ${a.premiumScans}`;
  })() : null;

  const docs = rawDocs.map((d) => ({
    id: d.id, fileName: d.fileName, type: d.type, status: d.status,
    createdAt: d.createdAt.toISOString(), aiData: d.aiData
  }));

  return (
    <div className="mx-auto w-full max-w-[1500px] py-4">
      <ErpClient 
        stats={stats} 
        chartData={chartData} 
        flowSummary={null} 
        priceSpikes={priceSpikes} 
        docs={docs} 
        priceComparison={priceComparison as any}
        geminiConfigured={true}
        scanQuotaSummary={scanQuotaSummary}
      />
    </div>
  );
}
