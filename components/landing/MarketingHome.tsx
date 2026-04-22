"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  BrainCircuit,
  Building2,
  CreditCard,
  FileText,
  Linkedin,
  Mail,
  MapPinned,
  Menu,
  Quote,
  Sparkles,
  UsersRound,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { marketingSans } from "@/lib/fonts/marketing-fonts";
import { ADMIN_SUBSCRIPTION_TIER_OPTIONS, tierAllowance, tierLabelHe } from "@/lib/subscription-tier-config";
import BsdYbmLogo from "@/components/brand/BsdYbmLogo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useI18n } from "@/components/I18nProvider";
import type { AppLocale } from "@/lib/i18n/config";

type EditorialNav = {
  about: string;
  projects: string;
  services: string;
  blog: string;
  contact: string;
};

type EditorialQuote = { body: string; role: string };
type EditorialProjectCard = { title: string };

type Editorial = {
  nav: EditorialNav;
  heroEyebrow: string;
  heroTitle: string;
  heroLead: string;
  heroCta: string;
  heroSecondaryCta: string;
  projectsSectionTitle: string;
  projectCardCta: string;
  projectCards: EditorialProjectCard[];
  quotesSectionTitle: string;
  quotes: EditorialQuote[];
  featuredTitle: string;
  featuredLead: string;
  featuredCta: string;
  footerProductTitle: string;
  footerCompanyTitle: string;
  footerLegalTitle: string;
  footerContactBlurb: string;
};

type MHPlans = {
  label: string;
  title: string;
  body: string;
  featured: string;
  joinPrefix: string;
};

type MHCta = {
  label: string;
  title: string;
  body: string;
  primary: string;
  secondary: string;
};

type MHFooter = { brand: string; lead: string };

type MHHero = { title: string; subtitle: string; ctaRegister: string; ctaDemo: string; kicker: string };
type MHFeature = { title: string; body: string };
type MHNav = {
  product: string;
  workflows: string;
  solutions: string;
  pricing: string;
  about: string;
  contact: string;
};

type MH = {
  nav: MHNav;
  header: { tagline: string };
  hero: MHHero;
  features: MHFeature[];
  plans: MHPlans;
  cta: MHCta;
  footer: MHFooter;
};

const FEATURE_ICONS = [UsersRound, CreditCard, BrainCircuit] as const;

/** כרטיסי «פרויקטים» — אייקון + גרדיאנט לכל שורה (לא רקע ריק) */
const PROJECT_CARD_VISUALS: readonly { Icon: LucideIcon; panel: string }[] = [
  {
    Icon: Building2,
    panel:
      "bg-gradient-to-br from-slate-800 via-slate-700 to-teal-950 shadow-inner",
  },
  {
    Icon: FileText,
    panel: "bg-gradient-to-br from-teal-900/95 via-slate-800 to-slate-900 shadow-inner",
  },
  {
    Icon: CreditCard,
    panel: "bg-gradient-to-br from-emerald-900/90 via-slate-800 to-slate-950 shadow-inner",
  },
  {
    Icon: MapPinned,
    panel: "bg-gradient-to-br from-slate-900 via-teal-950/80 to-slate-950 shadow-inner",
  },
  {
    Icon: BarChart3,
    panel: "bg-gradient-to-br from-cyan-950/90 via-slate-800 to-slate-900 shadow-inner",
  },
  {
    Icon: Sparkles,
    panel: "bg-gradient-to-br from-violet-950/70 via-slate-800 to-teal-950 shadow-inner",
  },
];

function fallbackEditorial(mh: MH, locale: AppLocale, mhRaw: Record<string, unknown>): Editorial {
  const blog =
    locale === "he" ? "תוכן מקצועי" : locale === "ru" ? "Материалы" : "Insights";
  const proofPoints = (mhRaw.proofPoints as string[] | undefined) ?? [];
  const roleFallback =
    locale === "he" ? "צוות משתמשים" : locale === "ru" ? "Команда пользователей" : "User team";
  const quotes: EditorialQuote[] =
    proofPoints.length >= 3
      ? proofPoints.slice(0, 3).map((body) => ({ body, role: roleFallback }))
      : mh.features.map((f) => ({ body: f.body, role: roleFallback }));
  const featuredCta =
    locale === "he" ? "לעמוד המוצר" : locale === "ru" ? "К продукту" : "Product overview";
  return {
    nav: {
      about: mh.nav.about,
      projects: mh.nav.product,
      services: mh.nav.solutions,
      blog,
      contact: mh.nav.contact,
    },
    heroEyebrow: mh.hero.kicker,
    heroTitle: mh.hero.title,
    heroLead: mh.hero.subtitle,
    heroCta: mh.hero.ctaDemo,
    heroSecondaryCta: mh.hero.ctaRegister,
    projectsSectionTitle: locale === "he" ? "יכולות המערכת" : locale === "ru" ? "Возможности" : "Capabilities",
    projectCardCta: locale === "he" ? "למוצר" : locale === "ru" ? "К продукту" : "To product",
    projectCards: mh.features.map((f) => ({ title: f.title })),
    quotesSectionTitle: locale === "he" ? "מה אומרים אצלנו" : locale === "ru" ? "Отзывы" : "What teams say",
    quotes,
    featuredTitle: locale === "he" ? "BSD-YBM במבט על" : locale === "ru" ? "Обзор" : "Overview",
    featuredLead: mh.hero.subtitle,
    featuredCta,
    footerProductTitle: locale === "he" ? "מוצר" : locale === "ru" ? "Продукт" : "Product",
    footerCompanyTitle: locale === "he" ? "חברה" : locale === "ru" ? "Компания" : "Company",
    footerLegalTitle: locale === "he" ? "משפטי" : locale === "ru" ? "Право" : "Legal",
    footerContactBlurb: "",
  };
}

function resolveEditorial(mhRaw: Record<string, unknown>, mh: MH, locale: AppLocale): Editorial {
  const e = mhRaw.editorial as Editorial | undefined;
  if (e?.nav?.about && e.heroTitle && e.projectCards?.length) {
    return e;
  }
  return fallbackEditorial(mh, locale, mhRaw);
}

export default function MarketingHome() {
  const { dir, locale, messages, t } = useI18n();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const mhRaw = (messages as Record<string, unknown>).marketingHome as Record<string, unknown>;
  const mh = mhRaw as unknown as MH;
  const ed = useMemo(() => {
    const mhInner = mhRaw as unknown as MH;
    return resolveEditorial(mhRaw, mhInner, locale as AppLocale);
  }, [mhRaw, locale]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen]);

  const editorialNav = useMemo(
    () => [
      { href: "/about", label: ed.nav.about },
      { href: "/product#projects", label: ed.nav.projects },
      { href: "/solutions", label: ed.nav.services },
      { href: "/professional", label: ed.nav.blog },
      { href: "/contact", label: ed.nav.contact },
    ],
    [ed.nav],
  );

  const planCards = ADMIN_SUBSCRIPTION_TIER_OPTIONS.map((tier) => {
    const allowance = tierAllowance(tier);
    const label = locale === "he" ? tierLabelHe(tier) : tier.replace(/_/g, " ");
    const price =
      allowance.monthlyPriceIls == null
        ? locale === "he"
          ? "בתיאום"
          : locale === "ru"
            ? "По согласованию"
            : "Custom"
        : `₪${allowance.monthlyPriceIls}`;
    const summary =
      locale === "he"
        ? `${allowance.cheapScans} זולות · ${allowance.premiumScans} פרימיום · ${
            allowance.unlimitedCompanies ? "ללא הגבלת חברות" : `עד ${allowance.maxCompanies} חברות`
          }`
        : locale === "ru"
          ? `${allowance.cheapScans} эконом · ${allowance.premiumScans} премиум · ${
              allowance.unlimitedCompanies
                ? "без лимита компаний"
                : `до ${allowance.maxCompanies} компаний`
            }`
          : `${allowance.cheapScans} cheap scans · ${allowance.premiumScans} premium · ${
              allowance.unlimitedCompanies ? "Unlimited companies" : `Up to ${allowance.maxCompanies} companies`
            }`;
    return { tier, label, price, summary, featured: tier === "DEALER" };
  });

  const productFooterLinks = [
    { href: "/product", label: t("publicShell.navProduct") },
    { href: "/solutions", label: t("publicShell.navSolutions") },
    { href: "/pricing", label: t("publicShell.navPricing") },
    { href: "/demo", label: t("marketingHome.hero.ctaDemo") },
  ];

  const companyFooterLinks = [
    { href: "/about", label: t("publicShell.navAbout") },
    { href: "/contact", label: t("publicShell.navContact") },
    { href: "/brief", label: t("publicShell.navBrief") },
  ];

  const legalFooterLinks = [
    { href: "/privacy", label: t("landing.footerPrivacy") },
    { href: "/terms", label: t("landing.footerTerms") },
    { href: "/legal", label: t("landing.footerLegal") },
  ];

  return (
    <div className={`${marketingSans.className} bento-site-shell bg-white`} dir={dir}>
      <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <BsdYbmLogo href="/" variant="marketing-light" size="md" />
            <span className="hidden min-w-0 truncate text-[11px] font-semibold text-slate-500 sm:inline">
              {mh.header.tagline}
            </span>
          </div>

          <nav className="hidden items-center gap-5 lg:flex" aria-label="ראשי">
            {editorialNav.map((item) => (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                className="whitespace-nowrap text-[13px] font-bold text-slate-600 transition hover:text-[color:var(--ink-900)]"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <LanguageSwitcher className="max-sm:[&_select]:min-w-[7rem] max-sm:[&_select]:px-2 max-sm:[&_select]:text-xs" />
            <Link
              href="/login"
              className="hidden text-[13px] font-bold text-slate-600 hover:text-[color:var(--ink-900)] md:inline"
            >
              {t("publicShell.ctaLogin")}
            </Link>
            <Link
              href="/register"
              className="hidden items-center rounded-lg bg-[color:var(--axis-clients)] px-3 py-2 text-[13px] font-black text-white shadow-sm transition hover:bg-[color:var(--axis-clients-strong)] sm:inline-flex"
            >
              {t("publicShell.ctaStart")}
            </Link>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-800 lg:hidden"
              aria-expanded={mobileNavOpen}
              aria-controls="marketing-mobile-nav"
              aria-label={locale === "he" ? "פתיחת תפריט" : "Open menu"}
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {mobileNavOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" id="marketing-mobile-nav">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
            aria-label={locale === "he" ? "סגירת תפריט" : "Close menu"}
            onClick={() => setMobileNavOpen(false)}
          />
          <div
            className={`absolute inset-y-0 flex w-[min(100%,20rem)] flex-col bg-white shadow-2xl ${
              dir === "rtl" ? "right-0 border-l border-slate-200" : "left-0 border-r border-slate-200"
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <span className="text-sm font-black text-slate-900">BSD-YBM</span>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
                onClick={() => setMobileNavOpen(false)}
                aria-label={locale === "he" ? "סגירה" : "Close"}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4" aria-label="מובייל">
              {editorialNav.map((item) => (
                <Link
                  key={`m-${item.href}`}
                  href={item.href}
                  className="rounded-xl px-3 py-3 text-base font-bold text-slate-800 hover:bg-slate-50"
                  onClick={() => setMobileNavOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <hr className="my-2 border-slate-100" />
              <Link
                href="/login"
                className="rounded-xl px-3 py-3 text-base font-bold text-slate-600 hover:bg-slate-50"
                onClick={() => setMobileNavOpen(false)}
              >
                {t("publicShell.ctaLogin")}
              </Link>
              <Link
                href="/register"
                className="mt-2 inline-flex items-center justify-center rounded-xl bg-[color:var(--axis-clients)] px-3 py-3 text-base font-black text-white"
                onClick={() => setMobileNavOpen(false)}
              >
                {t("publicShell.ctaStart")}
              </Link>
            </nav>
          </div>
        </div>
      ) : null}

      <main>
        <section className="relative bg-white" aria-labelledby="marketing-hero-heading">
          {/* סדר ויזואלי קבוע: תמונה שמאל, טקסט ימין (גם ב־RTL) */}
          <div className="grid min-h-0 lg:grid-cols-2 lg:items-stretch" dir="ltr">
            <div className="relative min-h-[260px] w-full lg:min-h-[min(90vh,820px)]">
              <div className="absolute inset-0 lg:[clip-path:polygon(0_0,100%_0,68%_100%,0_100%)]">
                <Image
                  src="/marketing/bsd-ybm-hero-boulevard-16x9.png"
                  alt=""
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" aria-hidden />
              </div>
              <div className="pointer-events-none absolute bottom-6 end-6 z-10 hidden w-[min(44%,210px)] rotate-2 border-4 border-white shadow-2xl lg:block">
                <div className="relative aspect-[4/3] w-full grayscale">
                  <Image src="/marketing/bsd-ybm-crm-erp-bridge.png" alt="" fill className="object-cover" sizes="210px" />
                </div>
              </div>
              <div className="pointer-events-none absolute end-[15%] top-[10%] z-10 hidden w-[min(36%,180px)] -rotate-2 border-4 border-white shadow-2xl lg:block">
                <div className="relative aspect-[4/3] w-full grayscale">
                  <Image
                    src="/marketing/bsd-ybm-documents-ai-flow.png"
                    alt=""
                    fill
                    className="object-cover"
                    sizes="180px"
                  />
                </div>
              </div>
            </div>

            <div
              className="flex flex-col justify-center px-5 py-12 sm:px-10 lg:min-h-[min(90vh,820px)] lg:px-14 lg:py-16"
              dir={dir}
            >
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[color:var(--axis-clients)]">
                {ed.heroEyebrow}
              </p>
              <h1
                id="marketing-hero-heading"
                className="mt-4 max-w-xl text-4xl font-black leading-[0.98] tracking-[-0.055em] text-slate-900 sm:text-5xl lg:text-[3.15rem]"
              >
                {ed.heroTitle}
              </h1>
              <p className="mt-6 max-w-lg text-base leading-8 text-slate-600 sm:text-lg">{ed.heroLead}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[color:var(--axis-clients)] px-6 py-3.5 text-sm font-black text-white shadow-md transition hover:bg-[color:var(--axis-clients-strong)]"
                >
                  {ed.heroCta}
                  <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-lg border-2 border-slate-200 px-6 py-3.5 text-sm font-black text-slate-800 transition hover:border-[color:var(--axis-clients)] hover:text-[color:var(--axis-clients-strong)]"
                >
                  {ed.heroSecondaryCta}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* שלושת עמודי היכולות — תוכן אמיתי מה־JSON */}
        <section className="border-t border-slate-100 bg-white py-14 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-5 sm:grid-cols-3">
              {mh.features.map((f, i) => {
                const Icon = FEATURE_ICONS[i] ?? UsersRound;
                return (
                  <article
                    key={f.title}
                    className="rounded-2xl border border-slate-100 bg-slate-50/60 p-5 shadow-sm sm:p-6"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--axis-clients-soft)] text-[color:var(--axis-clients)]">
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <h2 className="mt-4 text-lg font-black text-slate-900">{f.title}</h2>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{f.body}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="projects" className="scroll-mt-24 border-t border-slate-100 bg-slate-50/80 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-black tracking-[-0.04em] text-slate-900 sm:text-4xl">{ed.projectsSectionTitle}</h2>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {ed.projectCards.map((card, i) => {
                const visual = PROJECT_CARD_VISUALS[i % PROJECT_CARD_VISUALS.length];
                const CardIcon = visual.Icon;
                return (
                  <article
                    key={card.title}
                    className="flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition hover:border-[color:var(--axis-clients)]/50 hover:shadow-lg"
                  >
                    <div
                      className={`relative flex aspect-[16/10] items-center justify-center overflow-hidden ${visual.panel}`}
                      aria-hidden
                    >
                      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_30%_15%,rgba(255,255,255,0.14),transparent_55%)]" />
                      <div className="pointer-events-none absolute -end-6 -top-8 h-32 w-32 rounded-full bg-white/5 blur-2xl" />
                      <CardIcon className="relative z-[1] h-14 w-14 text-white drop-shadow-lg sm:h-[4.25rem] sm:w-[4.25rem]" />
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="text-lg font-black text-slate-900">{card.title}</h3>
                      <Link
                        href="/product#projects"
                        className="mt-4 inline-flex w-fit items-center gap-1 text-sm font-black text-[color:var(--axis-clients)] hover:underline"
                      >
                        {ed.projectCardCta}
                        <ArrowUpRight className="h-4 w-4" aria-hidden />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-t border-slate-100 bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-3xl font-black tracking-[-0.04em] text-slate-900 sm:text-4xl">
              {ed.quotesSectionTitle}
            </h2>
            <div className="mt-12 grid gap-8 md:grid-cols-3 md:gap-6">
              {ed.quotes.map((q, qi) => (
                <blockquote
                  key={qi}
                  className="relative rounded-2xl border border-slate-100 bg-slate-50/90 p-6 pt-10 shadow-sm"
                >
                  <Quote
                    className="absolute start-5 top-4 h-10 w-10 text-[color:var(--axis-clients)] opacity-90"
                    aria-hidden
                  />
                  <p className="text-sm font-semibold leading-7 text-slate-700">{q.body}</p>
                  <footer className="mt-4 text-xs font-bold text-slate-500">{q.role}</footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-slate-100 bg-white py-16 sm:py-20">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:px-8">
            <div
              className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-slate-200 shadow-lg lg:order-1"
              dir="ltr"
            >
              <Image
                src="/marketing/bsd-ybm-crm-erp-bridge.png"
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-[color:var(--axis-clients)]/10 mix-blend-multiply" aria-hidden />
            </div>
            <div className="lg:order-2">
              <h2 className="text-3xl font-black tracking-[-0.04em] text-slate-900 sm:text-4xl">{ed.featuredTitle}</h2>
              <p className="mt-5 text-base leading-8 text-slate-600 sm:text-lg">{ed.featuredLead}</p>
              <Link
                href="/product"
                className="mt-8 inline-flex items-center gap-2 rounded-lg bg-[color:var(--axis-clients)] px-5 py-3 text-sm font-black text-white transition hover:bg-[color:var(--axis-clients-strong)]"
              >
                {ed.featuredCta}
                <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
              </Link>
            </div>
          </div>
        </section>

        <section id="plans" className="border-t border-slate-100 bg-slate-50/80 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[color:var(--axis-clients)]">{mh.plans.label}</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-slate-900 sm:text-4xl">{mh.plans.title}</h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">{mh.plans.body}</p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {planCards.map((plan) => (
                <article
                  key={plan.tier}
                  className={`rounded-2xl border px-5 py-6 ${
                    plan.featured ? "border-[color:var(--axis-clients)] bg-[color:var(--axis-clients-soft)]" : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-lg font-black text-slate-900">{plan.label}</p>
                    {plan.featured ? (
                      <span className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-black text-[color:var(--axis-clients)]">
                        {mh.plans.featured}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-4 text-3xl font-black text-slate-900">{plan.price}</p>
                  <p className="mt-3 min-h-[4.5rem] text-sm leading-7 text-slate-600">{plan.summary}</p>
                  <Link
                    href={`/register?plan=${encodeURIComponent(plan.tier)}`}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-black text-white transition hover:bg-slate-800"
                  >
                    {mh.plans.joinPrefix}
                    {plan.label}
                    <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16 pt-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-br from-[color:var(--axis-clients-strong)] to-[color:var(--axis-clients)] px-6 py-12 text-center sm:px-12 sm:py-14">
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-white/85">{mh.cta.label}</p>
            <h2 className="mt-4 text-2xl font-black tracking-[-0.04em] text-white sm:text-4xl">{mh.cta.title}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/90 sm:text-base">{mh.cta.body}</p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex w-full items-center justify-center rounded-xl bg-white px-6 py-3.5 text-sm font-black text-slate-900 shadow-md transition hover:bg-slate-100 sm:w-auto"
              >
                {mh.cta.primary}
              </Link>
              <Link
                href="/contact"
                className="inline-flex w-full items-center justify-center rounded-xl border-2 border-white/40 bg-white/10 px-6 py-3.5 text-sm font-black text-white transition hover:bg-white/15 sm:w-auto"
              >
                {mh.cta.secondary}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800 bg-slate-950 text-slate-400">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-lg font-black text-white">{mh.footer.brand}</p>
              <p className="mt-3 text-sm leading-7">{mh.footer.lead}</p>
              {ed.footerContactBlurb ? <p className="mt-4 text-sm leading-7 text-slate-500">{ed.footerContactBlurb}</p> : null}
              <div className="mt-6 flex gap-3">
                <Link
                  href="/contact"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 text-slate-300 transition hover:border-[color:var(--axis-clients)] hover:text-white"
                  aria-label={t("publicShell.navContact")}
                >
                  <Mail className="h-4 w-4" />
                </Link>
                <a
                  href="https://www.linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 text-slate-300 transition hover:border-[color:var(--axis-clients)] hover:text-white"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
              </div>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{ed.footerProductTitle}</p>
              <ul className="mt-4 space-y-2.5">
                {productFooterLinks.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm font-semibold text-slate-300 hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{ed.footerCompanyTitle}</p>
              <ul className="mt-4 space-y-2.5">
                {companyFooterLinks.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm font-semibold text-slate-300 hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{ed.footerLegalTitle}</p>
              <ul className="mt-4 space-y-2.5">
                {legalFooterLinks.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm font-semibold text-slate-300 hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="mt-12 border-t border-slate-800 pt-8 text-center text-xs text-slate-600">
            © {new Date().getFullYear()} {mh.footer.brand}
          </p>
        </div>
      </footer>
    </div>
  );
}
