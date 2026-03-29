import { GoogleGenerativeAI } from "@google/generative-ai";
import { getGeminiModelId } from "@/lib/gemini-model";
import type { AiProviderId } from "@/lib/ai-providers";

/** ספקים שתומכים בסריקת מסמך (לא כולל Groq) */
const DOCUMENT_SCAN_PROVIDERS: AiProviderId[] = ["gemini", "openai", "anthropic"];

/** מנועים מותרים לפי רמת מנוי — FREE רק Gemini; מנויים משלמים / מנהלים — כל ספקי הסריקה */
export function getAllowedAiProvidersForPlan(
  subscriptionTier: string,
  elevated: boolean,
): AiProviderId[] {
  if (elevated) return [...DOCUMENT_SCAN_PROVIDERS];
  const normalized = (subscriptionTier || "FREE").trim().toUpperCase();
  if (normalized === "FREE") return ["gemini"];
  return [...DOCUMENT_SCAN_PROVIDERS];
}

/**
 * תשובת טקסט קצרה מ־Gemini — לניתוחי ERP / השוואות מחיר.
 * ללא מפתח — מחזיר הודעת גיבוי ללא זריקת שגיאה.
 */
export async function generateAiResponse(prompt: string): Promise<string> {
  const apiKey =
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
    process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return "מומלץ לעקוב אחר מגמת המחיר מול ספקים חלופיים ולוודא שההזמנה עומדת בתקציב.";
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: getGeminiModelId() });
    const result = await model.generateContent(
      `ענה בעברית בלבד, בפסקה אחת קצרה (עד 4 משפטים), בלי כותרות:\n\n${prompt}`,
    );
    const text = result.response.text()?.trim();
    return text && text.length > 0
      ? text
      : "לא התקבלה תשובה מהמודל — נסו שוב מאוחר יותר.";
  } catch {
    return "ניתוח AI זמנית לא זמין. השוו מחירים ידנית מול היסטוריית הרכישות.";
  }
}
