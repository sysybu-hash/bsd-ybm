const MINDSTUDIO_API_BASE = 'https://api.mindstudio.ai';

/** Server-only: keys must not be exposed via NEXT_PUBLIC. */
export function isMindStudioConfigured(): boolean {
  return !!(process.env.MINDSTUDIO_API_KEY && process.env.MINDSTUDIO_WORKFLOW_ID);
}

export type MindStudioRunInput = {
  documentBase64?: string;
  documentMimeType?: string;
  [key: string]: unknown;
};

export type MindStudioRunResult = {
  result?: { providerName?: string; totalAmount?: string; date?: string; projectName?: string };
  text?: string;
  [key: string]: unknown;
};

/**
 * Run MindStudio workflow with given inputs.
 * Server-side only: MINDSTUDIO_API_KEY + MINDSTUDIO_WORKFLOW_ID (call via /api/mindstudio/run).
 */
export async function runMindStudioWorkflow(
  inputs: MindStudioRunInput
): Promise<MindStudioRunResult | null> {
  const apiKey = process.env.MINDSTUDIO_API_KEY;
  const workflowId = process.env.MINDSTUDIO_WORKFLOW_ID;

  if (!apiKey || !workflowId) return null;

  try {
    const res = await fetch(`${MINDSTUDIO_API_BASE}/v1/workflows/${workflowId}/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ inputs }),
    });

    if (!res.ok) {
      console.warn('MindStudio run failed:', res.status, await res.text());
      return null;
    }

    const data = (await res.json()) as MindStudioRunResult;
    return data;
  } catch (err) {
    console.warn('MindStudio error:', err);
    return null;
  }
}
