import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import {
  getUserFacingAiErrorMessage,
  runWorkspaceAssistant,
} from "@/lib/ai/workspace-assistant";
import { assertProviderConfigured, normalizeAiProviderId } from "@/lib/ai-providers";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "נדרשת התחברות." }, { status: 401 });
    }

    const body = await req.json();
    const { message, orgId, provider: providerBody, sectionLabel, sectionSummary } = body as {
      message?: string;
      orgId?: string;
      provider?: string;
      sectionLabel?: string;
      sectionSummary?: string;
    };

    if (!message) {
      return NextResponse.json({ error: "חסר message בבקשה" }, { status: 400 });
    }

    const effectiveOrgId = orgId ?? session.user.organizationId ?? undefined;

    if (effectiveOrgId && effectiveOrgId !== session.user.organizationId) {
      return NextResponse.json({ error: "אין גישה לארגון זה." }, { status: 403 });
    }

    const provider = normalizeAiProviderId(providerBody);
    const missing = assertProviderConfigured(provider);
    if (missing) {
      return NextResponse.json({ error: missing }, { status: 400 });
    }

    const org = effectiveOrgId
      ? await prisma.organization.findUnique({
          where: { id: effectiveOrgId },
          select: { industry: true, constructionTrade: true },
        })
      : null;

    const { answer, provider: resolvedProvider } = await runWorkspaceAssistant({
      provider: providerBody,
      message,
      orgId: effectiveOrgId,
      sectionLabel: sectionLabel?.trim() || "מרחב עבודה",
      sectionSummary: sectionSummary?.trim(),
      userName: session.user.name?.trim() || session.user.email || "המשתמש",
      industry: org?.industry || "CONSTRUCTION",
      constructionTrade: org?.constructionTrade || "GENERAL_CONTRACTOR",
    });

    return NextResponse.json({ answer, provider: resolvedProvider });
  } catch (error) {
    console.error("AI assistant error:", error);
    return NextResponse.json({ error: getUserFacingAiErrorMessage(error) }, { status: 500 });
  }
}
