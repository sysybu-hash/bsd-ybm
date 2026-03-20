import { NextResponse } from 'next/server';
import { getAdminFirestore, isFirebaseAdminConfigured } from '@/lib/firebaseAdmin';
import { indexDriveSyncedDocument } from '@/services/sync/GoogleDriveSync';

export const runtime = 'nodejs';

type Body = {
  secret?: string;
  companyId?: string;
  driveFileId?: string;
  fileName?: string;
  ocrText?: string;
  mimeType?: string;
  projectId?: string;
};

/**
 * Secured webhook: drop OCR text from Drive sync workers into archive-search index.
 * Header or body: `x-drive-sync-secret` / `secret` must match DRIVE_SYNC_WEBHOOK_SECRET.
 */
export async function POST(req: Request) {
  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json({ error: 'server_not_configured' }, { status: 503 });
  }

  const expected = process.env.DRIVE_SYNC_WEBHOOK_SECRET?.trim();
  if (!expected) {
    return NextResponse.json({ error: 'drive_sync_not_configured' }, { status: 503 });
  }

  const headerSecret = req.headers.get('x-drive-sync-secret')?.trim();
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const secret = (headerSecret || body.secret || '').trim();
  if (secret !== expected) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const companyId = (body.companyId ?? '').trim();
  const driveFileId = (body.driveFileId ?? '').trim();
  const fileName = (body.fileName ?? '').trim() || 'drive-file';
  const ocrText = typeof body.ocrText === 'string' ? body.ocrText : '';

  if (!companyId || !driveFileId) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }

  const db = getAdminFirestore();
  const docId = await indexDriveSyncedDocument(db, {
    companyId,
    driveFileId,
    fileName,
    ocrText,
    mimeType: typeof body.mimeType === 'string' ? body.mimeType : undefined,
    projectId: typeof body.projectId === 'string' ? body.projectId.trim() : undefined,
  });

  return NextResponse.json({ ok: true, docId });
}
