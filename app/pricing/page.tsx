import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import MarketingPublicShell from "@/components/marketing/MarketingPublicShell";

export const metadata: Metadata = {
  title: "תמחור | BSD-YBM",
  description:
    "עמוד תמחור ראשוני ל-BSD-YBM עם מסלול התחלה, מסלול צמיחה ומסלול ארגוני.",
};

const tiers = [
  {
    name: "Start",
    price: "מותאם להתחלה",
    body: "לצוותים קטנים שרוצים להפסיק לפצל בין לקוחות, מסמכים ומשימות.",
    points: ["CRM בסיסי", "עבודה עם מסמכים", "כניסת AI ראשונה", "תמיכה בהטמעה"],
  },
  {
    name: "Growth",
    price: "לצוות שעולה מדרגה",
    body: "לעסקים פעילים שצריכים שליטה על תהליכים, חיוב ויותר אוטומציה.",
    points: ["זרימות חיוב וגבייה", "תפקידים והרשאות", "תהליכי עבודה פנימיים", "תובנות ניהוליות"],
  },
  {
    name: "Enterprise",
    price: "בהתאמה לארגון",
    body: "לארגונים עם מבנה מורכב, התאמות עומק, ובקרת תפעול רוחבית.",
    points: ["התאמות לפי ענף", "אוטומציות מתקדמות", "בקרה ניהולית רחבה", "ליווי הטמעה"],
  },
];

export default function PricingPage() {
  return (
    <MarketingPublicShell
      title="תמחור שנבנה סביב שלב הצמיחה של העסק, לא סביב רשימת פיצ'רים ריקה."
      eyebrow="Pricing"
      description="כאן מתחיל מבנה תמחור חדש. אפשר להתחיל בקטן, להתרחב עם העבודה, ולהתאים את BSD-YBM לארגון כשהמורכבות גדלה."
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
