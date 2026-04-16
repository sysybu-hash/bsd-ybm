import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getUserFacingAiErrorMessage, runAiChat } from "@/lib/ai-chat";
import { getServerLocale } from "@/lib/i18n/server";
import { assertProviderConfigured, normalizeAiProviderId } from "@/lib/ai-providers";
import { prisma } from "@/lib/prisma";

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
      return NextResponse.json({ error: "חסר orgId או message בבקשה" }, { status: 400 });
    }

    if (orgId !== session.user.organizationId) {
      return NextResponse.json({ error: "אין גישה לארגון זה." }, { status: 403 });
    }

    const provider = normalizeAiProviderId(providerBody);
    const missing = assertProviderConfigured(provider);
    if (missing) {
      return NextResponse.json({ error: missing }, { status: 400 });
    }

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { industry: true, constructionTrade: true },
    });

    const data = await prisma.document.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const contextJson = JSON.stringify({
      industry: org?.industry || "CONSTRUCTION",
      constructionTrade: org?.constructionTrade || "GENERAL_CONTRACTOR",
      documentCount: data.length,
      documents: data.map((document) => document.fileName),
    });

    const locale = await getServerLocale();
    const { text, provider: resolvedProvider } = await runAiChat(
      providerBody,
      message,
      contextJson,
      locale,
    );

    return NextResponse.json({ answer: text, provider: resolvedProvider });
  } catch (error) {
    console.error("AI assistant error:", error);
    return NextResponse.json({ error: getUserFacingAiErrorMessage(error) }, { status: 500 });
  }
}
