/**
 * ספקי AI נתמכים לפי מפתחות ב-.env / Vercel.
 * שים לב: MindStudio נשאר כסוג שמור לאחור, אבל לא נחשף ב-UI עד שתהיה אינטגרציית runtime אמיתית.
 */

export type AiProviderId = "gemini" | "openai" | "anthropic" | "groq" | "mindstudio" | "docai";

export type AiProviderPublic = {
  id: AiProviderId;
  label: string;
  description: string;
  configured: boolean;
  supportsDocumentScan: boolean;
};

export type AiProviderWithPlan = AiProviderPublic & {
  allowedByPlan: boolean;
};

function has(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

export function isGeminiConfigured(): boolean {
  return has(process.env.GOOGLE_GENERATIVE_AI_API_KEY) || has(process.env.GEMINI_API_KEY);
}

export function isOpenAiConfigured(): boolean {
  return has(process.env.OPENAI_API_KEY);
}

export function isAnthropicConfigured(): boolean {
  return has(process.env.ANTHROPIC_API_KEY);
}

export function isGroqConfigured(): boolean {
  return has(process.env.GROQ_API_KEY);
}

export function isMindStudioConfigured(): boolean {
  return has(process.env.MIND_STUDIO_API_KEY);
}

export function isDocAiConfigured(): boolean {
  return has(process.env.GOOGLE_DOCUMENT_AI_PROCESSOR_ID) && has(process.env.GOOGLE_DOCUMENT_AI_CREDENTIALS);
}

export function getAiProvidersPublic(): AiProviderPublic[] {
  return [
    {
      id: "gemini",
      label: "Google Gemini 2.5",
      description: "סריקת מסמכים רב-ממדית, ניתוח נתונים משולב ו-vision",
      configured: isGeminiConfigured(),
      supportsDocumentScan: true,
    },
    {
      id: "openai",
      label: "OpenAI GPT",
      description: "מנוע שיחה וניתוח כללי עם תמיכה במסמכים מתקדמים",
      configured: isOpenAiConfigured(),
      supportsDocumentScan: true,
    },
    {
      id: "anthropic",
      label: "Anthropic Claude",
      description: "מנוע ניתוח וכתיבה ארגונית לעומק",
      configured: isAnthropicConfigured(),
      supportsDocumentScan: true,
    },
    {
      id: "groq",
      label: "Groq (Llama)",
      description: "מנוע מהיר במיוחד לטקסט ול-fallback בזמן עומס",
      configured: isGroqConfigured(),
      supportsDocumentScan: false,
    },
    {
      id: "docai",
      label: "Google Document AI",
      description: "OCR מוסדי ברמת דיוק גבוהה למסמכים מורכבים",
      configured: isDocAiConfigured(),
      supportsDocumentScan: true,
    },
  ];
}

export function normalizeAiProviderId(raw: string | null | undefined): AiProviderId {
  const value = (raw ?? "").trim().toLowerCase();
  if (
    value === "openai" ||
    value === "anthropic" ||
    value === "groq" ||
    value === "gemini" ||
    value === "mindstudio" ||
    value === "docai"
  ) {
    return value as AiProviderId;
  }
  return "gemini";
}

export function assertProviderConfigured(id: AiProviderId): string | null {
  switch (id) {
    case "gemini":
      return isGeminiConfigured() ? null : "חסר GOOGLE_GENERATIVE_AI_API_KEY או GEMINI_API_KEY";
    case "openai":
      return isOpenAiConfigured() ? null : "חסר OPENAI_API_KEY";
    case "anthropic":
      return isAnthropicConfigured() ? null : "חסר ANTHROPIC_API_KEY";
    case "groq":
      return isGroqConfigured() ? null : "חסר GROQ_API_KEY";
    case "mindstudio":
      return "MindStudio עדיין לא מחובר ב-runtime בפרויקט הזה";
    case "docai":
      return isDocAiConfigured() ? null : "חסר GOOGLE_DOCUMENT_AI_PROCESSOR_ID או GOOGLE_DOCUMENT_AI_CREDENTIALS";
    default:
      return "ספק לא ידוע";
  }
}

export function getOpenAiVisionModel(): string {
  return process.env.OPENAI_VISION_MODEL?.trim() || "gpt-5-vision-ultra";
}

export function getAnthropicModel(): string {
  return process.env.ANTHROPIC_MODEL?.trim() || "claude-4-opus-2026";
}

export function getGroqModel(): string {
  return process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile";
}
