import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import FinancialCharts from "@/components/FinancialCharts";
import MultiEngineScanner from "@/components/MultiEngineScanner";
import SupplierPriceBoard from "@/components/SupplierPriceBoard";
import ErpScrollToHash from "@/components/ErpScrollToHash";
import ERPDashboard, { type ErpStatCard } from "@/components/ERPDashboard";
import ErpDocumentsManager from "@/components/ErpDocumentsManager";
import {
  buildMonthlyExpenseSeries,
  sumExpensesInCalendarMonth,
  formatExpenseTrendVsPrevious,
} from "@/lib/erp-stats";
import type { Document } from "@prisma/client";

type SearchParams = { q?: string };

export default async function ErpPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
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
      label: "הוצאות החודש הנוכחי",
      value: `₪${expenseThisMonth.toLocaleString()}`,
      trend: formatExpenseTrendVsPrevious(expenseThisMonth, expensePrevMonth),
      valueClass: "text-blue-600",
    },
    {
      label: "מסמכים בתצוגה",
      value: String(docs.length),
      trend: q ? `חיפוש: "${q}"` : "כל המסמכים בארגון (ללא סינון חיפוש)",
      valueClass: "text-slate-900",
    },
    {
      label: "ממוצע לחשבונית",
      value: docs.length ? `₪${avgPerDoc.toLocaleString()}` : "—",
      trend: "מחושב מסה״כ הוצאות בתצוגה",
      valueClass: "text-emerald-600",
    },
  ];

  const chartData = buildMonthlyExpenseSeries(docs, 6);

  const geminiConfigured = !!(
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
    process.env.GEMINI_API_KEY?.trim()
  );

  const orgQuota = orgId
    ? await prisma.organization.findUnique({
        where: { id: orgId },
        select: { creditsRemaining: true, monthlyAllowance: true },
      })
    : null;

  return (
    <div
      className="animate-in fade-in duration-500 rounded-[2rem] bg-[#f8fafc] text-slate-900 border border-slate-200/90 shadow-inner p-6 md:p-8 space-y-10"
      dir="rtl"
    >
      <ErpScrollToHash />
      {!geminiConfigured && (
        <div
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
          role="alert"
        >
          <strong>סריקת AI לא פעילה:</strong> חסר מפתח Gemini בשרת. הגדר{" "}
          <code className="bg-red-100 px-1 rounded">GOOGLE_GENERATIVE_AI_API_KEY</code> בקובץ
          .env.local וב-Vercel (Environment Variables), ואז הפעל מחדש את השרת.
        </div>
      )}

      <ERPDashboard
        stats={stats}
        chartData={chartData}
        creditsRemaining={orgQuota?.creditsRemaining ?? null}
        creditsAllowance={orgQuota?.monthlyAllowance ?? null}
      />

      {q && (
        <p className="text-sm text-slate-500 -mt-4">
          תוצאות חיפוש עבור: &quot;{q}&quot; ({docs.length}) · סה״כ הוצאות בתצוגה: ₪
          {totalExpenses.toLocaleString()}
        </p>
      )}

      <MultiEngineScanner variant="light" />

      {orgId ? <SupplierPriceBoard /> : null}

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
