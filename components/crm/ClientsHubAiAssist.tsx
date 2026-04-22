"use client";

import AiAssistInlineLauncher from "@/components/ai/AiAssistInlineLauncher";
import { useI18n } from "@/components/I18nProvider";
import type { IndustryProfile } from "@/lib/professions/runtime";

type Props = {
  orgId: string;
  industryProfile: IndustryProfile;
  userFirstName: string;
  insightText: string;
  variant?: "hero" | "compact";
};

export default function ClientsHubAiAssist({
  orgId,
  industryProfile,
  userFirstName,
  insightText,
  variant = "hero",
}: Props) {
  const { t } = useI18n();

  const triggerLabel =
    variant === "hero" ? t("workspaceHome.aiNarrative.open") : t("workspaceHome.aiNarrative.open");

  const triggerClassName =
    variant === "hero"
      ? "tile-cta inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition"
      : "inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--axis-ai-border)] bg-[color:var(--axis-ai-soft)] px-3 py-2 text-[12px] font-bold text-[color:var(--axis-ai-ink)] hover:bg-[color:var(--axis-ai)] hover:text-white";

  return (
    <AiAssistInlineLauncher
      orgId={orgId}
      industryProfile={industryProfile}
      sectionLabel={t("workspaceClients.eyebrow")}
      sectionSummary={insightText}
      userFirstName={userFirstName}
      triggerLabel={triggerLabel}
      triggerClassName={triggerClassName}
      triggerShowArrow={variant === "hero"}
    />
  );
}
