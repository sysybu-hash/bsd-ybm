import { GoogleGenerativeAI } from "@google/generative-ai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGeminiModelId } from "@/lib/gemini-model";
import { isGeminiConfigured } from "@/lib/ai-providers";
import { NextResponse } from "next/server";
import { subscriptionTiersPromptBlockHe } from "@/lib/subscription-tier-config";

const MAX_MESSAGES = 24;
const MAX_CONTENT_LEN = 8000;

type ChatMsg = { role?: string; content?: unknown };

function normalizeMessages(raw: unknown): ChatMsg[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((m): m is ChatMsg => m && typeof m === "object")
    .slice(-MAX_MESSAGES);
}

function buildPromptFromMessages(messages: ChatMsg[]): string {
  const lines: string[] = [];
  for (const m of messages) {
    const content =
      typeof m.content === "string" ? m.content.trim().slice(0, MAX_CONTENT_LEN) : "";
    if (!content) continue;
    const role = m.role === "user" ? "משתמש" : "עוזר";
    lines.push(`${role}: ${content}`);
  }
  return lines.join("\n\n");
}

export async function POST(req: Request) {
  try {
    if (!isGeminiConfigured()) {
      return NextResponse.json(
        { error: "שירות הצ'אט אינו מוגדר כרגע (חסר מפתח Gemini)." },
        { status: 503 },
      );
    }

    const body = (await req.json()) as { messages?: unknown };
    const messages = normalizeMessages(body.messages);
    const prompt = buildPromptFromMessages(messages);
    if (!prompt) {
      return NextResponse.json({ error: "חסרה הודעה." }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    const displayName =
      session?.user?.name?.trim() || session?.user?.email?.trim() || "משתמש";

    const tiersHe = subscriptionTiersPromptBlockHe();
    const systemPrompt = !session
      ? `אתה העוזר החכם של BSD-YBM. תפקידך להסביר למבקרים על המערכת (CRM, ERP, Billing), 
על היתרונות של ניתוח מחירים ב-AI, ועל האפשרות לנהל חברות מבוקרות ואישיות. 
אל תחשוף נתונים פנימיים, מפתחות API או פרטי ארגונים. אם שואלים איך נרשמים, הפנה לכפתור הרישום ל-30 יום ניסיון.
הפתגם שלך: 'BSD-YBM - השדרה שמחברת בין כולם'.

${tiersHe}
כשמשתמש מתאר את עצמו (למשל „אני סוחר”, „משפחה”, „חברה עם שני סניפים”), המלץ לרמת המנוי המתאימה (FREE / HOUSEHOLD / DEALER / COMPANY / CORPORATE) והסבר בקצרה למה.

ענה בעברית, בקצרה ובבהירות אלא אם המשתמש מבקש פירוט.`
      : `אתה העוזר האישי של ${displayName} במערכת BSD-YBM. 
עזור לו לנהל את העסק ביעילות — CRM, ERP, חיובים ובינה מלאכותית.
אל תמציא נתונים ספציפיים שלא סופקו בשיחה; אם נדרש מידע מדויק מהמערכת, הצע לבדוק בדשבורד או במסכים הרלוונטיים.

${tiersHe}
אם נשאלת על מחירון או מכסות סריקה, השתמש במידע למעלה והמלץ לרמה לפי הצורך.

ענה בעברית.`;

    const apiKey = (
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      process.env.GEMINI_API_KEY ||
      ""
    ).trim();

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: getGeminiModelId() });
    const result = await model.generateContent([systemPrompt, prompt]);
    const response = result.response;
    const text = response.text();

    return NextResponse.json({ text: text || "לא התקבלה תשובה מהמודל." });
  } catch (error) {
    console.error("api/ai/chat", error);
    return NextResponse.json({ error: "שגיאה בחיבור ל-AI" }, { status: 500 });
  }
}
