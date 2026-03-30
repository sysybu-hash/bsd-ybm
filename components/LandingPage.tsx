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
      {/* גוון עדין תחת התמונה — לא לבן מלא שלא מכהה את הצילום */}
      <div className="fixed inset-0 z-0 bg-slate-400/30" aria-hidden />
      <div
        className="pointer-events-none fixed inset-0 z-[1] bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('/jerusalem-street.jpg')` }}
        aria-hidden
      />
      {/* ללא מסכה לבנה — רק טשטוש קל מלמעלה/מלמטה לניגוד טקסט בלי להסתיר את העיר */}
      <div
        className="pointer-events-none fixed inset-0 z-[2] bg-gradient-to-b from-slate-900/10 via-transparent to-slate-900/25"
        aria-hidden
      />

      <header className="relative z-50 flex items-center justify-between gap-3 border-b border-slate-200/90 bg-white/95 px-6 py-5 shadow-sm shadow-slate-200/40 backdrop-blur-md sm:px-8">
        <h1 className="text-3xl font-black italic tracking-tighter text-slate-900">
          BSD-<span className="text-blue-600">YBM</span>
        </h1>
        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-4">
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2.5 text-slate-800 transition hover:border-slate-300 hover:bg-slate-50 md:p-2"
            aria-label={t("marketingDrawer.openMenu")}
            aria-expanded={navOpen}
          >
            <Menu className="h-6 w-6" aria-hidden />
          </button>
          <LanguageSwitcher showLabel />
          <Link
            href="/login"
            className="text-sm font-bold text-slate-600 transition-colors hover:text-blue-700"
          >
            {t("nav.login")}
          </Link>
          <Link
            href="/register"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 px-6 py-2.5 text-sm font-black text-white shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02]"
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

          <p
            className="mt-8 max-w-2xl text-xl font-medium leading-relaxed text-slate-800 md:text-2xl [text-shadow:0_1px_18px_rgba(255,255,255,0.75),0_0_1px_rgba(255,255,255,0.9)]"
          >
            {t("landing.heroSubtitle")}
          </p>
        </div>

        <div className="flex w-full shrink-0 flex-wrap justify-center gap-4 pt-6">
          <Link
            href="#features"
            className="rounded-2xl border border-slate-200 bg-white px-8 py-4 text-lg font-bold text-slate-800 shadow-sm transition-all hover:border-blue-200 hover:bg-slate-50"
          >
            {t("landing.ctaDiscover")}
          </Link>
          <Link
            href="#tutorial-videos"
            className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50/90 px-8 py-4 text-lg font-bold text-blue-900 transition-all hover:bg-blue-100"
          >
            <Play size={20} className="opacity-90" aria-hidden />
            {t("landing.tutorialCta")}
          </Link>
          <Link
            href="/register"
            className="flex items-center gap-2 rounded-[2rem] bg-gradient-to-l from-blue-600 to-indigo-600 px-12 py-4 text-lg font-black text-white shadow-xl shadow-blue-500/30 transition-all hover:scale-[1.03]"
          >
            {t("landing.ctaStart")} <ChevronLeft size={20} />
          </Link>
        </div>
      </main>

      <LandingTutorialSection />

      <section
        id="features"
        className="relative z-30 mx-4 mb-24 rounded-[4rem] border border-slate-100 bg-white p-16 text-right shadow-2xl shadow-slate-200/50 md:mx-10 md:p-24"
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

      <footer className="relative z-50 border-t border-slate-200 bg-slate-100/90 p-10 text-center text-[10px] text-slate-500">
        <p className="font-bold uppercase tracking-widest italic flex items-center justify-center gap-3 flex-wrap">
          <Palette size={12} /> {t("landing.footerTagline")} | {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
