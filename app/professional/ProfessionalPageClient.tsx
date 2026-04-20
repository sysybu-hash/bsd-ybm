"use client";

import MarketingPublicShell from "@/components/marketing/MarketingPublicShell";
import { useI18n } from "@/components/I18nProvider";

export default function ProfessionalPageClient() {
  const { t } = useI18n();

  return (
    <MarketingPublicShell
      title={t("professionalPage.title")}
      eyebrow={t("publicShell.navProfessional")}
      description={t("professionalPage.shellDescription")}
    >
      <div className="v2-panel p-8">
        <div className="space-y-6 text-lg leading-8 text-[color:var(--v2-muted)]">
          <p>{t("professionalPage.body")}</p>
        </div>
      </div>
    </MarketingPublicShell>
  );
}
