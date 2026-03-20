/**
 * Groq API — מנוע AI לטקסט/צ'אט. Server-only: GROQ_API_KEY (API routes).
 */
export function isGroqConfigured(): boolean {
  return !!(process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY);
}

export async function groqChat(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  model = 'llama-3.1-8b-instant'
): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages }),
    });
    if (!res.ok) {
      console.warn('Groq error:', res.status, await res.text());
      return null;
    }
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content ?? null;
  } catch (err) {
    console.warn('Groq error:', err);
    return null;
  }
}
