import { GoogleGenerativeAI } from '@google/generative-ai';
import { runMindStudioWorkflow } from '@/services/mindStudioService';
import { processWithGoogleDocumentAi } from '@/services/documentAiService';
import { analyzeWithTextract, isTextractConfigured } from '@/services/scan/textractService';
import type { AiScanEngineId } from '@/services/events/EventPipeline';
import { buildGeminiScanPrompt, type ScanDocumentCategory } from '@/lib/scan/documentCategories';

export type { AiScanEngineId };

export const ALLOY_ENGINE_META: Record<
  AiScanEngineId,
  { label: string; description: string }
> = {
  mindstudio: { label: 'MindStudio OCR', description: 'זרימת MindStudio לחילוץ שדות' },
  gemini: { label: 'Gemini Vision', description: 'Google Gemini — ניתוח תמונה/PDF' },
  document_ai: { label: 'Google Document AI', description: 'מעבד מסמכים מובנה' },
  textract: { label: 'AWS Textract', description: 'טבלאות וטפסים (AWS)' },
};

export function parseEngineList(raw: unknown): AiScanEngineId[] {
  if (!Array.isArray(raw)) return [];
  const allowed: AiScanEngineId[] = ['mindstudio', 'gemini', 'document_ai', 'textract'];
  return raw.filter((x): x is AiScanEngineId => typeof x === 'string' && allowed.includes(x as AiScanEngineId));
}

export type FilePayload = { name: string; type: string; base64: string };

export type AlloyEngineRunOptions = {
  /** Tenant BYOK or pre-resolved key; falls back to server env when omitted. */
  geminiApiKey?: string | null;
  /** User intent — shapes Gemini extraction (other engines unchanged). */
  documentCategory?: ScanDocumentCategory;
};

export async function runAlloyEngineOnFile(
  engine: AiScanEngineId,
  file: FilePayload,
  options?: AlloyEngineRunOptions
): Promise<{ ok: boolean; summary?: unknown; error?: string }> {
  try {
    switch (engine) {
      case 'mindstudio': {
        const r = await runMindStudioWorkflow({
          documentBase64: file.base64,
          documentMimeType: file.type || 'application/octet-stream',
        });
        if (!r) return { ok: false, error: 'mindstudio_unavailable' };
        return { ok: true, summary: r };
      }
      case 'gemini': {
        const apiKey =
          (options?.geminiApiKey && String(options.geminiApiKey).trim()) || process.env.GEMINI_API_KEY;
        if (!apiKey) return { ok: false, error: 'gemini_not_configured' };
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const part = {
          inlineData: {
            data: file.base64,
            mimeType: file.type || 'application/octet-stream',
          },
        };
        const prompt = buildGeminiScanPrompt(options?.documentCategory ?? 'invoice');
        const result = await model.generateContent([prompt, part]);
        const text = result.response.text();
        return { ok: true, summary: text };
      }
      case 'document_ai': {
        const r = await processWithGoogleDocumentAi(file.base64, file.type || 'application/pdf');
        if (!r) return { ok: false, error: 'document_ai_unavailable' };
        return { ok: true, summary: r };
      }
      case 'textract': {
        if (!isTextractConfigured()) return { ok: false, error: 'textract_not_configured' };
        const bytes = Uint8Array.from(Buffer.from(file.base64, 'base64'));
        const r = await analyzeWithTextract(bytes);
        if (!r) return { ok: false, error: 'textract_failed' };
        if (typeof r === 'object' && r !== null && 'error' in r) {
          return { ok: false, error: String((r as { error: unknown }).error) };
        }
        return { ok: true, summary: r };
      }
      default:
        return { ok: false, error: 'unknown_engine' };
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'engine_error' };
  }
}
