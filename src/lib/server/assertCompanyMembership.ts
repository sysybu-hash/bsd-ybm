import { getAdminFirestore, isFirebaseAdminConfigured } from '@/lib/firebaseAdmin';
import { ApiAuthError } from '@/lib/server/verifyBearerUid';

/** Ensures `users/{uid}/companies/{companyId}` exists (tenant membership). */
export async function assertCompanyMembership(uid: string, companyId: string): Promise<void> {
  if (!companyId?.trim()) {
    throw new ApiAuthError('companyId_required', 400);
  }
  if (!isFirebaseAdminConfigured()) {
    throw new ApiAuthError('firebase_admin_not_configured', 503);
  }
  const db = getAdminFirestore();
  const snap = await db.doc(`users/${uid}/companies/${companyId.trim()}`).get();
  if (!snap.exists) {
    throw new ApiAuthError('company_access_denied', 403);
  }
}
