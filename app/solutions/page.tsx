import type { Metadata } from "next";
import MarketingPublicShell from "@/components/marketing/MarketingPublicShell";

export const metadata: Metadata = {
  title: "פתרונות | BSD-YBM",
  description:
    "BSD-YBM מתאימה לעסקים מקצועיים עם מסמכים, לקוחות, חיוב ותהליכים תפעוליים מורכבים.",
};

const solutions = [
  {
    title: "משרדי עורכי דין",
    body: "תיקי לקוח, מסמכים, מעקבי פעולה וגבייה בממשק אחד שמתאים לעומס תפעולי יומיומי.",
  },
  {
    title: "רואי חשבון ומנהלי כספים",
    body: "שליטה על מסמכים, קשרי לקוחות, משימות וגבייה בלי לפצל בין מערכות.",
  },
  {
    title: "קבלנים ועסקי שטח",
    body: "ניהול לקוח, מסמכים, חשבונות ומשימות תפעול גם כשהעבודה נעה בין משרד לשטח.",
  },
  {
    title: "קליניקות ועסקי שירות",
    body: "חיבור בין פניות, תיאום, מסמכים, חיוב ונקודות תשומת לב לצוות.",
  },
];

export default function SolutionsPage() {
  return (
    <MarketingPublicShell
      title="BSD-YBM מתאימה לעסקים שהעבודה אצלם לא נגמרת בטופס אחד."
      eyebrow="Solutions"
      description="המערכת תוכננה עבור ארגונים עם עומס תפעולי, מסמכים, אחריות מול לקוחות וצורך בתמונה ניהולית ברורה."
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
