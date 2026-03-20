import { NextResponse } from 'next/server';
import { getAdminFirestore, isFirebaseAdminConfigured } from '@/lib/firebaseAdmin';
import { collectRecentRuntimeErrors } from '@/lib/sentinel/collectRuntimeErrors';
import { pushSentinelPatchToHotfixBranch } from '@/lib/sentinel/githubHotfix';
import { runOwnerOrchestratorLlm } from '@/lib/sentinel/llm';
import { appendSentinelEvent } from '@/lib/sentinel/timeline';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/**
 * Vercel Cron — every 30 minutes. Secured with `Authorization: Bearer ${CRON_SECRET}`.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json({ error: 'admin_not_configured' }, { status: 503 });
  }

  const db = getAdminFirestore();

  try {
    const errors = await collectRecentRuntimeErrors(db, 50);
    await appendSentinelEvent(db, {
      kind: 'scan_completed',
      title: 'Sentinel — סריקת שגיאות',
      detail: `נמצאו ${errors.length} רשומות אחרונות ב-runtimeErrors`,
      meta: { count: errors.length },
    });

    if (errors.length === 0) {
      await appendSentinelEvent(db, {
        kind: 'sentinel_idle',
        title: 'אין שגיאות זמינות',
        detail: 'לא נמצאו מסמכים ב-runtimeErrors (או ריק).',
        meta: {},
      });
      return NextResponse.json({ ok: true, errors: 0 });
    }

    const payload = errors
      .slice(0, 28)
      .map((e) => ({ companyId: e.companyId, message: e.message, source: e.source, atMs: e.atMs }));

    const system = `You are the production SRE AI for BSD-YBM (Next.js 16, Firebase, Prisma, Vercel).
Analyze the JSON array of client/runtime errors. Respond with:
(1) Executive summary (Hebrew).
(2) Grouped root-cause hypotheses.
(3) Concrete remediation steps for the codebase.
(4) A proposed patch as a unified diff or file-scoped snippet in a markdown code block.

End with EXACTLY one line on its own: SENTINEL_CONFIDENCE: HIGH
or SENTINEL_CONFIDENCE: LOW
Use HIGH only if you have a minimal, safe patch for this stack.`;

    let analysis: string;
    try {
      analysis = await runOwnerOrchestratorLlm(system, JSON.stringify(payload, null, 2));
    } catch (e) {
      await appendSentinelEvent(db, {
        kind: 'error_analysis',
        title: 'ניתוח AI נכשל / LLM לא מוגדר',
        detail: e instanceof Error ? e.message : 'unknown',
        meta: {},
      });
      return NextResponse.json({ ok: true, errors: errors.length, llm: 'skipped' });
    }

    await appendSentinelEvent(db, {
      kind: 'error_analysis',
      title: 'ניתוח שגיאות (AI)',
      detail: analysis.slice(0, 3500),
      meta: { fullLength: analysis.length },
    });

    const high = /SENTINEL_CONFIDENCE:\s*HIGH\b/i.test(analysis);
    const autoPush = process.env.SENTINEL_AUTO_PUSH === 'true';

    if (high && autoPush && process.env.GITHUB_TOKEN) {
      try {
        const gh = await pushSentinelPatchToHotfixBranch({
          patchBody: analysis,
          analysisSummary: 'Sentinel cron — auto HIGH confidence',
        });
        if (gh) {
          await appendSentinelEvent(db, {
            kind: 'hotfix_pushed',
            title: 'Hotfix branch ב-GitHub',
            detail: gh.branch,
            meta: { url: gh.htmlUrl },
          });
          await appendSentinelEvent(db, {
            kind: 'error_fixed',
            title: 'תיקון הוצע ב-branch',
            detail: gh.htmlUrl,
            meta: { branch: gh.branch },
          });
        }
      } catch (e) {
        await appendSentinelEvent(db, {
          kind: 'hotfix_proposed',
          title: 'GitHub push נכשל',
          detail: e instanceof Error ? e.message : 'github_error',
          meta: {},
        });
      }
    } else if (high) {
      await appendSentinelEvent(db, {
        kind: 'hotfix_proposed',
        title: 'תיקון בביטחון גבוה (ללא דחיפה אוטומטית)',
        detail: 'הגדרו SENTINEL_AUTO_PUSH=true + GITHUB_TOKEN כדי לדחוף אוטומטית.',
        meta: {},
      });
    }

    await appendSentinelEvent(db, {
      kind: 'system_optimized',
      title: 'מחזור Sentinel הושלם',
      detail: high ? 'ניתוח עם ביטחון גבוה' : 'ניתוח עם ביטחון נמוך או כללי',
      meta: { highConfidence: high },
    });

    return NextResponse.json({ ok: true, errors: errors.length, highConfidence: high });
  } catch (e) {
    console.error('[sentinel]', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'sentinel_failed' },
      { status: 500 }
    );
  }
}
