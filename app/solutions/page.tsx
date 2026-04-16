import type { Metadata } from "next";
import MarketingPublicShell from "@/components/marketing/MarketingPublicShell";

export const metadata: Metadata = {
  title: "פתרונות | BSD-YBM",
  description:
    "פתרונות ליזמים, קבלנים, מפקחים ומקצועות נלווים בענף הבנייה — מסמכים, כסף ופרויקטים.",
};

const solutions = [
  {
    title: "יזמים ומנהלי פרויקטים",
    body: "תמונת מצב על אתרים, התחייבויות, מסמכים ותשלומים — מקום אחד לתאם בין משרד לשטח.",
  },
  {
    title: "קבלנים ראשיים וחברות בנייה",
    body: "ניהול מזמינים, ספקים וקבלני משנה, חשבוניות והוצאות — עם מעקב אחרי רווחיות פרויקט.",
  },
  {
    title: "מקצועות נלווים (חשמל, אינסטלציה, מיזוג, גמר…)",
    body: "אותה תשתית CRM ומסמכים — עם התאמת AI לסוג המקצוע: הצעות מחיר, חשבוניות ותעודות מהשטח.",
  },
  {
    title: "פיקוח, בקרה וגופים מזמינים",
    body: "מעקב אחרי אישורים, חריגות ותיעוד — כדי לשמור על סדר בתיק הפרויקט.",
  },
];

export default function SolutionsPage() {
  return (
    <MarketingPublicShell
      title="מאותו סוג עבודה — לא אותו כאב ראש תפעולי."
      eyebrow="פתרונות"
      description="BSD-YBM בנויה לעומס של פרויקטי בנייה: מסמכים רבים, גורמים רבים, וצורך בשפה אחידה בין משרד לאתר."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        {solutions.map((solution) => (
          <article key={solution.title} className="v2-panel p-6">
            <h2 className="text-2xl font-black text-[color:var(--v2-ink)]">{solution.title}</h2>
            <p className="mt-3 text-sm leading-7 text-[color:var(--v2-muted)]">{solution.body}</p>
          </article>
        ))}
      </div>
    </MarketingPublicShell>
  );
}
