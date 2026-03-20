import { FieldValue, type Firestore } from 'firebase-admin/firestore';

export type SentinelTimelineKind =
  | 'scan_completed'
  | 'error_fixed'
  | 'system_optimized'
  | 'sentinel_run'
  | 'error_analysis'
  | 'hotfix_proposed'
  | 'hotfix_pushed'
  | 'ai_coder'
  | 'sentinel_idle';

export async function appendSentinelEvent(
  db: Firestore,
  payload: {
    kind: SentinelTimelineKind;
    title: string;
    detail?: string;
    meta?: Record<string, unknown>;
  }
): Promise<void> {
  await db.collection('sentinelTimeline').add({
    kind: payload.kind,
    title: payload.title,
    detail: payload.detail ?? '',
    meta: payload.meta ?? {},
    createdAt: FieldValue.serverTimestamp(),
  });
}
