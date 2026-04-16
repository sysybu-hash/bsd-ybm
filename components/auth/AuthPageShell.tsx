"use client";

import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import { ArrowLeft, ShieldCheck, Sparkles } from "lucide-react";
import { marketingSans } from "@/lib/fonts/marketing-fonts";
import BsdYbmLogo from "@/components/brand/BsdYbmLogo";
import { useI18n } from "@/components/I18nProvider";

type Props = Readonly<{
  children: ReactNode;
  secondaryNav: { href: string; label: string };
}>;

export default function AuthPageShell({ children, secondaryNav }: Props) {
  const { t, dir } = useI18n();
  const year = String(new Date().getFullYear());

  const highlights = useMemo(
    () => [t("publicShell.authHighlight1"), t("publicShell.authHighlight2"), t("publicShell.authHighlight3")],
    [t],
  );

  return (
    <div className={`${marketingSans.className} v2-site-shell min-h-screen`} dir={dir}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="v2-orb v2-orb-primary" />
        <div className="v2-orb v2-orb-secondary" />
        <div className="v2-grid-overlay" />
      </div>

      <header className="relative z-10 border-b border-[color:var(--v2-line)] bg-[color:var(--v2-surface)]/86 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <BsdYbmLogo href="/" variant="marketing-light" size="md" />

          <div className="flex items-center gap-2">
            <Link href="/" className="v2-button v2-button-ghost hidden sm:inline-flex">
              {t("publicShell.authBackToSite")}
            </Link>
            <Link href={secondaryNav.href} className="v2-button v2-button-secondary">
              {secondaryNav.label}
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto grid min-h-[calc(100vh-141px)] max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:px-8 lg:py-14">
        <section className="order-2 lg:order-1">
          <div className="max-w-xl space-y-7">
            <span className="v2-eyebrow">{t("publicShell.authEyebrow")}</span>
            <div className="space-y-4">
              <h1 className="text-4xl font-black leading-[0.95] tracking-[-0.06em] text-[color:var(--v2-ink)] sm:text-6xl">
                {t("publicShell.authHeroTitle")}
              </h1>
              <p className="text-lg leading-8 text-[color:var(--v2-muted)]">{t("publicShell.authHeroLead")}</p>
            </div>

            <div className="grid gap-3">
              {highlights.map((item, i) => (
                <div key={`hl-${i}`} className="v2-panel flex items-center gap-3 px-4 py-4">
                  <ShieldCheck className="h-5 w-5 shrink-0 text-[color:var(--v2-success)]" aria-hidden />
                  <span className="text-sm font-semibold text-[color:var(--v2-ink)]">{item}</span>
                </div>
              ))}
            </div>

            <div className="v2-panel v2-panel-highlight p-5">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-1 h-5 w-5 shrink-0 text-[color:var(--v2-accent)]" aria-hidden />
                <div>
                  <p className="font-black text-[color:var(--v2-ink)]">{t("publicShell.authPanelTitle")}</p>
                  <p className="mt-2 text-sm leading-7 text-[color:var(--v2-muted)]">{t("publicShell.authPanelBody")}</p>
                </div>
              </div>
            </div>

            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-bold text-[color:var(--v2-muted)] transition hover:text-[color:var(--v2-ink)]"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              {t("publicShell.authViewNewSite")}
            </Link>
          </div>
        </section>

        <section className="order-1 flex justify-center lg:order-2 lg:justify-end">{children}</section>
      </main>

      <footer className="relative z-10 border-t border-[color:var(--v2-line)] bg-[color:var(--v2-surface)]/82">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-[color:var(--v2-muted)] sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <p>{t("publicShell.authFooterLead")}</p>
          <p>{t("publicShell.authFooterCopy", { year })}</p>
        </div>
      </footer>
    </div>
  );
}
