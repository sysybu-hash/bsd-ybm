/**
 * ספקי AI נתמכים לפי מפתחות ב-.env / Vercel (ללא חשיפת ערכים ללקוח).
 */

export type AiProviderId = "gemini" | "openai" | "anthropic" | "groq" | "mindstudio" | "docai";

export type AiProviderPublic = {
  id: AiProviderId;
  label: string;
  description: string;
  configured: boolean;
  /** סריקת קובץ (תמונה/PDF לפי יכולת הספק) */
  supportsDocumentScan: boolean;
};

/** אחרי סינון מנוי ב־API */
export type AiProviderWithPlan = AiProviderPublic & {
  allowedByPlan: boolean;
};

function has(k: string | undefined): boolean {
  return typeof k === "string" && k.trim().length > 0;
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
  return has(process.env.GOOGLE_DOCUMENT_AI_PROCESSOR_ID);
}

export function getAiProvidersPublic(): AiProviderPublic[] {
  return [
    {
      id: "gemini",
      label: "Google Gemini",
      description: "סריקת מסמכים, תמונות ו-PDF",
      configured: isGeminiConfigured(),
      supportsDocumentScan: true,
    },
    {
      id: "openai",
      label: "OpenAI",
      description: "GPT-4o — תמונות; PDF מומלץ דרך Gemini",
      configured: isOpenAiConfigured(),
      supportsDocumentScan: true,
    },
    {
      id: "anthropic",
      label: "Anthropic Claude",
      description: "Claude — תמונות; PDF מומלץ דרך Gemini",
      configured: isAnthropicConfigured(),
      supportsDocumentScan: true,
    },
    {
      id: "groq",
      label: "Groq (Llama)",
      description: "פענוח מהיר במיוחד (טקסט בלבד)",
      configured: isGroqConfigured(),
      supportsDocumentScan: false,
    },
    {
      id: "mindstudio",
      label: "MindStudio",
      description: "סוכני עבודה וירטואלים ארגוניים",
      configured: isMindStudioConfigured(),
      supportsDocumentScan: true,
    },
    {
      id: "docai",
      label: "Google Document AI",
      description: "סורק חשבוניות מוסדיות מתקדם",
      configured: isDocAiConfigured(),
      supportsDocumentScan: true,
    },
  ];
}

export function normalizeAiProviderId(raw: string | null | undefined): AiProviderId {
  const s = (raw ?? "").trim().toLowerCase();
  if (
    s === "openai" ||
    s === "anthropic" ||
    s === "groq" ||
    s === "gemini" ||
    s === "mindstudio" ||
    s === "docai"
  ) {
    return s as AiProviderId;
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
      return isMindStudioConfigured() ? null : "חסר MIND_STUDIO_API_KEY";
    case "docai":
      return isDocAiConfigured() ? null : "חסר GOOGLE_DOCUMENT_AI_PROCESSOR_ID";
    default:
      return "ספק לא ידוע";
  }
}

export function getOpenAiVisionModel(): string {
  return process.env.OPENAI_VISION_MODEL?.trim() || "gpt-4o";
}

export function getAnthropicModel(): string {
  return process.env.ANTHROPIC_MODEL?.trim() || "claude-3-5-sonnet-20241022";
}

export function getGroqModel(): string {
  return process.env.GROQ_MODEL?.trim() || "llama-4-scout-17b-16e-instruct";
}
