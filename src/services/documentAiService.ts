/**
 * Google Document AI — ניתוח מסמכים (חשבוניות, טפסים). Server-only env.
 * GOOGLE_DOCUMENT_AI_KEY + GOOGLE_DOCUMENT_AI_PROCESSOR
 */
export function isGoogleDocumentAiConfigured(): boolean {
  const key = process.env.GOOGLE_DOCUMENT_AI_KEY || process.env.NEXT_PUBLIC_GOOGLE_DOCUMENT_AI_KEY;
  const proc = process.env.GOOGLE_DOCUMENT_AI_PROCESSOR || process.env.NEXT_PUBLIC_GOOGLE_DOCUMENT_AI_PROCESSOR;
  return !!(key && proc);
}

export async function processWithGoogleDocumentAi(
  base64Content: string,
  mimeType: string
): Promise<Record<string, unknown> | null> {
  const apiKey = process.env.GOOGLE_DOCUMENT_AI_KEY || process.env.NEXT_PUBLIC_GOOGLE_DOCUMENT_AI_KEY;
  const processor = process.env.GOOGLE_DOCUMENT_AI_PROCESSOR || process.env.NEXT_PUBLIC_GOOGLE_DOCUMENT_AI_PROCESSOR;
  if (!apiKey || !processor) return null;

  // processor format: projects/PROJECT/locations/LOCATION/processors/ID
  const match = processor.match(/projects\/([^/]+)\/locations\/([^/]+)\/processors\/([^/]+)/);
  if (!match) return null;
  const [, projectId, location, processorId] = match;
  const url = `https://${location}-documentai.googleapis.com/v1/projects/${projectId}/locations/${location}/processors/${processorId}:process`;

  try {
    const res = await fetch(`${url}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rawDocument: { content: base64Content, mimeType },
      }),
    });
    if (!res.ok) {
      console.warn('Google Document AI error:', res.status, await res.text());
      return null;
    }
    return (await res.json()) as Record<string, unknown>;
  } catch (err) {
    console.warn('Google Document AI error:', err);
    return null;
  }
}

/**
 * Azure Document Intelligence — ניתוח מסמכים. Server-only: AZURE_DOCUMENT_AI_KEY.
 */
export function isAzureDocumentAiConfigured(): boolean {
  return !!(process.env.AZURE_DOCUMENT_AI_KEY || process.env.NEXT_PUBLIC_AZURE_DOCUMENT_AI_KEY);
}

const AZURE_DOCUMENT_AI_ENDPOINT =
  process.env.AZURE_DOCUMENT_AI_ENDPOINT || process.env.NEXT_PUBLIC_AZURE_DOCUMENT_AI_ENDPOINT || '';

export async function processWithAzureDocumentAi(
  base64Content: string
): Promise<Record<string, unknown> | null> {
  const key = process.env.AZURE_DOCUMENT_AI_KEY || process.env.NEXT_PUBLIC_AZURE_DOCUMENT_AI_KEY;
  if (!key || !AZURE_DOCUMENT_AI_ENDPOINT) return null;

  try {
    const endpoint = AZURE_DOCUMENT_AI_ENDPOINT.replace(/\/$/, '');
    const res = await fetch(`${endpoint}/formrecognizer/documentModels/prebuilt-layout:analyze?api-version=2023-07-31`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Type': 'application/octet-stream',
      },
      body: Buffer.from(base64Content, 'base64'),
    });
    if (!res.ok) {
      console.warn('Azure Document AI error:', res.status, await res.text());
      return null;
    }
    return (await res.json()) as Record<string, unknown>;
  } catch (err) {
    console.warn('Azure Document AI error:', err);
    return null;
  }
}
