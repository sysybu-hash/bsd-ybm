"use server";

import { createHash } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getGeminiModelId } from "@/lib/gemini-model";
import {
  assertProviderConfigured,
  normalizeAiProviderId,
  type AiProviderId,
} from "@/lib/ai-providers";
import { parseModelJsonText } from "@/lib/ai-document-json";
import { getServerLocale } from "@/lib/i18n/server";
import {
  getDocumentJsonInstruction,
  DOCUMENT_JSON_SCHEMA_VERSION,
} from "@/lib/i18n/ai-prompts";
import { extractDocumentWithOpenAI } from "@/lib/ai-extract-openai";
import { extractDocumentWithAnthropic } from "@/lib/ai-extract-anthropic";
import { checkAndDeductCredit, resolveOrganizationForUser } from "@/lib/quota-check";
import { getAllowedAiProvidersForPlan } from "@/lib/ai-engine-access";
import { isPlatformDeveloperEmail } from "@/lib/platform-developers";
import { sendDocNotification } from "./send-doc-notification";
import { persistDocumentLineItemsFromAiData } from "@/lib/persist-document-lines";
import {
  inferMimeFromFileName,
  isOpenAiAnthropicVisionMime,
  isTextLikeMime,
} from "@/lib/scan-mime";

function getGeminiKey(): string | undefined {
  return process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GEMINI_API_KEY;
}

export type ProcessDocumentResult =
  | { success: true; data: unknown }
  | { success: false; error: string; code?: "QUOTA_EXCEEDED" };

async function extractWithGemini(
  base64Data: string,
  mimeType: string,
  documentInstruction: string,
): Promise<Record<string, unknown>> {
  const apiKey = getGeminiKey();
  if (!apiKey?.trim()) {
    throw new Error("חסר מפתח Gemini");
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: getGeminiModelId() });
  const result = await model.generateContent([
    `${documentInstruction}`,
    { inlineData: { data: base64Data, mimeType } },
  ]);
  const text = result.response.text();
  return parseModelJsonText(text);
}

async function extractWithGeminiText(
  plainText: string,
  fileName: string,
  documentInstruction: string,
): Promise<Record<string, unknown>> {
  const apiKey = getGeminiKey();
  if (!apiKey?.trim()) {
    throw new Error("חסר מפתח Gemini");
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: getGeminiModelId() });
  const capped =
    plainText.length > 500_000
      ? `${plainText.slice(0, 500_000)}\n\n[…truncated for scan]`
      : plainText;
  const result = await model.generateContent([
    `${documentInstruction}\nFile name: ${fileName}\n\nDocument text:\n${capped}`,
  ]);
  const text = result.response.text();
  return parseModelJsonText(text);
}

/** בוחר ספק בפועל: טקסט → Gemini טקסט; OpenAI/Claude רק לתמונות; אחרת Gemini קבצים */
function resolveScanProvider(
  requested: AiProviderId,
  mimeType: string,
): AiProviderId {
  if (isTextLikeMime(mimeType)) {
    return "gemini";
  }
  if (requested === "groq") {
    return "gemini";
  }
  if (requested === "openai" || requested === "anthropic") {
    if (isOpenAiAnthropicVisionMime(mimeType)) {
      return requested;
    }
    return "gemini";
  }
  return requested;
}

function sha256Hex(buffer: ArrayBuffer): string {
  return createHash("sha256").update(Buffer.from(buffer)).digest("hex");
}

export async function processDocumentAction(
  formData: FormData,
  userId: string,
  orgId: string,
): Promise<ProcessDocumentResult> {
  try {
    const file = formData.get("file") as File | null;
    if (!file) {
      return { success: false, error: "No file provided" };
    }

    const uiLocale = await getServerLocale();
    const documentInstruction = getDocumentJsonInstruction(uiLocale);

    const requested = normalizeAiProviderId(formData.get("provider") as string | null);
    const rawMime = file.type || "application/octet-stream";
    const mimeType = inferMimeFromFileName(file.name, rawMime);

    const accessUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        role: true,
        organization: { select: { plan: true } },
      },
    });
    const orgPlan = accessUser?.organization?.plan ?? "FREE";
    const superAdmin = accessUser?.role === "SUPER_ADMIN";
    const devBypass =
      !!accessUser?.email && isPlatformDeveloperEmail(accessUser.email);
    const allowedProviders = getAllowedAiProvidersForPlan(
      orgPlan,
      superAdmin || devBypass,
    );

    let effectiveProvider = resolveScanProvider(requested, mimeType);
    if (!allowedProviders.includes(effectiveProvider)) {
      effectiveProvider = allowedProviders.includes("gemini")
        ? resolveScanProvider("gemini", mimeType)
        : resolveScanProvider(allowedProviders[0] ?? "gemini", mimeType);
    }

    const missingEff = assertProviderConfigured(effectiveProvider);
    if (missingEff) {
      return { success: false, error: missingEff };
    }

    const resolvedOrg = await resolveOrganizationForUser(orgId, userId);
    if (!resolvedOrg) {
      return { success: false, error: "לא נמצא ארגון למשתמש" };
    }
    const effectiveOrgId = resolvedOrg.id;

    const bytes = await file.arrayBuffer();
    const contentSha256 = sha256Hex(bytes);

    const cached = await prisma.documentScanCache.findUnique({
      where: {
        organizationId_contentSha256_providerUsed_locale_schemaVersion: {
          organizationId: effectiveOrgId,
          contentSha256,
          providerUsed: effectiveProvider,
          locale: uiLocale,
          schemaVersion: DOCUMENT_JSON_SCHEMA_VERSION,
        },
      },
    });

    let aiData: Record<string, unknown>;
    let fromCache = false;

    if (cached?.resultJson && typeof cached.resultJson === "object") {
      aiData = cached.resultJson as Record<string, unknown>;
      fromCache = true;
    } else {
      const quota = await checkAndDeductCredit(orgId, userId);
      if (!quota.allowed) {
        return {
          success: false,
          error: quota.error,
          code: "QUOTA_EXCEEDED",
        };
      }

      if (isTextLikeMime(mimeType)) {
        const decoder = new TextDecoder("utf-8");
        const plain = decoder.decode(bytes);
        aiData = await extractWithGeminiText(plain, file.name, documentInstruction);
      } else {
        const base64Data = Buffer.from(bytes).toString("base64");
        switch (effectiveProvider) {
          case "openai":
            aiData = await extractDocumentWithOpenAI(
              base64Data,
              mimeType,
              file.name,
              documentInstruction,
            );
            break;
          case "anthropic":
            aiData = await extractDocumentWithAnthropic(
              base64Data,
              mimeType,
              file.name,
              documentInstruction,
            );
            break;
          default:
            aiData = await extractWithGemini(base64Data, mimeType, documentInstruction);
        }
      }

      await prisma.documentScanCache.upsert({
        where: {
          organizationId_contentSha256_providerUsed_locale_schemaVersion: {
            organizationId: effectiveOrgId,
            contentSha256,
            providerUsed: effectiveProvider,
            locale: uiLocale,
            schemaVersion: DOCUMENT_JSON_SCHEMA_VERSION,
          },
        },
        create: {
          organizationId: effectiveOrgId,
          contentSha256,
          providerUsed: effectiveProvider,
          locale: uiLocale,
          schemaVersion: DOCUMENT_JSON_SCHEMA_VERSION,
          resultJson: aiData as Prisma.InputJsonValue,
        },
        update: {
          resultJson: aiData as Prisma.InputJsonValue,
        },
      });
    }

    const providerAdjusted = requested !== effectiveProvider;

    const doc = await prisma.document.create({
      data: {
        fileName: file.name,
        type: String(aiData.docType ?? "UNKNOWN"),
        status: "PROCESSED",
        aiData: aiData as Prisma.InputJsonValue,
        userId,
        organizationId: effectiveOrgId,
      },
    });

    await persistDocumentLineItemsFromAiData(
      doc.id,
      effectiveOrgId,
      typeof aiData.vendor === "string" ? aiData.vendor : null,
      aiData,
      { skipPriceObservations: fromCache },
    );

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (user?.email && !fromCache) {
      await sendDocNotification(
        user.email,
        String(aiData.vendor ?? "ספק כללי"),
        Number(aiData.total ?? 0),
      );
    }

    return {
      success: true,
      data: {
        ...doc,
        _provider: effectiveProvider,
        _requestedProvider: requested,
        _fromCache: fromCache,
        _providerAdjusted: providerAdjusted,
      },
    };
  } catch (error) {
    console.error("processDocumentAction error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("API key") || msg.includes("401") || msg.includes("403")) {
      return {
        success: false,
        error: "בעיית הרשאה לספק ה-AI — בדקו מפתח ב-.env / Vercel.",
      };
    }
    return {
      success: false,
      error: `פענוח נכשל: ${msg.slice(0, 280)}`,
    };
  }
}
