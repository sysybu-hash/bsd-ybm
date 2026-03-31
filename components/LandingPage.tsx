"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Zap,
  Target,
  BarChart3,
  ChevronLeft,
  Bot,
  Play,
  Menu,
  ShieldCheck,
  FileText,
  Users,
  BrainCircuit,
  CheckCircle2,
} from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import LandingTutorialSection from "@/components/landing/LandingTutorialSection";
import LandingNavDrawer from "@/components/landing/LandingNavDrawer";
import PricingSection from "@/components/landing/PricingSection";

export default function LandingPage() {
  const { t, dir } = useI18n();
  const [navOpen, setNavOpen] = useState(false);

  const featureCards = useMemo(
    () => [
      {
        title: t("landing.featureCrmTitle"),
        icon: <Bot size={22} className="text-blue-600" />,
        desc: t("landing.featureCrmDesc"),
        bg: "bg-blue-50",
        border: "border-blue-100",
        iconBg: "bg-blue-100",
      },
      {
        title: t("landing.featureInvTitle"),
        icon: <Target size={22} className="text-emerald-600" />,
        desc: t("landing.featureInvDesc"),
        bg: "bg-emerald-50/60",
        border: "border-emerald-100",
        iconBg: "bg-emerald-100",
      },
      {
        title: t("landing.featureFlowTitle"),
        icon: <BarChart3 size={22} className="text-indigo-600" />,
        desc: t("landing.featureFlowDesc"),
        bg: "bg-indigo-50/60",
        border: "border-indigo-100",
        iconBg: "bg-indigo-100",
      },
    ],
    [t],
  );

  const trustItems = [
    { icon: <ShieldCheck size={16} />, text: "אבטחת JWT + OAuth 2.0" },
    { icon: <FileText size={16} />, text: "Gemini + OpenAI / Claude" },
    { icon: <Users size={16} />, text: "Multi-Tenant מלא" },
    { icon: <BrainCircuit size={16} />, text: "AI בזמן אמת" },
  ];

  return (
    <div
      className="relative min-h-screen overflow-x-hidden bg-white text-slate-900"
      dir={dir}
    >
      {/* ═══════════════ NAVBAR ═══════════════ */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          {/* לוגו */}
          <Link href="/" className="flex items-center gap-1 text-2xl font-black italic tracking-tighter">
            <span style={{ color: "var(--primary-color, #2563eb)" }}>BSD-</span>
            <span className="text-slate-900">YBM</span>
          </Link>

          {/* ניווט מרכזי — desktop */}
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="#features" className="text-sm font-medium text-slate-600 transition hover:text-blue-700">
              {t("landing.featureCrmTitle")}
            </Link>
            <Link href="#tutorial-videos" className="text-sm font-medium text-slate-600 transition hover:text-blue-700">
              הדגמות
            </Link>
            <Link href="#pricing" className="text-sm font-medium text-slate-600 transition hover:text-blue-700">
              מחירים
            </Link>
          </nav>

          {/* כפתורי פעולה */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setNavOpen(true)}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700 transition hover:bg-slate-50 md:hidden"
              aria-label={t("marketingDrawer.openMenu")}
              aria-expanded={navOpen}
            >
              <Menu className="h-5 w-5" aria-hidden />
            </button>
            <LanguageSwitcher />
            <Link
              href="/login"
              className="hidden text-sm font-bold text-slate-600 transition hover:text-blue-700 sm:inline"
            >
              {t("nav.login")}
            </Link>
            <Link
              href="/register"
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-black text-white shadow-sm transition hover:opacity-90"
              style={{ backgroundColor: "var(--primary-color, #2563eb)" }}
            >
              {t("landing.registerQuick")} <Zap size={13} />
            </Link>
          </div>
        </div>
      </header>

      <LandingNavDrawer open={navOpen} onClose={setNavOpen} />

      {/* ═══════════════ HERO ═══════════════ */}
      <section className="relative overflow-hidden bg-white">
        {/* גרדיאנט רקע */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `
              radial-gradient(ellipse 80% 60% at 60% -10%, rgba(37,99,235,0.07) 0%, transparent 60%),
              radial-gradient(ellipse 60% 50% at 0% 80%, rgba(99,102,241,0.05) 0%, transparent 55%)
            `,
          }}
          aria-hidden
        />
        {/* נקודות דקורטיביות */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='22' height='22' viewBox='0 0 22 22' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='1' cy='1' r='0.8' fill='%2394a3b8'/%3E%3C/svg%3E")`,
            backgroundSize: "22px 22px",
          }}
          aria-hidden
        />

        <div className="relative mx-auto max-w-7xl px-4 py-24 text-center sm:px-6 md:py-32 lg:py-40">
          {/* Badge */}
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-bold text-blue-700 shadow-sm">
            <CheckCircle2 size={13} />
            פלטפורמת ניהול עסקי — Made in Israel
          </p>

          {/* Hero title */}
          <h1 className="mx-auto max-w-4xl text-4xl font-black leading-tight tracking-tight text-slate-900 sm:text-5xl md:text-6xl lg:text-7xl">
            {t("landing.heroTitle")}
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-6 max-w-2xl text-lg font-medium leading-relaxed text-slate-600 sm:text-xl">
            {t("landing.heroSubtitle")}
          </p>

          {/* CTA buttons */}
          <div className="mt-10 flex flex-wrap justify-center gap-3 sm:gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-2xl px-8 py-4 text-base font-black text-white shadow-lg shadow-blue-600/25 transition hover:opacity-90 hover:scale-[1.02]"
              style={{ backgroundColor: "var(--primary-color, #2563eb)" }}
            >
              {t("landing.ctaStart")} <ChevronLeft size={18} />
            </Link>
            <Link
              href="#tutorial-videos"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-8 py-4 text-base font-bold text-slate-800 shadow-sm transition hover:border-blue-200 hover:bg-slate-50"
            >
              <Play size={18} className="text-blue-500" aria-hidden />
              {t("landing.tutorialCta")}
            </Link>
            <Link
              href="#features"
              className="inline-flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 px-8 py-4 text-base font-bold text-blue-700 transition hover:bg-blue-100"
            >
              {t("landing.ctaDiscover")}
            </Link>
          </div>

          {/* Trust strip */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {trustItems.map((item, i) => (
              <span key={i} className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <span className="text-blue-400">{item.icon}</span>
                {item.text}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ VIDEO TUTORIALS ═══════════════ */}
      <LandingTutorialSection />

      {/* ═══════════════ FEATURES ═══════════════ */}
      <section
        id="features"
        className="bg-slate-50/80 py-20 sm:py-28"
        dir={dir}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {/* כותרת section */}
          <div className="mb-14 text-center">
            <span className="inline-block rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-blue-700">
              יכולות ליבה
            </span>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              כל מה שהעסק שלכם צריך
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm font-medium text-slate-500 sm:text-base">
              מערכת All-in-One המשלבת AI, ניהול לקוחות ותפעול — בממשק אחד
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {featureCards.map((feat) => (
              <div
                key={feat.title}
                className={`rounded-3xl border p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${feat.bg} ${feat.border}`}
              >
                <div className={`mb-5 inline-flex rounded-2xl p-3 ${feat.iconBg}`}>
                  {feat.icon}
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{feat.title}</p>
                <h3 className="mt-2 text-xl font-black leading-snug text-slate-900">{feat.desc}</h3>
              </div>
            ))}
          </div>

          {/* CTA תחתית */}
          <div className="mt-12 text-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-2xl px-8 py-3.5 text-sm font-black text-white shadow-md transition hover:opacity-90"
              style={{ backgroundColor: "var(--primary-color, #2563eb)" }}
            >
              {t("landing.ctaStart")} <ChevronLeft size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════ PRICING ═══════════════ */}
      <div dir={dir}>
        <PricingSection />
      </div>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <Link href="/" className="text-xl font-black italic tracking-tighter" style={{ color: "var(--primary-color, #2563eb)" }}>
              BSD-<span className="text-slate-900">YBM</span>
            </Link>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-slate-500">
              <Link href="/about" className="hover:text-slate-800">אודות</Link>
              <Link href="/contact" className="hover:text-slate-800">צור קשר</Link>
              <Link href="/legal" className="hover:text-slate-800">משפטי</Link>
              <Link href="/privacy" className="hover:text-slate-800">פרטיות</Link>
              <Link href="/terms" className="hover:text-slate-800">תנאים</Link>
            </div>
            <p className="text-[11px] text-slate-400">
              © {new Date().getFullYear()} BSD-YBM · {t("landing.footerTagline")}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
