"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { legalSite } from "@/lib/legal-site";
import { useI18n } from "@/components/I18nProvider";

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

const sectionClass = "space-y-4 text-[color:var(--ink-600)] leading-relaxed text-[15px]";
const h2Class = "text-xl font-bold text-[color:var(--ink-900)] mt-10 mb-3 scroll-mt-28";
const noteClass =
  "rounded-2xl border border-[color:var(--cd-line-strong)] bg-[color:var(--cd-accent-soft)] px-4 py-3 text-sm text-[color:var(--cd-accent-ink)] not-italic";

export default function LegalLayout({ title, subtitle, children }: Props) {
  const { t, dir } = useI18n();
  const breadcrumbHome = t("legalShell.breadcrumbHome");
  const breadcrumbLegal = t("legalShell.breadcrumbLegal");
  const operatorLabel = t("legalShell.operatorLabel");
  const docUpdateLabel = t("legalShell.docUpdateLabel");
  const disclaimerTitle = t("legalShell.disclaimerTitle");
  const disclaimerBody = t("legalShell.disclaimerBody");
  const footerContact = t("legalShell.footerContact");

  return (
    <div className="min-h-screen bg-[color:var(--canvas)]" dir={dir}>
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 pb-20 pt-28 md:pt-32">
        <nav className="mb-8 text-sm text-[color:var(--ink-400)]">
          <Link href="/" className="hover:text-[color:var(--cd-accent)]">
            {breadcrumbHome}
          </Link>
          <span className="mx-2">/</span>
          <Link href="/legal" className="hover:text-[color:var(--cd-accent)]">
            {breadcrumbLegal}
          </Link>
          <span className="mx-2">/</span>
          <span className="font-medium text-[color:var(--ink-700)]">{title}</span>
        </nav>

        <header className="mb-10 border-b border-[color:var(--line-subtle)] pb-8">
          <h1 className="text-3xl font-black italic tracking-tight text-[color:var(--ink-900)] md:text-4xl">{title}</h1>
          {subtitle ? <p className="mt-3 text-lg text-[color:var(--ink-500)]">{subtitle}</p> : null}
          <p className="mt-4 text-sm text-[color:var(--ink-400)]">
            {operatorLabel}{" "}
            <strong className="text-[color:var(--ink-700)]">{legalSite.operatorDisplayName}</strong>
            {" · "}
            {docUpdateLabel} {legalSite.documentsLastUpdated}
          </p>
          <aside className={`mt-6 ${noteClass}`} role="note">
            <strong>{disclaimerTitle}</strong> {disclaimerBody}
          </aside>
        </header>

        <article className={sectionClass}>{children}</article>

        <footer className="mt-16 border-t border-[color:var(--line-subtle)] pt-8 text-sm text-[color:var(--ink-400)]">
          <p>
            {footerContact}{" "}
            <a
              href={`mailto:${legalSite.contactEmail}`}
              className="font-medium text-[var(--primary-color)] hover:underline"
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
