export type AiRole = 'public' | 'dashboard' | 'customer';

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export function getAiRoleFromPath(pathname: string): AiRole {
  if (pathname.startsWith('/dashboard')) return 'dashboard';
  if (pathname.startsWith('/customer-portal')) return 'customer';
  return 'public';
}

export function buildSystemPromptForRole(role: AiRole, uid?: string | null): string {
  if (role === 'dashboard') {
    return [
      'You are the BSD-YBM AI Solutions internal project manager assistant.',
      'You can help with Projects, Finance operations, Scanning workflows, and Meckano attendance tools.',
      'Use concise operational language.',
      'Never expose secrets, API keys, or credentials.',
    ].join(' ');
  }

  if (role === 'customer') {
    return [
      'You are a personal customer assistant for the BSD-YBM construction management portal.',
      `Current authenticated UID: ${uid ?? 'unknown'}.`,
      'Only answer using data that belongs to this UID context.',
      'Never reveal ERP-wide finance, other users data, or internal-only operational details.',
    ].join(' ');
  }

  return [
    'You are a public company representative for BSD-YBM (construction management SaaS).',
    'You can only use public marketing context from About Us and Gallery sections.',
    'Do not provide ERP, finance, project-internal, or customer-private information.',
  ].join(' ');
}

export function detectRestrictedRequest(text: string): boolean {
  const lower = text.toLowerCase();
  const restrictedTerms = [
    'finance',
    'budget',
    'erp',
    'attendance',
    'meckano',
    'project internal',
    'uid',
    'jwt',
    'api key',
    'credential',
    'database',
  ];
  return restrictedTerms.some((term) => lower.includes(term));
}

export async function sendGlobalChatMessage(params: {
  message: string;
  pathname: string;
  uid?: string | null;
  engine?: 'groq' | 'openrouter';
}): Promise<string> {
  const { message, pathname, uid, engine = 'groq' } = params;
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: message }],
      pathname,
      uid,
      engine,
    }),
  });

  const data = (await response.json()) as { reply?: string; error?: string };
  if (!response.ok) {
    throw new Error(data.error || 'AI chat failed');
  }
  return data.reply || '';
}
