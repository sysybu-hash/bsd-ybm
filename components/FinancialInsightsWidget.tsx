import { prisma } from "@/lib/prisma";

export default async function FinancialInsightsWidget({
  organizationId,
}: {
  organizationId: string | null | undefined;
}) {
  if (!organizationId) {
    return (
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-900 text-sm">
        <p className="font-bold text-amber-800 mb-2">תובנות BSD-YBM</p>
        <p>שייך משתמש לארגון כדי לקבל תובנות AI.</p>
      </div>
    );
  }

  const insight = await prisma.financialInsight.findUnique({
    where: { organizationId },
  });

  return (
    <div className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-6 text-slate-800 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">💰</span>
        <h2 className="text-lg font-bold text-emerald-800">תובנות BSD-YBM</h2>
      </div>
      {insight ? (
        <>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{insight.content}</p>
          <p className="text-xs text-slate-500 mt-4">
            עודכן: {new Date(insight.updatedAt).toLocaleString("he-IL")}
          </p>
        </>
      ) : (
        <p className="text-sm text-slate-600">
          התובנות ייווצרו אוטומטית (Cron יומי) לאחר שיהיו מספיק נתונים ב-ERP/CRM.
        </p>
      )}
    </div>
  );
}
