import { NextResponse } from 'next/server';
import { getDailyAttendance } from '@/services/meckanoService';

export async function GET() {
  try {
    const data = await getDailyAttendance();
    return NextResponse.json(data ?? {});
  } catch (err) {
    console.error('Meckano attendance API error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch attendance' },
      { status: 500 }
    );
  }
}
