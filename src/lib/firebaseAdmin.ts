import { applicationDefault, cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { existsSync, readFileSync } from 'node:fs';

let adminApp: App | undefined;

/** פעם אחת לכל תהליך שרת — כולל קריאה מקובץ ב־FIREBASE_SERVICE_ACCOUNT_PATH */
let resolvedServiceAccount: Record<string, unknown> | null | undefined;

function isServiceAccountShape(o: unknown): o is Record<string, unknown> {
  if (!o || typeof o !== 'object') return false;
  const r = o as Record<string, unknown>;
  return (
    typeof r.private_key === 'string' &&
    typeof r.client_email === 'string' &&
    typeof r.project_id === 'string'
  );
}

/** מירכאות מסביב לנתיב ב־.env; נתיבי Windows עם / עובדים גם בלי escape */
function normalizeEnvFilePath(raw: string): string {
  let s = raw.trim();
  if (s.length >= 2 && ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'")))) {
    s = s.slice(1, -1);
  }
  return s.trim();
}

function stripCodeFences(s: string): string {
  const t = s.trim();
  if (!t.startsWith('```')) return s.trim();
  return t
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

function normalizeQuotes(s: string): string {
  return s
    .replace(/[\u201C\u201D\u00AB\u00BB]/g, '"')
    .replace(/[\u2018\u2019]/g, "'");
}

function normalizeServiceAccountJsonString(raw: string): string[] {
  let s = stripCodeFences(normalizeQuotes(raw)).trim().replace(/^\uFEFF/, '');
  const variants: string[] = [];
  variants.push(s);
  if (s.length >= 2 && s.startsWith("'") && s.endsWith("'")) {
    variants.push(s.slice(1, -1).replace(/\\'/g, "'").replace(/\\n/g, '\n'));
  }
  for (const v of [...variants]) {
    if (v.includes('\\n') && !v.includes('\n')) {
      variants.push(v.replace(/\\n/g, '\n'));
    }
  }
  return [...new Set(variants)];
}

function tryParseJsonServiceAccount(raw: string): Record<string, unknown> | null {
  for (const candidate of normalizeServiceAccountJsonString(raw)) {
    try {
      const o = JSON.parse(candidate) as unknown;
      if (isServiceAccountShape(o)) return o;
    } catch {
      /* try next */
    }
  }
  return null;
}

function loadServiceAccountFromPath(): Record<string, unknown> | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim();
  if (!raw) return null;
  const p = normalizeEnvFilePath(raw);
  try {
    if (!existsSync(p)) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[firebase-admin] FIREBASE_SERVICE_ACCOUNT_PATH: file not found:', p);
      }
      return null;
    }
    const text = readFileSync(p, 'utf8');
    const o = JSON.parse(normalizeQuotes(text)) as unknown;
    if (isServiceAccountShape(o)) return o;
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[firebase-admin] FIREBASE_SERVICE_ACCOUNT_PATH: read/parse failed:', (e as Error).message);
    }
  }
  return null;
}

function loadServiceAccountFromJsonEnv(): Record<string, unknown> | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) return null;
  const parsed = tryParseJsonServiceAccount(raw);
  if (parsed) return parsed;
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      '[firebase-admin] FIREBASE_SERVICE_ACCOUNT_JSON is set but could not be parsed. Try FIREBASE_SERVICE_ACCOUNT_PATH, BASE64, or GOOGLE_APPLICATION_CREDENTIALS.'
    );
  }
  return null;
}

function loadServiceAccountFromBase64Env(): Record<string, unknown> | null {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64?.replace(/\s+/g, '').trim();
  if (!b64) return null;
  try {
    const json = Buffer.from(b64, 'base64').toString('utf8');
    const o = JSON.parse(normalizeQuotes(json)) as unknown;
    if (isServiceAccountShape(o)) return o;
  } catch {
    /* fall through */
  }
  if (process.env.NODE_ENV !== 'production') {
    console.warn('[firebase-admin] FIREBASE_SERVICE_ACCOUNT_BASE64 is set but decode/parse failed.');
  }
  return null;
}

/**
 * סדר עדיפות: נתיב לקובץ → JSON ב-env → Base64.
 * נשמר במטמון לתהליך.
 */
export function resolveServiceAccountCredentials(): Record<string, unknown> | null {
  if (resolvedServiceAccount !== undefined) {
    return resolvedServiceAccount;
  }
  resolvedServiceAccount =
    loadServiceAccountFromPath() ?? loadServiceAccountFromJsonEnv() ?? loadServiceAccountFromBase64Env() ?? null;
  return resolvedServiceAccount;
}

export function isFirebaseAdminConfigured(): boolean {
  return !!(
    resolveServiceAccountCredentials() ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim() ||
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

  const sa = resolveServiceAccountCredentials();
  if (sa) {
    adminApp = initializeApp({ credential: cert(sa as never) });
    return adminApp;
  }

  try {
    adminApp = initializeApp({ credential: applicationDefault() });
    return adminApp;
  } catch {
    throw new Error(
      'Firebase Admin is not configured. Set FIREBASE_SERVICE_ACCOUNT_PATH, FIREBASE_SERVICE_ACCOUNT_JSON, FIREBASE_SERVICE_ACCOUNT_BASE64, or GOOGLE_APPLICATION_CREDENTIALS.'
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
