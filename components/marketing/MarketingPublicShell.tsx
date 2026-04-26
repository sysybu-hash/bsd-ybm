"use client";

import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { marketingSans } from "@/lib/fonts/marketing-fonts";
import { useI18n } from "@/components/I18nProvider";
import BsdYbmLogo from "@/components/brand/BsdYbmLogo";
import LanguageSwitcher from "@/components/LanguageSwitcher";

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
    <div
      className={`${marketingSans.className} marketing-unified-shell min-h-screen bg-[#05060d] text-white`}
      dir={dir}
    >
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#05060d]/92 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-5 px-4 sm:px-6 lg:px-8">
          <BsdYbmLogo href="/" variant="marketing-dark" size="md" />

          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-3 lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap rounded-full px-2.5 py-1 text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
            <LanguageSwitcher
              tone="dark"
              className="max-sm:[&_select]:min-w-[7.5rem] max-sm:[&_select]:px-2 max-sm:[&_select]:text-xs"
            />
            <Link
              href="/login"
              className="hidden rounded-lg border border-white/10 px-4 py-2 text-sm font-bold text-slate-200 transition hover:border-white/20 hover:bg-white/5 sm:inline-flex"
            >
              {t("publicShell.ctaLogin")}
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-lg bg-[#7c57ff] px-4 py-2 text-sm font-black text-white shadow-[0_16px_36px_rgba(124,87,255,0.28)] transition hover:bg-[#6d48f2]"
            >
              {t("publicShell.ctaStart")}
            </Link>
          </div>
        </div>
      </header>

      <main className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(37,99,235,0.22),transparent_34%),linear-gradient(180deg,#07091a_0%,#05060d_42%,#080b14_100%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:64px_64px] opacity-35" />

        <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <section className="max-w-4xl py-8 sm:py-12">
            <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-cyan-200">
              {eyebrowText}
            </span>
            <h1 className="mt-5 max-w-4xl text-4xl font-black leading-[1.05] text-white sm:text-5xl lg:text-6xl">
              {title}
            </h1>
            {description ? (
              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300 sm:text-xl">{description}</p>
            ) : null}
          </section>

          <section className="pb-16">{children}</section>
        </div>
      </main>

      <footer className="border-t border-white/10 bg-[#05060d]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-slate-400 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <p>{t("publicShell.footerLead")}</p>
          <div className="flex flex-wrap gap-4">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="inline-flex items-center gap-1 font-semibold transition hover:text-white">
                {item.label}
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
