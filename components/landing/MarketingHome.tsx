"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  Bot,
  CheckCircle2,
  FileText,
  FolderKanban,
  Layers3,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import BsdYbmLogo from "@/components/brand/BsdYbmLogo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useI18n } from "@/components/I18nProvider";
import { marketingSans } from "@/lib/fonts/marketing-fonts";

const navItems = [
  { href: "/product", labelKey: "publicShell.navProduct" },
  { href: "/solutions", labelKey: "publicShell.navSolutions" },
  { href: "/pricing", labelKey: "publicShell.navPricing" },
  { href: "/about", labelKey: "publicShell.navAbout" },
  { href: "/contact", labelKey: "publicShell.navContact" },
] as const;

const featureIcons = [UsersRound, FileText, Bot] as const;
const moduleIcons = [FileText, FolderKanban, BarChart3, Layers3] as const;
const proofIcons = [CheckCircle2, ShieldCheck, Sparkles, CheckCircle2] as const;

type HomeMessages = {
  hero: {
    kicker: string;
    title: string;
    subtitle: string;
    ctaRegister: string;
    ctaDemo: string;
  };
  features: { title: string; body: string }[];
  modulesSection: { label: string; title: string; body: string };
  modules: { title: string; body: string }[];
  workflow: { label: string; title: string; lead: string; stepSub: string; steps: string[] };
  industries: { label: string; title: string; body: string; tags: string[] };
  why: { label: string; title: string; rows: { title: string; body: string }[] };
  proofPoints: string[];
  cta: { label: string; title: string; body: string; primary: string; secondary: string };
  footer: { brand: string; lead: string };
};

export default function MarketingHome() {
  const { dir, messages, t } = useI18n();
  const home = (messages as Record<string, unknown>).marketingHome as HomeMessages;

  return (
    <div
      className={`${marketingSans.className} marketing-unified-shell min-h-screen overflow-hidden bg-[#05060d] text-white`}
      dir={dir}
    >
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#05060d]/92 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-5 px-4 sm:px-6 lg:px-8">
          <BsdYbmLogo href="/" variant="marketing-dark" size="md" />

          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-3 lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap rounded-full px-2.5 py-1 text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white"
              >
                {t(item.labelKey)}
              </Link>
            ))}
          </nav>

          <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
            <LanguageSwitcher
              tone="dark"
              className="max-sm:[&_select]:min-w-[7.5rem] max-sm:[&_select]:px-2 max-sm:[&_select]:text-xs"
            />
            <Link
              href="/login"
              className="hidden rounded-lg border border-white/10 px-4 py-2 text-sm font-bold text-slate-200 transition hover:border-white/20 hover:bg-white/5 sm:inline-flex"
            >
              {t("publicShell.ctaLogin")}
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-lg bg-[#7c57ff] px-4 py-2 text-sm font-black text-white shadow-[0_16px_36px_rgba(124,87,255,0.28)] transition hover:bg-[#6d48f2]"
            >
              {t("publicShell.ctaStart")}
            </Link>
          </div>
        </div>
      </header>

      <main className="relative">
        <section className="relative overflow-hidden border-b border-white/10">
          <Image
            src="/marketing/marketing-bg-industrial-16x9.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-62"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,6,13,0.98)_0%,rgba(5,6,13,0.86)_38%,rgba(5,6,13,0.54)_72%,rgba(5,6,13,0.88)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:64px_64px] opacity-40" />

          <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:min-h-[720px] lg:grid-cols-[0.96fr_1.04fr] lg:px-8 lg:py-16">
            <div className="max-w-2xl">
              <span className="inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-cyan-200">
                {home.hero.kicker}
              </span>
              <h1 className="mt-5 text-4xl font-black leading-[1.04] text-white sm:text-5xl lg:text-6xl">
                {home.hero.title}
              </h1>
              <p className="mt-6 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">{home.hero.subtitle}</p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#7c57ff] px-6 py-3.5 text-base font-black text-white shadow-[0_18px_42px_rgba(124,87,255,0.32)] transition hover:bg-[#6d48f2]"
                >
                  {home.hero.ctaRegister}
                  <ArrowLeft className="h-5 w-5" aria-hidden />
                </Link>
                <Link
                  href="/product"
                  className="inline-flex items-center justify-center rounded-lg border border-white/15 bg-white/10 px-6 py-3.5 text-base font-black text-white transition hover:border-white/25 hover:bg-white/15"
                >
                  {home.hero.ctaDemo}
                </Link>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#0b1020]/78 p-4 shadow-[0_30px_90px_rgba(0,0,0,0.42)] backdrop-blur lg:max-w-xl">
              <div className="grid gap-3">
                {home.features.map((feature, index) => {
                  const Icon = featureIcons[index] ?? Layers3;
                  return (
                    <article key={feature.title} className="rounded-lg border border-white/10 bg-white/[0.06] p-5">
                      <Icon className="h-6 w-6 text-cyan-200" aria-hidden />
                      <h2 className="mt-4 text-xl font-black text-white">{feature.title}</h2>
                      <p className="mt-2 text-sm leading-7 text-slate-300">{feature.body}</p>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section id="product" className="bg-[#070914] py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">
                {home.modulesSection.label}
              </span>
              <h2 className="mt-4 text-3xl font-black leading-tight text-white sm:text-5xl">
                {home.modulesSection.title}
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-300">{home.modulesSection.body}</p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {home.modules.map((mod, index) => {
                const Icon = moduleIcons[index] ?? Layers3;
                return (
                  <article key={mod.title} className="rounded-xl border border-white/10 bg-white/[0.055] p-6">
                    <Icon className="h-6 w-6 text-[#8fb7ff]" aria-hidden />
                    <h3 className="mt-5 text-xl font-black text-white">{mod.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-300">{mod.body}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-[#05060d] py-16 sm:py-20">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
            <div>
              <span className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">{home.workflow.label}</span>
              <h2 className="mt-4 text-3xl font-black leading-tight text-white sm:text-5xl">{home.workflow.title}</h2>
              <p className="mt-4 text-lg leading-8 text-slate-300">{home.workflow.lead}</p>
            </div>
            <div className="grid gap-3">
              {home.workflow.steps.map((step, index) => (
                <div key={step} className="flex gap-4 rounded-xl border border-white/10 bg-white/[0.055] p-5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#7c57ff] text-sm font-black text-white">
                    {index + 1}
                  </span>
                  <p className="self-center text-base font-bold leading-7 text-slate-100">{step}</p>
                </div>
              ))}
              <p className="rounded-xl border border-cyan-300/20 bg-cyan-300/10 p-5 text-sm leading-7 text-cyan-100">
                {home.workflow.stepSub}
              </p>
            </div>
          </div>
        </section>

        <section className="bg-[#070914] py-16 sm:py-20">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
            <div className="rounded-xl border border-white/10 bg-white/[0.055] p-6 sm:p-8">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">{home.industries.label}</span>
              <h2 className="mt-4 text-3xl font-black leading-tight text-white sm:text-5xl">{home.industries.title}</h2>
              <p className="mt-4 text-lg leading-8 text-slate-300">{home.industries.body}</p>
              <div className="mt-7 flex flex-wrap gap-2">
                {home.industries.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-sm font-bold text-slate-200">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-3">
              {home.proofPoints.map((point, index) => {
                const Icon = proofIcons[index] ?? CheckCircle2;
                return (
                  <div key={point} className="flex gap-3 rounded-lg border border-white/10 bg-white/[0.055] p-4">
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" aria-hidden />
                    <p className="text-sm font-bold leading-7 text-slate-100">{point}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-[#05060d] py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-xl border border-white/10 bg-[linear-gradient(135deg,rgba(124,87,255,0.22),rgba(14,165,233,0.12))] p-6 sm:p-10">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">{home.cta.label}</span>
              <h2 className="mt-4 max-w-3xl text-3xl font-black leading-tight text-white sm:text-5xl">{home.cta.title}</h2>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-200">{home.cta.body}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#7c57ff] px-6 py-3.5 text-base font-black text-white">
                  {home.cta.primary}
                  <ArrowLeft className="h-5 w-5" aria-hidden />
                </Link>
                <Link href="/contact" className="inline-flex items-center justify-center rounded-lg border border-white/15 bg-white/10 px-6 py-3.5 text-base font-black text-white">
                  {home.cta.secondary}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-[#05060d]">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-slate-400 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <p className="font-bold text-slate-200">{home.footer.brand}</p>
          <p>{home.footer.lead}</p>
        </div>
      </footer>
    </div>
  );
}
