import { NextRequest, NextResponse } from 'next/server';
import { getAiMetadataForDrive } from '@/services/multiAIScanService';

const DRIVE_ROOT_FOLDER = process.env.GOOGLE_DRIVE_ROOT_FOLDER ?? 'גרוזלם בילדרס - אתר';

/**
 * POST /api/documents/upload
 * Accepts: multipart file + optional project, type, aiVendor, aiDate (or pass merged AI result for getAiMetadataForDrive).
 * Saves to Drive: {root}/Documents/[project]/[type]/[aiVendor]/[aiDate]/ with original mimeType.
 * Full implementation: use googleapis to upload file to Drive.
 */
export async function POST(request: NextRequest) {
  const hasGoogleCreds = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;
  if (!hasGoogleCreds) {
    return NextResponse.json(
      { error: 'Google Drive not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.' },
      { status: 503 }
    );
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const project = (formData.get('project') as string) || 'default';
  const type = (formData.get('type') as string) || 'documents';
  let aiVendor = formData.get('aiVendor') as string | null;
  let aiDate = formData.get('aiDate') as string | null;
  const mergedJson = formData.get('mergedResult') as string | null;

  if (mergedJson) {
    try {
      const merged = JSON.parse(mergedJson) as Record<string, unknown>;
      const meta = getAiMetadataForDrive(merged);
      if (meta.aiVendor) aiVendor = meta.aiVendor;
      if (meta.aiDate) aiDate = meta.aiDate;
    } catch {
      // ignore
    }
  }

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const pathParts = [DRIVE_ROOT_FOLDER, 'Documents', project, type];
  if (aiVendor) pathParts.push(aiVendor);
  if (aiDate) pathParts.push(aiDate);
  const expectedPath = pathParts.join('/');

  // Placeholder: full implementation would use googleapis to upload file with file.name and file.type (mimeType)
  return NextResponse.json({
    message: 'Upload endpoint ready',
    expectedPath,
    fileName: file.name,
    mimeType: file.type,
    note: 'Implement with googleapis for full Drive upload.',
  });
}
