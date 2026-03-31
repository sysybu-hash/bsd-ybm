import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { runAiChat } from "@/lib/ai-chat";
import { assertProviderConfigured, normalizeAiProviderId } from "@/lib/ai-providers";
import { getServerLocale } from "@/lib/i18n/server";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "נדרשת התחברות." }, { status: 401 });
    }

    const body = await req.json();
    const { message, orgId, provider: providerBody } = body as {
      message?: string;
      orgId?: string;
      provider?: string;
    };

    if (!orgId || !message) {
      return NextResponse.json(
        { error: "חסר orgId או message בבקשה" },
        { status: 400 },
      );
    }

    if (orgId !== session.user.organizationId) {
      return NextResponse.json({ error: "אין גישה לארגון זה." }, { status: 403 });
    }

    const provider = normalizeAiProviderId(providerBody);
    const missing = assertProviderConfigured(provider);
    if (missing) {
      return NextResponse.json({ error: missing }, { status: 400 });
    }

    const data = await prisma.document.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const contextJson = JSON.stringify({ documentCount: data.length, documents: data });
    const locale = await getServerLocale();
    const { text } = await runAiChat(providerBody, message, contextJson, locale);

    return NextResponse.json({ answer: text, provider });
  } catch (error) {
    console.error("AI assistant error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: msg.slice(0, 400) || "שגיאה פנימית בעוזר הפיננסי" },
      { status: 500 },
    );
  }
}
