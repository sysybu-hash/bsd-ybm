"use client";

import MarketingPublicShell from "@/components/marketing/MarketingPublicShell";
import { useI18n } from "@/components/I18nProvider";

export default function AboutPageClient() {
  const { t } = useI18n();

  return (
    <MarketingPublicShell title={t("aboutPage.title")}>
      <div className="space-y-6 text-lg leading-relaxed text-gray-400/95">
        <p>{t("aboutPage.body")}</p>
      </div>
    </MarketingPublicShell>
  );
}
