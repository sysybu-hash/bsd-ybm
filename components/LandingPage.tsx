"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Zap, Target, BarChart3, ChevronLeft, Bot, Palette, Play, Menu } from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import LandingTutorialSection from "@/components/landing/LandingTutorialSection";
import LandingHeroMetallicTitle from "@/components/landing/LandingHeroMetallicTitle";
import LandingNavDrawer from "@/components/landing/LandingNavDrawer";
import PricingSection from "@/components/landing/PricingSection";

export default function LandingPage() {
  const { t, dir } = useI18n();
  const [navOpen, setNavOpen] = useState(false);

  const featureCards = useMemo(
    () => [
      {
        title: t("landing.featureCrmTitle"),
        icon: <Bot className="text-blue-600" />,
        desc: t("landing.featureCrmDesc"),
      },
      {
        title: t("landing.featureInvTitle"),
        icon: <Target className="text-green-600" />,
        desc: t("landing.featureInvDesc"),
      },
      {
        title: t("landing.featureFlowTitle"),
        icon: <BarChart3 className="text-purple-600" />,
        desc: t("landing.featureFlowDesc"),
      },
    ],
    [t],
  );

  return (
    <div
      className="relative min-h-screen font-[var(--font-heading)] overflow-x-hidden text-right"
      dir={dir}
    >
      <div
        className="fixed inset-0 z-0 bg-slate-950 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('/jerusalem-street.jpg')` }}
      />
      {/* ללא טשטוש — רק עמעום קל לקריאות טקסט על השמש/בהירות */}
      <div
        className="pointer-events-none fixed inset-0 z-10 bg-gradient-to-b from-black/45 via-black/25 to-black/55"
        aria-hidden
      />

      <header className="relative z-50 flex items-center justify-between gap-3 px-6 py-5 sm:px-8 bg-black/25 border-b border-white/10">
        <h1 className="text-3xl font-black text-white italic tracking-tighter">
          BSD-<span className="text-blue-400">YBM</span>
        </h1>
        <div className="flex flex-wrap gap-2 sm:gap-4 items-center justify-end">
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 p-2.5 text-white transition hover:bg-white/15 md:p-2"
            aria-label={t("marketingDrawer.openMenu")}
            aria-expanded={navOpen}
          >
            <Menu className="h-6 w-6" aria-hidden />
          </button>
          <LanguageSwitcher tone="dark" showLabel />
          <Link
            href="/login"
            className="text-white/80 font-bold hover:text-white transition-colors text-sm"
          >
            {t("nav.login")}
          </Link>
          <Link
            href="/register"
            className="bg-gradient-to-tr from-blue-700 to-indigo-600 text-white px-6 py-2.5 rounded-xl font-black shadow-lg shadow-blue-200/50 hover:scale-105 transition-all text-sm flex items-center gap-2"
          >
            {t("landing.registerQuick")} <Zap size={14} />
          </Link>
        </div>
      </header>

      <LandingNavDrawer open={navOpen} onClose={setNavOpen} />

      {/* גובה מסך מלא פחות הכותרת — הכפתורים בתחתית המסך (לא תחתית העמוד) */}
      <main className="relative z-30 flex min-h-[calc(100svh-5.75rem)] flex-col px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-8 text-center md:min-h-[calc(100svh-6rem)] md:pb-[max(1.5rem,env(safe-area-inset-bottom))] md:pt-10">
        <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center px-1">
          <LandingHeroMetallicTitle text={t("landing.heroTitle")} />

          <p className="mt-8 max-w-2xl text-xl font-medium leading-relaxed text-slate-200 md:text-2xl">
            {t("landing.heroSubtitle")}
          </p>
        </div>

        <div className="flex w-full shrink-0 flex-wrap justify-center gap-4 pt-6">
          <Link
            href="#features"
            className="bg-white/10 text-white font-bold px-8 py-4 rounded-2xl hover:bg-white/20 transition-all text-lg"
          >
            {t("landing.ctaDiscover")}
          </Link>
          <Link
            href="#tutorial-videos"
            className="inline-flex items-center gap-2 border border-white/25 bg-white/5 text-white font-bold px-8 py-4 rounded-2xl hover:bg-white/10 transition-all text-lg"
          >
            <Play size={20} className="opacity-90" aria-hidden />
            {t("landing.tutorialCta")}
          </Link>
          <Link
            href="/register"
            className="bg-white text-blue-700 font-black px-12 py-4 rounded-[2rem] text-lg shadow-2xl shadow-white/20 hover:scale-[1.03] transition-all flex items-center gap-2"
          >
            {t("landing.ctaStart")} <ChevronLeft size={20} />
          </Link>
        </div>
      </main>

      <LandingTutorialSection />

      <section
        id="features"
        className="relative z-30 bg-white rounded-[4rem] p-16 md:p-24 mx-4 md:mx-10 mb-24 shadow-2xl shadow-black/20 text-right"
        dir={dir}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {featureCards.map((feat) => (
            <div
              key={feat.title}
              className="bg-slate-50 p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/20 group hover:border-blue-200 hover:bg-white transition-all"
            >
              <div className="p-4 bg-white rounded-2xl group-hover:bg-blue-50 transition-colors w-fit mb-6 shadow-sm">
                {feat.icon}
              </div>
              <p className="text-slate-500 font-bold text-sm uppercase tracking-wider">{feat.title}</p>
              <h3 className="text-2xl font-black text-slate-800 mt-2 leading-snug">{feat.desc}</h3>
            </div>
          ))}
        </div>
      </section>

      <div dir={dir}>
        <PricingSection />
      </div>

      <footer className="relative z-50 p-10 text-center text-slate-400 text-[10px] bg-black/60 border-t border-white/5">
        <p className="font-bold uppercase tracking-widest italic flex items-center justify-center gap-3 flex-wrap">
          <Palette size={12} /> {t("landing.footerTagline")} | {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
