import type { Document } from "@prisma/client";

export type MonthlyExpensePoint = { name: string; value: number };

function docTotal(doc: Document): number {
  const ai = doc.aiData as { total?: number } | null;
  return ai?.total ?? 0;
}

/** סכום הוצאות לפי חודש קלנדרי (0–11) */
export function sumExpensesInCalendarMonth(
  docs: Document[],
  year: number,
  monthIndex: number,
): number {
  return docs.reduce((acc, doc) => {
    const d = new Date(doc.createdAt);
    if (d.getFullYear() !== year || d.getMonth() !== monthIndex) return acc;
    return acc + docTotal(doc);
  }, 0);
}

/** סדרה ל־Recharts — חודשים אחרונים */
export function buildMonthlyExpenseSeries(
  docs: Document[],
  monthsBack = 6,
): MonthlyExpensePoint[] {
  const now = new Date();
  const points: MonthlyExpensePoint[] = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString("he-IL", { month: "short" });
    const value = sumExpensesInCalendarMonth(docs, d.getFullYear(), d.getMonth());
    points.push({ name: label, value });
  }
  return points;
}

export function formatExpenseTrendVsPrevious(
  current: number,
  previous: number,
): string {
  if (previous <= 0) return current > 0 ? "חודש ראשון עם נתונים" : "—";
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return "0% לעומת חודש קודם";
  return `${pct > 0 ? "+" : ""}${pct}% לעומת חודש קודם`;
}
