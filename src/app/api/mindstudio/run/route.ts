import { NextRequest, NextResponse } from 'next/server';
import { runMindStudioWorkflow } from '@/services/mindStudioService';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');

    const result = await runMindStudioWorkflow({
      documentBase64: base64Data,
      documentMimeType: file.type,
    });

    if (!result) {
      return NextResponse.json(
        { error: 'MindStudio not configured or run failed' },
        { status: 503 }
      );
    }

    return NextResponse.json({ result });
  } catch (err) {
    console.error('MindStudio API error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'MindStudio run failed' },
      { status: 500 }
    );
  }
}
