"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ScanLine,
  ReceiptText,
  BarChart3,
  Layers,
  Shield,
  Zap,
  Globe,
  Star,
  Users,
} from "lucide-react";
import LandingTutorialSection from "./LandingTutorialSection";
import PricingSection from "./PricingSection";

const FEATURES = [
  {
    icon: Layers,
    gradient: "from-blue-500 to-indigo-600",
    bg: "bg-blue-50 border-blue-100",
    title: "ERP ו-CRM בחלון אחד",
    desc: "מסמכי ERP וניהול לקוחות CRM מסונכרנים בזמן אמת. כשעסקה נסגרת — חשבונית נוצרת אוטומטית.",
  },
  {
    icon: ScanLine,
    gradient: "from-violet-500 to-purple-600",
    bg: "bg-violet-50 border-violet-100",
    title: "סריקת מסמכים AI",
    desc: "העלה כל חשבונית, קבלה או הצעת מחיר — בינה מלאכותית מפענחת ומארגנת הנתונים אוטומטית.",
  },
  {
    icon: ReceiptText,
    gradient: "from-indigo-500 to-blue-600",
    bg: "bg-indigo-50 border-indigo-100",
    title: "הנפקת חשבוניות",
    desc: "הנפק חשבוניות, קבלות ומסמכי מס תוך שניות — עם מספור אוטומטי ותבנית מקצועית.",
  },
  {
    icon: BarChart3,
    gradient: "from-emerald-500 to-teal-600",
    bg: "bg-emerald-50 border-emerald-100",
    title: "ניתוח פיננסי חי",
    desc: "תובנות AI יומיות, ניתוח מגמות הוצאות, זיהוי עליות מחירים — הכל אוטומטי.",
  },
  {
    icon: Users,
    gradient: "from-cyan-500 to-sky-600",
    bg: "bg-cyan-50 border-cyan-100",
    title: "פייפליין מכירות",
    desc: "עקוב אחר כל ליד מ-LEAD ועד CLOSED_WON, עם חיבור ישיר לחשבוניות ERP.",
  },
  {
    icon: Shield,
    gradient: "from-amber-500 to-orange-500",
    bg: "bg-amber-50 border-amber-100",
    title: "אבטחה ופרטיות",
    desc: "GDPR-compliant, נתונים בענן מאובטח, הצפנה מלאה. עמידה בתקנות האיחוד האירופי.",
  },
];

const STATS = [
  { value: "AI", label: "מנוע סריקה", icon: Zap },
  { value: "ERP+CRM", label: "סינכרון מלא", icon: Layers },
  { value: "99", label: "מ-₪99/חודש", icon: Star },
  { value: "30 יום", label: "ניסיון חינם", icon: CheckCircle2 },
];

export default function WizardHome() {
  return (
    <div className="min-h-screen bg-white" dir="rtl">

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/95 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-sm shadow-lg shadow-blue-600/30">
              B
            </div>
            <span className="font-black text-white text-lg tracking-tight">
              BSD<span className="text-blue-400">-YBM</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-1">
            <a href="#features" className="px-3 py-1.5 text-sm font-semibold text-slate-400 hover:text-white transition rounded-lg hover:bg-white/5">תכונות</a>
            <a href="#tutorial-videos" className="px-3 py-1.5 text-sm font-semibold text-slate-400 hover:text-white transition rounded-lg hover:bg-white/5">הדגמה</a>
            <a href="#pricing" className="px-3 py-1.5 text-sm font-semibold text-slate-400 hover:text-white transition rounded-lg hover:bg-white/5">מחירים</a>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-bold text-slate-300 hover:text-white transition rounded-xl hover:bg-white/10">
              התחבר
            </Link>
            <Link href="/register" className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500 transition shadow-sm shadow-blue-600/30">
              התחל חינם <ArrowLeft size={13} />
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden bg-slate-950 pb-20 pt-16">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 right-1/3 h-[600px] w-[600px] rounded-full bg-blue-600/10 blur-[120px]" />
          <div className="absolute -top-20 left-1/4 h-[400px] w-[400px] rounded-full bg-indigo-600/10 blur-[100px]" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-6 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-600/10 px-4 py-1.5 text-xs font-bold text-blue-400">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
              מערכת ERP + CRM ישראלית — עם AI
            </span>
          </div>
          <h1 className="text-center text-4xl font-black leading-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
            ניהול עסקי חכם
            <br />
            <span className="bg-gradient-to-l from-blue-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent">
              ERP ו-CRM בחלון אחד
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-center text-base leading-relaxed text-slate-400 sm:text-lg">
            סרוק מסמכים עם AI, נהל לקוחות ועסקאות, הנפק חשבוניות — הכל מסונכרן.
            <br className="hidden sm:block" />
            מנוי מ-₪99 לחודש. ניסיון חינם ל-30 יום.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/register" className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-7 py-3.5 text-base font-black text-white shadow-xl shadow-blue-600/30 hover:bg-blue-500 transition">
              התחל ניסיון חינם <ArrowLeft size={16} />
            </Link>
            <a href="#tutorial-videos" className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-800/60 px-7 py-3.5 text-base font-bold text-slate-300 hover:bg-slate-800 transition">
              ▶ צפה בהדגמה
            </a>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-500" /> ללא כרטיס אשראי</span>
            <span className="text-slate-700">·</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-500" /> ביטול בכל עת</span>
            <span className="text-slate-700">·</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-500" /> GDPR-compliant</span>
          </div>
          <div className="mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
            {STATS.map(({ value, label, icon: Icon }) => (
              <div key={label} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-center">
                <Icon size={16} className="mx-auto mb-2 text-blue-400" />
                <p className="text-xl font-black text-white">{value}</p>
                <p className="mt-0.5 text-[11px] font-medium text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HERO BOTTOM FADE */}
      <div style={{ background: "linear-gradient(to bottom, #020617 0%, #ffffff 100%)", height: "3rem" }} />

      {/* FEATURES */}
      <section id="features" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-indigo-700">
              <Zap size={11} /> מה המערכת עושה
            </span>
            <h2 className="mt-4 text-3xl font-black text-slate-900 sm:text-4xl">כל מה שעסק צריך — במקום אחד</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-slate-500">מ-ERP לסריקת מסמכים, מ-CRM לחשבוניות — מערכת אחת, תזרים עבודה אחד.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, gradient, bg, title, desc }) => (
              <div key={title} className={`group rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${bg}`}>
                <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-sm`}>
                  <Icon size={20} />
                </div>
                <h3 className="text-base font-black text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TUTORIAL VIDEOS */}
      <LandingTutorialSection />

      {/* HOW IT WORKS */}
      <section className="bg-slate-950 py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-black text-white sm:text-4xl">מתחילים תוך דקות — לא שבועות</h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-400">שלושה שלבים פשוטים להתחלת עבודה</p>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              { n: "01", title: "הרשמה חינם", desc: "צור חשבון תוך 30 שניות. לא צריך כרטיס אשראי." },
              { n: "02", title: "חבר את העסק", desc: "הזן פרטי חברה, הוסף לקוחות ראשונים, סרוק מסמך ראשון." },
              { n: "03", title: "עבוד בחכמה", desc: "ה-AI לומד את העסק שלך ומייצר תובנות ואוטומציות." },
            ].map(({ n, title, desc }) => (
              <div key={n} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-7">
                <span className="text-4xl font-black text-blue-500/40">{n}</span>
                <h3 className="mt-3 text-lg font-black text-white">{title}</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-10">
            <Link href="/register" className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-8 py-3.5 text-base font-black text-white shadow-xl shadow-blue-600/30 hover:bg-blue-500 transition">
              התחל עכשיו חינם <ArrowLeft size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <PricingSection />

      {/* FOOTER */}
      <footer className="bg-slate-950 border-t border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-black text-sm">B</div>
                <span className="font-black text-white">BSD-YBM</span>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">מערכת ERP + CRM ישראלית לניהול עסקי חכם עם בינה מלאכותית.</p>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-black text-white">מוצר</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><a href="#features" className="hover:text-white transition">תכונות</a></li>
                <li><a href="#pricing" className="hover:text-white transition">מחירים</a></li>
                <li><a href="#tutorial-videos" className="hover:text-white transition">הדגמה</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-black text-white">כניסה</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><Link href="/register" className="hover:text-white transition">הרשמה</Link></li>
                <li><Link href="/login" className="hover:text-white transition">התחברות</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-black text-white">משפטי</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><Link href="/privacy" className="hover:text-white transition">פרטיות</Link></li>
                <li><Link href="/terms" className="hover:text-white transition">תנאי שימוש</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-slate-800 pt-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-600">© 2026 BSD-YBM Platform. כל הזכויות שמורות.</p>
            <div className="flex items-center gap-3 text-xs text-slate-600">
              <Globe size={12} />
              <span>עברית · English · Русский</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
