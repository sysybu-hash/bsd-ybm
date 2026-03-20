import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore, isFirebaseAdminConfigured } from '@/lib/firebaseAdmin';
import { resolveGeminiApiKeyForCompany, logMasterKeyAiUsage } from '@/lib/server/apiProxy';
import { assertCompanyStaffNotClient } from '@/lib/server/registrationAuthz';
import { parseLegacyFileWithGemini } from '@/services/ai/LegacyInvoiceParser';

export const runtime = 'nodejs';

type FilePart = {
  fileName?: string;
  mimeType?: string;
  base64?: string;
};

type Body = {
  companyId?: string;
  files?: FilePart[];
};

export async function POST(req: Request) {
  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json({ error: 'server_not_configured' }, { status: 503 });
  }

  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    return NextResponse.json({ error: 'auth_required' }, { status: 401 });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const companyId = (body.companyId ?? '').trim();
  const files = Array.isArray(body.files) ? body.files : [];
  if (!companyId || files.length === 0) {
    return NextResponse.json({ error: 'missing_company_or_files' }, { status: 400 });
  }
  if (files.length > 12) {
    return NextResponse.json({ error: 'too_many_files' }, { status: 400 });
  }

  const adminAuth = getAdminAuth();
  const db = getAdminFirestore();

  let uid: string;
  let requestEmail: string | undefined;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    uid = decoded.uid;
    requestEmail = decoded.email;
  } catch {
    return NextResponse.json({ error: 'invalid_token' }, { status: 401 });
  }

  try {
    await assertCompanyStaffNotClient(db, uid, companyId, requestEmail);
  } catch {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const keyRes = await resolveGeminiApiKeyForCompany(db, companyId);
  if (!keyRes.ok) {
    return NextResponse.json({ error: 'gemini_not_configured' }, { status: 503 });
  }
  if (keyRes.source === 'master') {
    logMasterKeyAiUsage({
      companyId,
      operation: 'legacy_import.parse',
      detail: { fileCount: files.length, model: 'gemini-1.5-pro' },
    });
  }

  const results = [];
  for (const f of files) {
    const fileName = String(f.fileName ?? 'upload').slice(0, 240);
    const mimeType = String(f.mimeType ?? 'application/octet-stream').slice(0, 120);
    const base64 = typeof f.base64 === 'string' ? f.base64.replace(/^data:[^;]+;base64,/, '').trim() : '';
    if (!base64) {
      results.push({
        fileName,
        error: 'empty_base64',
        invoices: [],
      });
      continue;
    }
    if (base64.length > 14_000_000) {
      results.push({ fileName, error: 'file_too_large', invoices: [] });
      continue;
    }
    try {
      const parsed = await parseLegacyFileWithGemini({
        apiKey: keyRes.apiKey,
        base64,
        mimeType,
        fileName,
      });
      results.push(parsed);
    } catch (e) {
      console.error('[legacy-import-parse]', fileName, e);
      results.push({
        fileName,
        error: e instanceof Error ? e.message : 'parse_failed',
        invoices: [],
      });
    }
  }

  return NextResponse.json({ ok: true, results });
}
