import { NextRequest, NextResponse } from 'next/server';
import { groqChat } from '@/services/groqService';
import { openRouterChat } from '@/services/openRouterService';
import {
  buildSystemPromptForRole,
  detectRestrictedRequest,
  getAiRoleFromPath,
  type ChatMessage,
} from '@/services/aiService';

type Engine = 'groq' | 'openrouter';

function publicGuard(message: string): string | null {
  if (detectRestrictedRequest(message)) {
    return 'במצב ציבורי ניתן לענות רק על תוכן כללי מאזור אודותינו וגלריה.';
  }
  return null;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const messages = body.messages as ChatMessage[] | undefined;
  const pathname = String(body.pathname || '/');
  const uid = (body.uid as string | undefined) ?? null;
  const engine = (body.engine as Engine) || 'groq';

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'messages array required' }, { status: 400 });
  }

  const role = getAiRoleFromPath(pathname);
  if (role === 'customer' && !uid) {
    return NextResponse.json(
      { error: 'Customer portal requires authenticated UID context' },
      { status: 403 }
    );
  }

  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
  if (role === 'public') {
    const blocked = publicGuard(lastUserMessage);
    if (blocked) {
      return NextResponse.json({ reply: blocked });
    }
  }

  const systemPrompt = buildSystemPromptForRole(role, uid);
  const scopedMessages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...messages.filter((m) => m.role !== 'system'),
  ];

  try {
    let text: string | null = null;
    if (engine === 'groq') {
      text = await groqChat(scopedMessages);
    } else {
      text = await openRouterChat(scopedMessages);
    }

    if (text === null) {
      return NextResponse.json(
        { error: `${engine} not configured or failed` },
        { status: 503 }
      );
    }

    return NextResponse.json({ reply: text });
  } catch (err) {
    console.error('AI chat error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Chat failed' },
      { status: 500 }
    );
  }
}
