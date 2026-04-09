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

    const { query } = await req.json();
    const orgId = session.user.organizationId;
    if (!orgId) return NextResponse.json({ error: "No org" }, { status: 400 });

    // שליפת רשימת אנשי קשר בסיסית לצורך סינון AI (עד 100 לקוחות למהירות)
    const contacts = await prisma.contact.findMany({
      where: { organizationId: orgId },
      include: {
        issuedDocuments: {
            select: { status: true, total: true, dueDate: true }
        }
      },
      take: 100
    });

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" });

    const systemPrompt = `
      אתה מנוע חיפוש סמנטי עבור מערכת CRM.
      נתונה רשימת לקוחות בפורמט JSON. המשימה שלך היא להחזיר רק את ה-ID של הלקוחות שמתאימים לתיאור של המשתמש.
      תיאור משתמש: "${query}"
      
      חובה להחזיר רק רשימת IDs בפורמט JSON Array של Strings. אל תוסיף הסברים.
      דוגמה לפורמט: ["id1", "id2"]
    `;

    const result = await model.generateContent([
        systemPrompt,
        JSON.stringify(contacts.map(c => ({
            id: c.id,
            name: c.name,
            status: c.status,
            value: c.value,
            notes: c.notes,
            pendingInvoicesCount: c.issuedDocuments.filter(d => d.status === 'PENDING').length
        })))
    ]);

    const text = result.response.text().trim();
    const matchedIds = JSON.parse(text.match(/\[.*\]/s)?.[0] || "[]");

    return NextResponse.json({ matchedIds });
  } catch (error) {
    console.error("Semantic Search API Error:", error);
    return NextResponse.json({ matchedIds: [] });
  }
}
