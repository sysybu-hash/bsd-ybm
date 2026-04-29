import type { ComponentType } from "react";
import { BarChart3, FileText, ReceiptText } from "lucide-react";
import type { ScanModeV5 } from "@/lib/scan-schema-v5";
import type { EngineRunMode, TriTelemetry } from "./types";

export const IDLE_TELEMETRY: TriTelemetry = {
  documentAI: { phase: "idle" },
  gemini: { phase: "idle" },
  gpt: { phase: "idle" },
};

export const RUNNING_TELEMETRY: TriTelemetry = {
  documentAI: { phase: "running" },
  gemini: { phase: "running" },
  gpt: { phase: "running" },
};

export const FALLBACK_OPENAI_MODEL_OPTIONS = [
  { id: "gpt-5.4-turbo-2026-03", label: "GPT-5.4 Turbo" },
  { id: "gpt-4o-mini", label: "GPT-4o mini" },
  { id: "gpt-4o", label: "GPT-4o" },
];

export const SCAN_MODES: {
  id: ScanModeV5;
  label: string;
  accent: string;
  icon: ComponentType<{ className?: string }>;
  description: string;
  output: string;
}[] = [
  {
    id: "INVOICE_FINANCIAL",
    label: "חשבונית / כספים",
    accent: "emerald",
    icon: ReceiptText,
    description: "פענוח חשבוניות, ספקים, שורות מחיר, מע\"מ וסיכום ERP.",
    output: "שורות ERP, ספק, תאריך, סכום ומחירי שורה.",
  },
  {
    id: "DRAWING_BOQ",
    label: "תכנית / כתב כמויות",
    accent: "sky",
    icon: BarChart3,
    description: "קריאת תכניות, מקרא, מידות, יחידות וכתב כמויות.",
    output: "BOQ מלא, כמויות, יחידות ושורות ERP ללא מחיר כשצריך.",
  },
  {
    id: "GENERAL_DOCUMENT",
    label: "מסמך כללי",
    accent: "violet",
    icon: FileText,
    description: "סיכום מהיר, ישויות, מטא-דאטה וסיווג מסמך.",
    output: "סיכום, סוג מסמך, שדות עיקריים ומטא-דאטה.",
  },
];

export const RUN_MODES: {
  id: EngineRunMode;
  label: string;
  short: string;
  description: string;
  engines: ("documentAI" | "gemini" | "gpt")[];
}[] = [
  {
    id: "AUTO",
    label: "חכם לפי סוג מסמך",
    short: "Auto",
    description: "המערכת בוחרת מסלול מיטבי לפי מסמך כספי, תכנית או מסמך כללי.",
    engines: ["documentAI", "gemini", "gpt"],
  },
  {
    id: "MULTI_PARALLEL",
    label: "כמה מנועים במקביל",
    short: "Parallel",
    description: "Gemini ו-GPT רצים יחד, ו-Document AI נכנס כשיש התאמה למסמך.",
    engines: ["documentAI", "gemini", "gpt"],
  },
  {
    id: "MULTI_SEQUENTIAL",
    label: "רב-מנועי מדורג",
    short: "Tri-Engine",
    description: "מסלול יציב ומבוקר: מנוע ייעודי, מנוע חזותי ואז מיזוג.",
    engines: ["documentAI", "gemini", "gpt"],
  },
  {
    id: "SINGLE_DOCUMENT_AI",
    label: "Document AI בלבד",
    short: "DocAI",
    description: "למסמכים מובנים: OCR, entities, טפסים, חשבוניות והוצאות.",
    engines: ["documentAI"],
  },
  {
    id: "SINGLE_GEMINI",
    label: "Gemini בלבד",
    short: "Gemini",
    description: "מנוע חזותי מהיר לתכניות, PDF ותמונות.",
    engines: ["gemini"],
  },
  {
    id: "SINGLE_OPENAI",
    label: "GPT בלבד",
    short: "GPT",
    description: "דיוק, מיזוג, נרמול ושדות משלימים לפי המודל שנבחר.",
    engines: ["gpt"],
  },
];

export const STREAM_STAGE_LABELS: Record<string, string> = {
  document_ai: "Document AI",
  openai: "OpenAI",
  openai_single: "OpenAI בלבד",
  openai_parallel: "OpenAI במקביל",
  gemini: "Gemini",
  gemini_single: "Gemini בלבד",
  gemini_parallel: "Gemini במקביל",
  gemini_flash: "Gemini Flash",
  gemini_fallback: "Gemini fallback",
  merged_gemini_openai: "מיזוג Gemini + GPT",
  merged_parallel: "מיזוג מנועים מקבילים",
};

export const DOC_AI_MODE_MATRIX: Record<ScanModeV5, string[]> = {
  INVOICE_FINANCIAL: ["INVOICE", "EXPENSE", "FORM", "OCR"],
  DRAWING_BOQ: ["FORM", "OCR"],
  GENERAL_DOCUMENT: ["FORM", "OCR", "INVOICE", "EXPENSE"],
};
