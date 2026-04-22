"use client";

import AiAssistInlineLauncher from "@/components/ai/AiAssistInlineLauncher";
import { useI18n } from "@/components/I18nProvider";
import type { IndustryProfile } from "@/lib/professions/runtime";

type Props = {
  orgId: string;
  industryProfile: IndustryProfile;
  sectionSummary: string;
  userFirstName: string;
};

const quickToneClass =
  "border-[color:var(--axis-ai-border)] bg-[color:var(--axis-ai-soft)] text-[color:var(--axis-ai-ink)] hover:bg-[color:var(--axis-ai)] hover:text-white";

/** אריח AI במסך הבית — עוזר מקומי בלי ניווט ל־/app/ai */
export default function HomeAiAssistTile({ orgId, industryProfile, sectionSummary, userFirstName }: Props) {
  const { t } = useI18n();

  return (
    <AiAssistInlineLauncher
      orgId={orgId}
      industryProfile={industryProfile}
      sectionLabel={t("workspaceHome.aiNarrative.eyebrowShort")}
      sectionSummary={sectionSummary}
      userFirstName={userFirstName}
      triggerLabel={t("workspaceHome.aiNarrative.open")}
    />
  );
}

/** כפתור פעולה מהירה — אותו עוזר מבודד, סגנון QuickLink */
export function HomeQuickAiAssistButton({
  orgId,
  industryProfile,
  sectionSummary,
  userFirstName,
  label,
}: Props & { label: string }) {
  const { t } = useI18n();

  return (
    <AiAssistInlineLauncher
      orgId={orgId}
      industryProfile={industryProfile}
      sectionLabel={t("workspaceHome.quickActions.askAi")}
      sectionSummary={sectionSummary}
      userFirstName={userFirstName}
      triggerLabel={label}
      triggerClassName={`inline-flex w-full min-h-[2.5rem] items-center justify-center gap-2 rounded-lg border px-3 py-2 text-center text-[12px] font-bold transition ${quickToneClass}`}
    />
  );
}
