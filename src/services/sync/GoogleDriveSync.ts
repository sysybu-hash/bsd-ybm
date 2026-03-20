/**
 * Phase 15.6 — Bridge from Google Drive “Synced” folder → Firestore OCR archive index.
 * Call `indexDriveSyncedDocument` from a secured API route, Cloud Function, or Apps Script
 * after OCR text is available. Archive search merges `archiveIndex` with `scans`.
 */

import type { Firestore } from 'firebase-admin/firestore';

export type DriveSyncedArchivePayload = {
  companyId: string;
  /** Google Drive file id (stable key) */
  driveFileId: string;
  fileName: string;
  /** Full OCR / extracted text */
  ocrText: string;
  mimeType?: string;
  projectId?: string;
  syncedAtIso?: string;
};

function safeDocId(fileId: string): string {
  const s = fileId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120);
  return `drive_${s || 'file'}`;
}

/**
 * Upserts a searchable row under `companies/{companyId}/archiveIndex/{docId}`.
 */
export async function indexDriveSyncedDocument(db: Firestore, payload: DriveSyncedArchivePayload): Promise<string> {
  const docId = safeDocId(payload.driveFileId);
  const text = (payload.ocrText ?? '').trim();
  const preview = text.slice(0, 280) || payload.fileName || docId;

  const ref = db.collection('companies').doc(payload.companyId).collection('archiveIndex').doc(docId);

  await ref.set(
    {
      source: 'google_drive',
      driveFileId: payload.driveFileId,
      fileName: payload.fileName,
      ocrText: text,
      preview,
      mimeType: payload.mimeType ?? null,
      projectId: payload.projectId ?? null,
      syncedAtIso: payload.syncedAtIso ?? new Date().toISOString(),
      indexedAt: new Date().toISOString(),
    },
    { merge: true }
  );

  return docId;
}
