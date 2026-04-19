"use client";

import Image from "next/image";
import Link from "next/link";
import { Layers3, Link2, Sparkles } from "lucide-react";
import MarketingPublicShell from "@/components/marketing/MarketingPublicShell";
import { useI18n } from "@/components/I18nProvider";

const PILLAR_ICONS = [Link2, Layers3, Sparkles] as const;
const PILLAR_KEYS = ["crm", "erp", "ai"] as const;

export default function BriefPageClient() {
  const { t } = useI18n();

  return (
    <MarketingPublicShell
      title={t("brandBriefPage.title")}
      eyebrow={t("brandBriefPage.eyebrow")}
      description={t("brandBriefPage.description")}
    >
      <div className="space-y-12 sm:space-y-16">
        <figure className="relative overflow-hidden rounded-[28px] border border-[color:var(--v2-line)] bg-[color:var(--v2-canvas)] shadow-[0_24px_60px_-28px_rgba(15,23,42,0.35)]">
          <div className="relative aspect-[16/9] w-full sm:aspect-[21/9]">
            <Image
              src="/marketing/bsd-ybm-hero-boulevard-16x9.png"
              alt={t("brandBriefPage.heroAlt")}
              fill
              className="object-cover object-center"
              sizes="(max-width: 1024px) 100vw, 896px"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--v2-canvas)]/95 via-transparent to-transparent" />
          </div>
          <figcaption className="sr-only">{t("brandBriefPage.heroAlt")}</figcaption>
        </figure>

        <div className="v2-panel v2-panel-soft p-6 sm:p-8">
          <p className="text-base leading-8 text-[color:var(--v2-muted)] sm:text-lg sm:leading-9">{t("brandBriefPage.intro")}</p>
        </div>

        <section className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-[0.22em] text-[color:var(--v2-muted)]">{t("brandBriefPage.pathTitle")}</h2>
          <p className="max-w-3xl text-base leading-8 text-[color:var(--v2-ink)] sm:text-lg sm:leading-9">{t("brandBriefPage.pathBody")}</p>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-black tracking-[-0.04em] text-[color:var(--v2-ink)] sm:text-3xl">{t("brandBriefPage.pillarsTitle")}</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {PILLAR_KEYS.map((key, i) => {
              const Icon = PILLAR_ICONS[i] ?? Layers3;
              return (
                <article
                  key={key}
                  className="v2-panel flex flex-col gap-3 p-5 transition hover:border-[color:var(--v2-accent)]/35"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--v2-accent-soft)] text-[color:var(--v2-accent)]">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="text-lg font-black text-[color:var(--v2-ink)]">{t(`brandBriefPage.pillars.${key}.title`)}</h3>
                  <p className="text-sm leading-7 text-[color:var(--v2-muted)]">{t(`brandBriefPage.pillars.${key}.body`)}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section
          className="relative overflow-hidden rounded-[28px] border border-[color:var(--v2-line)] px-6 py-10 sm:px-10"
          style={{
            backgroundImage: "url(/marketing/bsd-ybm-bg-modular-mesh.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          aria-label={t("brandBriefPage.meshAriaLabel")}
        >
          <div className="absolute inset-0 bg-[color:var(--v2-surface)]/86 backdrop-blur-[2px]" aria-hidden />
          <div className="relative space-y-4">
            <h2 className="text-2xl font-black tracking-[-0.04em] text-[color:var(--v2-ink)] sm:text-3xl">{t("brandBriefPage.modularTitle")}</h2>
            <p className="max-w-3xl text-base leading-8 text-[color:var(--v2-muted)] sm:text-lg sm:leading-9">{t("brandBriefPage.modularBody")}</p>
          </div>
        </section>

        <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-14">
          <div className="order-2 space-y-4 lg:order-1">
            <h2 className="text-xl font-black text-[color:var(--v2-ink)] sm:text-2xl">{t("brandBriefPage.visualCrmTitle")}</h2>
            <p className="text-base leading-8 text-[color:var(--v2-muted)]">{t("brandBriefPage.visualCrmBody")}</p>
          </div>
          <div className="order-1 overflow-hidden rounded-2xl border border-[color:var(--v2-line)] shadow-lg lg:order-2">
            <Image
              src="/marketing/bsd-ybm-crm-erp-bridge.png"
              alt=""
              width={1200}
              height={900}
              className="h-auto w-full object-cover"
              sizes="(max-width: 1024px) 100vw, 480px"
            />
          </div>
        </div>

        <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-14">
          <div className="overflow-hidden rounded-2xl border border-[color:var(--v2-line)] shadow-lg">
            <Image
              src="/marketing/bsd-ybm-documents-ai-flow.png"
              alt=""
              width={1200}
              height={900}
              className="h-auto w-full object-cover"
              sizes="(max-width: 1024px) 100vw, 480px"
            />
          </div>
          <div className="space-y-4">
            <h2 className="text-xl font-black text-[color:var(--v2-ink)] sm:text-2xl">{t("brandBriefPage.visualDocsTitle")}</h2>
            <p className="text-base leading-8 text-[color:var(--v2-muted)]">{t("brandBriefPage.visualDocsBody")}</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-[color:var(--v2-line)] pt-10 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-3">
            <Link href="/product" className="v2-button v2-button-primary">
              {t("brandBriefPage.ctaProduct")}
            </Link>
            <Link href="/register" className="v2-button v2-button-secondary">
              {t("brandBriefPage.ctaStart")}
            </Link>
          </div>
        </div>

        <p className="text-center text-xs leading-relaxed text-[color:var(--v2-muted)]">{t("brandBriefPage.footnote")}</p>
      </div>
    </MarketingPublicShell>
  );
}
