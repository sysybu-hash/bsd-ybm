"use client";

import { useEffect } from "react";
import { Loader2, Play, RotateCcw } from "lucide-react";
import { useScanState } from "@/components/scan/hooks/useScanState";
import { useScanUpload } from "@/components/scan/hooks/useScanUpload";
import { useScanEngine } from "@/components/scan/hooks/useScanEngine";
import { useScanSave } from "@/components/scan/hooks/useScanSave";
import {
  PRELOAD_SCAN_FILES_EVENT,
  type PreloadScanFilesDetail,
} from "@/components/scan/hooks/useGlobalScanTriggers";
import { canSave, canStartScan } from "@/components/scan/state/scan-machine";
import ScanDropzone from "@/components/scan/ui/ScanDropzone";
import ScanFileStrip from "@/components/scan/ui/ScanFileStrip";
import ScanModePicker from "@/components/scan/ui/ScanModePicker";
import ScanEnginePicker from "@/components/scan/ui/ScanEnginePicker";
import ScanProgressTimeline from "@/components/scan/ui/ScanProgressTimeline";
import ScanPreviewPane from "@/components/scan/ui/ScanPreviewPane";
import ScanContextFields from "@/components/scan/ui/ScanContextFields";
import ScanResultPanel from "@/components/scan/ui/ScanResultPanel";

type Props = {
  /** מציג כותרת קומפקטית כשהרכיב משובץ ב-Dock צף. */
  compact?: boolean;
};

/**
 * ScanBoard — המחליף הנקי של MultiEngineScanner.
 * State אחד (reducer), 3 hooks (upload/engine/save), 7 רכיבי UI נטולי-state.
 * סה"כ ~150 שורות במקום 1976.
 */
export default function ScanBoard({ compact = false }: Props) {
  const { state, dispatch } = useScanState();
  const upload = useScanUpload({
    dispatch,
    files: state.files,
    activeFileIndex: state.activeFileIndex,
  });
  const engine = useScanEngine({ state, dispatch });
  const save = useScanSave({ state, dispatch });

  useEffect(() => {
    const onPreload = (event: Event) => {
      const detail = (event as CustomEvent<PreloadScanFilesDetail>).detail;
      const files = detail?.files ?? [];
      if (files.length === 0) return;
      dispatch({ type: "FILES_SELECTED", files });
    };
    window.addEventListener(PRELOAD_SCAN_FILES_EVENT, onPreload);
    return () => window.removeEventListener(PRELOAD_SCAN_FILES_EVENT, onPreload);
  }, [dispatch]);

  const activeFile = state.files[state.activeFileIndex] ?? null;
  const startable = canStartScan(state);
  const savable = canSave(state);
  const busy = state.phase === "extracting" || state.phase === "uploading";

  return (
    <div className="flex flex-col gap-3">
      {!compact ? (
        <header>
          <h1 className="text-xl font-black text-slate-950">לוח סריקה</h1>
          <p className="text-sm font-semibold text-slate-500">העלה קובץ → AI מסנכרן ל-ERP, ל-CRM, ומתריע על חריגות מחיר.</p>
        </header>
      ) : null}

      <ScanProgressTimeline
        phase={state.phase}
        elapsedSeconds={state.elapsedSeconds}
        streamStage={state.streamStage}
      />

      {state.errorMessage ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-black text-rose-800">
          {state.errorMessage}
        </div>
      ) : null}

      {state.files.length === 0 ? (
        <ScanDropzone
          getRootProps={upload.getRootProps}
          getInputProps={upload.getInputProps}
          isDragActive={upload.isDragActive}
        />
      ) : (
        <ScanFileStrip
          files={state.files}
          activeIndex={state.activeFileIndex}
          previewUrls={upload.previewUrls}
          onSelect={upload.setActiveFile}
          onRemove={upload.removeFile}
        />
      )}

      {state.files.length > 0 ? (
        <div className="grid gap-3 lg:grid-cols-[1.1fr_1fr]">
          <ScanPreviewPane file={activeFile} url={upload.activePreviewUrl} />

          <div className="flex flex-col gap-2.5">
            <ScanModePicker
              value={state.scanMode}
              onChange={(mode) => dispatch({ type: "SCAN_MODE_CHANGED", mode })}
            />
            <ScanEnginePicker
              value={state.engineRunMode}
              onChange={(mode) => dispatch({ type: "ENGINE_MODE_CHANGED", mode })}
            />
            <ScanContextFields
              projectLabel={state.projectLabel}
              clientLabel={state.clientLabel}
              userInstruction={state.userInstruction}
              onProjectChange={(value) => dispatch({ type: "PROJECT_LABEL_CHANGED", value })}
              onClientChange={(value) => dispatch({ type: "CLIENT_LABEL_CHANGED", value })}
              onInstructionChange={(value) => dispatch({ type: "INSTRUCTION_CHANGED", value })}
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void engine.startScan()}
                disabled={!startable || busy}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
                {state.phase === "review" ? "סרוק שוב" : "התחל סריקה"}
              </button>
              <button
                type="button"
                onClick={() => dispatch({ type: "RESET" })}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 text-xs font-black text-slate-600 transition hover:border-slate-300"
                aria-label="איפוס"
              >
                <RotateCcw className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {savable || state.phase === "saving" ? (
        <ScanResultPanel
          aiData={state.aiData}
          v5={state.v5}
          saving={state.phase === "saving"}
          saveTarget={state.saveTarget}
          onSave={(target) => void save.save(target)}
          onReset={() => dispatch({ type: "RESET" })}
        />
      ) : null}
    </div>
  );
}
