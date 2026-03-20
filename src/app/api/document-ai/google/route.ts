import { NextRequest, NextResponse } from 'next/server';
import { processWithGoogleDocumentAi } from '@/services/documentAiService';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const result = await processWithGoogleDocumentAi(base64, file.type);
    if (!result) {
      return NextResponse.json(
        { error: 'Google Document AI not configured or failed' },
        { status: 503 }
      );
    }
    return NextResponse.json({ result });
  } catch (err) {
    console.error('Document AI error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Processing failed' },
      { status: 500 }
    );
  }
}
