/**
 * מזהה מודל ב-Gemini API (Google AI Studio / Generative Language API).
 *
 * `gemini-2.0-flash` אינו זמין יותר למפתחים חדשים (404) — ברירת המחדל היא מודל עדכני.
 * ניתן לעקוף ב־GEMINI_MODEL או GOOGLE_GENERATIVE_AI_MODEL.
 *
 * @see https://ai.google.dev/gemini-api/docs/models/gemini
 */
const DEFAULT_MODEL = "gemini-2.5-flash";

/** מודלים שהופסקו / לא זמינים לחשבונות חדשים — ממופים אוטומטית */
const LEGACY_MODEL_ALIASES: Record<string, string> = {
  "gemini-2.0-flash": DEFAULT_MODEL,
  "gemini-2.0-flash-001": DEFAULT_MODEL,
  "gemini-2.0-flash-lite": DEFAULT_MODEL,
};

export function getGeminiModelId(): string {
  const fromEnv =
    process.env.GEMINI_MODEL?.trim() ||
    process.env.GOOGLE_GENERATIVE_AI_MODEL?.trim();
  const raw = fromEnv || DEFAULT_MODEL;
  return LEGACY_MODEL_ALIASES[raw] ?? raw;
}
