import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { isDatabaseConfigured } from '@/lib/databaseConfig';
import { getDailyAttendance } from '@/services/meckanoService';
import {
  getDefaultSyncCompanyId,
  processMeckanoAttendanceForCompany,
} from '@/services/events/EventPipeline';

/**
 * POST /api/sync — סנכרון מערכות מלא (BSD-YBM orchestrator style).
 * בודק חיבור DB, מושך נוכחות ממקאנו, מריץ Event Pipeline (עלויות עבודה → finances + P&L).
 */
export async function POST() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        message: 'DATABASE_URL לא מוגדר — הוסיפו משתנה סביבה ב-Vercel או ב-.env.local',
        results: { db: 'לא מוגדר', meckano: 'לא נבדק' },
        pipeline: null,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }

  const results: { db: string; meckano: string } = { db: 'לא נבדק', meckano: 'לא נבדק' };
  let attendancePayload: unknown = null;

  try {
    await prisma.$queryRaw`SELECT 1`;
    results.db = 'מחובר';
  } catch (err) {
    results.db = 'שגיאה: ' + (err instanceof Error ? err.message : 'חיבור נכשל');
  }

  try {
    const attendance = await getDailyAttendance();
    attendancePayload = attendance;
    results.meckano = attendance != null ? 'עודכן' : 'לא מוגדר או שגיאה';
  } catch (err) {
    results.meckano = 'שגיאה: ' + (err instanceof Error ? err.message : 'קריאה נכשלה');
  }

  let pipeline: Awaited<ReturnType<typeof processMeckanoAttendanceForCompany>> | null = null;
  if (attendancePayload != null && results.meckano.startsWith('עודכן')) {
    try {
      const companyId = getDefaultSyncCompanyId();
      pipeline = await processMeckanoAttendanceForCompany(companyId, attendancePayload);
    } catch (e) {
      pipeline = {
        ok: false,
        companyId: getDefaultSyncCompanyId(),
        rowsProcessed: 0,
        financeLinesWritten: 0,
        projectUpdates: 0,
        errors: [e instanceof Error ? e.message : 'pipeline_failed'],
      };
    }
  }

  const allOk = results.db === 'מחובר' && results.meckano === 'עודכן';
  const message = allOk ? 'סינכרון הושלם' : 'סינכרון הושלם עם הערות';

  try {
    await prisma.syncRun.create({
      data: {
        ok: allOk,
        message,
        dbStatus: results.db,
        meckanoStatus: results.meckano,
        ...(pipeline != null ? { pipelineJson: pipeline as Prisma.InputJsonValue } : {}),
      },
    });
  } catch {
    // טבלת SyncRun עדיין לא נפרסה — לא לשבור את תגובת ה-API
  }

  return NextResponse.json({
    ok: allOk,
    message,
    results,
    pipeline,
    timestamp: new Date().toISOString(),
  });
}
