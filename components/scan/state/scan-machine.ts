import type { ScanExtractionV5, ScanModeV5 } from "@/lib/scan-schema-v5";

/**
 * State machine מפורש לזרימת סריקה.
 * החלפנו 27 useState מפוזרים ב-MultiEngineScanner ברדיוסר אחד עם מעברים מוגדרים.
 * הפונקציות כאן pure — אין React, אין fetch — קל לבדוק ולהרכיב.
 */

export type ScanPhase =
  | "idle" // אין קובץ — ממתין לבחירה
  | "ready" // קובץ נבחר, מחכה לסריקה
  | "uploading" // שולח לשרת
  | "extracting" // ה-AI מפענח (streaming)
  | "review" // יש תוצאה — המשתמש בודק/עורך
  | "saving" // נשמר ל-ERP/CRM
  | "done" // נשמר בהצלחה
  | "error"; // שגיאה ניתנת להחלמה

export type EngineRunMode =
  | "AUTO"
  | "MULTI_PARALLEL"
  | "MULTI_SEQUENTIAL"
  | "SINGLE_DOCUMENT_AI"
  | "SINGLE_GEMINI"
  | "SINGLE_OPENAI";

export type SaveTarget = "ERP" | "CRM";

export type ScanState = {
  phase: ScanPhase;
  files: File[];
  activeFileIndex: number;
  scanMode: ScanModeV5;
  engineRunMode: EngineRunMode;
  projectLabel: string;
  clientLabel: string;
  selectedContactId: string | null;
  selectedProjectId: string | null;
  userInstruction: string;
  openAiModel: string;
  /** תוצאה גולמית — מה שה-AI החזיר. */
  aiData: Record<string, unknown> | null;
  /** תוצאה מובנית v5. */
  v5: ScanExtractionV5 | null;
  /** התקדמות streaming. */
  streamStage: string | null;
  partialV5: ScanExtractionV5 | null;
  /** הודעת שגיאה אחרונה (phase === "error"). */
  errorMessage: string | null;
  /** מה נשמר אחרון. */
  savedDocumentId: string | null;
  saveTarget: SaveTarget | null;
  /** שניות שעברו מתחילת הסריקה הנוכחית. */
  elapsedSeconds: number;
};

export type ScanEvent =
  | { type: "FILES_SELECTED"; files: File[] }
  | { type: "FILE_REMOVED"; index: number }
  | { type: "ACTIVE_FILE_CHANGED"; index: number }
  | { type: "SCAN_MODE_CHANGED"; mode: ScanModeV5 }
  | { type: "ENGINE_MODE_CHANGED"; mode: EngineRunMode }
  | { type: "OPENAI_MODEL_CHANGED"; model: string }
  | { type: "PROJECT_LABEL_CHANGED"; value: string }
  | { type: "CLIENT_LABEL_CHANGED"; value: string }
  | { type: "CONTACT_SELECTED"; id: string | null }
  | { type: "PROJECT_SELECTED"; id: string | null }
  | { type: "INSTRUCTION_CHANGED"; value: string }
  | { type: "SCAN_STARTED" }
  | { type: "STREAM_PARTIAL"; stage: string | null; v5: ScanExtractionV5 | null }
  | { type: "TICK"; seconds: number }
  | { type: "SCAN_COMPLETED"; aiData: Record<string, unknown>; v5: ScanExtractionV5 | null }
  | { type: "SCAN_FAILED"; error: string }
  | { type: "SAVE_STARTED"; target: SaveTarget }
  | { type: "SAVE_COMPLETED"; documentId: string }
  | { type: "SAVE_FAILED"; error: string }
  | { type: "RESET" }
  | { type: "EDIT_RESULT"; aiData: Record<string, unknown>; v5: ScanExtractionV5 | null };

export const initialScanState: ScanState = {
  phase: "idle",
  files: [],
  activeFileIndex: 0,
  scanMode: "DRAWING_BOQ",
  engineRunMode: "MULTI_PARALLEL",
  projectLabel: "",
  clientLabel: "",
  selectedContactId: null,
  selectedProjectId: null,
  userInstruction: "",
  openAiModel: "",
  aiData: null,
  v5: null,
  streamStage: null,
  partialV5: null,
  errorMessage: null,
  savedDocumentId: null,
  saveTarget: null,
  elapsedSeconds: 0,
};

export function scanReducer(state: ScanState, event: ScanEvent): ScanState {
  switch (event.type) {
    case "FILES_SELECTED": {
      if (event.files.length === 0) return state;
      return {
        ...state,
        files: event.files,
        activeFileIndex: 0,
        phase: "ready",
        aiData: null,
        v5: null,
        errorMessage: null,
        savedDocumentId: null,
      };
    }

    case "FILE_REMOVED": {
      const next = state.files.filter((_, i) => i !== event.index);
      return {
        ...state,
        files: next,
        activeFileIndex: Math.min(state.activeFileIndex, Math.max(0, next.length - 1)),
        phase: next.length === 0 ? "idle" : state.phase,
      };
    }

    case "ACTIVE_FILE_CHANGED":
      return { ...state, activeFileIndex: event.index };

    case "SCAN_MODE_CHANGED":
      return { ...state, scanMode: event.mode };
    case "ENGINE_MODE_CHANGED":
      return { ...state, engineRunMode: event.mode };
    case "OPENAI_MODEL_CHANGED":
      return { ...state, openAiModel: event.model };

    case "PROJECT_LABEL_CHANGED":
      return { ...state, projectLabel: event.value };
    case "CLIENT_LABEL_CHANGED":
      return { ...state, clientLabel: event.value };
    case "CONTACT_SELECTED":
      return { ...state, selectedContactId: event.id };
    case "PROJECT_SELECTED":
      return { ...state, selectedProjectId: event.id };
    case "INSTRUCTION_CHANGED":
      return { ...state, userInstruction: event.value };

    case "SCAN_STARTED":
      if (state.files.length === 0) return state;
      return {
        ...state,
        phase: "extracting",
        errorMessage: null,
        streamStage: null,
        partialV5: null,
        elapsedSeconds: 0,
      };

    case "STREAM_PARTIAL":
      if (state.phase !== "extracting") return state;
      return { ...state, streamStage: event.stage, partialV5: event.v5 };

    case "TICK":
      if (state.phase !== "extracting" && state.phase !== "uploading") return state;
      return { ...state, elapsedSeconds: event.seconds };

    case "SCAN_COMPLETED":
      return {
        ...state,
        phase: "review",
        aiData: event.aiData,
        v5: event.v5,
        streamStage: null,
        partialV5: null,
        errorMessage: null,
      };

    case "SCAN_FAILED":
      return { ...state, phase: "error", errorMessage: event.error, streamStage: null, partialV5: null };

    case "EDIT_RESULT":
      if (state.phase !== "review") return state;
      return { ...state, aiData: event.aiData, v5: event.v5 };

    case "SAVE_STARTED":
      if (state.phase !== "review") return state;
      return { ...state, phase: "saving", saveTarget: event.target };

    case "SAVE_COMPLETED":
      return { ...state, phase: "done", savedDocumentId: event.documentId };

    case "SAVE_FAILED":
      return { ...state, phase: "review", errorMessage: event.error, saveTarget: null };

    case "RESET":
      return { ...initialScanState, scanMode: state.scanMode, engineRunMode: state.engineRunMode };

    default:
      return state;
  }
}

export function canStartScan(state: ScanState): boolean {
  return state.files.length > 0 && (state.phase === "ready" || state.phase === "error" || state.phase === "review");
}

export function canSave(state: ScanState): boolean {
  return state.phase === "review" && state.aiData != null;
}

export function activeFile(state: ScanState): File | null {
  return state.files[state.activeFileIndex] ?? null;
}
