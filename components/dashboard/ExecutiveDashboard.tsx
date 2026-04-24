import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { Activity, CreditCard, Users } from "lucide-react";
import { normalizeConstructionTrade, type ConstructionTradeId } from "@/lib/construction-trades";

export type ExecutiveDashboardProps = {
  /** מסמכים שעובדו (מול מכסה) */
  scanUsed: number;
  /** מגבלת סריקות בטווח cheap+premium */
  scanLimit: number;
  /** סכום חשבוניות החודש (תצוגה) */
  cashDisplay: string;
  /** שינוי % לעומת חודש קודם (חיובי = גדל) */
  cashChangePct: number;
  /** מספר אנשי קשר ACTIVE — פרוקסי ל״בשטח״ כשמקאנו מחובר */
  meckanoFieldActive: number;
  hasMeckano: boolean;
  /** מקצוע בנייה — לכרטיסי מבט־על ייעודיים */
  constructionTrade?: string | null;
};

/**
 * מרכז בקרה — כרטיסיות עליונות + אזורי placeholder לגרפים/CRM
 */
export function ExecutiveDashboard({
  scanUsed,
  scanLimit,
  cashDisplay,
  cashChangePct,
  meckanoFieldActive,
  hasMeckano,
  constructionTrade,
}: ExecutiveDashboardProps) {
  const trade = normalizeConstructionTrade(constructionTrade) as ConstructionTradeId;
  const scanPct = Math.min(100, Math.max(0, Math.round((scanUsed / Math.max(1, scanLimit)) * 100)));

  const trendClass =
    cashChangePct > 0
      ? "text-green-600"
      : cashChangePct < 0
        ? "text-amber-600"
        : "text-text-secondary";
  const trendSign = cashChangePct > 0 ? "+" : "";

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">מרכז בקרה</h1>
        <p className="mt-1 text-text-secondary">סקירה פיננסית ותפעולית בזמן אמת</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <DashboardCard title="מכסת סריקות AI" actionIcon={<Activity size={20} />}>
          <div className="text-4xl font-semibold text-brand">
            {scanUsed}{" "}
            <span className="text-sm font-normal text-text-secondary">/ {scanLimit}</span>
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-brand transition-[width]"
              style={{ width: `${scanPct}%` }}
            />
          </div>
        </DashboardCard>

        <DashboardCard title="תזרים מוערך (חודש)" actionIcon={<CreditCard size={20} />}>
          <div className="text-4xl font-semibold text-text-primary">{cashDisplay}</div>
          <p className="mt-2 flex items-center text-sm">
            <span className={`font-medium ${trendClass}`}>
              {trendSign}
              {cashChangePct}%
            </span>
            <span className="ms-2 text-text-secondary">מחודש קודם</span>
          </p>
        </DashboardCard>

        <DashboardCard title="נוכחות מקאנו" actionIcon={<Users size={20} />}>
          <div className="text-4xl font-semibold text-text-primary">
            {hasMeckano ? meckanoFieldActive : "—"}
          </div>
          <p className="mt-2 text-sm text-text-secondary">
            {hasMeckano ? "לקוחות פעילים (פרוקסי) בשטח" : "אין חיבור למקאנו — הופעל בהגדרות"}
          </p>
        </DashboardCard>
      </div>

      {trade === "ELECTRICAL" || trade === "GENERAL_CONTRACTOR" ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {trade === "ELECTRICAL" ? (
            <DashboardCard title="מעקב מחירי חומרי גלם (נחושת / אלומיניום)">
              <p className="text-sm leading-relaxed text-text-secondary">
                כרטיס ייעודי לעבודות חשמל — השוואת רכש וחריגות מחיר בציוד וחומרים.
              </p>
              <div className="mt-4 flex h-40 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 text-text-secondary">
                נתונים יוצגו כאן
              </div>
            </DashboardCard>
          ) : null}
          {trade === "GENERAL_CONTRACTOR" ? (
            <DashboardCard title="יומן יציקות וסטטוס בטון">
              <p className="text-sm leading-relaxed text-text-secondary">
                מבט־על לקבלן שלד / גמר — לוח זמנים וסטטוס אספקה.
              </p>
              <div className="mt-4 flex h-40 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 text-text-secondary">
                נתונים יוצגו כאן
              </div>
            </DashboardCard>
          ) : null}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <DashboardCard className="lg:col-span-2" title="השוואת מחירים (ERP)">
          <div className="flex h-64 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 text-text-secondary">
            גרף יוכנס כאן
          </div>
        </DashboardCard>

        <DashboardCard title="לקוחות פעילים">
          <div className="flex h-64 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 text-text-secondary">
            רשימה תוכנס כאן
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}
