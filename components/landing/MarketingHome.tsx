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
import BsdYbmLogo from "@/components/brand/BsdYbmLogo";
import { useI18n } from "@/components/I18nProvider";

type MH = {
  nav: {
    product: string;
    workflows: string;
    solutions: string;
    pricing: string;
    about: string;
    contact: string;
  };
  header: { tagline: string };
  hero: {
    kicker: string;
    title: string;
    subtitle: string;
    ctaRegister: string;
    ctaDemo: string;
  };
  features: { title: string; body: string }[];
  mock: {
    attentionLabel: string;
    attentionTitle: string;
    boardKicker: string;
    boardTitle: string;
    boardBadge: string;
    focusLabel: string;
    focusTitle: string;
    imageAlt: string;
    suggestLabel: string;
    suggestTitle: string;
    suggestBody: string;
    financeLabel: string;
    stats: { label: string; value: string }[];
  };
  modulesSection: { label: string; title: string; body: string };
  modules: { title: string; body: string }[];
  workflow: {
    label: string;
    title: string;
    lead: string;
    stepSub: string;
    steps: string[];
  };
  industries: { label: string; title: string; body: string; tags: string[] };
  why: { label: string; title: string; rows: { title: string; body: string }[] };
  proofPoints: string[];
  plans: { label: string; title: string; body: string; featured: string; joinPrefix: string };
  cta: { label: string; title: string; body: string; primary: string; secondary: string };
  footer: { brand: string; lead: string };
};

const featureIcons = [UsersRound, CreditCard, BrainCircuit];
const moduleIcons = [ScanSearch, ShieldCheck, BarChart3, Bot];

function SectionLabel({ children }: { children: ReactNode }) {
  return <span className="v2-eyebrow">{children}</span>;
}

export default function MarketingHome() {
  const { dir, locale, messages, t } = useI18n();
  const mh = (messages as Record<string, unknown>).marketingHome as MH;

  const navLinks = [
    { href: "/#product", label: mh.nav.product },
    { href: "/#workflows", label: mh.nav.workflows },
    { href: "/solutions", label: mh.nav.solutions },
    { href: "/pricing", label: mh.nav.pricing },
    { href: "/about", label: mh.nav.about },
    { href: "/contact", label: mh.nav.contact },
  ];

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
    return {
      tier,
      label,
      price,
      summary,
      featured: tier === "DEALER",
    };
  });

  return (
    <div className={`${marketingSans.className} v2-site-shell`} dir={dir}>
      <header className="sticky top-0 z-40 border-b border-[color:var(--v2-line)] bg-[color:var(--v2-surface)]/88 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <BsdYbmLogo href="/" variant="marketing-light" size="md" />
            <span className="hidden min-w-0 flex-col sm:flex">
              <span className="truncate text-[11px] font-semibold text-[color:var(--v2-muted)]">{mh.header.tagline}</span>
            </span>
          </div>

          <nav className="hidden items-center gap-6 lg:flex">
            {navLinks.map((item) => (
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
              {t("publicShell.ctaLogin")}
            </Link>
            <Link href="/register" className="v2-button v2-button-primary">
              {t("publicShell.ctaStart")}
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0">
            <Image
              src="/marketing/marketing-bg-industrial-16x9.png"
              alt=""
              fill
              className="object-cover opacity-[0.2]"
              sizes="100vw"
              priority
              aria-hidden
            />
            <div className="absolute inset-0 bg-[color:var(--v2-canvas)]/88" />
            <div className="v2-orb v2-orb-primary" />
            <div className="v2-grid-overlay" />
          </div>

          <div className="relative mx-auto grid max-w-7xl gap-10 px-4 pb-14 pt-12 sm:gap-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:px-8 lg:pb-16 lg:pt-16">
            <div className="space-y-6 sm:space-y-7">
              <SectionLabel>{mh.hero.kicker}</SectionLabel>
              <div className="space-y-4 sm:space-y-5">
                <h1 className="max-w-3xl text-4xl font-black leading-[0.95] tracking-[-0.05em] text-[color:var(--v2-ink)] sm:text-5xl lg:text-6xl">
                  {mh.hero.title}
                </h1>
                <p className="max-w-2xl text-base leading-7 text-[color:var(--v2-muted)] sm:text-lg sm:leading-8">{mh.hero.subtitle}</p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/register" className="v2-button v2-button-primary">
                  {mh.hero.ctaRegister}
                  <ArrowLeft className="h-4 w-4" aria-hidden />
                </Link>
                <Link href="/demo" className="v2-button v2-button-secondary">
                  {mh.hero.ctaDemo}
                  <ArrowUpRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {mh.features.map(({ title, body }, i) => {
                  const Icon = featureIcons[i] ?? UsersRound;
                  return (
                    <article key={title} className="v2-panel v2-panel-soft p-4 sm:p-5">
                      <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--v2-accent-soft)] text-[color:var(--v2-accent)]">
                        <Icon className="h-5 w-5" aria-hidden />
                      </span>
                      <h2 className="text-lg font-black text-[color:var(--v2-ink)]">{title}</h2>
                      <p className="mt-2 text-sm leading-7 text-[color:var(--v2-muted)]">{body}</p>
                    </article>
                  );
                })}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-4 top-6 hidden rounded-[28px] border border-white/60 bg-white/80 px-4 py-3 shadow-[0_30px_70px_-35px_rgba(15,23,42,0.45)] backdrop-blur sm:block">
                <p className="text-xs font-bold text-[color:var(--v2-muted)]">{mh.mock.attentionLabel}</p>
                <p className="mt-1 text-sm font-black text-[color:var(--v2-ink)]">{mh.mock.attentionTitle}</p>
              </div>

              <div className="v2-dashboard-frame">
                <div className="flex items-center justify-between border-b border-[color:var(--v2-line)] px-5 py-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.28em] text-[color:var(--v2-muted)]">{mh.mock.boardKicker}</p>
                    <p className="mt-2 text-xl font-black text-[color:var(--v2-ink)]">{mh.mock.boardTitle}</p>
                  </div>
                  <span className="rounded-full bg-[color:var(--v2-success-soft)] px-3 py-1 text-xs font-bold text-[color:var(--v2-success)]">
                    {mh.mock.boardBadge}
                  </span>
                </div>

                <div className="grid gap-4 p-5">
                  <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="v2-panel p-4">
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-[color:var(--v2-muted)]">{mh.mock.focusLabel}</p>
                          <p className="text-lg font-black text-[color:var(--v2-ink)]">{mh.mock.focusTitle}</p>
                        </div>
                        <Sparkles className="h-5 w-5 text-[color:var(--v2-accent)]" aria-hidden />
                      </div>
                      <Image
                        src="/marketing/prelogin-hero-16x9.png"
                        alt={mh.mock.imageAlt}
                        width={1600}
                        height={900}
                        sizes="(max-width: 1024px) 100vw, 48vw"
                        className="rounded-[22px] border border-[color:var(--v2-line)] object-cover"
                        priority
                      />
                    </div>

                    <div className="grid gap-4">
                      <div className="v2-panel p-4">
                        <p className="text-sm font-bold text-[color:var(--v2-muted)]">{mh.mock.suggestLabel}</p>
                        <p className="mt-2 text-lg font-black text-[color:var(--v2-ink)]">{mh.mock.suggestTitle}</p>
                        <p className="mt-2 text-sm leading-7 text-[color:var(--v2-muted)]">{mh.mock.suggestBody}</p>
                      </div>
                      <div className="v2-panel p-4">
                        <p className="text-sm font-bold text-[color:var(--v2-muted)]">{mh.mock.financeLabel}</p>
                        <div className="mt-4 grid grid-cols-2 gap-3">
                          {mh.mock.stats.map((item) => (
                            <div key={item.label} className="rounded-2xl bg-[color:var(--v2-canvas)] p-3">
                              <p className="text-xs font-bold text-[color:var(--v2-muted)]">{item.label}</p>
                              <p className="mt-2 text-base font-black text-[color:var(--v2-ink)]">{item.value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {mh.proofPoints.map((point) => (
                      <div key={point} className="flex items-center gap-2.5 rounded-2xl bg-[color:var(--v2-canvas)] px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
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

        <section id="product" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="mb-8 max-w-3xl space-y-3 sm:mb-10 sm:space-y-4">
            <SectionLabel>{mh.modulesSection.label}</SectionLabel>
            <h2 className="text-3xl font-black tracking-[-0.05em] text-[color:var(--v2-ink)] sm:text-4xl lg:text-5xl">{mh.modulesSection.title}</h2>
            <p className="text-base leading-7 text-[color:var(--v2-muted)] sm:text-lg sm:leading-8">{mh.modulesSection.body}</p>
          </div>

          <div className="grid gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
            {mh.modules.map(({ title, body }, i) => {
              const Icon = moduleIcons[i] ?? ScanSearch;
              return (
                <article key={title} className="v2-panel p-5 sm:p-6">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--v2-canvas)] text-[color:var(--v2-accent)]">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="mt-5 text-xl font-black text-[color:var(--v2-ink)]">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[color:var(--v2-muted)]">{body}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section id="workflows" className="border-y border-[color:var(--v2-line)] bg-[color:var(--v2-surface)]/72">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:gap-10 sm:px-6 sm:py-16 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
            <div className="space-y-3 sm:space-y-4">
              <SectionLabel>{mh.workflow.label}</SectionLabel>
              <h2 className="text-3xl font-black tracking-[-0.05em] text-[color:var(--v2-ink)] sm:text-4xl lg:text-5xl">{mh.workflow.title}</h2>
              <p className="text-base leading-7 text-[color:var(--v2-muted)] sm:text-lg sm:leading-8">{mh.workflow.lead}</p>
            </div>

            <div className="grid gap-3 sm:gap-4">
              {mh.workflow.steps.map((step, index) => (
                <div key={step} className="v2-panel flex items-start gap-3 p-4 sm:gap-4 sm:p-5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--v2-accent)] text-sm font-black text-white">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-lg font-black text-[color:var(--v2-ink)]">{step}</p>
                    <p className="mt-2 text-sm leading-7 text-[color:var(--v2-muted)]">{mh.workflow.stepSub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr] lg:gap-6">
            <div className="v2-panel p-6 sm:p-8">
              <SectionLabel>{mh.industries.label}</SectionLabel>
              <h2 className="mt-4 text-3xl font-black tracking-[-0.05em] text-[color:var(--v2-ink)] sm:text-4xl">{mh.industries.title}</h2>
              <p className="mt-4 text-base leading-8 text-[color:var(--v2-muted)]">{mh.industries.body}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                {mh.industries.tags.map((industry) => (
                  <span
                    key={industry}
                    className="rounded-full border border-[color:var(--v2-line)] bg-[color:var(--v2-canvas)] px-4 py-2 text-sm font-bold text-[color:var(--v2-ink)]"
                  >
                    {industry}
                  </span>
                ))}
              </div>
            </div>

            <div className="v2-panel v2-panel-highlight overflow-hidden p-0">
              <div className="border-b border-[color:var(--v2-line)] px-6 py-5">
                <SectionLabel>{mh.why.label}</SectionLabel>
                <h3 className="mt-3 text-2xl font-black text-[color:var(--v2-ink)]">{mh.why.title}</h3>
              </div>
              <div className="grid gap-0 divide-y divide-[color:var(--v2-line)]">
                {mh.why.rows.map((row) => (
                  <div key={row.title} className="flex gap-4 px-6 py-5">
                    <BadgeCheck className="mt-1 h-5 w-5 shrink-0 text-[color:var(--v2-accent)]" aria-hidden />
                    <div>
                      <p className="font-black text-[color:var(--v2-ink)]">{row.title}</p>
                      <p className="mt-2 text-sm leading-7 text-[color:var(--v2-muted)]">{row.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="plans" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="mb-8 max-w-3xl space-y-3 sm:mb-10 sm:space-y-4">
            <SectionLabel>{mh.plans.label}</SectionLabel>
            <h2 className="text-3xl font-black tracking-[-0.05em] text-[color:var(--v2-ink)] sm:text-4xl lg:text-5xl">{mh.plans.title}</h2>
            <p className="text-base leading-7 text-[color:var(--v2-muted)] sm:text-lg sm:leading-8">{mh.plans.body}</p>
          </div>

          <div className="grid gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
            {planCards.map((plan) => (
              <article
                key={plan.tier}
                className={`rounded-[24px] border px-4 py-5 sm:rounded-[30px] sm:px-5 sm:py-6 ${
                  plan.featured
                    ? "border-[color:var(--v2-accent)] bg-[color:var(--v2-accent-soft)]"
                    : "border-[color:var(--v2-line)] bg-white/88"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-lg font-black text-[color:var(--v2-ink)]">{plan.label}</p>
                  {plan.featured ? (
                    <span className="rounded-full bg-white/92 px-3 py-1 text-[11px] font-black text-[color:var(--v2-accent)]">
                      {mh.plans.featured}
                    </span>
                  ) : null}
                </div>
                <p className="mt-4 text-3xl font-black tracking-[-0.05em] text-[color:var(--v2-ink)]">{plan.price}</p>
                <p className="mt-3 min-h-[72px] text-sm leading-7 text-[color:var(--v2-muted)]">{plan.summary}</p>
                <Link
                  href={`/register?plan=${encodeURIComponent(plan.tier)}`}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[color:var(--v2-ink)] px-4 py-3 text-sm font-black text-white transition hover:opacity-92"
                >
                  {mh.plans.joinPrefix}
                  {plan.label}
                  <ArrowLeft className="h-4 w-4" aria-hidden />
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 sm:pb-16 lg:px-8">
          <div className="v2-cta-strip">
            <div className="space-y-3 sm:space-y-4">
              <SectionLabel>{mh.cta.label}</SectionLabel>
              <h2 className="text-2xl font-black tracking-[-0.05em] text-white sm:text-4xl lg:text-5xl">{mh.cta.title}</h2>
              <p className="max-w-2xl text-sm leading-7 text-white/78 sm:text-base sm:leading-8 lg:text-lg">{mh.cta.body}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className="v2-button bg-white text-[color:var(--v2-ink)] hover:bg-white/92">
                {mh.cta.primary}
              </Link>
              <Link href="/contact" className="v2-button border border-white/30 bg-white/10 text-white hover:bg-white/16">
                {mh.cta.secondary}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[color:var(--v2-line)] bg-[color:var(--v2-surface)]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.5fr_1fr] lg:px-8">
          <div className="space-y-3">
            <p className="text-lg font-black text-[color:var(--v2-ink)]">{mh.footer.brand}</p>
            <p className="max-w-2xl text-sm leading-7 text-[color:var(--v2-muted)]">{mh.footer.lead}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {navLinks.map((item) => (
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
    </div>
  );
}
