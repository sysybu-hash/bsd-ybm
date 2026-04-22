"use client";

import { BarChart3, CreditCard, FileText, FolderCog, UsersRound } from "lucide-react";
import MarketingPublicShell from "@/components/marketing/MarketingPublicShell";
import { useI18n } from "@/components/I18nProvider";

const MODULE_ORDER = [
  { key: "clients" as const, icon: UsersRound },
  { key: "docs" as const, icon: FileText },
  { key: "finance" as const, icon: CreditCard },
  { key: "ai" as const, icon: BarChart3 },
  { key: "operations" as const, icon: FolderCog },
];

export default function ProductPageClient() {
  const { messages } = useI18n();
  const mp = (messages as Record<string, unknown>).marketingProduct as {
    eyebrow: string;
    title: string;
    description: string;
    modules: Record<string, { title: string; body: string }>;
  };

  return (
    <MarketingPublicShell title={mp.title} eyebrow={mp.eyebrow} description={mp.description}>
      <div id="projects" className="scroll-mt-24 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {MODULE_ORDER.map(({ key, icon: Icon }) => {
          const mod = mp.modules[key];
          return (
            <article key={key} className="tile p-6">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--axis-clients-soft)] text-[color:var(--axis-clients)]">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <h2 className="mt-5 text-xl font-black text-[color:var(--ink-900)]">{mod.title}</h2>
              <p className="mt-3 text-sm leading-7 text-[color:var(--ink-500)]">{mod.body}</p>
            </article>
          );
        })}
      </div>
    </MarketingPublicShell>
  );
}
