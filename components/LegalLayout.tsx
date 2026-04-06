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

const sectionClass = "space-y-4 text-white/65 leading-relaxed text-[15px]";
const h2Class = "text-xl font-bold text-white mt-10 mb-3 scroll-mt-28";
const noteClass =
  "rounded-2xl border border-indigo-500/30 bg-indigo-500/15 px-4 py-3 text-sm text-indigo-950 not-italic";

export default function LegalLayout({ title, subtitle, children }: Props) {
  return (
    <div className="min-h-screen bg-[#0a0b14]" dir="rtl">
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 pb-20 pt-28 md:pt-32">
        <nav className="text-sm text-white/45 mb-8">
          <Link href="/" className="hover:text-[var(--primary-color)]">
            דף הבית
          </Link>
          <span className="mx-2">/</span>
          <Link href="/legal" className="hover:text-[var(--primary-color)]">
            מסמכים משפטיים
          </Link>
          <span className="mx-2">/</span>
          <span className="text-white/75 font-medium">{title}</span>
        </nav>

        <header className="mb-10 border-b border-white/[0.07] pb-8">
          <h1 className="text-3xl md:text-4xl font-black italic text-white tracking-tight">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-3 text-white/55 text-lg">{subtitle}</p>
          ) : null}
          <p className="mt-4 text-sm text-white/45">
            מפעיל: <strong className="text-white/75">{legalSite.operatorDisplayName}</strong>
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

        <footer className="mt-16 pt-8 border-t border-white/[0.07] text-sm text-white/45">
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
