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
import { isGeminiConfigured } from "@/lib/ai-providers";
import { formatCurrencyILS, formatShortDate } from "@/lib/ui-formatters";
import { DocumentsWorkspace } from "@/components/erp/DocumentsWorkspace";
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
  const [priceSpikes, priceComparison, pendingPriceAlertCount, pendingPriceAlertLinesRaw, docsWithLinePriceAlerts] =
    await Promise.all([
      getPriceSpikeAlerts(orgId, 6),
      getErpPriceComparisonForOrg(orgId),
      prisma.documentLineItem.count({
        where: { organizationId: orgId, priceAlertPending: true },
      }),
      prisma.documentLineItem.findMany({
        where: { organizationId: orgId, priceAlertPending: true },
        orderBy: { createdAt: "desc" },
        take: 250,
        select: {
          id: true,
          description: true,
          quantity: true,
          supplierName: true,
          document: { select: { fileName: true } },
        },
      }),
      prisma.documentLineItem.groupBy({
        by: ["documentId"],
        where: { organizationId: orgId, priceAlertPending: true },
      }),
    ]);

  const alertDocumentIdSet = new Set(docsWithLinePriceAlerts.map((r) => r.documentId));

  const pendingPriceAlertLines = pendingPriceAlertLinesRaw.map((row) => ({
    id: row.id,
    description: row.description,
    quantity: row.quantity,
    supplierName: row.supplierName,
    documentFileName: row.document.fileName,
  }));

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

  const erpHealth = rawDocs.length > 0 ? Math.min(100, 40 + Math.round((priceSpikes.length === 0 ? 30 : 10) + (avgPerDoc > 0 ? 30 : 0))) : 15;

  const yNow = now.getFullYear();
  const mNow = now.getMonth();
  const documentsThisMonth = rawDocs.filter(
    (d) => d.createdAt.getFullYear() === yNow && d.createdAt.getMonth() === mNow,
  ).length;

  const workspaceTableRows = rawDocs.slice(0, 20).map((d) => {
    const ai = d.aiData as { vendor?: string; total?: number; date?: string | null } | null;
    const supplier =
      (typeof ai?.vendor === "string" && ai.vendor.trim()) || d.fileName;
    const dateSource =
      typeof ai?.date === "string" && ai.date.trim() ? new Date(ai.date) : d.createdAt;
    const totalLabel =
      typeof ai?.total === "number" && Number.isFinite(ai.total)
        ? formatCurrencyILS(ai.total, 2)
        : "—";
    return {
      id: d.id,
      supplier,
      dateLabel: formatShortDate(dateSource),
      totalLabel,
      currency: "ILS",
      hasPriceAnomaly: alertDocumentIdSet.has(d.id),
    };
  });

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-6 py-4" dir="rtl">
      <DocumentsWorkspace
        documentsThisMonth={documentsThisMonth}
        anomaliesCount={pendingPriceAlertCount}
        aiReliabilityPct={erpHealth}
        tableRows={workspaceTableRows}
      />

      <ErpClient
        stats={stats}
        chartData={chartData}
        flowSummary={null}
        priceSpikes={priceSpikes}
        pendingPriceAlertCount={pendingPriceAlertCount}
        pendingPriceAlertLines={pendingPriceAlertLines}
        docs={docs}
        priceComparison={priceComparison}
        geminiConfigured={isGeminiConfigured()}
        scanQuotaSummary={scanQuotaSummary}
      />
    </div>
  );
}
