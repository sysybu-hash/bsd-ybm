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
    href: "/app/billing",
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
    href: "/app/ai",
    icon: Bot,
  },
];

export default function WizardPage() {
  return (
    <div className="px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-black text-gray-900 sm:text-4xl">אשף הטמעה — BSD-YBM פתרונות AI</h1>
        <p className="mt-3 max-w-2xl text-gray-500">
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
                className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:border-teal-200"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                    <Icon size={18} />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-[0.16em] text-gray-400">שלב {idx + 1}</span>
                </div>
                <h2 className="text-xl font-black text-gray-900">{item.title}</h2>
                <p className="mt-2 text-sm text-gray-500">{item.text}</p>
                <div className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-teal-600">
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
