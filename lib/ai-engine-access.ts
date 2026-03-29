import type { AiProviderId } from "./ai-providers";

const ALL_PROVIDERS: AiProviderId[] = ["gemini", "openai", "anthropic", "groq"];

/**
 * מנועים לפי תוכנית ארגון — מקביל לדוגמת Python (Basic / Pro / Business).
 * אינטגרציות עתידיות: Document AI, מנוע חיצוני ייעודי — יתווספו כאן כשיהיו בקוד.
 */
export function getAllowedAiProvidersForPlan(
  plan: string | null | undefined,
  isSuperAdmin: boolean,
): AiProviderId[] {
  if (isSuperAdmin) {
    return ALL_PROVIDERS;
  }

  switch (plan) {
    case "PRO":
      return ["gemini", "openai", "groq"];
    case "BUSINESS":
    case "ENTERPRISE":
      return ALL_PROVIDERS;
    case "FREE":
    default:
      return ["gemini"];
  }
}
