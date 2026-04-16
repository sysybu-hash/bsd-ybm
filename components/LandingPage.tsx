"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Zap, Target, BarChart3, ChevronLeft, ChevronRight,
  Bot, Play, Menu, ShieldCheck, FileText, Users,
  BrainCircuit, CheckCircle2, ArrowRight, Star,
  TrendingUp, Globe, Lock, Cpu, Sparkles,
} from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import LandingTutorialSection from "@/components/landing/LandingTutorialSection";
import LandingNavDrawer from "@/components/landing/LandingNavDrawer";
import PricingSection from "@/components/landing/PricingSection";

export default function LandingPage() {
  const { t, dir } = useI18n();
  const [navOpen, setNavOpen] = useState(false);

  const featureCards = useMemo(() => [
    {
      title: t("landing.featureCrmTitle"),
      icon: <Users size={22} />,
      desc: t("landing.featureCrmDesc"),
      color: "blue",
      gradient: "from-indigo-500 to-indigo-600",
      bg: "bg-indigo-500/15",
      iconColor: "text-indigo-400",
    },
    {
      title: t("landing.featureInvTitle"),
      icon: <BarChart3 size={22} />,
      desc: t("landing.featureInvDesc"),
      color: "emerald",
      gradient: "from-emerald-500 to-teal-600",
      bg: "bg-emerald-500/15",
      iconColor: "text-emerald-400",
    },
    {
      title: t("landing.featureFlowTitle"),
      icon: <BrainCircuit size={22} />,
      desc: t("landing.featureFlowDesc"),
      color: "indigo",
      gradient: "from-indigo-500 to-sky-500",
      bg: "bg-indigo-500/15",
      iconColor: "text-indigo-400",
    },
  ], [t]);

  const stats = [
    { value: "פרויקט", label: "מסמכים ואתרים במקום אחד" },
    { value: "מקצוע", label: "התאמת AI לסוג העסק" },
    { value: "שטח", label: "נוכחות וצוותים" },
    { value: "ענן", label: "גישה מכל אתר" },
  ];

  const trustItems = [
    { icon: <Lock size={14} />,       text: "אבטחה וסשנים מאובטחים" },
    { icon: <Cpu size={14} />,        text: "מנועי AI מרובים לפי מנוי" },
    { icon: <Globe size={14} />,      text: "מותאם לקבלנים ומקצועות נלווים" },
    { icon: <Sparkles size={14} />,   text: "CRM · ERP · מסמכים במערכת אחת" },
  ];

  const chevron = dir === "rtl"
    ? <ChevronLeft size={16} />
    : <ChevronRight size={16} />;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-white text-gray-900" dir={dir}>

      {/* ══════════════════════════════════
          NAVBAR
      ══════════════════════════════════ */}
      <header className="sticky top-0 z-50 border-b border-gray-200/80 bg-white/95 shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-xl font-black italic tracking-tight">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-900 text-xs font-black shadow"
              style={{ backgroundColor: "var(--primary-color)" }}
            >B</span>
            <span style={{ color: "var(--primary-color)" }}>BSD-</span>
            <span className="text-gray-900">YBM · בנייה</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-6 md:flex">
            {[
              ["/product", "המוצר"],
              ["/solutions", "פתרונות"],
              ["#features", "יכולות"],
              ["#pricing", "תמחור"],
            ].map(([href, label]) => (
              <Link
                key={href + label}
                href={href}
                className="text-sm font-semibold text-gray-600 transition-colors hover:text-[color:var(--primary-color)]"
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Mobile menu */}
            <button
              type="button"
              onClick={() => setNavOpen(true)}
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 p-2.5 text-gray-600 hover:bg-gray-50 transition-colors md:hidden"
              aria-label="פתח תפריט"
            >
              <Menu className="h-5 w-5" />
            </button>

            <LanguageSwitcher />

            <Link
              href="/login"
              className="hidden text-sm font-semibold text-gray-600 transition-colors hover:text-[color:var(--primary-color)] sm:inline px-2 py-1.5"
            >
              {t("nav.login")}
            </Link>

            <Link
              href="/register?plan=FREE"
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:opacity-90 hover:scale-[1.02]"
              style={{ backgroundColor: "var(--primary-color)" }}
            >
              {t("landing.registerQuick")} <Zap size={13} />
            </Link>
          </div>
        </div>
      </header>

      <LandingNavDrawer open={navOpen} onClose={setNavOpen} />

      {/* ══════════════════════════════════
          HERO — Dark gradient
      ══════════════════════════════════ */}
      <section
        className="relative overflow-hidden border-b border-gray-200/80"
        style={{
          background: "linear-gradient(180deg, #fffdf9 0%, #f6f1eb 55%, #f8fafc 100%)",
        }}
      >
        {/* Mesh overlay */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `
              radial-gradient(ellipse 80% 60% at 50% -10%, rgba(193,89,47,.12) 0%, transparent 60%),
              radial-gradient(ellipse 50% 50% at 90% 90%, rgba(12,74,110,.08) 0%, transparent 50%)
            `,
          }}
          aria-hidden
        />

        {/* Dot grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='1' cy='1' r='1' fill='%23ffffff'/%3E%3C/svg%3E")`,
            backgroundSize: "24px 24px",
          }}
          aria-hidden
        />

        <div className="relative mx-auto max-w-7xl px-4 py-24 text-center sm:px-6 md:py-32 lg:py-44">

          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-orange-200/80 bg-orange-50/90 px-4 py-2 text-xs font-bold text-[color:var(--primary-color)] shadow-sm">
            <CheckCircle2 size={13} className="text-[color:var(--primary-color)]" />
            נבנה לענף הבנייה והמקצועות הנלווים — מסמכים, כסף ופרויקטים
          </div>

          {/* H1 */}
          <h1 className="mx-auto max-w-4xl text-4xl font-black leading-[1.12] tracking-tight text-gray-900 sm:text-5xl md:text-6xl lg:text-7xl">
            {t("landing.heroTitle")}
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-6 max-w-2xl text-lg font-medium leading-relaxed text-gray-500 sm:text-xl">
            {t("landing.heroSubtitle")}
          </p>

          {/* CTA buttons */}
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link
              href="/register?plan=FREE"
              className="inline-flex items-center gap-2 rounded-2xl px-8 py-4 text-base font-black text-white shadow-xl transition-all hover:scale-[1.02] hover:brightness-105"
              style={{
                backgroundColor: "var(--primary-color)",
                boxShadow: "0 20px 40px -12px rgba(193, 89, 47, 0.45)",
              }}
            >
              {t("landing.ctaStart")} {chevron}
            </Link>
            <Link
              href="#tutorial-videos"
              className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-8 py-4 text-base font-bold text-gray-700 shadow-sm transition-all hover:bg-gray-50"
            >
              <Play size={16} className="text-[color:var(--primary-color)]" />
              {t("landing.tutorialCta")}
            </Link>
          </div>

          {/* Trust strip */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {trustItems.map((item, i) => (
              <span key={i} className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                <span className="text-[color:var(--primary-color)]">{item.icon}</span>
                {item.text}
              </span>
            ))}
          </div>

          {/* Stats bar */}
          <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4 max-w-2xl mx-auto">
            {stats.map((s) => (
              <div
                key={s.value}
                className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <p className="text-2xl font-black text-[color:var(--primary-color)]">{s.value}</p>
                <p className="mt-1 text-xs font-semibold text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom fade */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24"
          style={{ background: "linear-gradient(to bottom, transparent, #ffffff)" }}
          aria-hidden
        />
      </section>

      {/* ══════════════════════════════════
          TUTORIAL VIDEOS
      ══════════════════════════════════ */}
      <div className="bg-gray-50">
        <LandingTutorialSection />
      </div>

      {/* ══════════════════════════════════
          FEATURES
      ══════════════════════════════════ */}
      <section id="features" className="bg-gray-50 py-20 sm:py-28" dir={dir}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6">

          <div className="mb-14 text-center">
            <span className="section-badge">יכולות ליבה</span>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
              מהמשרד לשטח — כלים אחידים לענף הבנייה
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-gray-500">
              ניהול לקוחות וספקים, מסמכים ותזרים, סריקות AI מותאמות למקצוע — בלי לפצל בין מערכות.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {featureCards.map((feat) => (
              <div
                key={feat.title}
                className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-orange-200/80"
              >
                {/* Top gradient bar */}
                <div className={`absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r ${feat.gradient} opacity-80`} aria-hidden />

                <div className={`mb-5 inline-flex rounded-2xl p-3.5 ${feat.bg}`}>
                  <span className={feat.iconColor}>{feat.icon}</span>
                </div>

                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{feat.title}</p>
                <h3 className="mt-2 text-xl font-black leading-snug text-gray-900">{feat.desc}</h3>

                <div className={`mt-6 inline-flex items-center gap-1 text-xs font-bold ${feat.iconColor} opacity-0 transition-opacity group-hover:opacity-100`}>
                  גלו עוד {chevron}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/register"
              className="btn-primary text-base px-8 py-3.5"
            >
              {t("landing.ctaStart")} {chevron}
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          WHY US — Social proof strip
      ══════════════════════════════════ */}
      <section className="border-y border-orange-100 bg-orange-50/50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center">
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {[1,2,3,4,5].map(i => <Star key={i} size={18} className="fill-amber-400 text-amber-400" />)}
          </div>
          <p className="text-2xl font-black text-gray-900 sm:text-3xl max-w-2xl mx-auto">
            &ldquo;סוף סדר: חשבוניות ספק, אתרים ולקוחות באותה מערכת — הצוות בשטח רואה מה המשרד סגר&rdquo;
          </p>
          <p className="mt-4 text-sm font-semibold text-gray-400">מנהל פרויקטים, חברת בנייה</p>
        </div>
      </section>

      {/* ══════════════════════════════════
          PRICING
      ══════════════════════════════════ */}
      <div dir={dir} className="bg-gray-50">
        <PricingSection />
      </div>

      {/* ══════════════════════════════════
          FOOTER
      ══════════════════════════════════ */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <Link href="/" className="flex items-center gap-1.5 text-xl font-black italic tracking-tight">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-900 text-xs font-black" style={{ backgroundColor: "var(--primary-color)" }}>B</span>
              <span style={{ color: "var(--primary-color)" }}>BSD-</span>
              <span className="text-gray-900">YBM</span>
            </Link>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold text-gray-500">
              {[
                ["/about",   "אודות"],
                ["/contact", "צור קשר"],
                ["/legal",   "משפטי"],
                ["/privacy", "פרטיות"],
                ["/terms",   "תנאים"],
              ].map(([href, label]) => (
                <Link key={href} href={href} className="hover:text-gray-900 transition-colors">{label}</Link>
              ))}
            </div>

            <p className="text-[11px] text-gray-400">
              © {new Date().getFullYear()} BSD-YBM · {t("landing.footerTagline")}
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
