"use client";

import MarketingPublicShell from "@/components/marketing/MarketingPublicShell";
import { useI18n } from "@/components/I18nProvider";

export default function SolutionsPageClient() {
  const { messages } = useI18n();
  const ms = (messages as Record<string, unknown>).marketingSolutions as {
    eyebrow: string;
    title: string;
    description: string;
    items: { title: string; body: string }[];
  };

  return (
    <MarketingPublicShell title={ms.title} eyebrow={ms.eyebrow} description={ms.description}>
      <div className="grid gap-4 lg:grid-cols-2">
        {ms.items.map((solution) => (
          <article key={solution.title} className="v2-panel p-6">
            <h2 className="text-2xl font-black text-[color:var(--v2-ink)]">{solution.title}</h2>
            <p className="mt-3 text-sm leading-7 text-[color:var(--v2-muted)]">{solution.body}</p>
          </article>
        ))}
      </div>
    </MarketingPublicShell>
  );
}
