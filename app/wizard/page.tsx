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
    href: "/dashboard/billing",
    icon: CreditCard,
  },
  {
    title: "Workspace Launch",
    text: "Open dashboard and core modules for your team.",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "AI Operation",
    text: "Run intelligent workflows and automation in production.",
    href: "/dashboard/ai",
    icon: Bot,
  },
];

export default function WizardPage() {
  return (
    <div className="px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-black text-white sm:text-4xl">Wizard Control Center</h1>
        <p className="mt-3 max-w-2xl text-white/55">
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
                className="rounded-2xl border border-white/[0.08] bg-[#0a0b14] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900 text-white">
                    <Icon size={18} />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-[0.16em] text-white/35">Step {idx + 1}</span>
                </div>
                <h2 className="text-xl font-black text-white">{item.title}</h2>
                <p className="mt-2 text-sm text-white/55">{item.text}</p>
                <div className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-white/75">
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
