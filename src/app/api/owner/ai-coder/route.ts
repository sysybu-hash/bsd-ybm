import { NextResponse } from 'next/server';
import { getAdminFirestore, isFirebaseAdminConfigured } from '@/lib/firebaseAdmin';
import { requireOwnerBearer } from '@/lib/server/ownerAuth';
import { pushSentinelPatchToHotfixBranch } from '@/lib/sentinel/githubHotfix';
import { runOwnerOrchestratorLlm } from '@/lib/sentinel/llm';
import { appendSentinelEvent } from '@/lib/sentinel/timeline';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

type Body = {
  instruction?: string;
  /** If true, push AI output as .diff on new hotfix branch (requires GITHUB_* env). */
  applyGithub?: boolean;
};

/**
 * Phase 36 — Owner-only AI development hub. Requires Firebase ID token + sysybu@gmail.com.
 */
export async function POST(req: Request) {
  const gate = await requireOwnerBearer(req);
  if (!gate.ok) return gate.response;

  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json({ error: 'server_not_configured' }, { status: 503 });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const instruction = String(body.instruction ?? '').trim();
  if (!instruction || instruction.length > 12000) {
    return NextResponse.json({ error: 'invalid_instruction' }, { status: 400 });
  }

  const applyGithub = Boolean(body.applyGithub);

  const system = `You are the principal engineer for BSD-YBM AI Solutions (Next.js 16 App Router, Firebase, Prisma, Vercel).
The repository is TypeScript-first. Obey the user's development instruction.
Output:
1) Short plan (bullets)
2) Proposed code changes as markdown fenced blocks (diff or TSX/TS snippets)
3) Risks & test checklist

If the user asks for GitHub operations, still output patch text they can apply; do not claim you pushed unless told a bot will.`;

  let reply: string;
  try {
    reply = await runOwnerOrchestratorLlm(system, instruction);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'llm_failed' },
      { status: 503 }
    );
  }

  const db = getAdminFirestore();
  await appendSentinelEvent(db, {
    kind: 'ai_coder',
    title: 'AI Coder — הוראה',
    detail: instruction.slice(0, 800),
    meta: { replyLength: reply.length },
  });

  let github: { branch: string; htmlUrl: string } | null = null;
  if (applyGithub) {
    if (!process.env.GITHUB_TOKEN?.trim()) {
      return NextResponse.json(
        { ok: true, reply, github: null, warning: 'GITHUB_TOKEN not set' },
        { status: 200 }
      );
    }
    try {
      github = await pushSentinelPatchToHotfixBranch({
        patchBody: reply,
        analysisSummary: `Owner AI Coder instruction:\n${instruction.slice(0, 2000)}`,
      });
      if (github) {
        await appendSentinelEvent(db, {
          kind: 'hotfix_pushed',
          title: 'AI Coder — hotfix branch',
          detail: github.branch,
          meta: { url: github.htmlUrl },
        });
      }
    } catch (e) {
      await appendSentinelEvent(db, {
        kind: 'hotfix_proposed',
        title: 'AI Coder — GitHub נכשל',
        detail: e instanceof Error ? e.message : 'error',
        meta: {},
      });
      return NextResponse.json({
        ok: true,
        reply,
        github: null,
        githubError: e instanceof Error ? e.message : 'github_failed',
      });
    }
  }

  return NextResponse.json({ ok: true, reply, github });
}
