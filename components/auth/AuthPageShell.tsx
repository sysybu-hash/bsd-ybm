"use client";

import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import { ArrowLeft, CheckCircle2, FileScan, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
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
    <div className={`${marketingSans.className} min-h-screen bg-[#f7f2e8] text-[#111827]`} dir={dir}>
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute inset-0 bg-[url('/marketing/bsd-ybm-crm-erp-bridge.png')] bg-cover bg-center opacity-[0.14]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(247,242,232,0.98)_0%,rgba(247,242,232,0.88)_42%,rgba(247,242,232,0.96)_100%)]" />
        <div className="absolute inset-x-0 top-0 h-48 bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(255,255,255,0))]" />
      </div>

      <header className="relative z-10 border-b border-[#eadfce] bg-white/82 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <BsdYbmLogo href="/" variant="marketing-light" size="md" />

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="hidden h-11 items-center justify-center rounded-xl px-4 text-sm font-black text-[#334155] transition hover:bg-[#f3eadf] sm:inline-flex"
            >
              {t("publicShell.authBackToSite")}
            </Link>
            <Link
              href={secondaryNav.href}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-[#111827] px-5 text-sm font-black text-white shadow-[0_16px_38px_-24px_rgba(17,24,39,0.85)] transition hover:bg-[#273244]"
            >
              {secondaryNav.label}
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto grid min-h-[calc(100vh-70px)] max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(420px,0.9fr)_minmax(520px,1.1fr)] lg:items-center lg:px-8 lg:py-8">
        <section className="order-2 lg:order-1">
          <div className="overflow-hidden rounded-[28px] border border-white/80 bg-white/66 shadow-[0_28px_80px_-52px_rgba(42,35,24,0.45)] backdrop-blur-xl">
            <div className="border-b border-[#eadfce] p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full border border-[#d8c9b4] bg-[#efe4d5] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#607089]">
                  {t("publicShell.authEyebrow")}
                </span>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#111827] text-white">
                  <LockKeyhole className="h-5 w-5" aria-hidden />
                </div>
              </div>
            </div>

            <div className="grid gap-6 p-5 sm:p-7">
              <div className="space-y-4">
                <h1 className="max-w-xl !text-[#f9134d] text-4xl font-black leading-[0.98] sm:text-5xl lg:text-6xl">
                {t("publicShell.authHeroTitle")}
              </h1>
                <p className="max-w-xl text-base font-semibold leading-8 text-[#607089] sm:text-lg">{t("publicShell.authHeroLead")}</p>
              </div>

              <div className="grid gap-3">
                {highlights.map((item, i) => (
                  <div key={`hl-${i}`} className="flex items-center gap-3 rounded-2xl border border-white/90 bg-white/74 px-4 py-3 shadow-[0_14px_36px_-30px_rgba(17,24,39,0.55)]">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-[#059669]" aria-hidden />
                    <span className="text-sm font-black text-[#111827]">{item}</span>
                  </div>
                ))}
              </div>

              <div className="grid gap-3 rounded-3xl border border-[#eadfce] bg-[#111827] p-4 text-white sm:grid-cols-3">
                <div className="rounded-2xl bg-white/8 p-4">
                  <FileScan className="h-5 w-5 text-[#8dfcf0]" aria-hidden />
                  <p className="mt-3 text-xs font-black uppercase tracking-[0.14em] text-white/58">Scan</p>
                  <p className="mt-1 text-sm font-black">מסמכים</p>
                </div>
                <div className="rounded-2xl bg-white/8 p-4">
                  <ShieldCheck className="h-5 w-5 text-[#8dfcf0]" aria-hidden />
                  <p className="mt-3 text-xs font-black uppercase tracking-[0.14em] text-white/58">CRM</p>
                  <p className="mt-1 text-sm font-black">לקוחות</p>
                </div>
                <div className="rounded-2xl bg-white/8 p-4">
                  <Sparkles className="h-5 w-5 text-[#8dfcf0]" aria-hidden />
                  <p className="mt-3 text-xs font-black uppercase tracking-[0.14em] text-white/58">AI</p>
                  <p className="mt-1 text-sm font-black">בקרה</p>
                </div>
              </div>

              <div className="rounded-3xl border border-[#eadfce] bg-[#f8efe3] p-5">
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-1 h-5 w-5 shrink-0 text-[#f9134d]" aria-hidden />
                  <div>
                    <p className="font-black text-[#111827]">{t("publicShell.authPanelTitle")}</p>
                    <p className="mt-2 text-sm font-semibold leading-7 text-[#607089]">{t("publicShell.authPanelBody")}</p>
                  </div>
                </div>
              </div>

              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm font-black text-[#607089] transition hover:text-[#111827]"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
                {t("publicShell.authViewNewSite")}
              </Link>
            </div>
          </div>
        </section>

        <section className="order-1 lg:order-2">
          <div className="mx-auto w-full max-w-lg">{children}</div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-[#eadfce] bg-white/74">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 text-xs font-semibold text-[#607089] sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <p>{t("publicShell.authFooterLead")}</p>
          <p>{t("publicShell.authFooterCopy", { year })}</p>
        </div>
      </footer>
    </div>
  );
}
