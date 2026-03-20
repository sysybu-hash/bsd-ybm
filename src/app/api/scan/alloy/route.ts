import { randomUUID } from 'crypto';
import { NextResponse, type NextRequest } from 'next/server';
import {
  recordAiScanBatch,
  emitAiScanPipelineEvent,
  type AiScanEngineId,
} from '@/services/events/EventPipeline';
import { getAdminFirestore, isFirebaseAdminConfigured } from '@/lib/firebaseAdmin';
import { logMasterKeyAiUsage, resolveGeminiApiKeyForCompany } from '@/lib/server/apiProxy';
import {
  parseEngineList,
  runAlloyEngineOnFile,
  type AlloyEngineRunOptions,
  type FilePayload,
} from '@/services/scan/alloyEngines';
import { parseScanDocumentCategory } from '@/lib/scan/documentCategories';

export const runtime = 'nodejs';

function ndjsonLine(obj: Record<string, unknown>): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(obj)}\n`);
}

export async function POST(request: NextRequest) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const companyId = String(formData.get('companyId') ?? '').trim();
  const projectId = String(formData.get('projectId') ?? '').trim();
  let enginesParsed: unknown;
  try {
    enginesParsed = JSON.parse(String(formData.get('engines') ?? '[]'));
  } catch {
    return NextResponse.json({ error: 'Invalid engines JSON' }, { status: 400 });
  }

  const engines = parseEngineList(enginesParsed);
  const documentCategory = parseScanDocumentCategory(formData.get('documentCategory'));
  const files = formData.getAll('files').filter((x): x is File => x instanceof File && x.size > 0);

  if (!companyId || !projectId) {
    return NextResponse.json({ error: 'companyId and projectId are required' }, { status: 400 });
  }
  if (files.length === 0) {
    return NextResponse.json({ error: 'At least one file is required' }, { status: 400 });
  }
  if (engines.length === 0) {
    return NextResponse.json({ error: 'Select at least one AI engine' }, { status: 400 });
  }

  const batchId = randomUUID();
  const fileNames = files.map((f) => f.name);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const push = (obj: Record<string, unknown>) => controller.enqueue(ndjsonLine(obj));

      try {
        push({
          type: 'batch_started',
          batchId,
          fileNames,
          engines,
          companyId,
          projectId,
          documentCategory,
        });

        let geminiApiKey: string | undefined;
        if (isFirebaseAdminConfigured()) {
          try {
            const db = getAdminFirestore();
            const resolved = await resolveGeminiApiKeyForCompany(db, companyId);
            if (resolved.ok) {
              geminiApiKey = resolved.apiKey;
              if (resolved.source === 'master') {
                logMasterKeyAiUsage({
                  companyId,
                  operation: 'scan.alloy',
                  detail: { engines, fileCount: files.length },
                });
              }
            }
          } catch (e) {
            console.error('[scan/alloy] resolveGeminiApiKeyForCompany', e);
          }
        }
        if (!geminiApiKey) {
          const envKey = (process.env.GEMINI_API_KEY || '').trim();
          geminiApiKey = envKey || undefined;
        }

        const engineOpts: AlloyEngineRunOptions = { geminiApiKey, documentCategory };

        const fileBuffers: FilePayload[] = [];
        for (const f of files) {
          const ab = await f.arrayBuffer();
          fileBuffers.push({
            name: f.name,
            type: f.type || 'application/octet-stream',
            base64: Buffer.from(ab).toString('base64'),
          });
        }

        type EngineAgg = {
          ok: boolean;
          error?: string;
          durationMs: number;
          files: Array<{ name: string; ok: boolean; error?: string; summary?: unknown }>;
        };

        const engineResults: Record<string, EngineAgg> = {};

        await Promise.all(
          engines.map(async (engine) => {
            const eid = engine as string;
            push({ type: 'engine_progress', engine: eid, state: 'running', progress: 0 });
            const started = Date.now();
            const outFiles: EngineAgg['files'] = [];

            for (let i = 0; i < fileBuffers.length; i++) {
              const fb = fileBuffers[i];
              const pct = fileBuffers.length <= 1 ? 45 : Math.round((i / fileBuffers.length) * 90);
              push({ type: 'engine_progress', engine: eid, state: 'running', progress: pct });
              const one = await runAlloyEngineOnFile(engine as AiScanEngineId, fb, engineOpts);
              outFiles.push({
                name: fb.name,
                ok: one.ok,
                error: one.error,
                summary: one.summary,
              });
            }

            const agg: EngineAgg = {
              ok: outFiles.every((x) => x.ok),
              durationMs: Date.now() - started,
              files: outFiles,
            };
            if (!agg.ok && outFiles.some((x) => x.error)) {
              agg.error = outFiles.find((x) => !x.ok)?.error;
            }
            engineResults[eid] = agg;

            push({ type: 'engine_progress', engine: eid, state: 'done', progress: 100 });
            push({ type: 'engine_completed', engine: eid, result: agg });
          })
        );

        const rec = await recordAiScanBatch({
          companyId,
          projectId,
          batchId,
          fileNames,
          documentCategory,
          engineResults,
        });
        await emitAiScanPipelineEvent(companyId, batchId);

        push({ type: 'pipeline_recorded', ok: rec.ok, recordError: rec.error });
        push({
          type: 'done',
          batchId,
          companyId,
          projectId,
          engineResults,
        });
      } catch (err) {
        push({
          type: 'error',
          message: err instanceof Error ? err.message : 'alloy_scan_failed',
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
