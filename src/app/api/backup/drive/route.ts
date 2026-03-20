import { NextResponse } from 'next/server';

const DRIVE_ROOT_FOLDER = process.env.GOOGLE_DRIVE_ROOT_FOLDER ?? 'גרוזלם בילדרס - אתר';

/**
 * POST /api/backup/drive
 * Triggers backup: generates xlsx + JSON and uploads to Drive under {root}/Backups/YYYY-MM/.
 * Requires Google OAuth (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET) and Drive API.
 * Full implementation: use googleapis to create files and upload to Drive.
 */
export async function POST() {
  const hasGoogleCreds = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;
  if (!hasGoogleCreds) {
    return NextResponse.json(
      { error: 'Google Drive not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.' },
      { status: 503 }
    );
  }

  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const backupPath = `${DRIVE_ROOT_FOLDER}/Backups/${yyyy}-${mm}/`;

  // Placeholder: full implementation would use googleapis to:
  // 1. Create backup_YYYY-MM-DD.xlsx (e.g. with xlsx or exceljs)
  // 2. Create backup_YYYY-MM-DD.json
  // 3. Upload both to backupPath
  return NextResponse.json({
    message: 'Backup endpoint ready',
    expectedPath: backupPath,
    date: `${yyyy}-${mm}-${dd}`,
    note: 'Implement with googleapis + xlsx library for full Drive upload.',
  });
}
