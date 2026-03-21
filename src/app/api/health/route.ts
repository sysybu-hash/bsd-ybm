import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isDatabaseConfigured } from '@/lib/databaseConfig';
import { PUBLIC_API_URL, PUBLIC_SITE_URL } from '@/lib/site';

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({
      ok: true,
      db: 'not_configured',
      siteUrl: PUBLIC_SITE_URL,
      apiUrl: PUBLIC_API_URL,
      brand: 'BSD-YBM',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      ok: true,
      db: 'connected',
      siteUrl: PUBLIC_SITE_URL,
      apiUrl: PUBLIC_API_URL,
      brand: 'BSD-YBM',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Health check error:', err);
    return NextResponse.json(
      { ok: false, db: 'error', error: err instanceof Error ? err.message : 'Unknown' },
      { status: 503 }
    );
  }
}
