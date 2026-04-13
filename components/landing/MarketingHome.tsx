"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  BarChart3,
  Bot,
  BrainCircuit,
  Building2,
  CheckCircle2,
  CreditCard,
  FileText,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { marketingSans } from "@/lib/fonts/marketing-fonts";
import { ADMIN_SUBSCRIPTION_TIER_OPTIONS, tierAllowance, tierLabelHe } from "@/lib/subscription-tier-config";

const navItems = [
  { href: "/#product", label: "המוצר" },
  { href: "/#workflows", label: "זרימות עבודה" },
  { href: "/solutions", label: "פתרונות" },
  { href: "/pricing", label: "תמחור" },
  { href: "/about", label: "אודות" },
  { href: "/contact", label: "יצירת קשר" },
];

const featureCards = [
  {
    icon: UsersRound,
    title: "CRM שמזיז עבודה קדימה",
    body: "תיקי לקוח, משימות, תזכורות וסטטוסים במקום אחד, בלי לקפוץ בין כלים.",
  },
  {
    icon: CreditCard,
    title: "חיוב ומסמכים עסקיים",
    body: "חשבוניות, גבייה, מנויים ומעקב כספי בתוך אותה מערכת עבודה.",
  },
  {
    icon: BrainCircuit,
    title: "AI שמוטמע בתוך התהליך",
    body: "לא עוד צ'אט מנותק. ה-AI עובד בתוך הלקוחות, המסמכים, הבקרה וההחלטות.",
  },
];

const modules = [
  {
    title: "מסמכים חכמים",
    body: "סריקה, חילוץ, סיווג ויצירת מסמכים מתוך הפעילות האמיתית של העסק.",
    icon: ScanSearch,
  },
  {
    title: "שליטה תפעולית",
    body: "משימות, מעקבים, תהליכים פנימיים והודעות פעולה במקום אחד ברור.",
    icon: ShieldCheck,
  },
  {
    title: "תובנות ניהוליות",
    body: "תמונה חיה של הכנסות, עומסים, חריגות והזדמנויות, בלי דו\"חות מנותקים.",
    icon: BarChart3,
  },
  {
    title: "שכבת AI אחידה",
    body: "הצעות פעולה, ניסוחים, ניתוחים ותשובות בהקשר המדויק של הארגון שלך.",
    icon: Bot,
  },
];

const workflowSteps = [
  "לקוח או מסמך נכנסים למערכת",
  "BSD-YBM מזהה הקשר, משימות וסיכונים",
  "המערכת מעדכנת CRM, מסמכים וחיוב",
  "הצוות מקבל תמונת מצב והמלצה לפעולה הבאה",
];

const industries = ["משרדי עורכי דין", "רואי חשבון", "קבלנים", "קליניקות", "נדל\"ן", "עסקים מבוססי שירות"];

const proofPoints = [
  "פחות כפילויות בין CRM, מסמכים וחיוב",
  "פחות אדמין ידני לצוות",
  "פחות החמצות של משימות וגבייה",
  "יותר החלטות מתוך תמונת מצב אחת",
];

const planCards = ADMIN_SUBSCRIPTION_TIER_OPTIONS.map((tier) => {
  const allowance = tierAllowance(tier);
  return {
    tier,
    label: tierLabelHe(tier),
    price: allowance.monthlyPriceIls == null ? "בתיאום" : `₪${allowance.monthlyPriceIls}`,
    summary: `${allowance.cheapScans} זולות · ${allowance.premiumScans} פרימיום · ${
      allowance.unlimitedCompanies ? "ללא הגבלת חברות" : `עד ${allowance.maxCompanies} חברות`
    }`,
    featured: tier === "DEALER",
  };
});

function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[color:var(--v2-line)] bg-[color:var(--v2-surface)]/88 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 text-[color:var(--v2-ink)]">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--v2-accent)] text-sm font-black text-white shadow-[0_18px_40px_-20px_rgba(193,89,47,0.85)]">
            BY
          </span>
          <span className="flex flex-col">
            <span className="text-base font-black tracking-[-0.04em] sm:text-lg">BSD-YBM</span>
            <span className="text-[11px] font-semibold text-[color:var(--v2-muted)]">
              מערכת תפעול חכמה לעסקים מקצועיים
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-semibold text-[color:var(--v2-muted)] transition hover:text-[color:var(--v2-ink)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/login" className="v2-button v2-button-ghost hidden sm:inline-flex">
            כניסה
          </Link>
          <Link href="/register" className="v2-button v2-button-primary">
            התחלת עבודה
          </Link>
        </div>
      </div>
    </header>
  );
}

function PublicFooter() {
  return (
    <footer className="border-t border-[color:var(--v2-line)] bg-[color:var(--v2-surface)]">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.5fr_1fr] lg:px-8">
        <div className="space-y-3">
          <p className="text-lg font-black text-[color:var(--v2-ink)]">BSD-YBM</p>
          <p className="max-w-2xl text-sm leading-7 text-[color:var(--v2-muted)]">
            מערכת תפעול אינטליגנטית שמחברת לקוחות, מסמכים, חיוב, שליטה ניהולית ו-AI בתוך סביבת עבודה אחת.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="font-semibold text-[color:var(--v2-muted)] transition hover:text-[color:var(--v2-ink)]"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <span className="v2-eyebrow">{children}</span>;
}

export default function MarketingHome() {
  return (
    <div className={`${marketingSans.className} v2-site-shell`} dir="rtl">
      <PublicHeader />

      <main>
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0">
            <div className="v2-orb v2-orb-primary" />
            <div className="v2-orb v2-orb-secondary" />
            <div className="v2-grid-overlay" />
          </div>

          <div className="relative mx-auto grid max-w-7xl gap-16 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:pb-24 lg:pt-20">
            <div className="space-y-8">
              <SectionLabel>BSD-YBM v2</SectionLabel>
              <div className="space-y-5">
                <h1 className="max-w-3xl text-5xl font-black leading-[0.92] tracking-[-0.06em] text-[color:var(--v2-ink)] sm:text-6xl lg:text-7xl">
                  מערכת אחת שמסדרת את העבודה, המסמכים וההחלטות של העסק.
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-[color:var(--v2-muted)] sm:text-xl">
                  BSD-YBM מחברת CRM, מסמכים, חיוב, בקרה ו-AI בתוך סביבת עבודה אחת שנבנתה לעסקים מקצועיים בישראל.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/register" className="v2-button v2-button-primary">
                  פתיחת חשבון
                  <ArrowLeft className="h-4 w-4" aria-hidden />
                </Link>
                <Link href="/demo" className="v2-button v2-button-secondary">
                  לראות הדגמה
                  <ArrowUpRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {featureCards.map(({ icon: Icon, title, body }) => (
                  <article key={title} className="v2-panel v2-panel-soft p-5">
                    <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--v2-accent-soft)] text-[color:var(--v2-accent)]">
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <h2 className="text-lg font-black text-[color:var(--v2-ink)]">{title}</h2>
                    <p className="mt-2 text-sm leading-7 text-[color:var(--v2-muted)]">{body}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-4 top-6 hidden rounded-[28px] border border-white/60 bg-white/80 px-4 py-3 shadow-[0_30px_70px_-35px_rgba(15,23,42,0.45)] backdrop-blur sm:block">
                <p className="text-xs font-bold text-[color:var(--v2-muted)]">תשומת לב ניהולית</p>
                <p className="mt-1 text-sm font-black text-[color:var(--v2-ink)]">3 פריטים דורשים טיפול היום</p>
              </div>

              <div className="v2-dashboard-frame">
                <div className="flex items-center justify-between border-b border-[color:var(--v2-line)] px-5 py-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.28em] text-[color:var(--v2-muted)]">
                      Operational Intelligence
                    </p>
                    <p className="mt-2 text-xl font-black text-[color:var(--v2-ink)]">לוח תפעולי חי</p>
                  </div>
                  <span className="rounded-full bg-[color:var(--v2-success-soft)] px-3 py-1 text-xs font-bold text-[color:var(--v2-success)]">
                    פעילות תקינה
                  </span>
                </div>

                <div className="grid gap-4 p-5">
                  <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="v2-panel p-4">
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-[color:var(--v2-muted)]">פוקוס להיום</p>
                          <p className="text-lg font-black text-[color:var(--v2-ink)]">לקוחות, מסמכים, חיוב</p>
                        </div>
                        <Sparkles className="h-5 w-5 text-[color:var(--v2-accent)]" aria-hidden />
                      </div>
                      <Image
                        src="/demo/bsd-ybm-demo-hero-desktop.png"
                        alt="תצוגת הדשבורד של BSD-YBM"
                        width={1400}
                        height={880}
                        className="rounded-[22px] border border-[color:var(--v2-line)] object-cover"
                        priority
                      />
                    </div>

                    <div className="grid gap-4">
                      <div className="v2-panel p-4">
                        <p className="text-sm font-bold text-[color:var(--v2-muted)]">המלצת מערכת</p>
                        <p className="mt-2 text-lg font-black text-[color:var(--v2-ink)]">
                          7 מסמכים זוהו ומוכנים לשיוך אוטומטי
                        </p>
                        <p className="mt-2 text-sm leading-7 text-[color:var(--v2-muted)]">
                          המערכת זיהתה לקוחות, סכומים וסטטוסים ומציעה את הצעד הבא לכל פריט.
                        </p>
                      </div>
                      <div className="v2-panel p-4">
                        <p className="text-sm font-bold text-[color:var(--v2-muted)]">בקרה פיננסית</p>
                        <div className="mt-4 grid grid-cols-2 gap-3">
                          {[
                            { label: "גבייה פתוחה", value: "₪48,200" },
                            { label: "חשבוניות השבוע", value: "32" },
                            { label: "משימות דחופות", value: "11" },
                            { label: "פניות חדשות", value: "19" },
                          ].map((item) => (
                            <div key={item.label} className="rounded-2xl bg-[color:var(--v2-canvas)] p-3">
                              <p className="text-xs font-bold text-[color:var(--v2-muted)]">{item.label}</p>
                              <p className="mt-2 text-base font-black text-[color:var(--v2-ink)]">{item.value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    {proofPoints.map((point) => (
                      <div key={point} className="flex items-center gap-3 rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-3">
                        <CheckCircle2 className="h-5 w-5 text-[color:var(--v2-success)]" aria-hidden />
                        <span className="text-sm font-semibold text-[color:var(--v2-ink)]">{point}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="product" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mb-10 max-w-3xl space-y-4">
            <SectionLabel>מוצר אחד, שכבות עבודה ברורות</SectionLabel>
            <h2 className="text-3xl font-black tracking-[-0.05em] text-[color:var(--v2-ink)] sm:text-5xl">
              כל מודול נבנה כדי לשרת את התהליך, לא כדי לחיות לבד.
            </h2>
            <p className="text-lg leading-8 text-[color:var(--v2-muted)]">
              BSD-YBM לא מוכרת אוסף פיצ&apos;רים. היא בונה רצף עבודה: קליטה, עיבוד, פעולה, גבייה, ובקרה.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {modules.map(({ title, body, icon: Icon }) => (
              <article key={title} className="v2-panel p-6">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--v2-canvas)] text-[color:var(--v2-accent)]">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-5 text-xl font-black text-[color:var(--v2-ink)]">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-[color:var(--v2-muted)]">{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="workflows" className="border-y border-[color:var(--v2-line)] bg-[color:var(--v2-surface)]/72">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
            <div className="space-y-4">
              <SectionLabel>זרימת עבודה חיה</SectionLabel>
              <h2 className="text-3xl font-black tracking-[-0.05em] text-[color:var(--v2-ink)] sm:text-5xl">
                מה קורה מהרגע שנכנס מידע חדש למערכת?
              </h2>
              <p className="text-lg leading-8 text-[color:var(--v2-muted)]">
                במקום צוות שמדביק תהליכים ידנית, BSD-YBM מחברת בין הנתונים, מציעה פעולה, ומתעדת הכול בזמן אמת.
              </p>
            </div>

            <div className="grid gap-4">
              {workflowSteps.map((step, index) => (
                <div key={step} className="v2-panel flex items-start gap-4 p-5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--v2-accent)] text-sm font-black text-white">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-lg font-black text-[color:var(--v2-ink)]">{step}</p>
                    <p className="mt-2 text-sm leading-7 text-[color:var(--v2-muted)]">
                      שכבת העבודה הבאה מתעדכנת אוטומטית, כך שהצוות רואה תמיד מה השתנה ומה צריך לקרות עכשיו.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="v2-panel p-8">
              <SectionLabel>התאמה לענפים</SectionLabel>
              <h2 className="mt-4 text-3xl font-black tracking-[-0.05em] text-[color:var(--v2-ink)] sm:text-4xl">
                בנוי לעסקים עם עומס תפעולי אמיתי.
              </h2>
              <p className="mt-4 text-base leading-8 text-[color:var(--v2-muted)]">
                משרדים, קליניקות, קבלנים ועסקים מבוססי שירות צריכים מערכת שעובדת עם מסמכים, עם לקוחות ועם כסף. לא רק עם רשימות.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                {industries.map((industry) => (
                  <span key={industry} className="rounded-full border border-[color:var(--v2-line)] bg-[color:var(--v2-canvas)] px-4 py-2 text-sm font-bold text-[color:var(--v2-ink)]">
                    {industry}
                  </span>
                ))}
              </div>
            </div>

            <div className="v2-panel v2-panel-highlight overflow-hidden p-0">
              <div className="border-b border-[color:var(--v2-line)] px-6 py-5">
                <SectionLabel>למה זה עובד</SectionLabel>
                <h3 className="mt-3 text-2xl font-black text-[color:var(--v2-ink)]">המערכת חושבת כמו סביבת תפעול, לא כמו אוסף מסכים.</h3>
              </div>
              <div className="grid gap-0 divide-y divide-[color:var(--v2-line)]">
                {[
                  ["מקור אמת אחד", "לקוחות, מסמכים, משימות, חיוב ותובנות נשענים על אותה תמונה תפעולית."],
                  ["שפה אחידה", "הצוות לא לומד חמישה כלים שונים כדי להניע את העבודה."],
                  ["AI עם הקשר", "ההמלצות נוצרות מתוך הנתונים של העסק ולא מתוך prompt כללי."],
                ].map(([title, body]) => (
                  <div key={title} className="flex gap-4 px-6 py-5">
                    <BadgeCheck className="mt-1 h-5 w-5 shrink-0 text-[color:var(--v2-accent)]" aria-hidden />
                    <div>
                      <p className="font-black text-[color:var(--v2-ink)]">{title}</p>
                      <p className="mt-2 text-sm leading-7 text-[color:var(--v2-muted)]">{body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="plans" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mb-10 max-w-3xl space-y-4">
            <SectionLabel>מנויים והצטרפות</SectionLabel>
            <h2 className="text-3xl font-black tracking-[-0.05em] text-[color:var(--v2-ink)] sm:text-5xl">
              מסלול ברור לכל שלב, עם כניסה ישירה להרשמה.
            </h2>
            <p className="text-lg leading-8 text-[color:var(--v2-muted)]">
              כל מסלול מחובר כבר היום לעמוד ההצטרפות, למכסות הסריקה ולניהול המנוי בתוך המוצר.
              אפשר להתחיל בחינם, להצטרף למסלול מתאים, או לדבר איתנו למסלולים גדולים יותר.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {planCards.map((plan) => (
              <article
                key={plan.tier}
                className={`rounded-[30px] border px-5 py-6 ${
                  plan.featured
                    ? "border-[color:var(--v2-accent)] bg-[color:var(--v2-accent-soft)]"
                    : "border-[color:var(--v2-line)] bg-white/88"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-lg font-black text-[color:var(--v2-ink)]">{plan.label}</p>
                  {plan.featured ? (
                    <span className="rounded-full bg-white/92 px-3 py-1 text-[11px] font-black text-[color:var(--v2-accent)]">
                      מומלץ
                    </span>
                  ) : null}
                </div>
                <p className="mt-4 text-3xl font-black tracking-[-0.05em] text-[color:var(--v2-ink)]">{plan.price}</p>
                <p className="mt-3 min-h-[72px] text-sm leading-7 text-[color:var(--v2-muted)]">{plan.summary}</p>
                <Link
                  href={`/register?plan=${encodeURIComponent(plan.tier)}`}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[color:var(--v2-ink)] px-4 py-3 text-sm font-black text-white transition hover:opacity-92"
                >
                  הצטרפות ל-{plan.label}
                  <ArrowLeft className="h-4 w-4" aria-hidden />
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <div className="v2-cta-strip">
            <div className="space-y-4">
              <SectionLabel>מוכנים לעבוד אחרת?</SectionLabel>
              <h2 className="text-3xl font-black tracking-[-0.05em] text-white sm:text-5xl">
                עוברים ממערכת מפוזרת למרכז שליטה אחד.
              </h2>
              <p className="max-w-2xl text-base leading-8 text-white/78 sm:text-lg">
                מתחילים עם חשבון, מחברים את הזרימות החשובות באמת, ומקבלים סביבת עבודה שמתאימה למורכבות של העסק שלך.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className="v2-button bg-white text-[color:var(--v2-ink)] hover:bg-white/92">
                להתחיל עכשיו
              </Link>
              <Link href="/contact" className="v2-button border border-white/30 bg-white/10 text-white hover:bg-white/16">
                לדבר איתנו
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
