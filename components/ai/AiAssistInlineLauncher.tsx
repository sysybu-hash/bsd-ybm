"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, X } from "lucide-react";
import InlineWorkspaceAssistant from "@/components/ai/InlineWorkspaceAssistant";
import { useI18n } from "@/components/I18nProvider";
import type { IndustryProfile } from "@/lib/professions/runtime";

export type AiAssistInlineLauncherProps = {
  orgId: string;
  industryProfile: IndustryProfile;
  sectionLabel: string;
  sectionSummary: string;
  userFirstName: string;
  quickPrompts?: string[];
  /** טקסט על הכפתור לפני פתיחה */
  triggerLabel: string;
  triggerClassName?: string;
  triggerShowArrow?: boolean;
};

function buildWelcome(
  userFirstName: string,
  industryProfile: IndustryProfile,
  sectionLabel: string,
  t: (key: string, vars?: Record<string, string>) => string,
) {
  const first = userFirstName.split(" ")[0] || t("workspaceDock.guestName");
  return t("workspaceDock.welcome", {
    name: first,
    section: sectionLabel,
    industry: industryProfile.industryLabel,
    documents: industryProfile.documentsLabel.toLowerCase(),
  });
}

/**
 * כפתור שפותח עוזר AI באותו מסך — בלי מעבר ל־/app/ai.
 */
export default function AiAssistInlineLauncher({
  orgId,
  industryProfile,
  sectionLabel,
  sectionSummary,
  userFirstName,
  quickPrompts: quickPromptsProp,
  triggerLabel,
  triggerClassName,
  triggerShowArrow = true,
}: AiAssistInlineLauncherProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  const quickPrompts = useMemo(() => {
    if (quickPromptsProp?.length) return quickPromptsProp;
    return [
      t("workspaceDock.quickPrompts.default.0"),
      t("workspaceDock.quickPrompts.default.1", { section: sectionLabel }),
      t("workspaceDock.quickPrompts.default.2"),
    ];
  }, [quickPromptsProp, sectionLabel, t]);

  const welcomeMessage = useMemo(
    () => buildWelcome(userFirstName, industryProfile, sectionLabel, t),
    [userFirstName, industryProfile, sectionLabel, t],
  );

  return (
    <div className="w-full">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={
            triggerClassName ??
            "tile-cta inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition"
          }
        >
          {triggerLabel}
          {triggerShowArrow ? <ArrowUpRight className="h-4 w-4" aria-hidden /> : null}
        </button>
      ) : (
        <div className="mt-2 space-y-3">
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-1 rounded-lg border border-[color:var(--line)] bg-[color:var(--canvas-sunken)] px-3 py-1.5 text-[11px] font-bold text-[color:var(--ink-600)] transition hover:bg-[color:var(--canvas-raised)] hover:text-[color:var(--ink-900)]"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
              {t("nav.close")}
            </button>
          </div>
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
      )}
    </div>
  );
}
