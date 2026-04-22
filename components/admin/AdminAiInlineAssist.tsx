"use client";

import AiAssistInlineLauncher from "@/components/ai/AiAssistInlineLauncher";
import { useI18n } from "@/components/I18nProvider";
import type { IndustryProfile } from "@/lib/professions/runtime";

type Props = {
  orgId: string;
  industryProfile: IndustryProfile;
  userFirstName: string;
};

/** כפתור Intelligence במסך אדמין — עוזר מקומי במקום ניווט בלבד */
export default function AdminAiInlineAssist({ orgId, industryProfile, userFirstName }: Props) {
  const { t } = useI18n();

  return (
    <AiAssistInlineLauncher
      orgId={orgId}
      industryProfile={industryProfile}
      sectionLabel="Platform · Intelligence"
      sectionSummary={t("workspaceAiHub.subtitle")}
      userFirstName={userFirstName}
      triggerLabel="Intelligence"
      triggerClassName="inline-flex items-center gap-2 rounded-xl border border-[color:var(--line-strong)] bg-[color:var(--canvas-raised)] px-4 py-2.5 text-sm font-bold text-[color:var(--ink-800)] transition hover:bg-[color:var(--canvas-sunken)]"
      triggerShowArrow
    />
  );
}
