/**
 * Server-only LLM helpers for Sentinel / AI Coder (Phase 36).
 * Prefer Anthropic → OpenAI; returns null if neither is configured.
 */

async function anthropicMessages(system: string, user: string): Promise<string | null> {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) return null;
  const model = process.env.ANTHROPIC_MODEL?.trim() || 'claude-3-5-sonnet-20241022';
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`anthropic_http_${res.status}: ${t.slice(0, 500)}`);
  }
  const j = (await res.json()) as { content?: Array<{ type?: string; text?: string }> };
  const block = j.content?.find((c) => c.type === 'text');
  return block?.text?.trim() || null;
}

async function openAiChat(system: string, user: string): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;
  const model = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini';
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`openai_http_${res.status}: ${t.slice(0, 500)}`);
  }
  const j = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = j.choices?.[0]?.message?.content;
  return typeof text === 'string' ? text.trim() : null;
}

export async function runOwnerOrchestratorLlm(system: string, user: string): Promise<string> {
  const a = await anthropicMessages(system, user).catch(() => null);
  if (a) return a;
  const o = await openAiChat(system, user).catch(() => null);
  if (o) return o;
  throw new Error('No LLM configured (set ANTHROPIC_API_KEY or OPENAI_API_KEY)');
}
