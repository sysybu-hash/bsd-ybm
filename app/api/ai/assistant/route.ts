import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getUserFacingAiErrorMessage,
  runWorkspaceAssistant,
} from "@/lib/ai/workspace-assistant";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "נדרשת התחברות." }, { status: 401 });
    }

    const { message, context } = await req.json();
    const orgId = session.user.organizationId;
    const org = orgId
      ? await prisma.organization.findUnique({
          where: { id: orgId },
          select: {
            industry: true,
            constructionTrade: true,
          },
        })
      : null;

    const { answer, provider } = await runWorkspaceAssistant({
      message,
      orgId,
      sectionLabel: typeof context === "string" && context.trim() ? context.trim() : "עוזר הקשרי",
      sectionSummary: "ממשק עוזר ישיר מתוך סביבת העבודה.",
      userName: session.user.name?.trim() || session.user.email || "המשתמש",
      industry: org?.industry || "CONSTRUCTION",
      constructionTrade: org?.constructionTrade || "GENERAL_CONTRACTOR",
    });

    return NextResponse.json({ reply: answer, provider });
  } catch (error) {
    console.error("Assistant API Error:", error);
    return NextResponse.json({ error: getUserFacingAiErrorMessage(error) }, { status: 500 });
  }
}
