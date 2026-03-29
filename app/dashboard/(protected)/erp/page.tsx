import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import FinancialCharts from "@/components/FinancialCharts";
import MultiEngineScanner from "@/components/MultiEngineScanner";
import SupplierPriceBoard from "@/components/SupplierPriceBoard";
import ErpScrollToHash from "@/components/ErpScrollToHash";
import ErpHistoricalImportCallout from "@/components/ErpHistoricalImportCallout";
import ERPDashboard, { type ErpStatCard } from "@/components/ERPDashboard";
import ErpDocumentsManager from "@/components/ErpDocumentsManager";
import PriceComparisonChart from "@/components/PriceComparisonChart";
import { getErpPriceComparisonForOrg } from "@/lib/erp-price-comparison-data";
import {
  buildMonthlyExpenseSeries,
  sumExpensesInCalendarMonth,
  formatExpenseTrendVsPrevious,
} from "@/lib/erp-stats";
import { getPriceSpikeAlerts } from "@/lib/erp-price-spikes";
import { getServerTranslator } from "@/lib/i18n/server";
import { isRtlLocale } from "@/lib/i18n/config";
import { intlLocaleForApp } from "@/lib/i18n/intl-locale";
import { DocStatus } from "@prisma/client";
import type { Document } from "@prisma/client";
import { tierAllowance } from "@/lib/subscription-tier-config";
import { formatCreditsForDisplay } from "@/lib/org-credits-display";

type SearchParams = { q?: string };

export default async function ErpPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { t, locale } = await getServerTranslator();
  const intlTag = intlLocaleForApp(locale);
  const pageDir = isRtlLocale(locale) ? "rtl" : "ltr";

  const session = await getServerSession(authOptions);
  const orgId = session?.user?.organizationId || "";
  const sp = await searchParams;
  const q = sp.q?.trim();

  let docs: Document[];

  if (!orgId) {
    docs = [];
  } else if (q) {
    const pattern = `%${q}%`;
    docs = await prisma.$queryRaw<Document[]>`
      SELECT * FROM "Document"
      WHERE "organizationId" = ${orgId}
      AND (
        "fileName" ILIKE ${pattern}
        OR "type" ILIKE ${pattern}
        OR COALESCE("aiData"::text, '') ILIKE ${pattern}
      )
      ORDER BY "createdAt" DESC
    `;
  } else {
    docs = await prisma.document.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
    });
  }

  const totalExpenses = docs.reduce(
    (sum: number, doc: Document & { aiData?: unknown }) =>
      sum + ((doc.aiData as { total?: number })?.total || 0),
    0,
  );

  const now = new Date();
  const expenseThisMonth = sumExpensesInCalendarMonth(docs, now.getFullYear(), now.getMonth());
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const expensePrevMonth = sumExpensesInCalendarMonth(
    docs,
    prevMonth.getFullYear(),
    prevMonth.getMonth(),
  );
  const avgPerDoc = docs.length > 0 ? Math.round(totalExpenses / docs.length) : 0;

  const stats: ErpStatCard[] = [
    {
      label: t("erpPage.statMonthExpenses"),
      value: `₪${expenseThisMonth.toLocaleString(intlTag)}`,
      trend: formatExpenseTrendVsPrevious(expenseThisMonth, expensePrevMonth, t),
      valueClass: "text-blue-600",
    },
    {
      label: t("erpPage.statDocsInView"),
      value: String(docs.length),
      trend: q ? t("erpPage.trendSearch", { q }) : t("erpPage.trendAllDocs"),
      valueClass: "text-slate-900",
    },
    {
      label: t("erpPage.statAvgInvoice"),
      value: docs.length ? `₪${avgPerDoc.toLocaleString(intlTag)}` : "—",
      trend: t("erpPage.statAvgTrend"),
      valueClass: "text-emerald-600",
    },
  ];

  const chartData = buildMonthlyExpenseSeries(docs, 6, locale);

  let flowSummary: {
    totalItems: number;
    totalIssued: number;
    totalExpenses: number;
  } | null = null;
  let priceSpikes: Awaited<ReturnType<typeof getPriceSpikeAlerts>> = [];

  if (orgId) {
    const [distinctLineKeys, issuedIncomeSum, spikes] = await Promise.all([
      prisma.documentLineItem.findMany({
        where: { organizationId: orgId },
        distinct: ["normalizedKey"],
        select: { normalizedKey: true },
      }),
      prisma.issuedDocument.aggregate({
        where: {
          organizationId: orgId,
          status: { not: DocStatus.CANCELLED },
        },
        _sum: { total: true },
      }),
      getPriceSpikeAlerts(orgId, 8),
    ]);
    priceSpikes = spikes;
    flowSummary = {
      totalItems: distinctLineKeys.length,
      totalIssued: issuedIncomeSum._sum.total ?? 0,
      totalExpenses,
    };
  }

  const geminiConfigured = !!(
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
    process.env.GEMINI_API_KEY?.trim()
  );

  const orgQuota = orgId
    ? await prisma.organization.findUnique({
        where: { id: orgId },
        select: {
          cheapScansLeft: true,
          premiumScansLeft: true,
          subscriptionTier: true,
        },
      })
    : null;

  const scanQuotaSummary =
    orgQuota != null
      ? (() => {
          const a = tierAllowance(orgQuota.subscriptionTier);
          return `זולות ${formatCreditsForDisplay(orgQuota.cheapScansLeft)} / ${a.cheapScans} · פרימיום ${formatCreditsForDisplay(orgQuota.premiumScansLeft)} / ${a.premiumScans}`;
        })()
      : null;

  const priceComparison = orgId ? await getErpPriceComparisonForOrg(orgId) : null;

  return (
    <div
      className="animate-in fade-in duration-500 rounded-[2rem] bg-[#f8fafc] text-slate-900 border border-slate-200/90 shadow-inner p-6 md:p-8 space-y-10"
      dir={pageDir}
    >
      <ErpScrollToHash />
      {!geminiConfigured && (
        <div
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
          role="alert"
        >
          <strong>{t("erpPage.geminiTitle")}</strong> {t("erpPage.geminiBody")}{" "}
          <code className="bg-red-100 px-1 rounded">GOOGLE_GENERATIVE_AI_API_KEY</code>{" "}
          {t("erpPage.geminiCode")}
        </div>
      )}

      <ERPDashboard
        stats={stats}
        chartData={chartData}
        scanQuotaSummary={scanQuotaSummary}
        flowSummary={flowSummary}
        priceSpikes={priceSpikes}
      />

      {q && (
        <p className="text-sm text-slate-500 -mt-4">
          {t("erpPage.searchHint", {
            q,
            count: String(docs.length),
            total: totalExpenses.toLocaleString(intlTag),
          })}
        </p>
      )}

      {orgId ? <ErpHistoricalImportCallout /> : null}

      <MultiEngineScanner variant="light" />

      {orgId ? <SupplierPriceBoard /> : null}

      {priceComparison ? (
        <PriceComparisonChart data={priceComparison.data} productName={priceComparison.productName} />
      ) : null}

      <FinancialCharts data={docs as unknown as any[]} variant="light" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ErpDocumentsManager
          initialDocs={(q ? docs : docs).map((d) => ({
            id: d.id,
            fileName: d.fileName,
            type: d.type,
            status: d.status,
            createdAt: d.createdAt.toISOString(),
            aiData: d.aiData,
          }))}
        />
      </div>

    </div>
  );
}
