"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Zap, Target, BarChart3, ChevronLeft, Bot, Palette, Play } from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import LandingTutorialSection from "@/components/landing/LandingTutorialSection";

export default function LandingPage() {
  const { t, dir } = useI18n();

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

  const pricingTiers = useMemo(
    () => [
      {
        plan: t("landing.planFreeLabel"),
        price: t("landing.planFreePrice"),
        sub: t("landing.planFreeSub"),
        features: [
          t("landing.planFreeF1"),
          t("landing.planFreeF2"),
          t("landing.planFreeF3"),
          t("landing.planFreeF4"),
        ],
        popular: false,
        badgeClass: "bg-slate-100 text-slate-700",
        cardClass:
          "bg-white p-12 rounded-[3.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100",
        zapClass: "text-slate-400",
        ctaClass:
          "mt-12 w-full block bg-gradient-to-tr from-slate-700 to-indigo-600 text-white px-8 py-5 rounded-2xl font-black shadow-lg shadow-slate-300/50 text-center hover:scale-[1.03] transition-all text-lg",
      },
      {
        plan: t("landing.planProLabel"),
        price: t("landing.planProPrice"),
        sub: t("landing.planProSub"),
        features: [
          t("landing.planProF1"),
          t("landing.planProF2"),
          t("landing.planProF3"),
          t("landing.planProF4"),
          t("landing.planProF5"),
        ],
        popular: true,
        badgeClass: "bg-blue-100 text-blue-700",
        cardClass:
          "bg-white p-12 rounded-[3.5rem] shadow-2xl shadow-blue-200/40 border-4 border-blue-200 ring-4 ring-blue-100 relative",
        zapClass: "text-blue-500",
        ctaClass:
          "mt-12 w-full block bg-gradient-to-tr from-blue-700 to-indigo-600 text-white px-8 py-5 rounded-2xl font-black shadow-lg shadow-blue-200/50 text-center hover:scale-[1.03] transition-all text-lg",
      },
      {
        plan: t("landing.planEntLabel"),
        price: t("landing.planEntPrice"),
        sub: t("landing.planEntSub"),
        features: [
          t("landing.planEntF1"),
          t("landing.planEntF2"),
          t("landing.planEntF3"),
          t("landing.planEntF4"),
          t("landing.planEntF5"),
        ],
        popular: false,
        badgeClass: "bg-indigo-100 text-indigo-700",
        cardClass:
          "bg-white p-12 rounded-[3.5rem] shadow-2xl shadow-indigo-200/40 border border-indigo-100",
        zapClass: "text-indigo-500",
        ctaClass:
          "mt-12 w-full block bg-gradient-to-tr from-indigo-700 to-indigo-600 text-white px-8 py-5 rounded-2xl font-black shadow-lg shadow-indigo-200/50 text-center hover:scale-[1.03] transition-all text-lg",
      },
    ],
    [t],
  );

  return (
    <div
      className="relative min-h-screen font-[var(--font-heading)] overflow-hidden text-right"
      dir={dir}
    >
      <div
        className="fixed inset-0 z-0 bg-slate-950 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('/jerusalem-bg.jpg')` }}
      />
      <div className="fixed inset-0 z-10 bg-black/60 backdrop-blur-md" />

      <header className="relative z-50 p-6 flex justify-between items-center bg-black/20 border-b border-white/10">
        <h1 className="text-3xl font-black text-white italic tracking-tighter">
          BSD-<span className="text-blue-400">YBM</span>
        </h1>
        <div className="flex flex-wrap gap-3 sm:gap-4 items-center justify-end">
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

      <main className="relative z-30 pt-32 pb-24 flex flex-col items-center justify-center text-center px-4">
        <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-300/30 mb-10 border-4 border-white/20 animate-pulse">
          <Palette className="text-white" size={36} />
        </div>

        <h2 className="text-6xl md:text-7xl font-black text-white leading-none tracking-tighter max-w-4xl mx-auto">
          {t("landing.heroTitle")}
        </h2>

        <p className="max-w-2xl text-xl md:text-2xl text-slate-200 mt-8 leading-relaxed font-medium">
          {t("landing.heroSubtitle")}
        </p>

        <div className="flex gap-4 mt-16 flex-wrap justify-center">
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

      <section
        id="pricing"
        className="relative z-30 bg-slate-50 rounded-[4rem] p-16 md:p-24 mx-4 md:mx-10 mb-24 shadow-2xl shadow-black/10 text-right border border-white"
        dir={dir}
      >
        <div className="text-center mb-16">
          <span className="bg-indigo-100 text-indigo-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
            {t("landing.pricingBadge")}
          </span>
          <h3 className="text-5xl font-black text-slate-900 tracking-tighter mt-4">
            {t("landing.pricingHeadline")}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-16 items-start">
          {pricingTiers.map((tier) => (
            <div key={tier.plan} className={tier.cardClass}>
              {tier.popular ? (
                <span className="absolute -top-4 left-10 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-lg">
                  {t("landing.pricingPopular")}
                </span>
              ) : null}
              <span
                className={`inline-block px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${tier.badgeClass}`}
              >
                {tier.plan}
              </span>
              <h4 className="text-5xl font-black text-slate-900 mt-6 leading-none">{tier.price}</h4>
              <p className="text-sm text-slate-400 mt-1 font-medium">{tier.sub}</p>
              <ul className="mt-10 space-y-5 text-slate-600 font-medium text-lg">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-center gap-3">
                    <Zap size={16} className={`shrink-0 ${tier.zapClass}`} /> {f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className={tier.ctaClass}>
                {t("landing.pricingChoose")}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <footer className="relative z-50 p-10 text-center text-slate-400 text-[10px] bg-black/60 border-t border-white/5">
        <p className="font-bold uppercase tracking-widest italic flex items-center justify-center gap-3 flex-wrap">
          <Palette size={12} /> {t("landing.footerTagline")} | {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
