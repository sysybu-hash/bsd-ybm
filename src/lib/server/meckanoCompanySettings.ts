import type { Firestore } from 'firebase-admin/firestore';

function pickString(...vals: unknown[]): string | undefined {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim() !== '') return v.trim();
  }
  return undefined;
}

/**
 * Meckano key: companies/{companyId}/settings/integrations
 * Supported fields: meckanoApiKey | meckanoKey | key
 * Fallback: MECKANO_API_KEY env (single-tenant / dev).
 */
export async function getCompanyMeckanoApiKey(
  db: Firestore,
  companyId: string
): Promise<string | null> {
  const snap = await db
    .collection('companies')
    .doc(companyId)
    .collection('settings')
    .doc('integrations')
    .get();

  const d = snap.data() as Record<string, unknown> | undefined;
  const fromStore = pickString(d?.meckanoApiKey, d?.meckanoKey, d?.key);
  if (fromStore) return fromStore;

  const env = process.env.MECKANO_API_KEY?.trim();
  return env || null;
}
