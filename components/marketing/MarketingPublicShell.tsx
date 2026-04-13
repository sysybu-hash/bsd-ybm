"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { marketingSans } from "@/lib/fonts/marketing-fonts";
import { useI18n } from "@/components/I18nProvider";

type Props = Readonly<{
  children: ReactNode;
  title: string;
  eyebrow?: string;
  description?: string;
}>;

const navItems = [
  { href: "/", label: "בית" },
  { href: "/product", label: "המוצר" },
  { href: "/solutions", label: "פתרונות" },
  { href: "/pricing", label: "תמחור" },
  { href: "/about", label: "אודות" },
  { href: "/contact", label: "יצירת קשר" },
];

export default function MarketingPublicShell({
  children,
  title,
  eyebrow = "BSD-YBM v2",
  description,
}: Props) {
  const { dir } = useI18n();

  return (
    <div className={`${marketingSans.className} v2-site-shell min-h-screen`} dir={dir}>
      <header className="border-b border-[color:var(--v2-line)] bg-[color:var(--v2-surface)]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3 text-[color:var(--v2-ink)]">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--v2-accent)] text-sm font-black text-white shadow-[0_18px_40px_-20px_rgba(193,89,47,0.85)]">
              BY
            </span>
            <span className="text-lg font-black tracking-[-0.04em]">BSD-YBM</span>
          </Link>

          <nav className="hidden items-center gap-5 lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-semibold text-[color:var(--v2-muted)] transition hover:text-[color:var(--v2-ink)]"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login" className="v2-button v2-button-ghost hidden sm:inline-flex">
              כניסה
            </Link>
            <Link href="/register" className="v2-button v2-button-primary">
              התחלת עבודה
            </Link>
          </div>
        </div>
      </header>

      <main className="relative">
        <div className="pointer-events-none absolute inset-0">
          <div className="v2-orb v2-orb-primary" />
          <div className="v2-grid-overlay" />
        </div>

        <div className="relative mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <section className="v2-panel v2-panel-soft overflow-hidden px-6 py-8 sm:px-10 sm:py-10">
            <span className="v2-eyebrow">{eyebrow}</span>
            <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-[-0.06em] text-[color:var(--v2-ink)] sm:text-5xl">
              {title}
            </h1>
            {description ? (
              <p className="mt-4 max-w-3xl text-lg leading-8 text-[color:var(--v2-muted)]">{description}</p>
            ) : null}
          </section>

          <section className="mt-8">{children}</section>
        </div>
      </main>

      <footer className="border-t border-[color:var(--v2-line)] bg-[color:var(--v2-surface)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-[color:var(--v2-muted)] sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <p>BSD-YBM היא מערכת תפעול חכמה לעסקים שרוצים לעבוד מתוך תמונה אחת ברורה.</p>
          <div className="flex flex-wrap gap-4">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="font-semibold transition hover:text-[color:var(--v2-ink)]">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
