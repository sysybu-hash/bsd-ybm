import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";
import {
  constructionTradeLabelHe,
  normalizeConstructionTrade,
} from "@/lib/construction-trades";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { message, context, history: historyRaw } = await req.json();
    const history = Array.isArray(historyRaw) ? historyRaw : [];
    const orgId = session.user.organizationId;

    // שליפת הקשר בסיסי מהארגון (שם, סוג וכו')
    const org = orgId
      ? await prisma.organization.findUnique({
          where: { id: orgId },
          select: {
            name: true,
            type: true,
            subscriptionTier: true,
            industry: true,
            constructionTrade: true,
          },
        })
      : null;

    const tradeLabel = org?.constructionTrade
      ? constructionTradeLabelHe(normalizeConstructionTrade(org.constructionTrade))
      : constructionTradeLabelHe("GENERAL_CONTRACTOR");

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" });

    const systemPrompt = `
      אתה עוזר AI עסקי חכם תחת פלטפורמת BSD-YBM — ממוקד בענף הבנייה ובמקצועות הנלווים (חשמל, אינסטלציה, מיזוג, גמר וכו').
      תפקידך לסייע למשתמשים לנהל פרויקטים, מסמכים ותזרים בלי ייעוץ משפטי.
      
      הקשר נוכחי:
      - שם המשתמש: ${session.user.name || "המשתמש"}
      - שם הארגון: ${org?.name || "לא מוגדר"}
      - מיקום במערכת (Path): ${context}
      - סוג עסק (CustomerType): ${org?.type || "HOME"}
      - ענף מערכת: ${org?.industry || "CONSTRUCTION"}
      - התמחות בענף: ${tradeLabel}

      הוראות:
      1. ענה בעברית מקצועית אך נעימה.
      2. אם המשתמש ב-CRM — לידים, לקוחות, אתרים ופרויקטים; התאם ל-${tradeLabel} כשמדובר בדוגמאות.
      3. אם ב-ERP/מסמכים — חשבוניות, ספקים, יומני שטח וחומרים; בלי המצאת סכומים.
      4. היה קצר ופרקטי. אל תיתן תשובות גנריות.
      5. תמיד תראה מוכן לעזור; אין ייעוץ משפטי או הנדסי מחייב — רק ארגון ותיעוד עסקי.
    `;

    const chat = model.startChat({
        history: history.slice(-6).map((m: any) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
        })),
        generationConfig: { maxOutputTokens: 300 }
    });

    const result = await chat.sendMessage(`${systemPrompt}\n\nשאילתת משתמש: ${message}`);
    const reply = result.response.text();

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Assistant API Error:", error);
    return NextResponse.json({ reply: "מצטער, הייתה לי תקלה קטנה בחיבור. נסה שוב בעוד רגע." });
  }
}
