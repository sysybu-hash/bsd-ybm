import { getAdminAuth, isFirebaseAdminConfigured } from '@/lib/firebaseAdmin';

export class ApiAuthError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = 'ApiAuthError';
  }
}

/** Verify Firebase ID token from `Authorization: Bearer <jwt>`. Requires Admin SDK on server. */
export async function verifyBearerUid(request: Request): Promise<string> {
  if (!isFirebaseAdminConfigured()) {
    throw new ApiAuthError('firebase_admin_not_configured', 503);
  }
  const header = request.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) {
    throw new ApiAuthError('missing_bearer_token', 401);
  }
  const token = header.slice(7).trim();
  if (!token) {
    throw new ApiAuthError('empty_bearer_token', 401);
  }
  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    return decoded.uid;
  } catch {
    throw new ApiAuthError('invalid_token', 401);
  }
}
