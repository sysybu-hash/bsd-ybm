import { v1 } from "@google-cloud/documentai";
import { parseModelJsonText } from "@/lib/ai-document-json";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getGeminiModelId } from "@/lib/gemini-model";

const { DocumentProcessorServiceClient } = v1;

/**
 * 🚀 BSD-YBM 2026: PREMIUM GOOGLE DOCUMENT AI EXTRACTOR
 * Uses the dedicated Document AI service for ultra-high precision.
 */
export async function extractDocumentWithDocAI(
  base64: string,
  mimeType: string,
  fileName: string,
  documentInstruction: string,
): Promise<Record<string, unknown>> {
  const processorId = process.env.GOOGLE_DOCUMENT_AI_PROCESSOR_ID?.trim();
  const credentialsJson = process.env.GOOGLE_DOCUMENT_AI_CREDENTIALS?.trim();

  if (!processorId) throw new Error("Missing GOOGLE_DOCUMENT_AI_PROCESSOR_ID");
  if (!credentialsJson) throw new Error("Missing GOOGLE_DOCUMENT_AI_CREDENTIALS");

  let credentials;
  try {
    credentials = JSON.parse(credentialsJson);
  } catch (err) {
    throw new Error("Failed to parse GOOGLE_DOCUMENT_AI_CREDENTIALS JSON");
  }

  // Processor ID is in format: projects/PROJECT_ID/locations/LOCATION/processors/PROCESSOR_ID
  // We extract the location if possible, otherwise default to "us"
  const locationMatch = processorId.match(/locations\/([^\/]+)/);
  const apiEndpoint = locationMatch ? `${locationMatch[1]}-documentai.googleapis.com` : "us-documentai.googleapis.com";

  const client = new DocumentProcessorServiceClient({
    credentials,
    apiEndpoint,
  });

  const request = {
    name: processorId,
    rawDocument: {
      content: base64,
      mimeType,
    },
  };

  const [result] = await client.processDocument(request);
  const { document } = result;

  if (!document) {
    throw new Error("Document AI returned no document data");
  }

  // If it's a specialized processor (like Expense), it has entities.
  // However, Document AI output is complex. To maintain 100% consistency with our schema,
  // we take the full text and any extracted entities, then use Gemini to normalize it
  // to our exact JSON schema defined in documentInstruction. 
  // This gives us the precision of DocAI OCR + the flexibility of Gemini.

  const fullText = document.text || "";
  const entities = document.entities?.map(e => ({
    type: e.type,
    mentionText: e.mentionText,
    confidence: e.confidence,
    normalizedValue: e.normalizedValue?.text || e.mentionText,
  })) || [];

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
  const model = genAI.getGenerativeModel({ model: getGeminiModelId() });
  
  const prompt = `
${documentInstruction}
File: ${fileName}

I have processed this document using Google Document AI. 
Below is the raw text and extracted entities. 
Please convert this into the required JSON format.

${aiSummary}
  `;

  const geminiResult = await model.generateContent(prompt);
  const text = geminiResult.response.text();
  
  return parseModelJsonText(text);
}
