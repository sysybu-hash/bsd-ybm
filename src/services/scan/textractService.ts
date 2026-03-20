import { TextractClient, AnalyzeDocumentCommand } from '@aws-sdk/client-textract';

export function isTextractConfigured(): boolean {
  return !!(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_REGION
  );
}

/**
 * Synchronous document analysis (images / single-page PDF as supported by Textract).
 */
export async function analyzeWithTextract(bytes: Uint8Array): Promise<Record<string, unknown> | null> {
  if (!isTextractConfigured()) return null;

  const region = process.env.AWS_REGION || 'us-east-1';
  const client = new TextractClient({ region });

  try {
    const out = await client.send(
      new AnalyzeDocumentCommand({
        Document: { Bytes: bytes },
        FeatureTypes: ['TABLES', 'FORMS'],
      })
    );
    return {
      blocksCount: out.Blocks?.length ?? 0,
      summary: (out.Blocks ?? [])
        .filter((b) => b.BlockType === 'LINE' && b.Text)
        .slice(0, 80)
        .map((b) => b.Text),
      rawBlockSample: (out.Blocks ?? []).slice(0, 12),
    };
  } catch (e) {
    console.error('Textract error:', e);
    return { error: e instanceof Error ? e.message : 'textract_failed' };
  }
}
