import type { Firestore } from 'firebase-admin/firestore';
import { isMeckanoModuleEnabled } from '@/lib/integrations/meckanoModule';

export async function assertMeckanoModuleEnabled(
  db: Firestore,
  companyId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const [intSnap, coSnap] = await Promise.all([
    db.collection('companies').doc(companyId).collection('settings').doc('integrations').get(),
    db.collection('companies').doc(companyId).get(),
  ]);

  const enabled = isMeckanoModuleEnabled(
    intSnap.exists ? (intSnap.data() as Record<string, unknown>) : undefined,
    coSnap.exists ? (coSnap.data() as Record<string, unknown>) : undefined
  );

  if (!enabled) {
    return { ok: false, error: 'meckano_module_disabled' };
  }
  return { ok: true };
}
