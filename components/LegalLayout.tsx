import type { ReactNode } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { legalSite } from "@/lib/legal-site";

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

const sectionClass = "space-y-4 text-slate-700 leading-relaxed text-[15px]";
const h2Class = "text-xl font-bold text-slate-900 mt-10 mb-3 scroll-mt-28";
const noteClass =
  "rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 not-italic";

export default function LegalLayout({ title, subtitle, children }: Props) {
  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 pb-20 pt-28 md:pt-32">
        <nav className="text-sm text-slate-500 mb-8">
          <Link href="/" className="hover:text-[var(--primary-color)]">
            דף הבית
          </Link>
          <span className="mx-2">/</span>
          <Link href="/legal" className="hover:text-[var(--primary-color)]">
            מסמכים משפטיים
          </Link>
          <span className="mx-2">/</span>
          <span className="text-slate-800 font-medium">{title}</span>
        </nav>

        <header className="mb-10 border-b border-slate-100 pb-8">
          <h1 className="text-3xl md:text-4xl font-black italic text-slate-900 tracking-tight">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-3 text-slate-600 text-lg">{subtitle}</p>
          ) : null}
          <p className="mt-4 text-sm text-slate-500">
            מפעיל: <strong className="text-slate-800">{legalSite.operatorDisplayName}</strong>
            {" · "}
            עדכון מסמכים (מוצג): {legalSite.documentsLastUpdated}
          </p>
          <aside className={`mt-6 ${noteClass}`} role="note">
            <strong>הבהרה:</strong> הנוסחים להלן הם{" "}
            <strong>מסגרת בלבד</strong> ואינם מהווים ייעוץ משפטי או מס. יש להשלים ולאמת מול יועץ
            לפני פרסום סופי.
          </aside>
        </header>

        <article className={sectionClass}>{children}</article>

        <footer className="mt-16 pt-8 border-t border-slate-100 text-sm text-slate-500">
          <p>
            פניות בנושא מסמכים אלו:{" "}
            <a
              href={`mailto:${legalSite.contactEmail}`}
              className="text-[var(--primary-color)] font-medium hover:underline"
            >
              {legalSite.contactEmail}
            </a>
          </p>
        </footer>
      </main>
      <Footer />
    </div>
  );
}

export { h2Class, noteClass, sectionClass };
