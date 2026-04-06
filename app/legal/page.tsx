import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FileText, Shield, Cookie, Scale, Receipt, Globe2 } from "lucide-react";
import { legalSite } from "@/lib/legal-site";

export const metadata: Metadata = {
  title: "מסמכים משפטיים | BSD-YBM",
  description: "תנאי שימוש, פרטיות, מדיניות עוגיות והבהרות בנושא מסמכים ומס.",
};

const items = [
  {
    href: "/terms",
    title: "תנאי שימוש",
    desc: "הסכם השימוש בשירות, הגבלות אחריות וכללי התנהגות.",
    icon: FileText,
  },
  {
    href: "/privacy",
    title: "מדיניות פרטיות",
    desc: "איסוף נתונים, שימוש, אבטחה וזכויות נושאי מידע.",
    icon: Shield,
  },
  {
    href: "/legal/gdpr",
    title: "הצהרת GDPR והגנת מידע (EU)",
    desc: "מסגרת לתאימות לתקנות האיחוד האירופי (GDPR) וניהול זכויות נושאי מידע.",
    icon: Globe2,
  },
  {
    href: "/legal/invoices",
    title: "מסמכים כספיים ומס",
    desc: "הבהרות בנושא חשבוניות, קבלות ואחריות המשתמש מול רשויות.",
    icon: Receipt,
  },
  {
    href: "/legal/cookies",
    title: "מדיניות עוגיות (Cookies)",
    desc: "שימוש בעוגיות ובטכנולוגיות דומות באתר ובמערכת.",
    icon: Cookie,
  },
  {
    href: "/legal/disclaimer",
    title: "הצהרת הגבלה כללית",
    desc: "הגבלת אחריות לתוכן, ל-AI ולשירותים.",
    icon: Scale,
  },
];

export default function LegalHubPage() {
  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-24 pt-32 pb-16">
        <h1 className="text-4xl font-black italic text-gray-900 mb-3">מסמכים משפטיים</h1>
        <p className="text-gray-500 mb-2">
          כל המסמכים הרשמיים של <strong>{legalSite.siteName}</strong> במקום אחד. יש להשלים נוסח
          סופי מול יועץ משפטי לפני הסתמכות עסקית.
        </p>
        <p className="text-sm text-gray-400 mb-10">
          פניות:{" "}
          <a
            href={`mailto:${legalSite.contactEmail}`}
            className="text-[var(--primary-color)] hover:underline"
          >
            {legalSite.contactEmail}
          </a>
        </p>

        <ul className="grid gap-4 md:grid-cols-1">
          {items.map(({ href, title, desc, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className="flex gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-indigo-500/30 hover:shadow-md"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-[var(--primary-color)]">
                  <Icon size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{title}</h2>
                  <p className="text-gray-500 text-sm mt-1">{desc}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <Footer />
    </div>
  );
}
