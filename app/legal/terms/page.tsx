import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";
import { legalSite } from "@/lib/legal-site";

export const metadata: Metadata = {
  title: `תנאי שימוש | ${legalSite.siteName}`,
  description: "תנאי השימוש בפלטפורמת BSD-YBM — יש לאמת מול יועץ משפטי.",
};

export default function LegalTermsPage() {
  const updated = legalSite.documentsLastUpdated;

  return (
    <div className="min-h-screen bg-slate-50 font-sans rtl" dir="rtl">
      <header className="flex items-center justify-between bg-slate-950 px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand font-bold text-white">
            B
          </div>
          <span className="font-bold tracking-tight text-white">BSD-YBM</span>
        </div>
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-medium text-slate-400 transition-colors hover:text-white"
        >
          חזרה לאתר <ArrowRight size={16} />
        </Link>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-8 flex items-center gap-3">
          <FileText className="text-brand" size={32} />
          <h1 className="text-4xl font-bold text-slate-900">תנאי שימוש (Terms of Service)</h1>
        </div>

        <p className="mb-10 border-b border-slate-200 pb-6 text-sm text-slate-500">
          תאריך עדכון אחרון (טיוטה): {updated}
        </p>
        <div className="prose prose-slate max-w-none space-y-6 leading-relaxed text-slate-700 prose-headings:text-slate-900">
          <section>
            <h2 className="text-2xl font-bold text-slate-900">1. מבוא</h2>
            <p>
              ברוכים הבאים למערכת <strong>{legalSite.siteName}</strong>. השימוש בפלטפורמה, לרבות סריקת
              מסמכים, ניהול פרויקטים ושימוש במנועי בינה מלאכותית, כפוף לתנאים המפורטים במסמך זה.
              המפעיל: <strong>{legalSite.operatorDisplayName}</strong>, {legalSite.publicUrl}.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-bold text-slate-900">2. רישוי ומנויים</h2>
            <p>
              המערכת ניתנת במודל תוכנה כשירות (SaaS). תשלום עבור מנוי מתבצע בהתאם לתוכנית שנבחרה.
              ניתן לנהל את המנוי דרך אזור ההגדרות. יש להשלים סעיפי ביטול, החזרים ומחזור חיוב מול יועץ
              משפטי.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-bold text-slate-900">3. פרטיות ואבטחת מידע</h2>
            <p>
              אנו פועלים להגנה על מידע שמועלה למערכת בהתאם למדיניות הפרטיות ולדרישות חוק. מומלץ לקרוא
              גם את <Link href="/legal/privacy" className="font-medium text-brand underline">מדיניות הפרטיות</Link>.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-bold text-slate-900">4. הגבלת אחריות</h2>
            <p>
              תובנות ה-AI, חילוצי נתונים וכלים אוטומטיים מיועדים כעזר לקבלן/ארגון. האחריות לאימות
              נתונים, הצעות מחיר ודיווחים חלה על המשתמש. יש לבצע בקרה מקצועית לפני הסתמכות עסקית.
            </p>
          </section>
        </div>
        <div className="mt-16 rounded-xl border border-slate-200 bg-slate-100 p-6">
          <h3 className="mb-2 font-bold text-slate-900">פניות משפטיות</h3>
          <p className="text-sm text-slate-600">
            <a href={`mailto:${legalSite.contactEmail}`} className="font-medium text-brand underline">
              {legalSite.contactEmail}
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
