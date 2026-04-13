import type { Metadata } from "next";
import { BarChart3, Bot, CreditCard, FileText, UsersRound } from "lucide-react";
import MarketingPublicShell from "@/components/marketing/MarketingPublicShell";

export const metadata: Metadata = {
  title: "המוצר | BSD-YBM",
  description:
    "היכרות עם שכבות העבודה של BSD-YBM: לקוחות, מסמכים, חיוב, תפעול, בקרה ו-AI במערכת אחת.",
};

const modules = [
  {
    title: "לקוחות וקשרי עבודה",
    body: "CRM שמחבר סטטוסים, משימות, הערות, התקדמות והיסטוריה תפעולית.",
    icon: UsersRound,
  },
  {
    title: "מסמכים חכמים",
    body: "קליטה, סריקה, ניתוח, שיוך ויצירה של מסמכים מתוך ההקשר העסקי.",
    icon: FileText,
  },
  {
    title: "חיוב וגבייה",
    body: "חשבוניות, מעקב תשלומים, תמחור ומנויים באותו flow תפעולי.",
    icon: CreditCard,
  },
  {
    title: "בקרה ותובנות",
    body: "תמונה ניהולית אחת שמראה מה השתנה, מה מתעכב ומה צריך טיפול.",
    icon: BarChart3,
  },
  {
    title: "AI מוטמע",
    body: "שכבת עזר שעובדת בתוך הלקוחות, המסמכים והחלטות הניהול, לא לידם.",
    icon: Bot,
  },
];

export default function ProductPage() {
  return (
    <MarketingPublicShell
      title="שכבות עבודה ברורות למערכת אחת שעובדת כמו עסק אמיתי."
      eyebrow="Product"
      description="BSD-YBM בנויה כך שכל מודול מחזק את השני: לקוח מייצר מסמך, מסמך מייצר פעולה, פעולה מייצרת חיוב, והכול חוזר לבקרה ניהולית אחת."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {modules.map(({ title, body, icon: Icon }) => (
          <article key={title} className="v2-panel p-6">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--v2-accent-soft)] text-[color:var(--v2-accent)]">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <h2 className="mt-5 text-xl font-black text-[color:var(--v2-ink)]">{title}</h2>
            <p className="mt-3 text-sm leading-7 text-[color:var(--v2-muted)]">{body}</p>
          </article>
        ))}
      </div>
    </MarketingPublicShell>
  );
}
