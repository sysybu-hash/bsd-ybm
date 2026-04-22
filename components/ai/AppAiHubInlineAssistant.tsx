"use client";

import { useMemo } from "react";
import InlineWorkspaceAssistant from "@/components/ai/InlineWorkspaceAssistant";
import { useI18n } from "@/components/I18nProvider";
import type { IndustryProfile } from "@/lib/professions/runtime";

type Props = {
  orgId: string;
  industryProfile: IndustryProfile;
  userFirstName: string;
};

/** בלוק עוזר במסך `/app/ai` — מקומי, בלי להסתמך על Dock */
export default function AppAiHubInlineAssistant({ orgId, industryProfile, userFirstName }: Props) {
  const { t } = useI18n();

  const sectionLabel = t("workspaceAiHub.tabAssistant");
  const sectionSummary = t("workspaceAiHub.assistantBody");

  const welcomeMessage = useMemo(() => {
    const first = userFirstName.split(" ")[0] || t("workspaceDock.guestName");
    return t("workspaceDock.welcome", {
      name: first,
      section: sectionLabel,
      industry: industryProfile.industryLabel,
      documents: industryProfile.documentsLabel.toLowerCase(),
    });
  }, [industryProfile.documentsLabel, industryProfile.industryLabel, sectionLabel, t, userFirstName]);

  const quickPrompts = useMemo(
    () => [
      t("workspaceDock.quickPrompts.default.0"),
      t("workspaceDock.quickPrompts.default.1", { section: sectionLabel }),
      t("workspaceDock.quickPrompts.default.2"),
    ],
    [sectionLabel, t],
  );

  return (
    <div id="assistant" className="scroll-mt-24">
      <InlineWorkspaceAssistant
        orgId={orgId}
        industryProfile={industryProfile}
        sectionLabel={sectionLabel}
        sectionSummary={sectionSummary}
        quickPrompts={quickPrompts}
        welcomeMessage={welcomeMessage}
        variant="embed"
      />
    </div>
  );
}
