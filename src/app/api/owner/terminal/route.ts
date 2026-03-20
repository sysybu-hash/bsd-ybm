import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminFirestore, isFirebaseAdminConfigured } from '@/lib/firebaseAdmin';
import { pushOwnerTerminalFiles } from '@/lib/github/ownerTerminalPush';
import { sanitizeTerminalRepoPath } from '@/lib/github/terminalPathPolicy';
import { requireOwnerBearer } from '@/lib/server/ownerAuth';
import { appendSentinelEvent } from '@/lib/sentinel/timeline';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const terminalOutputSchema = z.object({
  summary: z.string().describe('Short plan / explanation of changes'),
  commitMessage: z
    .string()
    .describe('Conventional single-line git commit message for the changes'),
  files: z
    .array(
      z.object({
        path: z.string().describe('Repository-relative path under allowed roots only'),
        content: z.string().describe('Complete new file contents (UTF-8 text)'),
      })
    )
    .max(20)
    .describe('Files to create or replace entirely'),
});

type Body = {
  instruction?: string;
  /** If true, run the model but do not call GitHub */
  dryRun?: boolean;
};

const MAX_INSTRUCTION = 12_000;
const MAX_FILE_CHARS = 120_000;

/**
 * Owner-only AI Command Terminal: structured edits → optional GitHub branch push.
 * Requires Firebase ID token + sysybu@gmail.com (`requireOwnerBearer`).
 */
export async function POST(req: Request) {
  const gate = await requireOwnerBearer(req);
  if (!gate.ok) return gate.response;

  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json({ error: 'server_not_configured' }, { status: 503 });
  }

  if (!process.env.OPENAI_API_KEY?.trim()) {
    return NextResponse.json({ error: 'openai_not_configured' }, { status: 503 });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const instruction = String(body.instruction ?? '').trim();
  if (!instruction || instruction.length > MAX_INSTRUCTION) {
    return NextResponse.json({ error: 'invalid_instruction' }, { status: 400 });
  }

  const dryRun = Boolean(body.dryRun);
  const modelId = process.env.OPENAI_TERMINAL_MODEL?.trim() || 'gpt-4o';

  const system = `You are the principal engineer for a Next.js App Router TypeScript monolith (Firebase, Prisma).
The user will give a natural-language instruction to change the codebase.

You must respond with a structured object only (schema enforced):
- summary: brief plan
- commitMessage: one line, imperative mood, e.g. "feat(dashboard): add filter"
- files: full file paths and COMPLETE file contents for every file to add or replace.

Rules:
- Only use paths under these roots: src/, public/, prisma/, or root files: package.json, package-lock.json, next.config.*, tsconfig.json, eslint.config.mjs, postcss.config.mjs, middleware.ts, template.env, README.md, AGENTS.md, CLAUDE.md.
- Never use .., hidden path segments, or .env files (except exact template.env at repo root).
- Prefer minimal, correct TypeScript/React code; preserve RTL/hebrew comments where relevant.
- If the request is unsafe or impossible within allowed paths, return an empty files array and explain in summary.`;

  let object: z.infer<typeof terminalOutputSchema>;
  try {
    const { object: o } = await generateObject({
      model: openai(modelId),
      schema: terminalOutputSchema,
      system,
      prompt: instruction,
      temperature: 0.2,
    });
    object = o;
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'llm_failed' },
      { status: 503 }
    );
  }

  const rejectedPaths: string[] = [];
  const accepted: Array<{ path: string; content: string }> = [];

  for (const f of object.files) {
    const path = sanitizeTerminalRepoPath(f.path);
    if (!path) {
      rejectedPaths.push(f.path);
      continue;
    }
    if (f.content.length > MAX_FILE_CHARS) {
      rejectedPaths.push(`${path} (too large)`);
      continue;
    }
    accepted.push({ path, content: f.content });
  }

  const db = getAdminFirestore();
  await appendSentinelEvent(db, {
    kind: 'owner_terminal',
    title: 'Owner Terminal — הוראה',
    detail: instruction.slice(0, 800),
    meta: {
      dryRun,
      fileCount: accepted.length,
      rejectedCount: rejectedPaths.length,
      model: modelId,
    },
  });

  if (dryRun || accepted.length === 0) {
    return NextResponse.json({
      ok: true,
      dryRun: dryRun || accepted.length === 0,
      summary: object.summary,
      commitMessage: object.commitMessage,
      files: accepted.map((x) => ({ path: x.path, contentLength: x.content.length })),
      rejectedPaths,
      github: null,
    });
  }

  if (!process.env.GITHUB_TOKEN?.trim() || !process.env.GITHUB_REPO?.trim()) {
    return NextResponse.json({
      ok: true,
      dryRun: false,
      summary: object.summary,
      commitMessage: object.commitMessage,
      files: accepted.map((x) => ({ path: x.path, contentLength: x.content.length })),
      rejectedPaths,
      github: null,
      warning: 'GITHUB_TOKEN or GITHUB_REPO not set — no push performed',
    });
  }

  try {
    const github = await pushOwnerTerminalFiles({
      files: accepted,
      commitMessage: object.commitMessage.slice(0, 200),
    });
    await appendSentinelEvent(db, {
      kind: 'hotfix_pushed',
      title: 'Owner Terminal — GitHub branch',
      detail: github.branch,
      meta: { url: github.htmlUrl },
    });
    return NextResponse.json({
      ok: true,
      dryRun: false,
      summary: object.summary,
      commitMessage: object.commitMessage,
      files: accepted.map((x) => ({ path: x.path, contentLength: x.content.length })),
      rejectedPaths,
      github,
    });
  } catch (e) {
    await appendSentinelEvent(db, {
      kind: 'hotfix_proposed',
      title: 'Owner Terminal — GitHub נכשל',
      detail: e instanceof Error ? e.message : 'error',
      meta: {},
    });
    return NextResponse.json({
      ok: true,
      summary: object.summary,
      commitMessage: object.commitMessage,
      files: accepted.map((x) => ({ path: x.path, contentLength: x.content.length })),
      rejectedPaths,
      github: null,
      githubError: e instanceof Error ? e.message : 'github_failed',
    });
  }
}
