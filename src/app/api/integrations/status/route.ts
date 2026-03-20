import { NextResponse } from 'next/server';
import { getAdminAuth, isFirebaseAdminConfigured } from '@/lib/firebaseAdmin';
import { isPlatformAdminEmail } from '@/lib/auth/adminGuard';

export const runtime = 'nodejs';

type FullStatus = {
  firebase: boolean;
  database: boolean;
  googleOAuth: boolean;
  apiUrl: boolean;
  apiAuth: boolean;
  siteUrl: boolean;
  gemini: boolean;
  meckano: boolean;
  mindStudio: boolean;
  googleMaps: boolean;
  groq: boolean;
  openRouter: boolean;
  googleDocumentAi: boolean;
  azureDocumentAi: boolean;
};

function buildFullStatus(): FullStatus {
  return {
    firebase:
      !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
      !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
      !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    database: !!process.env.DATABASE_URL,
    googleOAuth:
      !!process.env.GOOGLE_CLIENT_ID &&
      !!process.env.GOOGLE_CLIENT_SECRET &&
      !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    apiUrl: !!process.env.NEXT_PUBLIC_API_URL,
    apiAuth: process.env.NEXT_PUBLIC_USE_API_AUTH === 'true',
    siteUrl: !!process.env.NEXT_PUBLIC_SITE_URL,
    gemini: !!process.env.GEMINI_API_KEY,
    meckano: !!process.env.MECKANO_API_KEY,
    mindStudio:
      !!process.env.MINDSTUDIO_API_KEY &&
      !!process.env.MINDSTUDIO_WORKFLOW_ID,
    googleMaps: !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    groq: !!(process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY),
    openRouter: !!(process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY),
    googleDocumentAi:
      !!(
        (process.env.GOOGLE_DOCUMENT_AI_KEY || process.env.NEXT_PUBLIC_GOOGLE_DOCUMENT_AI_KEY) &&
        (process.env.GOOGLE_DOCUMENT_AI_PROCESSOR || process.env.NEXT_PUBLIC_GOOGLE_DOCUMENT_AI_PROCESSOR)
      ),
    azureDocumentAi: !!(process.env.AZURE_DOCUMENT_AI_KEY || process.env.NEXT_PUBLIC_AZURE_DOCUMENT_AI_KEY),
  };
}

/** Non-admins: infra flags only — no AI engine key presence (reduces fingerprinting). */
function publicStatus(full: FullStatus) {
  return {
    scope: 'public' as const,
    firebase: full.firebase,
    database: full.database,
    googleOAuth: full.googleOAuth,
    apiUrl: full.apiUrl,
    apiAuth: full.apiAuth,
    siteUrl: full.siteUrl,
    meckano: full.meckano,
  };
}

/**
 * GET — full integration matrix only when `Authorization: Bearer <Firebase ID token>`
 * verifies to a platform admin email (`NEXT_PUBLIC_ADMIN_EMAILS` + fallbacks).
 */
export async function GET(req: Request) {
  const full = buildFullStatus();
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

  if (token && isFirebaseAdminConfigured()) {
    try {
      const decoded = await getAdminAuth().verifyIdToken(token);
      const email = decoded.email;
      if (isPlatformAdminEmail(email)) {
        return NextResponse.json({ scope: 'admin' as const, ...full });
      }
    } catch {
      /* treat as non-admin */
    }
  }

  return NextResponse.json(publicStatus(full));
}
