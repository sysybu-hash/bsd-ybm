import { v1 } from "@google-cloud/documentai";
import { parseModelJsonText } from "@/lib/ai-document-json";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getGeminiModelFallbackChain, isLikelyGeminiModelUnavailable } from "@/lib/gemini-model";

const { DocumentProcessorServiceClient } = v1;

type ServiceAccountCredentials = {
  project_id?: string;
};

/**
 * שם משאב מלא: projects/PROJECT/locations/REGION/processors/PROCESSOR_ID
 * אם הוגדר רק מזהה המעבד (למשל hex) — בונים מהפרויקט והאזור.
 */
function resolveDocAiProcessorResourceName(
  raw: string,
  credentials: ServiceAccountCredentials,
): string {
  const t = raw.trim();
  if (t.startsWith("projects/") && t.includes("/processors/")) {
    return t;
  }

  const projectId =
    process.env.GOOGLE_DOCUMENT_AI_PROJECT_ID?.trim() ||
    credentials.project_id?.trim() ||
    process.env.GOOGLE_CLOUD_PROJECT?.trim() ||
    process.env.GCLOUD_PROJECT?.trim() ||
    process.env.GOOGLE_CLOUD_PROJECT_ID?.trim();

  const location =
    process.env.GOOGLE_DOCUMENT_AI_LOCATION?.trim() ||
    process.env.GOOGLE_CLOUD_LOCATION?.trim() ||
    "us";

  if (!projectId) {
    throw new Error(
      "Document AI: הגדירו GOOGLE_DOCUMENT_AI_PROCESSOR_ID כשם משאב מלא (projects/.../processors/...), או מזהה מעבד קצר יחד עם project_id ב-JSON של חשבון השירות / GOOGLE_DOCUMENT_AI_PROJECT_ID.",
    );
  }

  const idOnly = t.replace(/^processors\//, "");
  return `projects/${projectId}/locations/${location}/processors/${idOnly}`;
}

function simplifyDocAiProperties(props: unknown): Record<string, unknown> {
  if (!props || typeof props !== "object") return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(props as Record<string, unknown>)) {
    if (v && typeof v === "object") {
      const o = v as Record<string, unknown>;
      const nv = o.normalizedValue;
      const text =
        nv && typeof nv === "object" && nv !== null && "text" in nv
          ? String((nv as { text?: string }).text ?? "")
          : "";
      out[k] = text.trim() || o.mentionText || null;
    }
  }
  return out;
}

export type DocAiRawEntity = {
  type?: string | null;
  mentionText?: string | null;
  confidence?: number | null;
  normalizedValue?: string | null;
  properties?: Record<string, unknown>;
};

/**
 * הרצת Document AI בלבד — טקסט + ישויות (למיפוי פיננסי ישיר ול-Tri-Engine).
 */
export async function processDocumentAiRaw(
  base64: string,
  mimeType: string,
): Promise<{ fullText: string; entities: DocAiRawEntity[] }> {
  const processorRaw = process.env.GOOGLE_DOCUMENT_AI_PROCESSOR_ID?.trim();
  const credentialsJson =
    process.env.GOOGLE_DOCUMENT_AI_CREDENTIALS?.trim() ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON?.trim();

  if (!processorRaw) throw new Error("Missing GOOGLE_DOCUMENT_AI_PROCESSOR_ID");
  if (!credentialsJson) {
    throw new Error(
      "Missing GOOGLE_DOCUMENT_AI_CREDENTIALS or GOOGLE_APPLICATION_CREDENTIALS_JSON",
    );
  }

  let credentials: ServiceAccountCredentials;
  try {
    credentials = JSON.parse(credentialsJson) as ServiceAccountCredentials;
  } catch {
    throw new Error(
      "Failed to parse Document AI credentials JSON (GOOGLE_DOCUMENT_AI_CREDENTIALS or GOOGLE_APPLICATION_CREDENTIALS_JSON)",
    );
  }

  const processorId = resolveDocAiProcessorResourceName(processorRaw, credentials);
  const locationMatch = processorId.match(/locations\/([^/]+)/);
  const apiEndpoint = locationMatch ? `${locationMatch[1]}-documentai.googleapis.com` : "us-documentai.googleapis.com";

  const client = new DocumentProcessorServiceClient({
    credentials,
    apiEndpoint,
  });

  const [result] = await client.processDocument({
    name: processorId,
    rawDocument: { content: base64, mimeType },
  });

  const doc = result.document;
  if (!doc) throw new Error("Document AI returned no document data");

  const fullText = doc.text || "";
  const entities: DocAiRawEntity[] =
    doc.entities?.map((e) => ({
      type: e.type,
      mentionText: e.mentionText,
      confidence: e.confidence ?? undefined,
      normalizedValue: e.normalizedValue?.text || e.mentionText || null,
      properties: simplifyDocAiProperties(e.properties as unknown),
    })) ?? [];

  return { fullText, entities };
}

/**
 * 🚀 BSD-YBM Active: PREMIUM GOOGLE DOCUMENT AI EXTRACTOR
 * Uses the dedicated Document AI service for ultra-high precision.
 */
export async function extractDocumentWithDocAI(
  base64: string,
  mimeType: string,
  fileName: string,
  documentInstruction: string,
): Promise<Record<string, unknown>> {
  const { fullText, entities } = await processDocumentAiRaw(base64, mimeType);

  const aiSummary = `
DOCUMENT AI OCR TEXT:
${fullText}

EXTRACTED ENTITIES:
${JSON.stringify(entities, null, 2)}
  `;

  // Secondary pass with Gemini for 100% schema compliance
  const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GEMINI_API_KEY;
  if (!geminiKey) {
     // If no Gemini key, we try a basic manual mapping (not ideal for "Premium")
     throw new Error("Google Document AI requires Gemini for schema normalization in this version.");
  }

  const genAI = new GoogleGenerativeAI(geminiKey);

  const prompt = `
${documentInstruction}
File: ${fileName}

I have processed this document using Google Document AI. 
Below is the raw text and extracted entities. 
Please convert this into the required JSON format.

${aiSummary}
  `;

  let lastErr: unknown = null;
  for (const modelName of getGeminiModelFallbackChain()) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const geminiResult = await model.generateContent(prompt);
      const text = geminiResult.response.text();
      return parseModelJsonText(text);
    } catch (err: unknown) {
      lastErr = err;
      if (isLikelyGeminiModelUnavailable(err)) continue;
      const inner = err instanceof Error ? err.message : String(err);
      throw new Error(
        `Document AI (OCR הושלם) — נכשל שלב נורמליזציה עם Gemini: ${inner}`,
      );
    }
  }
  const inner = lastErr instanceof Error ? lastErr.message : String(lastErr);
  throw new Error(
    `Document AI (OCR הושלם) — נכשל שלב נורמליזציה עם Gemini (כל המודלים): ${inner}`,
  );
}
