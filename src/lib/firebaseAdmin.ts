import { applicationDefault, cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

let adminApp: App | undefined;

function parseServiceAccount(): Record<string, unknown> | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (raw) {
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (b64) {
    try {
      const json = Buffer.from(b64, 'base64').toString('utf8');
      return JSON.parse(json) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
  return null;
}

export function isFirebaseAdminConfigured(): boolean {
  return !!(
    parseServiceAccount() ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    getApps().length > 0
  );
}

/**
 * Lazily initialise the default Firebase Admin app (server-only).
 */
export function getAdminApp(): App {
  if (adminApp) return adminApp;
  const existing = getApps()[0];
  if (existing) {
    adminApp = existing;
    return adminApp;
  }

  const sa = parseServiceAccount();
  if (sa) {
    adminApp = initializeApp({ credential: cert(sa as never) });
    return adminApp;
  }

  try {
    adminApp = initializeApp({ credential: applicationDefault() });
    return adminApp;
  } catch {
    throw new Error(
      'Firebase Admin is not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON (JSON string) or FIREBASE_SERVICE_ACCOUNT_BASE64, or GOOGLE_APPLICATION_CREDENTIALS.'
    );
  }
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}

/**
 * Uses named Firestore database when NEXT_PUBLIC_FIREBASE_DATABASE_ID / FIREBASE_DATABASE_ID is set and not "(default)".
 */
export function getAdminFirestore() {
  const app = getAdminApp();
  const dbId =
    process.env.FIREBASE_DATABASE_ID?.trim() ||
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID?.trim() ||
    '';
  if (dbId && dbId !== '(default)') {
    return getFirestore(app, dbId);
  }
  return getFirestore(app);
}

/** Firebase Storage (default bucket). */
export function getAdminBucket() {
  const app = getAdminApp();
  const name =
    process.env.FIREBASE_STORAGE_BUCKET?.trim() ||
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim() ||
    '';
  return name ? getStorage(app).bucket(name) : getStorage(app).bucket();
}
