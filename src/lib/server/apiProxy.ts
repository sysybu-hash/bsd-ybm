/**
 * Multi-engine AI proxy — BYOK (Bring Your Own Key) for Gemini.
 *
 * Firestore: `companies/{companyId}/settings/ai`
 * Supported fields (first non-empty wins): `ai_key`, `aiKey`, `apiKey`, `geminiApiKey`
 *
 * Priority: company BYOK → platform `GEMINI_API_KEY` (server-only; never NEXT_PUBLIC).
 * Master-key calls should be logged for billing / usage (see `logMasterKeyAiUsage`).
 */

import type { Firestore } from 'firebase-admin/firestore';

export type GeminiKeySource = 'byok' | 'master';

export type ResolvedGeminiKey =
  | { ok: true; apiKey: string; source: GeminiKeySource }
  | { ok: false; reason: 'no_key' };

function pickByokKey(d: Record<string, unknown> | undefined): string | null {
  if (!d) return null;
  const raw = d.ai_key ?? d.aiKey ?? d.apiKey ?? d.geminiApiKey;
  if (typeof raw === 'string' && raw.trim()) return raw.trim();
  return null;
}

export async function readCompanyAiKeyDoc(
  db: Firestore,
  companyId: string
): Promise<Record<string, unknown> | undefined> {
  const snap = await db.collection('companies').doc(companyId).collection('settings').doc('ai').get();
  if (!snap.exists) return undefined;
  return snap.data() as Record<string, unknown>;
}

export async function resolveGeminiApiKeyForCompany(
  db: Firestore,
  companyId: string
): Promise<ResolvedGeminiKey> {
  const docData = await readCompanyAiKeyDoc(db, companyId);
  const byok = pickByokKey(docData);
  if (byok) {
    return { ok: true, apiKey: byok, source: 'byok' };
  }

  const master = (process.env.GEMINI_API_KEY || '').trim();
  if (!master) {
    return { ok: false, reason: 'no_key' };
  }

  return { ok: true, apiKey: master, source: 'master' };
}

export type MasterKeyAiUsageLog = {
  companyId: string;
  operation: string;
  /** e.g. engine ids, file count */
  detail?: Record<string, unknown>;
};

/**
 * Structured log for platform (master) key usage — extend to Firestore `usage` docs if needed.
 */
export function logMasterKeyAiUsage(entry: MasterKeyAiUsageLog): void {
  const payload = {
    kind: 'ai_master_key_usage',
    at: new Date().toISOString(),
    companyId: entry.companyId,
    operation: entry.operation,
    ...entry.detail,
  };
  console.info('[api-proxy]', JSON.stringify(payload));
}
