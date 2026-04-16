import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import MarketingPublicShell from "@/components/marketing/MarketingPublicShell";

export const metadata: Metadata = {
  title: "תמחור | BSD-YBM",
  description:
    "מסלולי מנוי לעסקי בנייה ומקצועות נלווים — מהצוות הקטן ועד ארגון רב־אתרי.",
};

const tiers = [
  {
    name: "התחלה",
    price: "צוות קטן · אתר בודד",
    body: "למקצוען או צוות מצומצם שרוצה סדר במסמכים, לקוחות וחשבוניות בלי אקסלים מפוזרים.",
    points: ["מסמכים וסריקות AI", "CRM פרויקטים", "חיוב בסיסי", "התאמת מקצוע (בנייה)"],
  },
  {
    name: "צמיחה",
    price: "שטח + משרד",
    body: "לחברה פעילה עם כמה פרויקטים במקביל — שליטה בתזרים, בהרשאות ובמעקב אחרי ספקים.",
    points: ["תפקידים והרשאות", "מנועי AI נוספים", "גבייה ותהליכי חיוב", "תובנות ניהוליות"],
  },
  {
    name: "ארגון",
    price: "בהתאמה אישית",
    body: "לחברות עם מספר חברות/אתרים, דרישות אינטגרציה וליווי הטמעה צמוד.",
    points: ["היקפי סריקה גבוהים", "מבנה ארגוני מורכב", "ליווי ותמיכה", "התאמות עומק"],
  },
];

export default function PricingPage() {
  return (
    <MarketingPublicShell
      title="תמחור לפי היקף עבודה — מהמקצוען ועד חברת בנייה."
      eyebrow="תמחור"
      description="המסלולים הטכניים במערכת ממופים לרמות מנוי (כולל מכסות סריקה). כאן המסגרת השיווקית לענף הבנייה; לפרטים מדויקים נכנסים אחרי התחברות."
    >
      <div className="grid gap-4 xl:grid-cols-3">
        {tiers.map((tier) => (
          <article key={tier.name} className="v2-panel p-6">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[color:var(--v2-accent)]">{tier.name}</p>
            <h2 className="mt-4 text-3xl font-black text-[color:var(--v2-ink)]">{tier.price}</h2>
            <p className="mt-3 text-sm leading-7 text-[color:var(--v2-muted)]">{tier.body}</p>
            <div className="mt-6 grid gap-3">
              {tier.points.map((point) => (
                <div key={point} className="flex items-center gap-3 rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-[color:var(--v2-success)]" aria-hidden />
                  <span className="text-sm font-semibold text-[color:var(--v2-ink)]">{point}</span>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>

      <div className="mt-6">
        <Link href="/contact" className="v2-button v2-button-primary">
          לקבלת הצעת התאמה
        </Link>
      </div>
    </MarketingPublicShell>
  );
}
