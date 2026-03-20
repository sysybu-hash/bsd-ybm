import { PUBLIC_SITE_URL } from '@/lib/site';

/**
 * OpenRouter API — גישה למספר מודלי AI. Server-only: OPENROUTER_API_KEY.
 */

export function isOpenRouterConfigured(): boolean {
  return !!(process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY);
}

export async function openRouterChat(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  model = 'openai/gpt-3.5-turbo'
): Promise<string | null> {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': PUBLIC_SITE_URL,
      },
      body: JSON.stringify({ model, messages }),
    });
    if (!res.ok) {
      console.warn('OpenRouter error:', res.status, await res.text());
      return null;
    }
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content ?? null;
  } catch (err) {
    console.warn('OpenRouter error:', err);
    return null;
  }
}
