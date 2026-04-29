import type { IndustryType } from "@/lib/professions/config";

export type ScanHubPreviewPayload = {
  fileName: string | null;
  previewUrl: string | null;
  previewKind: "image" | "pdf" | "none";
  extraction: unknown | null;
  streamStage: string | null;
  scanError: string | null;
  scanning: boolean;
};

export type ScannerProps = {
  industry?: IndustryType;
  compactHeader?: boolean;
  /** מופעל רק מדוק העבודה — פריסת אשף שלבים במקום לוח תלת-עמודתי */
  dockWizard?: boolean;
  /** סנכרון תצוגה מקדימה מאוחדת (מסך מרכז AI) */
  onScanHubPreviewUpdate?: (snapshot: ScanHubPreviewPayload) => void;
  /** כאשר true — לחיצה על «תצוגה מקדימה» מפנה לפאנל חיצוני במקום מודל */
  hubPreviewMode?: boolean;
  onHubPreviewFocusRequest?: () => void;
};

export type EnginePhase = "idle" | "running" | "ok" | "error" | "skipped";

export type TriTelemetry = {
  documentAI: { phase: EnginePhase; ms?: number; detail?: string };
  gemini: { phase: EnginePhase; ms?: number; detail?: string };
  gpt: { phase: EnginePhase; ms?: number; detail?: string };
};

export type EngineMetaResponse = {
  configured: { documentAI: boolean; gemini: boolean; openai: boolean };
  documentAI?: {
    processors?: Array<{ kind: string; label: string; env: string; consoleType: string; configured: boolean }>;
  };
  gemini: { flagshipModelId: string; primaryModelId: string; primaryLabel: string };
  openai: { defaultModelId: string; modelOptions: { id: string; label: string }[] };
};

export type ScanLookupProject = { id: string; name: string; isActive: boolean };
export type ScanLookupContact = { id: string; name: string; projectId: string | null };

export type EngineRunMode =
  | "AUTO"
  | "MULTI_SEQUENTIAL"
  | "MULTI_PARALLEL"
  | "SINGLE_DOCUMENT_AI"
  | "SINGLE_GEMINI"
  | "SINGLE_OPENAI";
