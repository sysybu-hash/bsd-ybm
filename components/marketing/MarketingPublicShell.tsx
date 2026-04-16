"use client";

import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import { marketingSans } from "@/lib/fonts/marketing-fonts";
import { useI18n } from "@/components/I18nProvider";
import BsdYbmLogo from "@/components/brand/BsdYbmLogo";

type Props = Readonly<{
  children: ReactNode;
  title: string;
  eyebrow?: string;
  description?: string;
}>;

export default function MarketingPublicShell({
  children,
  title,
  eyebrow,
  description,
}: Props) {
  const { dir, t } = useI18n();

  const navItems = useMemo(
    () =>
      [
        { href: "/", key: "navHome" as const },
        { href: "/product", key: "navProduct" as const },
        { href: "/solutions", key: "navSolutions" as const },
        { href: "/pricing", key: "navPricing" as const },
        { href: "/about", key: "navAbout" as const },
        { href: "/contact", key: "navContact" as const },
      ].map((item) => ({
        href: item.href,
        label: t(`publicShell.${item.key}`),
      })),
    [t],
  );

  const eyebrowText = eyebrow ?? t("publicShell.eyebrowSector");

  return (
    <div className={`${marketingSans.className} v2-site-shell min-h-screen`} dir={dir}>
      <header className="border-b border-slate-200/90 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
          <BsdYbmLogo href="/" variant="marketing-light" size="md" />

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
              {t("publicShell.ctaLogin")}
            </Link>
            <Link href="/register" className="v2-button v2-button-primary">
              {t("publicShell.ctaStart")}
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
            <span className="v2-eyebrow">{eyebrowText}</span>
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
          <p>{t("publicShell.footerLead")}</p>
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
