import { randomUUID } from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore, isFirebaseAdminConfigured } from '@/lib/firebaseAdmin';
import { resolveGeminiApiKeyForCompany, logMasterKeyAiUsage } from '@/lib/server/apiProxy';
import { assertCompanyStaffNotClient } from '@/lib/server/registrationAuthz';
import { analyzeBlueprintWithVision, type BlueprintAnalysisResult } from '@/services/ai/BlueprintAnalyzer';

export const runtime = 'nodejs';

type Body = {
  companyId?: string;
  projectId?: string;
  imageBase64?: string;
  mimeType?: string;
  /** When true, persist analysis under `projects/{projectId}/boqDrafts/{id}` for the budget module. */
  syncToFirestore?: boolean;
};

export async function POST(req: Request) {
  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json({ error: 'server_not_configured' }, { status: 503 });
  }

  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    return NextResponse.json({ error: 'auth_required' }, { status: 401 });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const companyId = (body.companyId ?? '').trim();
  const projectId = (body.projectId ?? '').trim();
  const imageBase64 = typeof body.imageBase64 === 'string' ? body.imageBase64.trim() : '';
  const mimeType = (body.mimeType ?? 'image/png').trim() || 'image/png';
  const syncToFirestore = body.syncToFirestore === true;

  if (!companyId || !projectId) {
    return NextResponse.json({ error: 'missing_company_or_project' }, { status: 400 });
  }
  if (!imageBase64) {
    return NextResponse.json({ error: 'missing_image_base64' }, { status: 400 });
  }

  const adminAuth = getAdminAuth();
  const db = getAdminFirestore();

  let uid: string;
  let requestEmail: string | undefined;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    uid = decoded.uid;
    requestEmail = decoded.email;
  } catch {
    return NextResponse.json({ error: 'invalid_token' }, { status: 401 });
  }

  try {
    await assertCompanyStaffNotClient(db, uid, companyId, requestEmail);
  } catch {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const keyRes = await resolveGeminiApiKeyForCompany(db, companyId);
  if (!keyRes.ok) {
    return NextResponse.json({ error: 'gemini_not_configured' }, { status: 503 });
  }
  if (keyRes.source === 'master') {
    logMasterKeyAiUsage({
      companyId,
      operation: 'blueprint.vision',
      detail: { projectId, model: 'gemini-1.5-pro' },
    });
  }

  let analysis: BlueprintAnalysisResult;
  try {
    analysis = await analyzeBlueprintWithVision({
      apiKey: keyRes.apiKey,
      imageBase64,
      mimeType,
    });
  } catch (e) {
    console.error('[blueprint-analyze]', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'vision_failed' },
      { status: 502 }
    );
  }

  let draftId: string | null = null;
  if (syncToFirestore) {
    draftId = randomUUID();
    const ref = db
      .collection('companies')
      .doc(companyId)
      .collection('projects')
      .doc(projectId)
      .collection('boqDrafts')
      .doc(draftId);

    await ref.set({
      source: 'blueprint_vision',
      analyzer: 'gramoshka',
      createdAt: FieldValue.serverTimestamp(),
      createdByUid: uid,
      companyId,
      projectId,
      scaleDetected: analysis.scaleDetected,
      confidenceNotes: analysis.confidenceNotes,
      walls: analysis.walls,
      rooms: analysis.rooms,
      fixtures: analysis.fixtures,
      draftBoq: analysis.draftBoq,
      /** Denormalized for finance dashboards — sum of draft BOQ lines (estimates). */
      draftBoqLineCount: analysis.draftBoq.length,
    });
  }

  return NextResponse.json({
    ok: true,
    analysis,
    draftId,
    synced: syncToFirestore,
  });
}
