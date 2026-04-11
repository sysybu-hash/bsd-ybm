import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { message, context, history } = await req.json();
    const orgId = session.user.organizationId;

    // שליפת הקשר בסיסי מהארגון (שם, סוג וכו')
    const org = orgId ? await prisma.organization.findUnique({
      where: { id: orgId },
      select: { name: true, type: true, subscriptionTier: true }
    }) : null;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" });

    const systemPrompt = `
      אתה עוזר AI עסקי חכם תחת פלטפורמת ה-SaaS בשם BSD-YBM (שנת BSD-YBM).
      תפקידך לסייע למשתמשים לנהל את העסק שלהם טוב יותר.
      
      הקשר נוכחי:
      - שם המשתמש: ${session.user.name || "המשתמש"}
      - שם הארגון: ${org?.name || "לא מוגדר"}
      - מיקום במערכת (Path): ${context}
      - סוג עסק: ${org?.type || "HOME"}

      הוראות:
      1. ענה בעברית מקצועית אך נעימה.
      2. אם המשתמש נמצא ב-CRM, דבר איתו על לידים, לקוחות וסגירת עסקאות.
      3. אם המשתמש נמצא ב-ERP, דבר איתו על חשבוניות, מחירי ספקים וחיסכון בעלויות.
      4. היה קצר ופרקטי. אל תיתן תשובות גנריות.
      5. תמיד תראה מוכן לעזור ולהגדיל את העסק.
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
