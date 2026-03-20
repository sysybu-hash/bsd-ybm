import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAdminFirestore, isFirebaseAdminConfigured } from '@/lib/firebaseAdmin';
import { logMasterKeyAiUsage, resolveGeminiApiKeyForCompany } from '@/lib/server/apiProxy';
import { buildGeminiScanPrompt, parseScanDocumentCategory } from '@/lib/scan/documentCategories';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const companyId = String(formData.get('companyId') ?? '').trim();
  const documentCategory = parseScanDocumentCategory(formData.get('documentCategory'));

  let apiKey: string | undefined;
  if (companyId && isFirebaseAdminConfigured()) {
    try {
      const db = getAdminFirestore();
      const resolved = await resolveGeminiApiKeyForCompany(db, companyId);
      if (resolved.ok) {
        apiKey = resolved.apiKey;
        if (resolved.source === 'master') {
          logMasterKeyAiUsage({
            companyId,
            operation: 'scan.legacy_upload',
            detail: { route: '/api/scan' },
          });
        }
      }
    } catch (e) {
      console.error('[api/scan] resolveGeminiApiKeyForCompany', e);
    }
  }
  if (!apiKey) {
    apiKey = (process.env.GEMINI_API_KEY || '').trim() || undefined;
  }
  if (!apiKey) {
    return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
  }

  const file = formData.get('file') as File | null;
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');

    const part = {
      inlineData: {
        data: base64Data,
        mimeType: file.type,
      },
    };

    const prompt = buildGeminiScanPrompt(documentCategory);
    const result = await model.generateContent([prompt, part]);
    const text = result.response.text();

    return NextResponse.json({ result: text });
  } catch (err) {
    console.error('Scan API error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Analysis failed' },
      { status: 500 }
    );
  }
}
