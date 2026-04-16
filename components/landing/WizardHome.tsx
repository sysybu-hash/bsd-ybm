"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ReceiptText,
  Layers,
  Shield,
  Zap,
  Globe,
  Users,
  Brain,
  TrendingUp,
  Lock,
  ChevronRight,
  ScanLine,
  BarChart3,
  Sparkles,
  Bell,
  FileText,
  MessageSquare,
  Activity,
  RefreshCw,
  AlertCircle,
  X,
  Check,
} from "lucide-react";
import LandingTutorialSection from "./LandingTutorialSection";
import PricingSection from "./PricingSection";

/* ─── Rotating headlines ────────────────────────────────────────────────── */
const ROLES = [
  { he: "לבעל העסק", en: "for the business owner" },
  { he: "לרואה חשבון", en: "for the accountant" },
  { he: "לאיש המכירות", en: "for the sales rep" },
  { he: "למנהל הכספים", en: "for the CFO" },
];

/* ─── AI Live feed items ────────────────────────────────────────────────── */
const AI_FEED = [
  { icon: Bell, text: "נשלחה תזכורת תשלום ל-3 לקוחות", color: "text-amber-400" },
  { icon: TrendingUp, text: "ספק ABC העלה מחיר ב-14% — נמצאה חלופה", color: "text-emerald-400" },
  { icon: ReceiptText, text: "חשבונית #1042 הונפקה אוטומטית", color: "text-sky-400" },
  { icon: AlertCircle, text: "תזרים מזומנים: צפוי חוסר ב-18 יום", color: "text-rose-400" },
  { icon: Brain, text: "נסרקו ועובדו 7 מסמכים חדשים", color: "text-teal-400" },
  { icon: Activity, text: "תחזית הכנסות Q2: +23% לעומת Q1", color: "text-teal-400" },
];

/* ─── Feature tabs ──────────────────────────────────────────────────────── */
const FEATURE_TABS = [
  {
    id: "ai-docs",
    label: "Document AI",
    icon: ScanLine,
    title: "כל מסמך הוא intelligence",
    desc: "לא סתם OCR — הבנה סמנטית עמוקה. המערכת מזהה, מסווגת, ומחברת כל מסמך לגורם הנכון אוטומטית. חשבוניות נכנסות, הצעות מחיר, חוזים — הכל מובן וניתן לפעולה.",
    points: [
      "זיהוי אוטומטי של ספק / סכום / תאריך",
      "התאמה לרשומות CRM קיימות",
      "איתור סתירות ומחירים חריגים",
      "אחסון והשוואה היסטורית",
    ],
    accent: "from-teal-500 to-cyan-500",
  },
  {
    id: "predictive",
    label: "Predictive Finance",
    icon: TrendingUp,
    title: "לא רטרוספקטיבה — עתיד",
    desc: "תחזית תזרים מזומנים ל-30/60/90 יום קדימה. המערכת לומדת את הדפוסים שלך ומתריעה לפני שיש בעיה — לא אחריה.",
    points: [
      "תחזית תזרים מזומנים AI",
      "זיהוי מוקדם של לקוחות מסוכנים",
      "ניתוח מגמות הוצאות",
      "התראות חכמות על חריגות תקציב",
    ],
    accent: "from-emerald-500 to-teal-500",
  },
  {
    id: "autonomous",
    label: "Autonomous Actions",
    icon: RefreshCw,
    title: "המערכת פועלת בשבילך",
    desc: "ה-AI לא מחכה לך. הוא מזהה מצבים ופועל: שולח תזכורות, מנפיק מסמכים, מציע חלופות לספקים, ומעדכן את ה-CRM אוטומטית.",
    points: [
      "תזכורות תשלום אוטומטיות",
      "הנפקת חשבוניות מחוזים",
      "עדכון סטטוס עסקאות CRM",
      "התראות ייחודיות לפי תפקיד",
    ],
    accent: "from-orange-500 to-amber-500",
  },
  {
    id: "conversational",
    label: "Conversational ERP",
    icon: MessageSquare,
    title: "שאל את העסק שלך",
    desc: 'שאל "כמה הרווחתי החודש?" — קבל תשובה. בשפה טבעית, בעברית, אנגלית או רוסית. לא עוד reports — שיחה.',
    points: [
      "שאלות בשפה טבעית בכל שפה",
      "תשובות עם ניתוח ולא רק נתונים",
      "אינטגרציה לכל מודול במערכת",
      "היסטוריית שיחות לפי הקשר עסקי",
    ],
    accent: "from-sky-500 to-cyan-500",
  },
];

/* ─── Comparison ────────────────────────────────────────────────────────── */
const COMPARE_FEATURES = [
  "AI מובנה בכל פעולה",
  "תחזית תזרים עתידי",
  "ERP + CRM מסונכרן",
  "פעולות אוטומטיות",
  "שיחה בשפה טבעית",
  "ריבוי שפות מלא",
  "חשבוניות ישראל",
  "ניתוח ספקים AI",
];
const COMPARE_COLS = [
  { name: "BSD-YBM", highlight: true, vals: [true, true, true, true, true, true, true, true] },
  { name: "Priority", highlight: false, vals: [false, false, true, false, false, false, true, false] },
  { name: "iCount", highlight: false, vals: [false, false, false, false, false, false, true, false] },
  { name: "Monday", highlight: false, vals: [false, false, false, true, false, false, false, false] },
];

/* ─── Component ───────────────────────────────────────────────────────────── */

export default function WizardHome() {
  const [roleIdx, setRoleIdx] = useState(0);
  const [feedIdx, setFeedIdx] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setFadeIn(false);
      setTimeout(() => {
        setRoleIdx((i) => (i + 1) % ROLES.length);
        setFadeIn(true);
      }, 300);
    }, 2800);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setFeedIdx((i) => (i + 1) % AI_FEED.length), 3200);
    return () => clearInterval(id);
  }, []);

  const feedItem = AI_FEED[feedIdx];
  const FeedIcon = feedItem.icon;

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden" dir="rtl">

      {/* ════════════════ NAVBAR ════════════════ */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/85 backdrop-blur-2xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-[60px] flex items-center justify-between gap-4">

          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 font-black text-sm shadow-lg shadow-teal-500/30">
              <span>B</span>
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-[#050508]" />
            </div>
            <span className="font-black text-gray-900 text-[15px] tracking-tight">
              BSD<span className="text-teal-500">-YBM</span>
            </span>
          </div>

          {/* AI Live ticker */}
          <div className="hidden lg:flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3.5 py-1.5 text-[11px] font-medium text-gray-500 max-w-xs overflow-hidden">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400 animate-pulse" />
            <span className={`truncate transition-opacity duration-300 ${feedItem.color}`}>
              AI: {feedItem.text}
            </span>
          </div>

          {/* Links */}
          <div className="hidden md:flex items-center gap-0.5">
            {[["#features", "יכולות"], ["#compare", "השוואה"], ["#tutorial-videos", "הדגמה"], ["#pricing", "מחירים"]].map(([href, label]) => (
              <a key={href} href={href}
                className="px-3 py-2 text-[13px] font-medium text-gray-500 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-50">
                {label}
              </a>
            ))}
          </div>

          {/* CTA */}
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/login"
              className="hidden sm:inline-flex items-center px-3 py-2 text-[13px] font-medium text-gray-500 hover:text-gray-900 transition rounded-lg hover:bg-gray-50">
              התחבר
            </Link>
            <Link href="/register"
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-[13px] font-bold text-white hover:bg-teal-700 transition shadow-sm">
              ניסיון חינם <ArrowLeft size={12} />
            </Link>
          </div>

        </div>
      </nav>

      {/* ════════════════ HERO ════════════════ */}
      <section className="relative overflow-hidden pt-20 pb-28">

        {/* Mesh gradient */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 right-1/4 h-[700px] w-[700px] rounded-full bg-teal-600/[0.18] blur-[140px]" />
          <div className="absolute top-1/2 left-0 h-[400px] w-[400px] rounded-full bg-teal-700/[0.12] blur-[100px]" />
          <div className="absolute bottom-0 right-0 h-[300px] w-[300px] rounded-full bg-sky-600/[0.08] blur-[80px]" />
          {/* Grid */}
          <div className="absolute inset-0 opacity-[0.025]"
            style={{ backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)", backgroundSize: "56px 56px" }} />
        </div>

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 text-center">

          {/* Badge */}
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-1.5 text-[11px] font-semibold text-teal-600 backdrop-blur-sm">
            <Sparkles size={11} />
            הדור הבא של ניהול עסקי — Powered by AI
          </div>

          {/* Main headline */}
          <h1 className="text-[52px] font-black leading-[1.06] tracking-tight text-gray-900 sm:text-[64px] md:text-[80px] lg:text-[96px]">
            The Business OS
            <br />
            <span className="bg-gradient-to-l from-teal-400 via-cyan-400 to-sky-400 bg-clip-text text-transparent">
              {" "}המיועד לך
            </span>
          </h1>

          {/* Rotating role sub */}
          <div className="mt-5 h-8 flex items-center justify-center">
            <p className={`text-lg font-bold text-gray-400 transition-opacity duration-300 ${fadeIn ? "opacity-100" : "opacity-0"}`}>
              חכם יותר •&nbsp;
              <span className="text-gray-700">{ROLES[roleIdx].he}</span>
            </p>
          </div>

          {/* Description */}
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-gray-500 sm:text-[17px]">
            לא עוד ERP שמתעד. לא עוד CRM שמאכסן. מערכת הפעלה לעסק שפועלת בשבילך —
            מנתחת, מחליטה, ומבצעת. מ-₪99 לחודש.
          </p>

          {/* CTAs */}
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link href="/register"
              className="group relative inline-flex items-center gap-2 rounded-xl bg-teal-600 px-8 py-3.5 text-[15px] font-bold text-white shadow-lg shadow-teal-600/25 transition hover:bg-teal-700">
              <span className="absolute inset-0 rounded-xl bg-white/10 opacity-0 transition group-hover:opacity-100" />
              התחל ניסיון חינם — 30 יום
              <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-0.5" />
            </Link>
            <a href="#features"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-8 py-3.5 text-[15px] font-bold text-gray-600 transition hover:bg-gray-50">
              גלה את היכולות <ChevronRight size={15} className="rotate-180" />
            </a>
          </div>

          {/* Trust strip */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {([
              [CheckCircle2, "ללא כרטיס אשראי"],
              [Shield, "GDPR & חשבוניות ישראל"],
              [Globe, "עברית · English · العربية · Русский"],
              [Zap, "הגדרה תוך 3 דקות"],
            ] as const).map(([Icon, text], i) => (
              <span key={i} className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400">
                <Icon size={11} className="text-teal-400 shrink-0" />
                {text}
              </span>
            ))}
          </div>

          {/* Stats grid */}
          <div className="mx-auto mt-14 grid max-w-xl grid-cols-2 gap-2.5 sm:grid-cols-4">
            {[
              { v: "AI-First", l: "ארכיטקטורה" },
              { v: "4 שפות", l: "ממשק מלא" },
              { v: "₪99", l: "החל מ-/חודש" },
              { v: "30 יום", l: "ניסיון חינם" },
            ].map(({ v, l }) => (
              <div key={l} className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-center">
                <p className="text-[17px] font-black text-gray-900">{v}</p>
                <p className="mt-0.5 text-[10px] font-medium text-gray-400">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ THE PROBLEM ════════════════ */}
      <section className="border-t border-gray-100 py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-rose-500">הבעיה האמיתית</p>
            <h2 className="text-3xl font-black text-gray-900 sm:text-4xl">עסקים מפסידים שעות כל יום</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { n: "4+ שעות", t: "ניירת ידנית", d: "העברת נתונים בין מערכות, הזנה ידנית, שגיאות." },
              { n: "₪12K+", t: "הפסדים שנתיים", d: "מחשבוניות שלא נשלחו בזמן ותשלומים שנשכחו." },
              { n: "3 מערכות", t: "שלא מדברות", d: "ERP, CRM, הנהלת חשבונות — כל אחד בנפרד." },
              { n: "0", t: "תחזיות עתידיות", d: "כל הכלים הקיימים מסתכלים אחורה — לא קדימה." },
            ].map(({ n, t, d }) => (
              <div key={t} className="rounded-2xl border border-rose-500/[0.15] bg-rose-500/[0.04] p-5">
                <p className="text-2xl font-black text-rose-400">{n}</p>
                <p className="mt-1 text-sm font-bold text-gray-900">{t}</p>
                <p className="mt-1.5 text-[12px] leading-relaxed text-gray-500">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ FEATURE TABS ════════════════ */}
      <section id="features" className="border-t border-gray-100 py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-teal-500">מה גורם לנו להיות שונים</p>
            <h2 className="text-3xl font-black text-gray-900 sm:text-4xl">AI שפועל — לא רק מציג</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-gray-500">
              ארבע יכולות ליבה שלא קיימות בשום מוצר אחר בשוק הישראלי.
            </p>
          </div>

          {/* Tab bar */}
          <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
            {FEATURE_TABS.map((tab, i) => {
              const Icon = tab.icon;
              const active = activeTab === i;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(i)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-bold transition-all ${
                    active
                      ? "bg-teal-600 text-white shadow-lg shadow-teal-600/20"
                      : "border border-gray-200 text-gray-500 hover:border-teal-300 hover:text-gray-800"
                  }`}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          {FEATURE_TABS.map((tab, i) => {
            const Icon = tab.icon;
            if (i !== activeTab) return null;
            return (
              <div key={tab.id} className="grid gap-6 lg:grid-cols-2 items-center">
                {/* Text */}
                <div>
                  <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${tab.accent}`}>
                    <Icon size={22} className="text-white" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900">{tab.title}</h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-gray-500">{tab.desc}</p>
                  <ul className="mt-5 space-y-2.5">
                    {tab.points.map((p) => (
                      <li key={p} className="flex items-start gap-2.5 text-sm text-gray-600">
                        <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-teal-400" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
                {/* Visual card */}
                <div className={`rounded-3xl border border-gray-200 bg-gradient-to-br ${tab.accent}/[0.07] p-7 min-h-[260px] flex flex-col justify-between`}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`h-2 w-2 rounded-full bg-gradient-to-br ${tab.accent}`} />
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Live Preview</span>
                  </div>
                  <div className="space-y-3">
                    {tab.points.map((p, idx) => (
                      <div key={p} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5">
                        <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${tab.accent} text-[10px] font-black text-white`}>
                          {idx + 1}
                        </div>
                        <span className="text-[12px] text-gray-600">{p}</span>
                        <CheckCircle2 size={13} className="mr-auto text-teal-400 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ════════════════ HOW IT WORKS ════════════════ */}
      <section className="border-t border-gray-100 py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-teal-500">איך מתחילים</p>
          <h2 className="text-3xl font-black text-gray-900 sm:text-4xl">מ-0 לפעיל תוך 3 דקות</h2>
          <div className="mt-12 grid gap-4 sm:grid-cols-3 text-right">
            {[
              { n: "01", title: "הרשמה חינם", desc: "ללא כרטיס אשראי. הגדרת פרטי הארגון וסוג העוסק.", icon: Users },
              { n: "02", title: "חבר ויבא", desc: "ייבא לקוחות, סרוק מסמך ראשון, הנפק חשבונית ראשונה.", icon: FileText },
              { n: "03", title: "ה-AI לוקח אחריות", desc: "מכאן המערכת לומדת, מנתחת, ומפעילה פעולות אוטומטית.", icon: Brain },
            ].map(({ n, title, desc, icon: Icon }, idx) => (
              <div key={n} className="relative rounded-2xl border border-gray-200 bg-gray-50 p-7">
                {idx < 2 && (
                  <ArrowLeft size={14} className="absolute -left-3 top-1/2 hidden -translate-y-1/2 text-gray-200 sm:block" />
                )}
                <div className="mb-3 flex items-center gap-3">
                  <span className="text-4xl font-black text-gray-100">{n}</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/20">
                    <Icon size={16} className="text-teal-400" />
                  </div>
                </div>
                <h3 className="text-base font-bold text-gray-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-10">
            <Link href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-8 py-3.5 text-[15px] font-bold text-white shadow-xl shadow-teal-600/20 transition hover:bg-teal-700">
              פתח חשבון חינם <ArrowLeft size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════ COMPARISON ════════════════ */}
      <section id="compare" className="border-t border-gray-100 py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-teal-500">מדוע BSD-YBM</p>
            <h2 className="text-3xl font-black text-gray-900 sm:text-4xl">השוואה כנה עם המתחרים</h2>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-200">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="py-4 px-5 text-right text-[11px] font-bold text-gray-400 uppercase tracking-widest w-1/3">יכולת</th>
                  {COMPARE_COLS.map((col) => (
                    <th key={col.name} className={`py-4 px-4 text-center text-[13px] font-black ${col.highlight ? "text-teal-600" : "text-gray-400"}`}>
                      {col.highlight && <span className="mr-1 text-[9px] text-teal-500">★</span>}
                      {col.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARE_FEATURES.map((feat, fi) => (
                  <tr key={feat} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="py-3.5 px-5 text-[13px] text-gray-600">{feat}</td>
                    {COMPARE_COLS.map((col) => (
                      <td key={col.name} className="py-3.5 px-4 text-center">
                        {col.vals[fi] ? (
                          <Check size={16} className={`mx-auto ${col.highlight ? "text-teal-500" : "text-gray-300"}`} />
                        ) : (
                          <X size={14} className="mx-auto text-gray-200" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ════════════════ TUTORIAL VIDEOS ════════════════ */}
      <section id="tutorial-videos" className="border-t border-gray-100 bg-white">
        <LandingTutorialSection />
      </section>

      {/* ════════════════ PRICING ════════════════ */}
      <section id="pricing" className="bg-white">
        <PricingSection />
      </section>

      {/* ════════════════ BOTTOM CTA ════════════════ */}
      <section className="border-t border-gray-100 py-32">
        <div className="relative mx-auto max-w-3xl px-4 text-center">
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-[500px] w-[700px] rounded-full bg-teal-600/[0.12] blur-[120px]" />
          </div>
          <div className="relative">
            <p className="mb-4 text-[11px] font-bold uppercase tracking-widest text-teal-500">העתיד של ניהול עסקי</p>
            <h2 className="text-4xl font-black text-gray-900 sm:text-5xl lg:text-6xl leading-tight">
              הצטרף לעסקים
              <br />
              <span className="bg-gradient-to-l from-teal-400 via-cyan-400 to-sky-400 bg-clip-text text-transparent">
                שעובדים חכם יותר
              </span>
            </h2>
            <p className="mx-auto mt-5 max-w-md text-base text-gray-400">
              30 יום ניסיון מלא. ללא כרטיס אשראי. ביטול בכל עת ללא תנאים.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-9 py-4 text-[15px] font-bold text-white shadow-xl shadow-teal-600/25 transition hover:bg-teal-700">
                התחל ניסיון חינם <ArrowLeft size={15} />
              </Link>
              <Link href="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-9 py-4 text-[15px] font-bold text-gray-600 transition hover:bg-gray-50">
                יש לי חשבון
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════ FOOTER ════════════════ */}
      <footer className="border-t border-gray-100 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-5">

            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-white font-black text-sm">B</div>
                <span className="font-black text-gray-900 text-[15px]">BSD<span className="text-teal-500">-YBM</span></span>
              </div>
              <p className="text-[12px] text-gray-400 leading-relaxed max-w-[220px]">
                The Business OS — מערכת הפעלה לעסק עם AI מובנה. ERP + CRM + Financial Intelligence בממשק אחד.
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-[11px] text-gray-400">
                <Globe size={11} />
                <span>עברית · English · العربية · Русский</span>
              </div>
            </div>

            {/* Links */}
            {[
              { title: "מוצר", links: [["#features", "יכולות AI"], ["#compare", "השוואה"], ["#pricing", "מחירים"], ["#tutorial-videos", "הדגמה"]] },
              { title: "כניסה", links: [["/register", "הרשמה חינם"], ["/login", "התחברות"], ["/demo", "דמו חי"]] },
              { title: "חברה", links: [["/privacy", "פרטיות"], ["/terms", "תנאי שימוש"], ["/about", "אודות"]] },
            ].map(({ title, links }) => (
              <div key={title}>
                <h4 className="mb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{title}</h4>
                <ul className="space-y-2.5">
                  {links.map(([href, label]) => (
                    <li key={href}>
                      <Link href={href} className="text-[12px] text-gray-400 hover:text-gray-700 transition">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-7">
            <p className="text-[11px] text-gray-400">© BSD-YBM BSD-YBM Platform Ltd. כל הזכויות שמורות.</p>
            <div className="flex items-center gap-2 text-[11px] text-gray-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>כל המערכות פעילות</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}