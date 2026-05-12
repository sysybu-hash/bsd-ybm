"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  ArrowRight,
  Bolt,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  Play,
  ScanLine,
  Sparkles,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import type { IndustryProfile } from "@/lib/professions/runtime";
import type { EngineCardId } from "@/lib/professions/scan-wizard";
import { getScanWizardProfile } from "@/lib/professions/scan-wizard";
import type { EngineRunMode } from "@/components/scan/state/scan-machine";
import { useScanState } from "@/components/scan/hooks/useScanState";
import { useScanEngine } from "@/components/scan/hooks/useScanEngine";
import { useScanSave } from "@/components/scan/hooks/useScanSave";
import {
  PRELOAD_SCAN_FILES_EVENT,
  type PreloadScanFilesDetail,
} from "@/components/scan/hooks/useGlobalScanTriggers";
import IndustryHero from "./IndustryHero";
import WizardProgressRail, { type WizardStepDescriptor } from "./WizardProgressRail";
import CreditsChip from "./CreditsChip";
import Step1ModeUpload from "./steps/Step1ModeUpload";
import Step2Context from "./steps/Step2Context";
import Step3Engine from "./steps/Step3Engine";
import Step4Review from "./steps/Step4Review";
import StepDone from "./steps/StepDone";
import "./scan-wizard.css";
import type { ScanHubPreviewPayload } from "@/components/multi-engine-scanner/types";
import { isImageFile, isPdfFile } from "@/components/multi-engine-scanner/utils";
import { Skeleton } from "@/components/ui/Skeleton";

const ErpProjectNotebook = dynamic(() => import("@/components/erp/ErpProjectNotebook"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[240px] items-center justify-center rounded-3xl border border-[color:var(--scanw-line)] bg-[color:var(--scanw-card-bg)] p-8">
      <Skeleton className="h-10 w-48" />
    </div>
  ),
});

export type ScanWizardShellVariant = "page" | "dock" | "embed";

type Props = {
  industryProfile: IndustryProfile;
  geminiConfigured: boolean;
  /** page — דף /app/scan מלא; dock — דוק צף; embed — מקטע בתוך דף (למשל Business) */
  variant?: ScanWizardShellVariant;
  /** מצב מהיר (3 שלבים). בדף הסריקה: מופעל עם ‎?express=1‎. ב־dock/embed נכפה אוטומטית כדי לחסוך גובה. */
  expressMode?: boolean;
  onScanHubPreviewUpdate?: (snapshot: ScanHubPreviewPayload) => void;
  hubPreviewMode?: boolean;
  onHubPreviewFocusRequest?: () => void;
};

const EXPRESS_STEP_IDS = ["upload", "review", "done"] as const;
const FULL_STEP_IDS = ["upload", "context", "engine", "review", "done"] as const;

export default function ScanWizardShell({
  industryProfile,
  geminiConfigured,
  variant = "page",
  expressMode: expressModeProp,
  onScanHubPreviewUpdate,
  hubPreviewMode: _hubPreviewMode,
  onHubPreviewFocusRequest: _onHubPreviewFocusRequest,
}: Props) {
  void _hubPreviewMode;
  void _onHubPreviewFocusRequest;
  const effectiveExpress = expressModeProp === true || variant !== "page";

  const wizardProfile = useMemo(
    () => getScanWizardProfile(industryProfile.id, industryProfile.constructionTradeId),
    [industryProfile.id, industryProfile.constructionTradeId],
  );

  const { state, dispatch } = useScanState();
  const { startScan } = useScanEngine({ state, dispatch });
  const save = useScanSave({ state, dispatch });

  const [stepIndex, setStepIndex] = useState(0);
  const [creditsRefreshKey, setCreditsRefreshKey] = useState(0);
  const [workspaceTab, setWorkspaceTab] = useState<"scan" | "notebook">("scan");

  useEffect(() => {
    dispatch({ type: "SCAN_MODE_CHANGED", mode: wizardProfile.defaultScanMode });
    const defaultCard = wizardProfile.engineCards.find((c) => c.id === wizardProfile.defaultEngineCard);
    if (defaultCard) dispatch({ type: "ENGINE_MODE_CHANGED", mode: defaultCard.engineRunMode });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wizardProfile.industryId, wizardProfile.tradeId]);

  const onEngineSelect = useCallback(
    (mode: EngineRunMode, _cardId: EngineCardId) => {
      void _cardId;
      dispatch({ type: "ENGINE_MODE_CHANGED", mode });
    },
    [dispatch],
  );

  useEffect(() => {
    const onPreload = (event: Event) => {
      const detail = (event as CustomEvent<PreloadScanFilesDetail>).detail;
      const files = detail?.files ?? [];
      if (files.length === 0) return;
      dispatch({ type: "FILES_SELECTED", files });
      if (effectiveExpress) {
        setStepIndex(1);
        void startScan();
      } else {
        setStepIndex(1);
      }
    };
    window.addEventListener(PRELOAD_SCAN_FILES_EVENT, onPreload);
    return () => window.removeEventListener(PRELOAD_SCAN_FILES_EVENT, onPreload);
  }, [dispatch, startScan, effectiveExpress]);

  useEffect(() => {
    if (state.phase === "review") {
      setCreditsRefreshKey((k) => k + 1);
    }
  }, [state.phase]);

  const stepDescriptors: WizardStepDescriptor[] = useMemo(() => {
    if (effectiveExpress) {
      return [
        {
          id: "upload",
          label: "מסמך וסוג",
          shortLabel: "מסמך",
          icon: <FileText className="h-4 w-4" aria-hidden />,
        },
        {
          id: "review",
          label: "פענוח וסקירה",
          shortLabel: "סקירה",
          icon: <Sparkles className="h-4 w-4" aria-hidden />,
        },
        {
          id: "done",
          label: "סיום",
          shortLabel: "סיום",
          icon: <Play className="h-4 w-4" aria-hidden />,
        },
      ];
    }
    return [
      {
        id: "upload",
        label: "מסמך וסוג",
        shortLabel: "מסמך",
        icon: <FileText className="h-4 w-4" aria-hidden />,
      },
      {
        id: "context",
        label: "הקשר (פרויקט / לקוח)",
        shortLabel: "הקשר",
        icon: <Users className="h-4 w-4" aria-hidden />,
      },
      {
        id: "engine",
        label: "מנוע פענוח",
        shortLabel: "מנוע",
        icon: <Bolt className="h-4 w-4" aria-hidden />,
      },
      {
        id: "review",
        label: "סקירה ושמירה",
        shortLabel: "סקירה",
        icon: <Sparkles className="h-4 w-4" aria-hidden />,
      },
      {
        id: "done",
        label: "סיום",
        shortLabel: "סיום",
        icon: <Play className="h-4 w-4" aria-hidden />,
      },
    ];
  }, [effectiveExpress]);

  const stepCount = effectiveExpress ? 3 : 5;
  const lastStepIndex = stepCount - 1;

  const completedFlags = useMemo<boolean[]>(() => {
    if (effectiveExpress) {
      const flags = [false, false, false];
      flags[0] = state.files.length > 0;
      flags[1] =
        state.phase === "uploading" ||
        state.phase === "extracting" ||
        state.phase === "review" ||
        state.phase === "done" ||
        state.phase === "saving";
      flags[2] = stepIndex >= 2;
      return flags;
    }
    const flags = [false, false, false, false, false];
    flags[0] = state.files.length > 0;
    flags[1] = stepIndex >= 2;
    flags[2] = stepIndex >= 3;
    flags[3] = stepIndex >= 4;
    flags[4] = false;
    return flags;
  }, [effectiveExpress, state.files.length, state.phase, stepIndex]);

  const canAdvance = useCallback(() => {
    if (effectiveExpress) {
      if (stepIndex === 0) return state.files.length > 0;
      if (stepIndex === 1) {
        if (
          state.phase === "extracting" ||
          state.phase === "uploading" ||
          state.phase === "saving" ||
          state.phase === "error"
        ) {
          return false;
        }
        return true;
      }
      return false;
    }
    if (stepIndex === 0) return state.files.length > 0;
    if (stepIndex === 1) return true;
    if (stepIndex === 2) return true;
    if (stepIndex === 3) {
      if (
        state.phase === "extracting" ||
        state.phase === "uploading" ||
        state.phase === "saving" ||
        state.phase === "error"
      ) {
        return false;
      }
      return Boolean(state.aiData || state.v5);
    }
    return false;
  }, [effectiveExpress, stepIndex, state.files.length, state.phase, state.aiData, state.v5]);

  const goNext = async () => {
    if (!canAdvance()) return;
    if (effectiveExpress) {
      if (stepIndex === 0) {
        setStepIndex(1);
        await startScan();
        return;
      }
      if (stepIndex === 1) {
        setStepIndex(2);
      }
      return;
    }
    if (stepIndex === 0) {
      setStepIndex(1);
      return;
    }
    if (stepIndex === 1) {
      setStepIndex(2);
      return;
    }
    if (stepIndex === 2) {
      setStepIndex(3);
      await startScan();
      return;
    }
    if (stepIndex === 3) {
      setStepIndex(4);
    }
  };

  const goBack = () => {
    if (effectiveExpress) {
      if (stepIndex === 0) return;
      if (stepIndex === 1 && (state.phase === "extracting" || state.phase === "uploading")) return;
      if (stepIndex === 1) {
        setStepIndex(0);
        return;
      }
      if (stepIndex === 2) {
        setStepIndex(1);
      }
      return;
    }
    if (stepIndex === 0) return;
    if (stepIndex === 3 && (state.phase === "extracting" || state.phase === "uploading")) return;
    if (stepIndex === 4) {
      setStepIndex(3);
      return;
    }
    setStepIndex((i) => Math.max(0, i - 1));
  };

  const reset = () => {
    dispatch({ type: "RESET" });
    setStepIndex(0);
    setWorkspaceTab("scan");
  };

  const activeFile = state.files[state.activeFileIndex] ?? null;
  const extractionForHub = useMemo(
    () => state.v5 ?? state.partialV5 ?? state.aiData,
    [state.v5, state.partialV5, state.aiData],
  );
  const scanningActive = state.phase === "uploading" || state.phase === "extracting";

  const previewUrl = useMemo(() => {
    if (!activeFile || (!isImageFile(activeFile) && !isPdfFile(activeFile))) return null;
    return URL.createObjectURL(activeFile);
  }, [activeFile]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!onScanHubPreviewUpdate) return;
    let previewKind: ScanHubPreviewPayload["previewKind"] = "none";
    if (activeFile) {
      if (isImageFile(activeFile)) previewKind = "image";
      else if (isPdfFile(activeFile)) previewKind = "pdf";
    }
    onScanHubPreviewUpdate({
      fileName: activeFile?.name ?? null,
      previewUrl,
      previewKind,
      extraction: extractionForHub,
      streamStage: state.streamStage,
      scanError: state.errorMessage,
      scanning: scanningActive,
    });
  }, [
    onScanHubPreviewUpdate,
    activeFile,
    previewUrl,
    extractionForHub,
    state.streamStage,
    state.errorMessage,
    scanningActive,
  ]);

  const rootClass =
    variant === "page"
      ? "scanw-root flex h-[calc(100dvh-112px)] min-h-[640px] w-full flex-col gap-3 overflow-hidden p-3 sm:gap-4 sm:p-4"
      : variant === "dock"
        ? "scanw-root flex h-full min-h-[280px] w-full flex-1 flex-col gap-2 overflow-hidden p-2"
        : "scanw-root flex min-h-[420px] w-full flex-col gap-2 overflow-hidden p-2";

  const showWorkspaceLink = variant === "page";
  const showNotebookTab = variant === "page" && !effectiveExpress;

  const motionStepKey = effectiveExpress ? EXPRESS_STEP_IDS[stepIndex] ?? "upload" : FULL_STEP_IDS[stepIndex] ?? "upload";

  const primaryLoading =
    (effectiveExpress && stepIndex === 1 && (state.phase === "extracting" || state.phase === "uploading")) ||
    (!effectiveExpress && stepIndex === 3 && (state.phase === "extracting" || state.phase === "uploading"));

  const primaryLabel = (() => {
    if (effectiveExpress) {
      if (stepIndex === 0) return "פענח מסמך";
      if (stepIndex === 1) return "סיום";
      return "המשך";
    }
    if (stepIndex === 0) return "המשך לשלב ההקשר";
    if (stepIndex === 1) return "המשך לבחירת מנוע";
    if (stepIndex === 2) return "הרץ פענוח";
    if (stepIndex === 3) return "סיום";
    return "המשך";
  })();

  const showFooter = workspaceTab === "scan" && stepIndex < lastStepIndex;

  return (
    <div className={rootClass} dir="rtl" data-scan-wizard-variant={variant}>
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="inline-flex items-center gap-2 rounded-2xl border border-[color:var(--scanw-line)] bg-[color:var(--scanw-rail-bg)] px-3 py-1.5 text-xs font-black text-[color:var(--scanw-ink)] shadow-sm">
          <ScanLine className="h-4 w-4 shrink-0 text-[color:var(--scanw-accent)]" aria-hidden />
          {effectiveExpress ? "סריקה מהירה" : "אשף סריקה מלא"}
        </div>
        <div className="flex items-center gap-2">
          <CreditsChip label={wizardProfile.hintCreditsLabel} refreshKey={creditsRefreshKey} />
          {showWorkspaceLink ? (
            <Link
              href="/app"
              aria-label="חזרה לסביבת העבודה"
              className="inline-flex h-11 w-11 min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl border border-[color:var(--scanw-line)] bg-white/70 text-[color:var(--scanw-muted)] transition-all duration-200 hover:border-[color:var(--scanw-accent-muted)] hover:text-[color:var(--scanw-ink)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--scanw-accent-muted)] focus-visible:ring-offset-2 active:scale-[0.98]"
            >
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          ) : null}
        </div>
      </div>

      {showNotebookTab ? (
        <div
          className="flex shrink-0 gap-1 overflow-x-auto rounded-2xl border border-[color:var(--scanw-line)] bg-[color:var(--scanw-rail-bg)] p-1"
          role="tablist"
          aria-label="מצב עבודה"
        >
          <button
            type="button"
            role="tab"
            aria-selected={workspaceTab === "scan"}
            id="scan-wizard-tab-scan"
            className={[
              "inline-flex min-h-11 min-w-[120px] flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-black transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--scanw-accent-muted)] focus-visible:ring-offset-2 active:scale-[0.98]",
              workspaceTab === "scan"
                ? "bg-[color:var(--scanw-accent)] text-white shadow-sm"
                : "text-[color:var(--scanw-muted)] hover:bg-white/50",
            ].join(" ")}
            onClick={() => setWorkspaceTab("scan")}
          >
            <ScanLine className="h-4 w-4 shrink-0" aria-hidden />
            סריקה
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={workspaceTab === "notebook"}
            id="scan-wizard-tab-notebook"
            className={[
              "inline-flex min-h-11 min-w-[120px] flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-black transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--scanw-accent-muted)] focus-visible:ring-offset-2 active:scale-[0.98]",
              workspaceTab === "notebook"
                ? "bg-[color:var(--scanw-accent)] text-white shadow-sm"
                : "text-[color:var(--scanw-muted)] hover:bg-white/50",
            ].join(" ")}
            onClick={() => setWorkspaceTab("notebook")}
          >
            <BookOpen className="h-4 w-4 shrink-0" aria-hidden />
            מחברת
          </button>
        </div>
      ) : null}

      <IndustryHero
        profile={wizardProfile}
        modeLabel={workspaceTab === "notebook" ? "מחברת AI" : "סריקה"}
      />

      {workspaceTab === "scan" ? (
        <>
          <WizardProgressRail
            steps={stepDescriptors}
            currentIndex={stepIndex}
            completedFlags={completedFlags}
            onJump={(i) => {
              if (i < stepIndex || completedFlags[i]) setStepIndex(i);
            }}
          />

          <div className="relative min-h-0 flex-1 overflow-y-auto rounded-3xl border border-[color:var(--scanw-line)] bg-[color:var(--scanw-card-bg)] p-4 shadow-[var(--cd-shadow,0_1px_3px_rgba(0,0,0,0.08))] sm:p-6">
            {state.errorMessage ? (
              <div
                role="alert"
                className="mb-3 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-black text-rose-800"
              >
                {state.errorMessage}
              </div>
            ) : null}

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={motionStepKey}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              >
                {effectiveExpress ? (
                  <>
                    {stepIndex === 0 ? (
                      <Step1ModeUpload
                        profile={wizardProfile}
                        files={state.files}
                        activeFileIndex={state.activeFileIndex}
                        selectedMode={state.scanMode}
                        onMode={(mode) => dispatch({ type: "SCAN_MODE_CHANGED", mode })}
                        onFilesAdded={(files) =>
                          dispatch({ type: "FILES_SELECTED", files: [...state.files, ...files].slice(0, 5) })
                        }
                        onFileRemove={(index) => dispatch({ type: "FILE_REMOVED", index })}
                        onActiveFileChange={(index) => dispatch({ type: "ACTIVE_FILE_CHANGED", index })}
                      />
                    ) : null}
                    {stepIndex === 1 ? (
                      <Step4Review
                        profile={wizardProfile}
                        aiData={state.aiData}
                        v5={state.v5}
                        saving={state.phase === "saving"}
                        saveTarget={state.saveTarget}
                        streamStage={state.streamStage}
                        partialV5={state.partialV5}
                        isExtracting={state.phase === "extracting" || state.phase === "uploading"}
                        elapsedSeconds={state.elapsedSeconds}
                        onSave={(target) => void save.save(target)}
                        onRescan={() => void startScan()}
                      />
                    ) : null}
                    {stepIndex === 2 ? (
                      <StepDone
                        profile={wizardProfile}
                        saveTarget={state.saveTarget}
                        savedDocumentId={state.savedDocumentId}
                        onAnother={reset}
                      />
                    ) : null}
                  </>
                ) : (
                  <>
                    {stepIndex === 0 ? (
                      <Step1ModeUpload
                        profile={wizardProfile}
                        files={state.files}
                        activeFileIndex={state.activeFileIndex}
                        selectedMode={state.scanMode}
                        onMode={(mode) => dispatch({ type: "SCAN_MODE_CHANGED", mode })}
                        onFilesAdded={(files) =>
                          dispatch({ type: "FILES_SELECTED", files: [...state.files, ...files].slice(0, 5) })
                        }
                        onFileRemove={(index) => dispatch({ type: "FILE_REMOVED", index })}
                        onActiveFileChange={(index) => dispatch({ type: "ACTIVE_FILE_CHANGED", index })}
                      />
                    ) : null}
                    {stepIndex === 1 ? (
                      <Step2Context
                        profile={wizardProfile}
                        projectLabel={state.projectLabel}
                        clientLabel={state.clientLabel}
                        userInstruction={state.userInstruction}
                        onProject={(value) => dispatch({ type: "PROJECT_LABEL_CHANGED", value })}
                        onClient={(value) => dispatch({ type: "CLIENT_LABEL_CHANGED", value })}
                        onInstruction={(value) => dispatch({ type: "INSTRUCTION_CHANGED", value })}
                      />
                    ) : null}
                    {stepIndex === 2 ? (
                      <Step3Engine
                        profile={wizardProfile}
                        selectedEngineRunMode={state.engineRunMode}
                        onSelect={onEngineSelect}
                      />
                    ) : null}
                    {stepIndex === 3 ? (
                      <Step4Review
                        profile={wizardProfile}
                        aiData={state.aiData}
                        v5={state.v5}
                        saving={state.phase === "saving"}
                        saveTarget={state.saveTarget}
                        streamStage={state.streamStage}
                        partialV5={state.partialV5}
                        isExtracting={state.phase === "extracting" || state.phase === "uploading"}
                        elapsedSeconds={state.elapsedSeconds}
                        onSave={(target) => void save.save(target)}
                        onRescan={() => void startScan()}
                      />
                    ) : null}
                    {stepIndex === 4 ? (
                      <StepDone
                        profile={wizardProfile}
                        saveTarget={state.saveTarget}
                        savedDocumentId={state.savedDocumentId}
                        onAnother={reset}
                      />
                    ) : null}
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {showFooter ? (
            <footer className="sticky bottom-0 z-10 flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-transparent bg-gradient-to-t from-[color:var(--scanw-card-bg)] pt-2 pb-1 sm:pt-3">
              <button
                type="button"
                onClick={goBack}
                disabled={
                  stepIndex === 0 ||
                  (effectiveExpress
                    ? stepIndex === 1 && (state.phase === "extracting" || state.phase === "uploading")
                    : stepIndex === 3 && (state.phase === "extracting" || state.phase === "uploading"))
                }
                className="inline-flex min-h-11 min-w-[88px] items-center justify-center gap-1.5 rounded-2xl border border-[color:var(--scanw-line)] bg-white/90 px-4 text-sm font-black text-[color:var(--scanw-muted)] shadow-sm transition-all duration-200 hover:border-[color:var(--scanw-accent-muted)] hover:text-[color:var(--scanw-ink)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--scanw-accent-muted)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 active:scale-[0.98]"
              >
                <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
                חזור
              </button>
              <button
                type="button"
                onClick={() => void goNext()}
                disabled={!canAdvance()}
                title={!canAdvance() && stepIndex === 3 && !state.aiData && !state.v5 ? "יש להמתין לסיום הפענוח" : undefined}
                className="inline-flex min-h-11 min-w-[120px] flex-1 items-center justify-center gap-1.5 rounded-2xl bg-[color:var(--scanw-accent)] px-5 text-sm font-black text-white shadow-[0_8px_24px_-12px_var(--scanw-accent)] transition-all duration-200 hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] sm:flex-initial sm:min-w-[160px]"
              >
                {primaryLoading ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                ) : stepIndex === 0 && !effectiveExpress ? (
                  <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
                ) : stepIndex === 0 && effectiveExpress ? (
                  <Play className="h-4 w-4 shrink-0" aria-hidden />
                ) : !effectiveExpress && stepIndex === 2 ? (
                  <Play className="h-4 w-4 shrink-0" aria-hidden />
                ) : (
                  <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
                )}
                <span className="truncate">{primaryLabel}</span>
                {!primaryLoading && (effectiveExpress ? stepIndex === 1 : stepIndex === 3) ? (
                  <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
                ) : null}
              </button>
            </footer>
          ) : null}
        </>
      ) : (
        <div className="relative min-h-0 flex-1 overflow-y-auto rounded-3xl border border-[color:var(--scanw-line)] bg-[color:var(--scanw-card-bg)] p-3 sm:p-4">
          <ErpProjectNotebook geminiConfigured={geminiConfigured} embedInHub embedCompact />
        </div>
      )}
    </div>
  );
}
