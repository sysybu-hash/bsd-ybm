"use client";

import MarketingPublicShell from "@/components/marketing/MarketingPublicShell";
import { useI18n } from "@/components/I18nProvider";

export default function AboutPageClient() {
  const { t } = useI18n();

  return (
    <MarketingPublicShell
      title={t("aboutPage.title")}
      eyebrow={t("publicShell.navAbout")}
      description={t("aboutPage.shellDescription")}
    >
      <div className="tile p-8">
        <div className="space-y-6 text-lg leading-8 text-[color:var(--ink-500)]">
          <p>{t("aboutPage.body")}</p>
        </div>
      </div>
    </MarketingPublicShell>
  );
}
