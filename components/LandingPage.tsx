"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Zap,
  ChevronLeft,
  ChevronRight,
  Menu,
  ShieldCheck,
  FileText,
  Users,
  BrainCircuit,
  CheckCircle2,
  BarChart3,
  HardHat,
  LineChart,
  Share2,
  Sparkles,
  LayoutDashboard,
} from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import LandingTutorialSection from "@/components/landing/LandingTutorialSection";
import LandingNavDrawer from "@/components/landing/LandingNavDrawer";
import PricingSection from "@/components/landing/PricingSection";
import BsdYbmLogo from "@/components/brand/BsdYbmLogo";

export default function LandingPage() {
  const { t, dir } = useI18n();
  const [navOpen, setNavOpen] = useState(false);

  const featureCards = useMemo(
    () => [
      {
        title: t("landing.featureCrmTitle"),
        icon: Users,
        desc: t("landing.featureCrmDesc"),
      },
      {
        title: t("landing.featureInvTitle"),
        icon: BarChart3,
        desc: t("landing.featureInvDesc"),
      },
      {
        title: t("landing.featureFlowTitle"),
        icon: BrainCircuit,
        desc: t("landing.featureFlowDesc"),
      },
      {
        title: t("landing.featureOpsTitle"),
        icon: HardHat,
        desc: t("landing.featureOpsDesc"),
      },
      {
        title: t("landing.featureIntelTitle"),
        icon: LineChart,
        desc: t("landing.featureIntelDesc"),
      },
      {
        title: t("landing.featurePortalTitle"),
        icon: Share2,
        desc: t("landing.featurePortalDesc"),
      },
    ],
    [t],
  );

  const chevron = dir === "rtl" ? <ChevronLeft size={16} /> : <ChevronRight size={16} />;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-white text-slate-900" dir={dir}>
      {/* ═══ Top: dark bar — ניווט על רקע כהה ═══ */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[color:var(--marketing-hero-bg)]/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <BsdYbmLogo variant="marketing-dark" size="md" />

          <nav className="hidden items-center gap-7 md:flex">
            {[
              ["/", t("landing.navHome")],
              ["#features", t("landing.navFeatures")],
              ["/solutions", t("landing.navSolutions")],
              ["/pricing", t("landing.navPricing")],
              ["/contact", t("landing.navSupport")],
            ].map(([href, label]) => (
              <Link
                key={href + label}
                href={href}
                className="text-sm font-semibold text-slate-300 transition hover:text-white"
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setNavOpen(true)}
              className="inline-flex items-center justify-center rounded-xl border border-white/15 p-2.5 text-slate-200 hover:bg-white/10 md:hidden"
              aria-label="פתח תפריט"
            >
              <Menu className="h-5 w-5" />
            </button>
            <LanguageSwitcher />
            <Link
              href="/login"
              className="hidden rounded-xl border border-white/40 bg-white px-4 py-2 text-sm font-bold text-slate-900 shadow-sm transition hover:bg-slate-100 sm:inline-flex"
            >
              {t("nav.login")}
            </Link>
            <Link
              href="/register?plan=FREE"
              className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[color:var(--marketing-hero-accent)] bg-transparent px-4 py-2 text-sm font-bold text-[color:var(--marketing-accent-soft)] transition hover:bg-[color:var(--marketing-hero-accent)]/10"
            >
              {t("landing.registerQuick")} <Zap size={13} />
            </Link>
          </div>
        </div>
      </header>

      <LandingNavDrawer open={navOpen} onClose={setNavOpen} />

      {/* ═══ Hero — כהה, דו-עמודתי RTL ═══ */}
      <section
        className="relative border-b border-white/5 bg-[color:var(--marketing-hero-bg)] text-white"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 90% 70% at 100% 0%, rgba(20, 184, 166, 0.12), transparent 55%), radial-gradient(ellipse 60% 50% at 0% 100%, rgba(59, 130, 246, 0.06), transparent 50%)",
        }}
      >
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:items-center md:py-24 lg:py-28">
          <div className="order-2 text-center md:order-1 md:text-right">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[color:var(--marketing-hero-accent)]/40 bg-[color:var(--marketing-hero-accent)]/10 px-4 py-2 text-xs font-bold text-[color:var(--marketing-accent-soft)]">
              <CheckCircle2 size={14} className="shrink-0" />
              {t("landing.heroKicker")}
            </div>
            <h1 className="text-4xl font-black leading-[1.12] tracking-tight sm:text-5xl lg:text-6xl">
              {t("landing.heroTitle")}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg md:mr-0 md:ml-auto">
              {t("landing.heroSubtitle")}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3 md:justify-start">
              <Link
                href="/register?plan=FREE"
                className="inline-flex items-center gap-2 rounded-2xl border-2 border-[color:var(--marketing-hero-accent)] px-7 py-3.5 text-base font-black text-[color:var(--marketing-accent-soft)] transition hover:bg-[color:var(--marketing-hero-accent)]/15"
              >
                {t("landing.ctaTrial")} {chevron}
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-3.5 text-base font-black text-slate-900 shadow-lg transition hover:bg-slate-100"
              >
                {t("landing.ctaDemo")}
              </Link>
            </div>
          </div>

          <div className="order-1 md:order-2">
            <div className="relative mx-auto max-w-lg rounded-2xl border border-white/10 bg-slate-900/50 p-4 shadow-2xl backdrop-blur-sm">
              <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-xs font-bold text-slate-400">{t("landing.mockDashboardTitle")}</span>
                <LayoutDashboard className="h-4 w-4 text-[color:var(--marketing-accent-soft)]" aria-hidden />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-xl bg-white/5 p-3 text-center">
                    <p className="text-[10px] font-bold text-slate-500">{t("landing.mockKpiLabel")}</p>
                    <p className="mt-1 text-lg font-black text-white">{i === 1 ? "24" : i === 2 ? "₪1.2M" : "94%"}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 h-24 rounded-xl bg-gradient-to-t from-[#14b8a6]/20 to-transparent p-3">
                <div className="h-full rounded-lg bg-white/5" />
              </div>
              <Sparkles className="absolute -left-2 -top-2 h-8 w-8 text-[color:var(--marketing-accent-soft)] opacity-80" aria-hidden />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Tutorial ═══ */}
      <div className="bg-slate-100/80">
        <LandingTutorialSection />
      </div>

      {/* ═══ Features — רשת 3×2 על רקע לבן ═══ */}
      <section id="features" className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              {t("landing.featuresGridTitle")}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600">{t("landing.featuresGridSubtitle")}</p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featureCards.map((feat) => (
              <article
                key={feat.title}
                className="group rounded-2xl border border-slate-200/80 bg-slate-50/50 p-7 shadow-sm transition hover:-translate-y-0.5 hover:border-[color:var(--v2-accent)]/35 hover:shadow-md"
              >
                <div className="mb-4 inline-flex rounded-2xl border border-[color:var(--v2-accent)]/25 bg-[color:var(--v2-accent-soft)] p-3.5 text-[color:var(--v2-accent-strong)]">
                  <feat.icon size={24} strokeWidth={2} aria-hidden />
                </div>
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">{feat.title}</p>
                <p className="mt-2 text-lg font-bold leading-snug text-slate-900">{feat.desc}</p>
              </article>
            ))}
          </div>

          <div className="mt-14 flex flex-col items-stretch justify-between gap-6 rounded-2xl border border-slate-200 bg-slate-50 px-6 py-8 sm:flex-row sm:items-center sm:px-10">
            <p className="text-lg font-black text-slate-900">{t("landing.readyCtaTitle")}</p>
            <Link
              href="/register?plan=FREE"
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-slate-900 px-8 py-3.5 text-sm font-black text-white transition hover:bg-slate-800"
            >
              {t("landing.readyCtaButton")}
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ Pricing ═══ */}
      <div dir={dir} className="bg-white">
        <PricingSection />
      </div>

      {/* ═══ Footer — כהה ═══ */}
      <footer className="border-t border-white/10 bg-[color:var(--marketing-hero-bg)] text-slate-400">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-8 lg:flex-row">
            <BsdYbmLogo variant="footer-dark" size="md" href="/" />
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm font-semibold">
              {[
                ["/about", t("landing.footerAbout")],
                ["/contact", t("landing.footerContact")],
                ["/legal", t("landing.footerLegal")],
                ["/privacy", t("landing.footerPrivacy")],
                ["/terms", t("landing.footerTerms")],
              ].map(([href, label]) => (
                <Link key={href} href={href} className="transition hover:text-white">
                  {label}
                </Link>
              ))}
            </div>
            <p className="text-center text-xs text-slate-500">
              © {new Date().getFullYear()} BSD-YBM · {t("landing.footerTagline")}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
