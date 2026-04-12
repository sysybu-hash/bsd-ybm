import { TrendingUp } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n/server";
import { isRtlLocale } from "@/lib/i18n/config";

export default async function FinancialInsightsWidget({
  organizationId,
}: {
  organizationId: string | null | undefined;
}) {
  const locale = await getServerLocale();
  const dir = isRtlLocale(locale) ? "rtl" : "ltr";

  if (!organizationId) {
    return (
      <div
        className="card-avenue border-indigo-500/30 bg-indigo-500/15 p-6 text-sm text-indigo-800"
        dir={dir}
      >
        <p className="mb-2 font-bold text-indigo-300">תובנות BSD-YBM</p>
        <p>שייך משתמש לארגון כדי לקבל תובנות AI.</p>
      </div>
    );
  }

  const insight = await prisma.financialInsight.findUnique({
    where: { organizationId },
  });

  return (
    <div
      className="card-avenue border-emerald-500/25/90 bg-gradient-to-b from-emerald-50/80 to-white p-6 text-gray-600 shadow-sm"
      dir={dir}
    >
      <div className="mb-3 flex items-center gap-2">
        <TrendingUp className="h-5 w-5 shrink-0 text-emerald-400" aria-hidden />
        <h2 className="text-lg font-bold text-emerald-800">תובנות BSD-YBM</h2>
      </div>
      {insight ? (
        <>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{insight.content}</p>
          <p className="mt-4 text-xs text-gray-500">
            עודכן: {new Date(insight.updatedAt).toLocaleString("he-IL")}
          </p>
        </>
      ) : (
        <p className="text-sm text-gray-500">
          התובנות ייווצרו אוטומטית (Cron יומי) לאחר שיהיו מספיק נתונים ב-ERP/CRM.
        </p>
      )}
    </div>
  );
}
