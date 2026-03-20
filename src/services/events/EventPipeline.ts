import {
  FieldValue,
  type DocumentReference,
  type Firestore,
  type QuerySnapshot,
} from 'firebase-admin/firestore';
import { randomUUID } from 'crypto';
import { getAdminFirestore, isFirebaseAdminConfigured } from '@/lib/firebaseAdmin';
import { PRIMARY_COMPANY_ID } from '@/services/firestore/seedService';

export type MeckanoPipelineResult = {
  ok: boolean;
  skipped?: boolean;
  reason?: string;
  companyId: string;
  rowsProcessed: number;
  financeLinesWritten: number;
  projectUpdates: number;
  errors: string[];
};

export type TeamRecord = {
  docId: string;
  displayName?: string;
  email?: string;
  hourlyRate?: number;
  defaultProjectId?: string;
  externalIds?: { meckanoUserId?: string; idNum?: string; workerTag?: string };
};

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function pickNumber(...vals: unknown[]): number {
  for (const v of vals) {
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string' && v.trim() !== '') {
      const n = Number(v.replace(',', '.'));
      if (Number.isFinite(n)) return n;
    }
  }
  return 0;
}

function pickString(...vals: unknown[]): string | undefined {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim() !== '') return v.trim();
  }
  return undefined;
}

/**
 * Flattens common Meckano / generic attendance JSON into normalised rows.
 */
export function extractAttendanceRows(raw: unknown): Array<Record<string, unknown>> {
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw.filter((x) => asRecord(x)) as Array<Record<string, unknown>>;
  const o = asRecord(raw);
  if (!o) return [];
  const candidates = ['records', 'data', 'attendance', 'items', 'rows', 'employees', 'workers'];
  for (const key of candidates) {
    const v = o[key];
    if (Array.isArray(v)) return v.filter((x) => asRecord(x)) as Array<Record<string, unknown>>;
  }
  return [];
}

export type MeckanoTeamIndex = {
  byMeckanoId: Map<string, TeamRecord>;
  byEmail: Map<string, TeamRecord>;
  byIdNum: Map<string, TeamRecord>;
  byWorkerTag: Map<string, TeamRecord>;
};

export function buildMeckanoTeamIndex(teamSnap: QuerySnapshot): MeckanoTeamIndex {
  const byMeckanoId = new Map<string, TeamRecord>();
  const byEmail = new Map<string, TeamRecord>();
  const byIdNum = new Map<string, TeamRecord>();
  const byWorkerTag = new Map<string, TeamRecord>();
  teamSnap.docs.forEach((doc) => {
    const d = doc.data() as TeamRecord;
    const rec: TeamRecord = {
      docId: doc.id,
      displayName: d.displayName,
      email: d.email,
      hourlyRate: typeof d.hourlyRate === 'number' ? d.hourlyRate : undefined,
      defaultProjectId: d.defaultProjectId,
      externalIds: d.externalIds,
    };
    const mid = rec.externalIds?.meckanoUserId;
    if (typeof mid === 'string' && mid.trim()) {
      byMeckanoId.set(mid.trim(), rec);
    }
    const idn = rec.externalIds?.idNum;
    if (typeof idn === 'string' && idn.trim()) {
      byIdNum.set(idn.trim(), rec);
    }
    const wtag = rec.externalIds?.workerTag;
    if (typeof wtag === 'string' && wtag.trim()) {
      byWorkerTag.set(wtag.trim(), rec);
    }
    const em = typeof rec.email === 'string' ? rec.email.toLowerCase().trim() : '';
    if (em) byEmail.set(em, rec);
  });
  return { byMeckanoId, byEmail, byIdNum, byWorkerTag };
}

export function resolveTeamForRow(
  row: Record<string, unknown>,
  index: MeckanoTeamIndex
): TeamRecord | null {
  const userId = pickString(
    row.user_id,
    row.userId,
    row.worker_id,
    row.workerId,
    row.employee_id,
    row.employeeId,
    row.id
  );
  if (userId && index.byMeckanoId.has(userId)) return index.byMeckanoId.get(userId)!;

  const idNum = pickString(row.idNum, row.id_num, row.teudat_zeut, row.teudatZeut);
  if (idNum && index.byIdNum.has(idNum)) return index.byIdNum.get(idNum)!;

  const workerTag = pickString(row.worker_tag, row.workerTag);
  if (workerTag && index.byWorkerTag.has(workerTag)) return index.byWorkerTag.get(workerTag)!;

  const email = pickString(row.email, row.user_email, row.worker_email)?.toLowerCase().trim();
  if (email && index.byEmail.has(email)) return index.byEmail.get(email)!;

  return null;
}

export function resolveHours(row: Record<string, unknown>): number {
  return pickNumber(
    row.hours,
    row.total_hours,
    row.totalHours,
    row.duration_hours,
    row.durationHours,
    row.net_hours,
    row.work_hours
  );
}

export function resolveProjectId(row: Record<string, unknown>, team: TeamRecord | null): string | undefined {
  const fromRow = pickString(
    row.project_id,
    row.projectId,
    row.site_id,
    row.siteId,
    row.department_id,
    row.departmentId
  );
  if (fromRow) return fromRow;
  return team?.defaultProjectId;
}

/** Prefer team hourlyRate, then Meckano user field_418-style fields, then row. */
export function resolveHourlyRate(
  row: Record<string, unknown>,
  team: TeamRecord | null,
  meckanoUser?: Record<string, unknown> | null
): number {
  const fromTeam = team?.hourlyRate;
  if (typeof fromTeam === 'number' && fromTeam > 0) return fromTeam;
  if (meckanoUser) {
    const u = pickNumber(
      meckanoUser.field_418,
      meckanoUser.Field_418,
      meckanoUser.hourly_rate,
      meckanoUser.hourlyRate,
      meckanoUser.rate
    );
    if (u > 0) return u;
  }
  return pickNumber(row.hourly_rate, row.hourlyRate, row.rate, row.field_418, row.Field_418);
}

/**
 * Meckano sync → labor cost lines + project P&L increments (batch commits).
 */
export async function processMeckanoAttendanceForCompany(
  companyId: string,
  rawAttendance: unknown,
  options?: { filterProjectId?: string }
): Promise<MeckanoPipelineResult> {
  const errors: string[] = [];
  if (!isFirebaseAdminConfigured()) {
    return {
      ok: true,
      skipped: true,
      reason: 'firebase_admin_not_configured',
      companyId,
      rowsProcessed: 0,
      financeLinesWritten: 0,
      projectUpdates: 0,
      errors: [],
    };
  }

  let db: Firestore;
  try {
    db = getAdminFirestore();
  } catch (e) {
    return {
      ok: false,
      skipped: true,
      reason: e instanceof Error ? e.message : 'admin_init_failed',
      companyId,
      rowsProcessed: 0,
      financeLinesWritten: 0,
      projectUpdates: 0,
      errors: [],
    };
  }

  const rows = extractAttendanceRows(rawAttendance);
  if (rows.length === 0) {
    return {
      ok: true,
      companyId,
      rowsProcessed: 0,
      financeLinesWritten: 0,
      projectUpdates: 0,
      errors: [],
    };
  }

  const teamSnap = await db.collection('companies').doc(companyId).collection('team').get();
  const index = buildMeckanoTeamIndex(teamSnap);

  const syncRunId = randomUUID();
  let financeLinesWritten = 0;
  let projectUpdates = 0;

  type Op =
    | { type: 'finance'; ref: DocumentReference; data: Record<string, unknown> }
    | { type: 'project'; ref: DocumentReference; increment: number };

  const ops: Op[] = [];

  for (const row of rows) {
    const team = resolveTeamForRow(row, index);
    const hours = resolveHours(row);
    if (hours <= 0) continue;

    const projectId = resolveProjectId(row, team);
    if (!projectId) {
      errors.push('missing_project_for_row');
      continue;
    }

    if (options?.filterProjectId && projectId !== options.filterProjectId) {
      continue;
    }

    const rate = resolveHourlyRate(row, team, null);
    const laborCost = Math.round(hours * rate * 100) / 100;
    if (laborCost <= 0) continue;

    const financeRef = db
      .collection('companies')
      .doc(companyId)
      .collection('finances')
      .doc(`meckano_${syncRunId}_${randomUUID()}`);

    ops.push({
      type: 'finance',
      ref: financeRef,
      data: {
        type: 'labor',
        category: 'Labor Costs',
        source: 'meckano_sync',
        amount: laborCost,
        currency: 'ILS',
        hours,
        hourlyRate: rate,
        teamMemberId: team?.docId ?? null,
        teamMemberName: team?.displayName ?? null,
        projectId,
        syncRunId,
        createdAt: FieldValue.serverTimestamp(),
      },
    });

    ops.push({
      type: 'project',
      ref: db.collection('companies').doc(companyId).collection('projects').doc(projectId),
      increment: laborCost,
    });

    financeLinesWritten += 1;
    projectUpdates += 1;
  }

  const BATCH_MAX = 400;
  for (let i = 0; i < ops.length; i += BATCH_MAX) {
    const slice = ops.slice(i, i + BATCH_MAX);
    const batch = db.batch();
    for (const op of slice) {
      if (op.type === 'finance') {
        batch.set(op.ref, op.data, { merge: false });
      } else {
        batch.set(
          op.ref,
          {
            'plSummary.laborCosts': FieldValue.increment(op.increment),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }
    }
    try {
      await batch.commit();
    } catch (e) {
      errors.push(e instanceof Error ? e.message : 'batch_commit_failed');
    }
  }

  return {
    ok: errors.length === 0,
    companyId,
    rowsProcessed: rows.length,
    financeLinesWritten,
    projectUpdates,
    errors,
  };
}

export function getDefaultSyncCompanyId(): string {
  return (
    process.env.SYNC_DEFAULT_COMPANY_ID?.trim() ||
    process.env.NEXT_PUBLIC_REGISTRATION_COMPANY_ID?.trim() ||
    PRIMARY_COMPANY_ID
  );
}

export type AiScanEngineId = 'mindstudio' | 'gemini' | 'document_ai' | 'textract';

export type AiScanBatchRecord = {
  companyId: string;
  projectId: string;
  batchId: string;
  /** User-selected scan intent (invoice / legal_contract / technical_drawing). */
  documentCategory?: string;
  fileNames: string[];
  engineResults: Record<
    string,
    {
      ok: boolean;
      error?: string;
      durationMs?: number;
      files?: Array<{ name: string; ok: boolean; error?: string; summary?: unknown }>;
    }
  >;
};

/**
 * Persists AI alloy scan output under companies/{companyId}/scans/{batchId}.
 * Invoked after parallel engine execution (server-side).
 */
export async function recordAiScanBatch(record: AiScanBatchRecord): Promise<{
  ok: boolean;
  error?: string;
}> {
  if (!isFirebaseAdminConfigured()) {
    return { ok: false, error: 'firebase_admin_not_configured' };
  }

  try {
    const db = getAdminFirestore();
    const ref = db.collection('companies').doc(record.companyId).collection('scans').doc(record.batchId);
    await ref.set(
      {
        companyId: record.companyId,
        projectId: record.projectId,
        batchId: record.batchId,
        documentCategory: record.documentCategory ?? 'invoice',
        fileNames: record.fileNames,
        engineResults: record.engineResults,
        status: 'completed',
        createdAt: FieldValue.serverTimestamp(),
        pipelineEvent: 'AiScanBatchCompleted' as const,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'record_failed' };
  }
}

/**
 * Phase 3.2+ — project finance projection from structured scan JSON.
 * Stub: marks batch for downstream workers; extend with invoice → finances writes.
 */
export async function emitAiScanPipelineEvent(companyId: string, batchId: string): Promise<void> {
  if (!isFirebaseAdminConfigured()) return;
  const db = getAdminFirestore();
  await db
    .collection('companies')
    .doc(companyId)
    .collection('scans')
    .doc(batchId)
    .set(
      {
        pipelineEmittedAt: FieldValue.serverTimestamp(),
        pipelineReadyForProjection: true,
      },
      { merge: true }
    );
}

export type ScanInvoiceCommitPayload = {
  companyId: string;
  projectId: string;
  batchId: string;
  supplierName: string;
  invoiceDate: string;
  totalAmount: string;
  vatAmount: string;
  projectLabel: string;
  category: string;
};

/**
 * Writes a finance line + increments project material P&amp;L from an approved AI scan review.
 */
export async function commitScanInvoiceToPl(
  payload: ScanInvoiceCommitPayload
): Promise<{ ok: boolean; error?: string; financeId?: string }> {
  if (!isFirebaseAdminConfigured()) {
    return { ok: false, error: 'firebase_admin_not_configured' };
  }

  const amount =
    Math.round(
      (parseFloat(String(payload.totalAmount).replace(/,/g, '.')) || 0) * 100
    ) / 100;
  const vatParsed =
    Math.round((parseFloat(String(payload.vatAmount).replace(/,/g, '.')) || 0) * 100) / 100;

  const db = getAdminFirestore();
  const financeId = `scan_${payload.batchId}_${randomUUID()}`;

  try {
    const batch = db.batch();
    const finRef = db
      .collection('companies')
      .doc(payload.companyId)
      .collection('finances')
      .doc(financeId);

    batch.set(finRef, {
      type: 'material',
      category: payload.category?.trim() || 'חומרים / חשבונית',
      source: 'ai_scan_alloy',
      amount,
      currency: 'ILS',
      vendor: payload.supplierName?.trim() || null,
      invoiceDate: payload.invoiceDate?.trim() || null,
      vatAmount: Number.isFinite(vatParsed) && vatParsed > 0 ? vatParsed : null,
      projectId: payload.projectId,
      projectLabel: payload.projectLabel?.trim() || null,
      scanBatchId: payload.batchId,
      createdAt: FieldValue.serverTimestamp(),
    });

    if (amount > 0) {
      const projRef = db
        .collection('companies')
        .doc(payload.companyId)
        .collection('projects')
        .doc(payload.projectId);
      batch.set(
        projRef,
        {
          'plSummary.materialCosts': FieldValue.increment(amount),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    const scanRef = db.collection('companies').doc(payload.companyId).collection('scans').doc(payload.batchId);
    batch.set(
      scanRef,
      {
        status: 'committed_to_pl',
        committedAt: FieldValue.serverTimestamp(),
        committedFinanceId: financeId,
        committedFields: {
          supplierName: payload.supplierName,
          invoiceDate: payload.invoiceDate,
          totalAmount: payload.totalAmount,
          vatAmount: payload.vatAmount,
          projectName: payload.projectLabel,
          category: payload.category,
        },
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    await batch.commit();
    return { ok: true, financeId };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'commit_failed' };
  }
}
