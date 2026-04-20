"use client";

import { useState } from "react";
import { BrainCircuit, ScanSearch, Sparkles } from "lucide-react";
import MultiEngineScanner from "@/components/MultiEngineScanner";
import { useI18n } from "@/components/I18nProvider";
import { WorkspaceSurface } from "@/components/workspace/WorkspacePageScaffold";

type DashboardAiHubProps = {
  orgId: string;
};

export default function DashboardAiHub({ orgId }: DashboardAiHubProps) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<"scanner" | "assistant">("scanner");

  return (
    <div className="w-full space-y-6" dir="rtl">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <span
            className="v2-eyebrow"
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
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-[color:var(--line)] bg-[color:var(--canvas-raised)] p-5">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ background: "var(--axis-ai-soft)", color: "var(--axis-ai)" }}
              >
                <BrainCircuit className="h-5 w-5" aria-hidden />
              </span>
              <p className="mt-4 text-base font-bold text-[color:var(--ink-900)]">
                {t("workspaceAiHub.assistantHint")}
              </p>
              <p className="mt-2 text-[13px] leading-6 text-[color:var(--ink-500)]">
                Org ID: {orgId || "N/A"}
              </p>
            </div>
            <div className="rounded-lg border border-[color:var(--line)] bg-[color:var(--canvas-raised)] p-5">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ background: "var(--axis-ai-soft)", color: "var(--axis-ai)" }}
              >
                <ScanSearch className="h-5 w-5" aria-hidden />
              </span>
              <p className="mt-4 text-base font-bold text-[color:var(--ink-900)]">
                {t("workspaceAiHub.scannerBody")}
              </p>
            </div>
          </div>
        </WorkspaceSurface>
      )}
    </div>
  );
}
