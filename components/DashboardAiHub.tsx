"use client";

import { useMemo, useState } from "react";
import { ScanSearch, Sparkles } from "lucide-react";
import InlineWorkspaceAssistant from "@/components/ai/InlineWorkspaceAssistant";
import MultiEngineScanner from "@/components/MultiEngineScanner";
import { useI18n } from "@/components/I18nProvider";
import type { IndustryProfile } from "@/lib/professions/runtime";
import { WorkspaceSurface } from "@/components/workspace/WorkspacePageScaffold";

type DashboardAiHubProps = {
  orgId: string;
  industryProfile: IndustryProfile;
  userFirstName: string;
};

export default function DashboardAiHub({ orgId, industryProfile, userFirstName }: DashboardAiHubProps) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<"scanner" | "assistant">("scanner");

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
    <div className="w-full min-w-0 space-y-8" dir="rtl">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <span
            className="bento-eyebrow"
            style={{ color: "var(--axis-ai)", background: "var(--axis-ai-soft)", borderColor: "transparent" }}
          >
            <Sparkles className="me-1 h-3 w-3" aria-hidden />
            {t("workspaceAiHub.eyebrow") || "AI"}
          </span>
          <h1 className="mt-3 text-[40px] leading-[1.05] font-black tracking-tight text-[color:var(--ink-900)] sm:text-[48px]">
            {t("workspaceAiHub.title")}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[color:var(--ink-500)]">
            {t("workspaceAiHub.subtitle")}
          </p>
        </div>

        <div
          className="flex rounded-lg border border-[color:var(--line)] bg-[color:var(--canvas-sunken)] p-1"
          role="tablist"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "scanner"}
            onClick={() => setActiveTab("scanner")}
            className={`rounded-md px-4 py-1.5 text-[13px] font-bold transition ${
              activeTab === "scanner"
                ? "bg-[color:var(--canvas-raised)] text-[color:var(--ink-900)] shadow-[var(--shadow-xs)]"
                : "text-[color:var(--ink-500)] hover:text-[color:var(--ink-900)]"
            }`}
          >
            {t("workspaceAiHub.tabScanner")}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "assistant"}
            onClick={() => setActiveTab("assistant")}
            className={`rounded-md px-4 py-1.5 text-[13px] font-bold transition ${
              activeTab === "assistant"
                ? "bg-[color:var(--canvas-raised)] text-[color:var(--ink-900)] shadow-[var(--shadow-xs)]"
                : "text-[color:var(--ink-500)] hover:text-[color:var(--ink-900)]"
            }`}
          >
            {t("workspaceAiHub.tabAssistant")}
          </button>
        </div>
      </div>

      {activeTab === "scanner" ? (
        <WorkspaceSurface
          axis="ai"
          title={t("workspaceAiHub.tabScanner")}
          description={t("workspaceAiHub.scannerBody")}
        >
          <MultiEngineScanner />
        </WorkspaceSurface>
      ) : (
        <WorkspaceSurface
          axis="ai"
          title={t("workspaceAiHub.tabAssistant")}
          description={t("workspaceAiHub.assistantBody")}
        >
          <InlineWorkspaceAssistant
            orgId={orgId}
            industryProfile={industryProfile}
            sectionLabel={sectionLabel}
            sectionSummary={sectionSummary}
            quickPrompts={quickPrompts}
            welcomeMessage={welcomeMessage}
            variant="embed"
          />
        </WorkspaceSurface>
      )}
    </div>
  );
}
