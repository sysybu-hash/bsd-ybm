import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jsonUnauthorized } from "@/lib/api-json";
import {
  getOpenAiResponsesModelCandidates,
  getOpenAiVisionModel,
  isDocAiConfigured,
  isGeminiConfigured,
  isOpenAiConfigured,
} from "@/lib/ai-providers";
import { getDocAiProcessorConfigs } from "@/lib/ai-extract-docai";
import { GEMINI_FLAGSHIP_MODEL, getGeminiModelId } from "@/lib/gemini-model";

export const dynamic = "force-dynamic";

function openAiUiLabel(id: string): string {
  const t = id.trim();
  if (t.includes("5.4")) return "GPT-5.4 Turbo";
  if (t === "gpt-4o-mini") return "GPT-4o mini";
  if (t === "gpt-4o") return "GPT-4o";
  if (t.startsWith("gpt-")) return t;
  return t;
}

function geminiUiLabel(id: string): string {
  return id.replace(/^gemini-/, "");
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return jsonUnauthorized("לא מחובר.");
  }

  const geminiPrimaryModelId = getGeminiModelId();
  const openaiDefaultModelId = getOpenAiVisionModel();
  const rawCandidates = getOpenAiResponsesModelCandidates(undefined);
  const modelOptions = rawCandidates.slice(0, 12).map((id) => ({
    id,
    label: openAiUiLabel(id),
  }));

  return NextResponse.json({
    configured: {
      documentAI: isDocAiConfigured(),
      gemini: isGeminiConfigured(),
      openai: isOpenAiConfigured(),
    },
    documentAI: {
      processors: getDocAiProcessorConfigs(),
    },
    gemini: {
      flagshipModelId: GEMINI_FLAGSHIP_MODEL,
      primaryModelId: geminiPrimaryModelId,
      primaryLabel: geminiUiLabel(geminiPrimaryModelId),
    },
    openai: {
      defaultModelId: openaiDefaultModelId,
      modelOptions,
    },
  });
}
