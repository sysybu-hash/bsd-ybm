import Link from "next/link";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { CheckCircle, FileText, UploadCloud, AlertTriangle } from "lucide-react";

export type DocumentWorkspaceTableRow = {
  id: string;
  supplier: string;
  dateLabel: string;
  totalLabel: string;
  currency: string;
  /** true אם לפחות שורה במסמך ללא מחיר / חריגת מחיר */
  hasPriceAnomaly: boolean;
};

type DocumentsWorkspaceProps = {
  /** ספירת מסמכים שנוצרו בחודש הקלנדרי הנוכחי */
  documentsThisMonth: number;
  /** שורות DocumentLineItem עם priceAlertPending בארגון */
  anomaliesCount: number;
  /** 0–100, מבוסס על heuristics איכות (כמו health ב-ERP) */
  aiReliabilityPct: number;
  tableRows: DocumentWorkspaceTableRow[];
  /** ברירת מחדל: מעבר ללשונית סריקה + עוגן לסורק */
  uploadHref?: string;
};

const DEFAULT_UPLOAD = "/app/documents/erp?tab=scan#erp-multi-scanner";

/**
 * שכבת מסמכי ERP: כותרת, CTA, מדדים וטבלת מסמכים אחרונים
 */
export function DocumentsWorkspace({
  documentsThisMonth,
  anomaliesCount,
  aiReliabilityPct,
  tableRows,
  uploadHref = DEFAULT_UPLOAD,
}: DocumentsWorkspaceProps) {
  const aiPct = Math.min(100, Math.max(0, aiReliabilityPct));
  const aiPctLabel = Number.isFinite(aiPct) ? aiPct.toFixed(1) : "—";

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">מסמכים ורכש (ERP)</h1>
          <p className="mt-1 text-text-secondary">ניהול חשבוניות, חילוץ AI והשוואת מחירי ספקים</p>
        </div>
        <Link
          href={uploadHref}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-2.5 font-medium text-white shadow-card transition-colors hover:bg-brand-dark"
        >
          <UploadCloud size={20} />
          העלאת מסמך
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <DashboardCard className="border-l-4 border-l-brand" title="סך מסמכים החודש">
          <div className="text-3xl font-semibold text-text-primary">{documentsThisMonth}</div>
        </DashboardCard>

        <DashboardCard className="border-l-4 border-l-amber-500" title="חריגות מחיר (לטיפול)">
          <div className="flex items-center gap-3">
            <div className="text-3xl font-semibold text-text-primary">{anomaliesCount}</div>
            {anomaliesCount > 0 && <AlertTriangle className="text-amber-500" size={24} aria-hidden />}
          </div>
        </DashboardCard>

        <DashboardCard className="border-l-4 border-l-emerald-500" title="אמינות חילוץ AI (הערכה)">
          <div className="flex items-center gap-3">
            <div className="text-3xl font-semibold text-text-primary">{aiPctLabel}%</div>
            <CheckCircle className="text-emerald-500" size={24} aria-hidden />
          </div>
        </DashboardCard>
      </div>

      <DashboardCard title="מסמכים אחרונים" actionIcon={<FileText size={20} />}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-start">
            <thead>
              <tr className="border-b border-gray-100 text-sm text-text-secondary">
                <th className="w-[24%] pb-4 pe-4 font-medium">שם ספק</th>
                <th className="pb-4 font-medium">תאריך</th>
                <th className="pb-4 font-medium">סכום כולל</th>
                <th className="pb-4 font-medium">מטבע</th>
                <th className="pb-4 font-medium">סטטוס AI</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {tableRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-text-secondary">
                    אין מסמכים להצגה
                  </td>
                </tr>
              ) : (
                tableRows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-gray-50 transition-colors hover:bg-brand-background/50"
                  >
                    <td className="py-4 pe-4 font-medium text-text-primary">{row.supplier}</td>
                    <td className="py-4 text-text-secondary">{row.dateLabel}</td>
                    <td className="py-4 font-mono tabular-nums">{row.totalLabel}</td>
                    <td className="py-4 text-text-secondary">{row.currency}</td>
                    <td className="py-4">
                      {row.hasPriceAnomaly ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden />
                          חריגת מחיר בשורה
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
                          חולץ בהצלחה
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </DashboardCard>
    </div>
  );
}
