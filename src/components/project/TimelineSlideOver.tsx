'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Reply, ExternalLink, CheckCircle2 } from 'lucide-react';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import type { ProjectTimelineEvent } from '@/types/projectTimeline';
import { useCompany } from '@/context/CompanyContext';
import { getDb } from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';
import { useSubscription } from '@/hooks/useSubscription';
import { runAiReferee } from '@/lib/scan/aiReferee';
import { decodeEngineSummary, INVOICE_FIELD_LABELS, type InvoiceFieldSet } from '@/lib/scan/invoiceFields';
import type { AiScanEngineId } from '@/services/events/EventPipeline';

const ORANGE = '#FF8C00';
const BLUE = '#004694';
const GREEN = '#22c55e';
function formatWhen(v: unknown): string {
  if (v && typeof v === 'object' && 'toDate' in v && typeof (v as { toDate: () => Date }).toDate === 'function') {
    try {
      return (v as { toDate: () => Date }).toDate().toLocaleString('he-IL');
    } catch {
      return '';
    }
  }
  return '';
}

const ENGINES: AiScanEngineId[] = ['mindstudio', 'gemini', 'document_ai', 'textract'];

function ScanRefereeBlock({ payload }: { payload: Record<string, unknown> }) {
  const referee = useMemo(() => {
    const er = payload.engineResults as Record<string, unknown> | undefined;
    if (!er) return null;
    const decoded: Partial<Record<AiScanEngineId, InvoiceFieldSet>> = {};
    for (const key of ENGINES) {
      const agg = er[key] as { files?: Array<{ ok?: boolean; summary?: unknown }> } | undefined;
      const row = agg?.files?.find((f) => f.ok && f.summary != null);
      if (row?.summary) decoded[key] = decodeEngineSummary(key, row.summary);
    }
    return runAiReferee(decoded);
  }, [payload]);

  if (!referee) {
    return <p className="text-center text-sm text-gray-500">אין נתוני מנועים מפורטים לאירוע זה.</p>;
  }

  return (
    <div className="flex flex-col gap-4 rounded-4xl border border-gray-100 bg-white p-4">
      <p className="text-center text-xs font-bold text-[#004694]">פירוט AI Referee</p>
      <p className="text-sm leading-relaxed text-gray-700">{referee.reasoningHe}</p>
      <ul className="flex flex-col gap-2 text-sm">
        {(Object.keys(INVOICE_FIELD_LABELS) as (keyof InvoiceFieldSet)[]).map((k) => (
          <li key={k} className="flex flex-col items-center justify-center gap-1 border-b border-gray-50 py-2 text-center last:border-0">
            <span className="text-xs font-bold text-gray-500">{INVOICE_FIELD_LABELS[k]}</span>
            <span className="text-[#1a1a1a]">{referee.recommendedFields[k] || '—'}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function TimelineSlideOver({
  open,
  onClose,
  event,
  projectId,
  allowStaffActions = false,
}: {
  open: boolean;
  onClose: () => void;
  event: ProjectTimelineEvent | null;
  projectId?: string;
  allowStaffActions?: boolean;
}) {
  const { companyId } = useCompany();
  const { hasFeature } = useSubscription();
  const [ackBusy, setAckBusy] = useState(false);
  const [ackMsg, setAckMsg] = useState<string | null>(null);
  const p = event?.payload ?? {};

  useEffect(() => {
    setAckMsg(null);
  }, [event?.id]);
  const pid =
    typeof p.projectId === 'string' && p.projectId
      ? p.projectId
      : projectId ?? '';
  const cid = typeof p.companyId === 'string' && p.companyId ? p.companyId : companyId ?? '';

  const acknowledgeTask = async () => {
    const docId = typeof p._docId === 'string' ? p._docId : '';
    if (!cid || !pid || !docId || !isFirebaseConfigured()) {
      setAckMsg('חסר מזהה פרויקט או Firebase');
      return;
    }
    setAckBusy(true);
    setAckMsg(null);
    try {
      const ref = doc(getDb(), 'companies', cid, 'projects', pid, 'communications', docId);
      await updateDoc(ref, { acknowledgedAt: serverTimestamp() });
      setAckMsg('סומן כטופל');
    } catch (e) {
      setAckMsg(e instanceof Error ? e.message : 'עדכון נכשל');
    } finally {
      setAckBusy(false);
    }
  };

  const imageUrl =
    typeof p.imageUrl === 'string'
      ? p.imageUrl
      : typeof p.previewUrl === 'string'
        ? p.previewUrl
        : typeof p.thumbUrl === 'string'
          ? p.thumbUrl
          : null;

  return (
    <AnimatePresence>
      {open && event && (
        <>
          <motion.button
            type="button"
            aria-label="סגור"
            className="fixed inset-0 z-[240] bg-black/35 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed top-0 bottom-0 left-0 z-[250] flex w-full max-w-md flex-col border-r border-gray-100 bg-[#FDFDFD] shadow-2xl"
            dir="rtl"
            initial={{ x: '-104%' }}
            animate={{ x: 0 }}
            exit={{ x: '-104%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            style={{ boxShadow: `0 0 40px ${ORANGE}22` }}
          >
            <div className="flex items-center justify-between gap-4 border-b border-gray-100 p-6">
              <h2 className="flex-1 text-center text-lg font-black text-[#004694]">פירוט אירוע</h2>
              <button
                type="button"
                onClick={onClose}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-4xl border border-gray-200 bg-white text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
              <div className="rounded-4xl border border-gray-100 bg-white p-4 text-center">
                <p className="text-sm font-bold text-[#1a1a1a]">{event.title}</p>
                <p className="mt-2 text-xs text-gray-500">{event.subtitle}</p>
                {formatWhen(event.createdAt) && (
                  <p className="mt-2 text-xs text-gray-400">{formatWhen(event.createdAt)}</p>
                )}
              </div>

              {event.kind === 'scan' && (
                <>
                  {imageUrl && (
                    <div className="overflow-hidden rounded-4xl border border-gray-100 bg-white">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imageUrl} alt="" className="max-h-56 w-full object-contain" />
                    </div>
                  )}
                  {!imageUrl && (
                    <p className="rounded-4xl border border-dashed border-gray-200 bg-white py-6 text-center text-sm text-gray-500">
                      אין תמונה מקוונת — הקבצים נשמרו בסריקה בלבד.
                    </p>
                  )}
                  {Array.isArray(p.fileNames) && (
                    <ul className="flex flex-col gap-2 text-sm text-gray-600">
                      {(p.fileNames as string[]).map((n) => (
                        <li key={n} className="rounded-4xl bg-gray-50 px-4 py-2 text-center">
                          {n}
                        </li>
                      ))}
                    </ul>
                  )}
                  {hasFeature('ai_referee') && <ScanRefereeBlock payload={p} />}
                </>
              )}

              {event.kind === 'finance_labor' && (
                <div className="flex flex-col gap-4 rounded-4xl border border-gray-100 bg-white p-4">
                  <dl className="flex flex-col gap-4 text-center text-sm">
                    <div>
                      <dt className="text-xs font-bold text-gray-500">שעות</dt>
                      <dd className="font-mono text-lg font-black text-[#FF8C00]">{String(p.hours ?? '—')}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-bold text-gray-500">תעריף שעתי</dt>
                      <dd className="font-mono">{String(p.hourlyRate ?? '—')} ₪</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-bold text-gray-500">עלות מחושבת</dt>
                      <dd className="font-mono text-xl font-black" style={{ color: ORANGE }}>
                        {Math.round(Number(p.amount) || 0)} ₪
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-bold text-gray-500">עובד</dt>
                      <dd>{String(p.teamMemberName ?? p.teamMemberId ?? '—')}</dd>
                    </div>
                  </dl>
                </div>
              )}

              {(event.kind === 'finance_expense' || event.kind === 'finance_revenue') && (
                <div className="rounded-4xl border border-gray-100 bg-white p-4 text-center text-sm">
                  <p className="font-bold" style={{ color: event.kind === 'finance_revenue' ? GREEN : ORANGE }}>
                    {Math.round(Number(p.amount) || 0)} ₪
                  </p>
                  <p className="mt-2 text-gray-600">{String(p.category ?? p.vendor ?? '—')}</p>
                  <p className="mt-1 text-xs text-gray-400">{String(p.type ?? '')}</p>
                </div>
              )}

              {event.kind === 'milestone' && (
                <div className="flex flex-col items-center justify-center gap-4 rounded-4xl border border-green-100 bg-white p-6">
                  <span className="text-4xl" aria-hidden>
                    ⭐
                  </span>
                  <p className="text-center text-sm font-bold text-[#1a1a1a]">{String(p.title ?? '')}</p>
                  <p className="text-center text-xs text-gray-500">
                    יעד: {(String(p.targetDate ?? '') || '—').slice(0, 10)}
                  </p>
                  <p className="text-center text-xs font-bold text-green-700">אבן דרך הושלמה</p>
                </div>
              )}

              {event.kind === 'communication' && (
                <div className="flex flex-col gap-4">
                  <div className="rounded-4xl border border-gray-100 bg-white p-4">
                    <p className="whitespace-pre-wrap text-center text-sm leading-relaxed text-[#1a1a1a]">
                      {String(p.body ?? '')}
                    </p>
                  </div>
                  {allowStaffActions &&
                    p.kind === 'task' &&
                    p.internal !== true &&
                    p.visibility !== 'internal' &&
                    !p.acknowledgedAt && (
                      <button
                        type="button"
                        disabled={ackBusy}
                        onClick={() => void acknowledgeTask()}
                        className="flex min-h-12 items-center justify-center gap-2 rounded-4xl font-bold text-white disabled:opacity-50"
                        style={{ backgroundColor: GREEN, boxShadow: `0 0 20px ${GREEN}55` }}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {ackBusy ? 'מעדכן…' : 'סמן משימת לקוח כטופל'}
                      </button>
                    )}
                  {ackMsg && <p className="text-center text-xs text-gray-600">{ackMsg}</p>}
                  <Link
                    href="/customer-portal"
                    className="flex min-h-12 items-center justify-center gap-2 rounded-4xl font-bold text-white"
                    style={{ backgroundColor: BLUE, boxShadow: `0 0 20px ${BLUE}55` }}
                  >
                    <Reply className="h-4 w-4" />
                    מענה מהפורטל
                  </Link>
                </div>
              )}

              {event.sourceCollection === 'scans' && typeof p._docId === 'string' && (
                <a
                  href={`/dashboard/scan/results/${encodeURIComponent(p._docId)}?companyId=${encodeURIComponent(String(p.companyId ?? ''))}`}
                  className="flex min-h-11 items-center justify-center gap-2 rounded-4xl border border-gray-200 text-sm font-bold text-[#004694]"
                >
                  <ExternalLink className="h-4 w-4" />
                  פתיחת חדר ניתוח
                </a>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
