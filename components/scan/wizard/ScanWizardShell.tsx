"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, FileText, Loader2, Play, ScanLine, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import type { IndustryProfile } from "@/lib/professions/runtime";
import { getScanWizardProfile } from "@/lib/professions/scan-wizard";
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
import Step4Review from "./steps/Step4Review";
import StepDone from "./steps/StepDone";
import "./scan-wizard.css";
import type { ScanHubPreviewPayload } from "@/components/multi-engine-scanner/types";
import { isImageFile, isPdfFile } from "@/components/multi-engine-scanner/utils";

export type ScanWizardShellVariant = "page" | "dock" | "embed";

type Props = {
  industryProfile: IndustryProfile;
  geminiConfigured: boolean;
  /** page — דף /app/scan מלא; dock — דוק צף; embed — מקטע בתוך דף (למשל Business) */
  variant?: ScanWizardShellVariant;
  onScanHubPreviewUpdate?: (snapshot: ScanHubPreviewPayload) => void;
  /** שמור לתאימות מול ממשק ישן — ניתן לחבר מחדש לשלבי תצוגה מקדימה */
  hubPreviewMode?: boolean;
  onHubPreviewFocusRequest?: () => void;
};

/** מצב Express: העלאה → פענוח וסקירה במסך אחד → סיום */
const STEP_IDS = ["upload", "review", "done"] as const;
type StepId = (typeof STEP_IDS)[number];

const STEP_LABELS: Record<StepId, { label: string; shortLabel: string; icon: React.ReactNode }> = {
  upload: { label: "מסמך וסוג", shortLabel: "מסמך", icon: <FileText className="h-4 w-4" aria-hidden /> },
  review: { label: "פענוח וסקירה", shortLabel: "סקירה", icon: <Sparkles className="h-4 w-4" aria-hidden /> },
  done: { label: "סיום", shortLabel: "סיום", icon: <Play className="h-4 w-4" aria-hidden /> },
};

export default function ScanWizardShell({
  industryProfile,
  geminiConfigured,
  variant = "page",
  onScanHubPreviewUpdate,
  hubPreviewMode: _hubPreviewMode,
  onHubPreviewFocusRequest: _onHubPreviewFocusRequest,
}: Props) {
  void geminiConfigured;
  const wizardProfile = useMemo(
    () => getScanWizardProfile(industryProfile.id, industryProfile.constructionTradeId),
    [industryProfile.id, industryProfile.constructionTradeId],
  );

  const { state, dispatch } = useScanState();
  const { startScan } = useScanEngine({ state, dispatch });
  const save = useScanSave({ state, dispatch });

  const [stepIndex, setStepIndex] = useState(0);
  const [creditsRefreshKey, setCreditsRefreshKey] = useState(0);

  useEffect(() => {
    dispatch({ type: "SCAN_MODE_CHANGED", mode: wizardProfile.defaultScanMode });
    const defaultCard = wizardProfile.engineCards.find((c) => c.id === wizardProfile.defaultEngineCard);
    if (defaultCard) dispatch({ type: "ENGINE_MODE_CHANGED", mode: defaultCard.engineRunMode });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wizardProfile.industryId, wizardProfile.tradeId]);

  useEffect(() => {
    const onPreload = (event: Event) => {
      const detail = (event as CustomEvent<PreloadScanFilesDetail>).detail;
      const files = detail?.files ?? [];
      if (files.length === 0) return;
      dispatch({ type: "FILES_SELECTED", files });
      setStepIndex(1);
      void startScan();
    };
    window.addEventListener(PRELOAD_SCAN_FILES_EVENT, onPreload);
    return () => window.removeEventListener(PRELOAD_SCAN_FILES_EVENT, onPreload);
  }, [dispatch, startScan]);

  useEffect(() => {
    if (state.phase === "review") {
      setCreditsRefreshKey((k) => k + 1);
    }
  }, [state.phase]);

  const completedFlags = useMemo<boolean[]>(() => {
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
  }, [state.files.length, state.phase, stepIndex]);

  const stepDescriptors: WizardStepDescriptor[] = STEP_IDS.map((id) => ({
    id,
    label: STEP_LABELS[id].label,
    shortLabel: STEP_LABELS[id].shortLabel,
    icon: STEP_LABELS[id].icon,
  }));

  const canAdvance = () => {
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
  };

  const goNext = async () => {
    if (!canAdvance()) return;
    if (stepIndex === 0) {
      setStepIndex(1);
      await startScan();
      return;
    }
    if (stepIndex === 1) {
      setStepIndex(2);
      return;
    }
  };

  const goBack = () => {
    if (stepIndex === 0) return;
    if (stepIndex === 1 && (state.phase === "extracting" || state.phase === "uploading")) {
      return;
    }
    if (stepIndex === 1) {
      setStepIndex(0);
      return;
    }
    if (stepIndex === 2) {
      setStepIndex(1);
    }
  };

  const reset = () => {
    dispatch({ type: "RESET" });
    setStepIndex(0);
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
      ? "scanw-root flex h-[calc(100dvh-112px)] min-h-[640px] w-full flex-col gap-3 overflow-hidden p-3"
      : variant === "dock"
        ? "scanw-root flex h-full min-h-[280px] w-full flex-1 flex-col gap-2 overflow-hidden p-2"
        : "scanw-root flex min-h-[420px] w-full flex-col gap-2 overflow-hidden p-2";

  const showWorkspaceLink = variant === "page";

  return (
    <div className={rootClass} dir="rtl" data-scan-wizard-variant={variant}>
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="inline-flex items-center gap-2 rounded-2xl border border-[color:var(--scanw-line)] bg-[color:var(--scanw-rail-bg)] px-3 py-1.5 text-xs font-black text-[color:var(--scanw-ink)]">
          <ScanLine className="h-4 w-4 text-[color:var(--scanw-accent)]" aria-hidden />
          סריקה מהירה
        </div>
        <div className="flex items-center gap-2">
          <CreditsChip label={wizardProfile.hintCreditsLabel} refreshKey={creditsRefreshKey} />
          {showWorkspaceLink ? (
            <Link
              href="/app"
              aria-label="חזרה לסביבת העבודה"
              className="inline-flex h-11 w-11 min-h-11 min-w-11 items-center justify-center rounded-xl border border-[color:var(--scanw-line)] bg-white/70 text-[color:var(--scanw-muted)] transition-all duration-200 hover:border-[color:var(--scanw-accent-muted)] hover:text-[color:var(--scanw-ink)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--scanw-accent-muted)] active:scale-[0.98]"
            >
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          ) : null}
        </div>
      </div>

      <IndustryHero profile={wizardProfile} />
      <WizardProgressRail
        steps={stepDescriptors}
        currentIndex={stepIndex}
        completedFlags={completedFlags}
        onJump={(i) => {
          if (i < stepIndex || completedFlags[i]) setStepIndex(i);
        }}
      />

      <div className="relative min-h-0 flex-1 overflow-y-auto rounded-3xl border border-[color:var(--scanw-line)] bg-[color:var(--scanw-card-bg)] p-4 sm:p-6">
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
            key={STEP_IDS[stepIndex]}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          >
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
          </motion.div>
        </AnimatePresence>
      </div>

      {stepIndex < 2 ? (
        <footer className="flex items-center justify-between gap-2 px-1">
          <button
            type="button"
            onClick={goBack}
            disabled={stepIndex === 0 || (stepIndex === 1 && (state.phase === "extracting" || state.phase === "uploading"))}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-2xl border border-[color:var(--scanw-line)] bg-white/70 px-4 text-sm font-black text-[color:var(--scanw-muted)] transition-all duration-200 hover:border-[color:var(--scanw-accent-muted)] hover:text-[color:var(--scanw-ink)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--scanw-accent-muted)] disabled:cursor-not-allowed disabled:opacity-40 active:scale-[0.98]"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
            חזור
          </button>
          <button
            type="button"
            onClick={() => void goNext()}
            disabled={!canAdvance()}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-2xl bg-[color:var(--scanw-accent)] px-5 text-sm font-black text-white shadow-[0_8px_24px_-12px_var(--scanw-accent)] transition-all duration-200 hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]"
          >
            {state.phase === "extracting" || state.phase === "uploading" ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : stepIndex === 0 ? (
              <Play className="h-4 w-4" aria-hidden />
            ) : (
              <ArrowLeft className="h-4 w-4" aria-hidden />
            )}
            {stepIndex === 0 ? "פענח מסמך" : "סיום"}
            {stepIndex === 1 ? <ChevronLeft className="h-4 w-4" aria-hidden /> : null}
          </button>
        </footer>
      ) : null}
    </div>
  );
}
