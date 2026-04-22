/**
 * Gemini — April 2026 (V12-style routing). מפתח AI Studio (לעיתים AQ…) ב־GOOGLE_GENERATIVE_AI_API_KEY / GEMINI_API_KEY.
 */

export const GEMINI_FLAGSHIP_MODEL = "gemini-3.1-pro-stable";

export const GEMINI_MODEL_FALLBACK_TIER: readonly string[] = [
  "gemini-3.1-pro-stable",
  "gemini-2.0-pro-stable",
  "gemini-2.5-pro",
  "gemini-2.0-flash",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  /** 1.5.x הוסרו מרוב מפתחות Google AI (404 ב־v1beta) — נשאר pro רק כגיבוי אחרון */
  "gemini-1.5-pro-002",
] as const;

const LEGACY_MODEL_ALIASES: Record<string, string> = {
  "gemini-3.1-pro": GEMINI_FLAGSHIP_MODEL,
  "gemini-2.0-flash-001": "gemini-2.0-flash",
  "gemini-2.0-flash-lite": "gemini-2.5-flash",
  "gemini-2.0-flash-exp": "gemini-2.5-pro",
  "gemini-1.5-flash-8b": "gemini-2.5-flash",
  "gemini-1.5-flash": "gemini-2.5-flash",
  "gemini-1.5-flash-002": "gemini-2.5-flash",
  "gemini-1.5-flash-latest": "gemini-2.5-flash",
};

function dedupeModels(ids: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    const m = id?.trim();
    if (!m || seen.has(m)) continue;
    seen.add(m);
    out.push(m);
  }
  return out;
}

export function getGeminiModelId(): string {
  const fromEnv =
    process.env.GEMINI_MODEL?.trim() ||
    process.env.GOOGLE_GENERATIVE_AI_MODEL?.trim();
  const raw = fromEnv || GEMINI_FLAGSHIP_MODEL;
  return LEGACY_MODEL_ALIASES[raw] ?? raw;
}

export function getGeminiModelFallbackChain(): string[] {
  const primary = getGeminiModelId();
  return dedupeModels([primary, ...GEMINI_MODEL_FALLBACK_TIER]);
}

export function isLikelyGeminiModelUnavailable(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();
  return (
    lower.includes("404") ||
    lower.includes("429") ||
    lower.includes("not found") ||
    lower.includes("not available") ||
    lower.includes("invalid model") ||
    lower.includes("503") ||
    lower.includes("resource exhausted") ||
    lower.includes("too many requests") ||
    lower.includes("quota") ||
    lower.includes("does not exist")
  );
}
