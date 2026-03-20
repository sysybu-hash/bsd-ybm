import type { Firestore } from 'firebase-admin/firestore';

export type RuntimeErrorRow = {
  id: string;
  companyId: string;
  message: string;
  source: string;
  atMs: number;
};

/**
 * Recent runtime error docs from all tenants (collection group `runtimeErrors` under each company).
 */
export async function collectRecentRuntimeErrors(db: Firestore, max = 40): Promise<RuntimeErrorRow[]> {
  const snap = await db.collectionGroup('runtimeErrors').limit(max).get();
  const rows: RuntimeErrorRow[] = [];
  snap.forEach((d) => {
    const parent = d.ref.parent.parent;
    const companyId = parent?.id ?? '';
    const data = d.data() as Record<string, unknown>;
    const message = String(data.message ?? '');
    const source = String(data.source ?? '');
    let atMs = 0;
    const at = data.at;
    if (at && typeof at === 'object' && 'toMillis' in at && typeof (at as { toMillis: () => number }).toMillis === 'function') {
      try {
        atMs = (at as { toMillis: () => number }).toMillis();
      } catch {
        atMs = 0;
      }
    }
    rows.push({ id: d.id, companyId, message, source, atMs });
  });
  rows.sort((a, b) => b.atMs - a.atMs);
  return rows.slice(0, max);
}
