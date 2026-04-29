import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Bot, Building2, CreditCard, LayoutDashboard } from "lucide-react";

export const metadata: Metadata = {
  title: "Wizard Flow | BSD-YBM",
  description: "Central guided flow for onboarding and daily operation.",
};

const flow = [
  {
    title: "Account Creation",
    text: "Create user access and verify organization details.",
    href: "/register",
    icon: Building2,
  },
  {
    title: "Billing Setup",
    text: "Choose plan and payment route before activation.",
    href: "/app/settings/billing",
    icon: CreditCard,
  },
  {
    title: "Workspace Launch",
    text: "Open dashboard and core modules for your team.",
    href: "/app",
    icon: LayoutDashboard,
  },
  {
    title: "AI Operation",
    text: "Run intelligent workflows and automation in production.",
    href: "/app/ai#assistant",
    icon: Bot,
  },
];

export default function WizardPage() {
  return (
    <div className="min-h-screen bg-[color:var(--canvas)] px-4 py-10 sm:px-6 sm:py-14" dir="rtl">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-black text-[color:var(--ink-900)] sm:text-4xl">אשף הטמעה — BSD-YBM פתרונות AI</h1>
        <p className="mt-3 max-w-2xl text-[color:var(--ink-500)]">
          This route provides one direct path across setup and operation. Use it when onboarding a new workspace or
          training users on the standard flow.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {flow.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                href={item.href}
                className="rounded-2xl border border-[color:var(--line-strong)] bg-[color:var(--canvas-raised)] p-5 shadow-[var(--cd-shadow-sm)] transition hover:-translate-y-0.5 hover:shadow-[var(--cd-shadow)] hover:border-[color:var(--cd-accent)]/40"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--cd-accent-soft)] text-[color:var(--cd-accent)]">
                    <Icon size={18} />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-[0.16em] text-[color:var(--ink-400)]">
                    שלב {idx + 1}
                  </span>
                </div>
                <h2 className="text-xl font-black text-[color:var(--ink-900)]">{item.title}</h2>
                <p className="mt-2 text-sm text-[color:var(--ink-500)]">{item.text}</p>
                <div className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[color:var(--cd-accent)]">
                  Open stage
                  <ArrowRight size={14} />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
