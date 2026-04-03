"use client";

import Link from "next/link";
import { ArrowRight, Bot, Building2, CheckCircle2, CreditCard, Rocket, Settings2, Sparkles } from "lucide-react";

const steps = [
  {
    id: "01",
    title: "Plan",
    text: "Review platform capabilities and choose the right operating model for your team.",
    href: "/about",
    icon: Rocket,
    color: "from-orange-500 to-amber-500",
  },
  {
    id: "02",
    title: "Join",
    text: "Create your account and activate secure access for your organization.",
    href: "/register",
    icon: Building2,
    color: "from-teal-500 to-cyan-500",
  },
  {
    id: "03",
    title: "Configure",
    text: "Set billing and defaults once, then apply them to your workspace.",
    href: "/dashboard/billing",
    icon: Settings2,
    color: "from-emerald-500 to-teal-600",
  },
  {
    id: "04",
    title: "Run",
    text: "Operate CRM, ERP, and AI workflows through one guided command center.",
    href: "/dashboard",
    icon: Bot,
    color: "from-sky-500 to-blue-600",
  },
];

export default function WizardHome() {
  return (
    <div className="relative isolate overflow-hidden">
      <section className="relative border-b border-slate-200/80 px-4 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-20">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_10%_0%,rgba(249,115,22,0.16),transparent_28%),radial-gradient(circle_at_92%_8%,rgba(20,184,166,0.2),transparent_33%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]" />
        <div className="mx-auto max-w-6xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-orange-800">
            <Sparkles size={14} />
            Wizard Platform
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight text-slate-900 sm:text-6xl">
            One guided flow.
            <span className="block bg-gradient-to-r from-orange-600 via-amber-500 to-teal-600 bg-clip-text text-transparent">
              Full business operation.
            </span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            BSD-YBM now works as a guided workspace. Every major function is arranged as a clean step-by-step journey,
            so your team can onboard faster, configure once, and operate daily tasks without screen overload.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-slate-800"
            >
              Start guided onboarding
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/tutorial"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              See tutorial flow
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-black text-slate-900 sm:text-3xl">Platform Wizard Map</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-600">
              4 stages
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <Link
                  key={step.id}
                  href={step.href}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div
                    className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${step.color} text-white shadow-md`}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Step {step.id}</div>
                  <h3 className="text-xl font-black text-slate-900">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.text}</p>
                  <div className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-slate-800 transition group-hover:gap-2">
                    Open step
                    <ArrowRight size={14} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="mx-auto grid max-w-6xl gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-3 sm:p-8">
          <div className="rounded-2xl bg-slate-50 p-5">
            <div className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-slate-500">Speed</div>
            <p className="text-3xl font-black text-slate-900">3x</p>
            <p className="mt-1 text-sm text-slate-600">Faster onboarding with guided steps.</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-5">
            <div className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-slate-500">Focus</div>
            <p className="text-3xl font-black text-slate-900">1 flow</p>
            <p className="mt-1 text-sm text-slate-600">Less context switching across tools.</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-5">
            <div className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-slate-500">Control</div>
            <p className="text-3xl font-black text-slate-900">Live</p>
            <p className="mt-1 text-sm text-slate-600">AI, CRM, and ERP visibility in real time.</p>
          </div>
        </div>

        <div className="mx-auto mt-8 max-w-6xl rounded-2xl border border-emerald-200 bg-emerald-50 p-5 sm:flex sm:items-center sm:justify-between sm:p-6">
          <div>
            <h3 className="text-lg font-black text-emerald-900">Ready to move into Wizard operation?</h3>
            <p className="mt-1 text-sm text-emerald-800">Continue to secure access and open your guided dashboard.</p>
          </div>
          <div className="mt-4 flex gap-2 sm:mt-0">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 py-2 text-sm font-bold text-emerald-900 hover:bg-emerald-100"
            >
              Existing user
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800"
            >
              <CheckCircle2 size={16} />
              Create workspace
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
