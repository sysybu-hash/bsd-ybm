"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import MarketingPublicShell from "@/components/marketing/MarketingPublicShell";
import { useI18n } from "@/components/I18nProvider";

export default function PricingPageClient() {
  const { messages } = useI18n();
  const mp = (messages as Record<string, unknown>).marketingPricing as {
    eyebrow: string;
    title: string;
    description: string;
    cta: string;
    tiers: { name: string; price: string; body: string; points: string[] }[];
  };

  return (
    <MarketingPublicShell title={mp.title} eyebrow={mp.eyebrow} description={mp.description}>
      <div className="grid gap-4 xl:grid-cols-3">
        {mp.tiers.map((tier) => (
          <article key={tier.name} className="tile p-6">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[color:var(--axis-clients)]">{tier.name}</p>
            <h2 className="mt-4 text-3xl font-black text-[color:var(--ink-900)]">{tier.price}</h2>
            <p className="mt-3 text-sm leading-7 text-[color:var(--ink-500)]">{tier.body}</p>
            <div className="mt-6 grid gap-3">
              {tier.points.map((point) => (
                <div key={point} className="flex items-center gap-3 rounded-2xl bg-[color:var(--canvas-sunken)] px-4 py-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-[color:var(--state-success)]" aria-hidden />
                  <span className="text-sm font-semibold text-[color:var(--ink-900)]">{point}</span>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>

      <div className="mt-6">
        <Link href="/contact" className="bento-btn bento-btn--primary">
          {mp.cta}
        </Link>
      </div>
    </MarketingPublicShell>
  );
}
