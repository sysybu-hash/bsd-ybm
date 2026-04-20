"use client";

import { useState } from "react";
import { BrainCircuit, ScanSearch } from "lucide-react";
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
    <div className="w-full animate-fade-in space-y-8" dir="rtl">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">
            {t("workspaceAiHub.title")}
          </h1>
          <p className="mt-2 max-w-2xl font-medium text-slate-500">{t("workspaceAiHub.subtitle")}</p>
        </div>

        <div className="flex rounded-2xl border border-slate-200 bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("scanner")}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${
              activeTab === "scanner"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t("workspaceAiHub.tabScanner")}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("assistant")}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${
              activeTab === "assistant"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t("workspaceAiHub.tabAssistant")}
          </button>
        </div>
      </div>

      {activeTab === "scanner" ? (
        <WorkspaceSurface
          title={t("workspaceAiHub.tabScanner")}
          description={t("workspaceAiHub.scannerBody")}
        >
          <MultiEngineScanner />
        </WorkspaceSurface>
      ) : (
        <WorkspaceSurface
          title={t("workspaceAiHub.tabAssistant")}
          description={t("workspaceAiHub.assistantBody")}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-6">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--v2-accent-soft)] text-[color:var(--v2-accent)]">
                <BrainCircuit className="h-5 w-5" aria-hidden />
              </span>
              <p className="mt-4 text-base font-black text-slate-900">{t("workspaceAiHub.assistantHint")}</p>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                Org ID: {orgId || "N/A"}
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-6">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--v2-accent-soft)] text-[color:var(--v2-accent)]">
                <ScanSearch className="h-5 w-5" aria-hidden />
              </span>
              <p className="mt-4 text-base font-black text-slate-900">{t("workspaceAiHub.scannerBody")}</p>
            </div>
          </div>
        </WorkspaceSurface>
      )}
    </div>
  );
}
