"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, ChevronLeft, ChevronRight, FileText, Loader2, MessagesSquare, Play, ScanLine, Settings2, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { IndustryProfile } from "@/lib/professions/runtime";
import { getScanWizardProfile, type EngineCardId } from "@/lib/professions/scan-wizard";
import { useScanState } from "@/components/scan/hooks/useScanState";
import { useScanEngine } from "@/components/scan/hooks/useScanEngine";
import { useScanSave } from "@/components/scan/hooks/useScanSave";
import {
  PRELOAD_SCAN_FILES_EVENT,
  type PreloadScanFilesDetail,
} from "@/components/scan/hooks/useGlobalScanTriggers";
import type { EngineRunMode } from "@/components/scan/state/scan-machine";
import IndustryHero from "./IndustryHero";
import WizardProgressRail, { type WizardStepDescriptor } from "./WizardProgressRail";
import CreditsChip from "./CreditsChip";
import Step1ModeUpload from "./steps/Step1ModeUpload";
import Step2Context from "./steps/Step2Context";
import Step3Engine from "./steps/Step3Engine";
import Step4Review from "./steps/Step4Review";
import StepDone from "./steps/StepDone";
import "./scan-wizard.css";

const ErpProjectNotebook = dynamic(() => import("@/components/erp/ErpProjectNotebook"), { ssr: false });

type Props = {
  industryProfile: IndustryProfile;
  geminiConfigured: boolean;
};

const STEP_IDS = ["upload", "context", "engine", "review", "done"] as const;
type StepId = (typeof STEP_IDS)[number];

const STEP_LABELS: Record<StepId, { label: string; shortLabel: string; icon: React.ReactNode }> = {
  upload: { label: "מסמך וסוג", shortLabel: "מסמך", icon: <FileText className="h-4 w-4" aria-hidden /> },
  context: { label: "הקשר ולקוח", shortLabel: "הקשר", icon: <MessagesSquare className="h-4 w-4" aria-hidden /> },
  engine: { label: "מנוע פענוח", shortLabel: "מנוע", icon: <Settings2 className="h-4 w-4" aria-hidden /> },
  review: { label: "סקירה ושמירה", shortLabel: "סקירה", icon: <Sparkles className="h-4 w-4" aria-hidden /> },
  done: { label: "סיום", shortLabel: "סיום", icon: <Play className="h-4 w-4" aria-hidden /> },
};

export default function ScanWizardShell({ industryProfile, geminiConfigured }: Props) {
  const wizardProfile = useMemo(
    () => getScanWizardProfile(industryProfile.id, industryProfile.constructionTradeId),
    [industryProfile.id, industryProfile.constructionTradeId],
  );

  const { state, dispatch } = useScanState();
  const engine = useScanEngine({ state, dispatch });
  const save = useScanSave({ state, dispatch });

  const [tab, setTab] = useState<"scan" | "notebook">("scan");
  const [stepIndex, setStepIndex] = useState(0);

  // אתחול ברירות מחדל מהפרופיל
  useEffect(() => {
    dispatch({ type: "SCAN_MODE_CHANGED", mode: wizardProfile.defaultScanMode });
    const defaultCard = wizardProfile.engineCards.find((c) => c.id === wizardProfile.defaultEngineCard);
    if (defaultCard) dispatch({ type: "ENGINE_MODE_CHANGED", mode: defaultCard.engineRunMode });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wizardProfile.industryId, wizardProfile.tradeId]);

  // אירוע preload של קבצים מ-Dock או מהדאשבורד
  useEffect(() => {
    const onPreload = (event: Event) => {
      const detail = (event as CustomEvent<PreloadScanFilesDetail>).detail;
      const files = detail?.files ?? [];
      if (files.length === 0) return;
      dispatch({ type: "FILES_SELECTED", files });
      setStepIndex(1);
    };
    window.addEventListener(PRELOAD_SCAN_FILES_EVENT, onPreload);
    return () => window.removeEventListener(PRELOAD_SCAN_FILES_EVENT, onPreload);
  }, [dispatch]);

  // קפיצה אוטומטית לסקירה כשמתחיל extraction, וקפיצה ל-done כששמירה הושלמה.
  useEffect(() => {
    if (state.phase === "extracting" && stepIndex !== 3) setStepIndex(3);
    if (state.phase === "review" && stepIndex !== 3) setStepIndex(3);
    if (state.phase === "done" && stepIndex !== 4) setStepIndex(4);
  }, [state.phase, stepIndex]);

  const completedFlags = useMemo<boolean[]>(() => {
    const flags = [false, false, false, false, false];
    flags[0] = state.files.length > 0;
    flags[1] = flags[0] && (state.projectLabel.trim().length + state.clientLabel.trim().length + state.userInstruction.trim().length > 0 || stepIndex > 1);
    flags[2] = flags[1] && stepIndex > 2;
    flags[3] = state.phase === "review" || state.phase === "done";
    flags[4] = state.phase === "done";
    return flags;
  }, [state, stepIndex]);

  const stepDescriptors: WizardStepDescriptor[] = STEP_IDS.map((id) => ({
    id,
    label: STEP_LABELS[id].label,
    shortLabel: STEP_LABELS[id].shortLabel,
    icon: STEP_LABELS[id].icon,
  }));

  const canAdvance = () => {
    if (stepIndex === 0) return state.files.length > 0;
    return true;
  };

  const goNext = async () => {
    if (!canAdvance()) return;
    if (stepIndex < 2) {
      setStepIndex(stepIndex + 1);
      return;
    }
    if (stepIndex === 2) {
      // משלב הבחירה של מנוע — ישר מתחילים סריקה
      setStepIndex(3);
      await engine.startScan();
      return;
    }
    setStepIndex(Math.min(stepIndex + 1, STEP_IDS.length - 1));
  };

  const goBack = () => {
    if (stepIndex === 0) return;
    setStepIndex(stepIndex - 1);
  };

  const reset = () => {
    dispatch({ type: "RESET" });
    setStepIndex(0);
  };

  const handleEngineSelect = (mode: EngineRunMode, _cardId: EngineCardId) => {
    dispatch({ type: "ENGINE_MODE_CHANGED", mode });
  };

  return (
    <div className="scanw-root flex h-[calc(100dvh-112px)] min-h-[640px] w-full flex-col gap-3 overflow-hidden p-3" dir="rtl">
      {/* סרגל עליון: טאבים, קרדיטים, חזרה */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="inline-flex rounded-2xl border border-[color:var(--scanw-line)] bg-[color:var(--scanw-rail-bg)] p-1">
          <button
            type="button"
            onClick={() => setTab("scan")}
            className={[
              "inline-flex h-9 items-center gap-2 rounded-xl px-3 text-xs font-black transition",
              tab === "scan"
                ? "bg-[color:var(--scanw-accent)] text-white shadow-sm"
                : "text-[color:var(--scanw-muted)] hover:text-[color:var(--scanw-ink)]",
            ].join(" ")}
          >
            <ScanLine className="h-4 w-4" aria-hidden />
            סריקה
          </button>
          <button
            type="button"
            onClick={() => setTab("notebook")}
            className={[
              "inline-flex h-9 items-center gap-2 rounded-xl px-3 text-xs font-black transition",
              tab === "notebook"
                ? "bg-[color:var(--scanw-accent)] text-white shadow-sm"
                : "text-[color:var(--scanw-muted)] hover:text-[color:var(--scanw-ink)]",
            ].join(" ")}
          >
            <BookOpen className="h-4 w-4" aria-hidden />
            NotebookLM
          </button>
        </div>
        <div className="flex items-center gap-2">
          <CreditsChip label={wizardProfile.hintCreditsLabel} />
          <Link
            href="/app"
            aria-label="חזרה לסביבת העבודה"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[color:var(--scanw-line)] bg-white/70 text-[color:var(--scanw-muted)] transition hover:border-[color:var(--scanw-accent-muted)] hover:text-[color:var(--scanw-ink)]"
          >
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>

      {tab === "scan" ? (
        <>
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
              <div className="mb-3 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-black text-rose-800">
                {state.errorMessage}
              </div>
            ) : null}

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={STEP_IDS[stepIndex]}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
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
                    onSelect={handleEngineSelect}
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
                    onRescan={() => {
                      setStepIndex(2);
                    }}
                  />
                ) : null}

                {stepIndex === 4 ? (
                  <StepDone
                    profile={wizardProfile}
                    saveTarget={state.saveTarget}
                    savedDocumentId={state.savedDocumentId}
                    onAnother={reset}
                    onOpenNotebook={() => setTab("notebook")}
                  />
                ) : null}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* פוטר ניווט */}
          {stepIndex < 4 ? (
            <footer className="flex items-center justify-between gap-2 px-1">
              <button
                type="button"
                onClick={goBack}
                disabled={stepIndex === 0}
                className="inline-flex h-11 items-center gap-1.5 rounded-2xl border border-[color:var(--scanw-line)] bg-white/70 px-4 text-sm font-black text-[color:var(--scanw-muted)] transition hover:border-[color:var(--scanw-accent-muted)] hover:text-[color:var(--scanw-ink)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" aria-hidden />
                חזור
              </button>
              <button
                type="button"
                onClick={() => void goNext()}
                disabled={!canAdvance() || state.phase === "extracting" || state.phase === "uploading"}
                className="inline-flex h-11 items-center gap-1.5 rounded-2xl bg-[color:var(--scanw-accent)] px-5 text-sm font-black text-white shadow-[0_8px_24px_-12px_var(--scanw-accent)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {state.phase === "extracting" || state.phase === "uploading" ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : stepIndex === 2 ? (
                  <Play className="h-4 w-4" aria-hidden />
                ) : (
                  <ArrowLeft className="h-4 w-4" aria-hidden />
                )}
                {stepIndex === 2 ? "הפעל סריקה" : stepIndex === 3 ? "סיום" : "הבא"}
                {stepIndex !== 2 && stepIndex !== 3 ? <ChevronLeft className="h-4 w-4" aria-hidden /> : null}
              </button>
            </footer>
          ) : null}
        </>
      ) : (
        <div className="min-h-0 flex-1 overflow-hidden rounded-3xl border border-[color:var(--scanw-line)] bg-[color:var(--scanw-card-bg)]">
          <ErpProjectNotebook geminiConfigured={geminiConfigured} embedInHub embedCompact />
        </div>
      )}
    </div>
  );
}
