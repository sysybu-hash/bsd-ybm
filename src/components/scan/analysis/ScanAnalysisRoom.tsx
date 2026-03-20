'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc } from 'firebase/firestore';
import { Sparkles, CheckCircle2, PencilLine } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { companyProjectsRef } from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';
import {
  type InvoiceFieldSet,
  INVOICE_FIELD_LABELS,
  EMPTY_INVOICE_FIELDS,
  ENGINE_LABELS_HE,
  decodeEngineSummary,
} from '@/lib/scan/invoiceFields';
import { runAiReferee, type RefereeOutcome } from '@/lib/scan/aiReferee';
import type { AiScanEngineId } from '@/services/events/EventPipeline';
import { useLocale } from '@/context/LocaleContext';
import { SCAN_CATEGORY_LABELS, parseScanDocumentCategory } from '@/lib/scan/documentCategories';

const WHITE = '#FFFFFF';
const ORANGE = '#FF8C00';
const BLUE = '#004694';

const LED_GLOW = `0 0 20px ${ORANGE}, 0 0 40px ${ORANGE}99, 0 0 60px ${ORANGE}44`;
const LED_GLOW_SOFT = `0 0 12px ${ORANGE}cc, 0 0 28px ${ORANGE}55`;

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function cloneFields(f: InvoiceFieldSet): InvoiceFieldSet {
  return { ...f };
}

function AiAlloyBadge({ active }: { active: boolean }) {
  return (
    <motion.div
      className="inline-flex items-center justify-center gap-2 rounded-4xl border-2 border-white px-6 py-3 text-sm font-black text-[#1a1a1a]"
      style={{
        backgroundColor: WHITE,
        boxShadow: active ? LED_GLOW : LED_GLOW_SOFT,
      }}
      animate={
        active
          ? {
              boxShadow: [
                LED_GLOW_SOFT,
                LED_GLOW,
                `0 0 28px ${ORANGE}, 0 0 56px ${ORANGE}aa`,
                LED_GLOW_SOFT,
              ],
            }
          : { boxShadow: LED_GLOW_SOFT }
      }
      transition={{ duration: 2.2, repeat: active ? Infinity : 0, ease: 'easeInOut' }}
    >
      <Sparkles className="h-5 w-5" style={{ color: ORANGE, filter: `drop-shadow(0 0 6px ${ORANGE})` }} />
      AI Alloy — המלצה
    </motion.div>
  );
}

function ProgressOrbGlow({ label, active }: { label: string; active: boolean }) {
  const r = 36;
  const c = 2 * Math.PI * r;
  return (
    <motion.div
      className="flex flex-col items-center justify-center gap-4"
      animate={active ? { y: [0, -4, 0] } : {}}
      transition={{ duration: 2.5, repeat: active ? Infinity : 0, ease: 'easeInOut' }}
    >
      <div
        className="relative flex h-[100px] w-[100px] items-center justify-center rounded-full border-4 border-white"
        style={{
          boxShadow: active ? LED_GLOW : `0 4px 20px rgba(0,70,148,0.12)`,
        }}
      >
        <svg viewBox="0 0 100 100" className="absolute h-full w-full -rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(0,70,148,0.1)" strokeWidth="10" />
          <motion.circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={ORANGE}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c * 0.35 }}
            animate={
              active
                ? { strokeDashoffset: [c * 0.35, 0, c * 0.2] }
                : { strokeDashoffset: c * 0.15 }
            }
            transition={{ duration: 2, repeat: active ? Infinity : 0, ease: 'easeInOut' }}
            style={{ filter: active ? `drop-shadow(0 0 10px ${ORANGE})` : undefined }}
          />
        </svg>
        <span className="relative z-[1] text-[10px] font-bold text-[#004694]">{label}</span>
      </div>
    </motion.div>
  );
}

function FieldGrid({
  fields,
  onChange,
  idPrefix,
}: {
  fields: InvoiceFieldSet;
  onChange: (k: keyof InvoiceFieldSet, v: string) => void;
  idPrefix: string;
}) {
  const keys = Object.keys(INVOICE_FIELD_LABELS) as (keyof InvoiceFieldSet)[];
  return (
    <div className="grid w-full gap-4 sm:grid-cols-2">
      {keys.map((key) => (
        <label key={key} className="flex flex-col items-center justify-center gap-2 text-center">
          <span className="text-xs font-bold text-[#004694]">{INVOICE_FIELD_LABELS[key]}</span>
          <input
            id={`${idPrefix}-${key}`}
            type="text"
            dir="rtl"
            value={fields[key]}
            onChange={(e) => onChange(key, e.target.value)}
            className="min-h-12 w-full rounded-4xl border border-gray-200 bg-white px-4 text-center text-sm text-[#1a1a1a] outline-none focus-visible:ring-2 focus-visible:ring-[#FF8C00]"
            style={{ boxShadow: `0 2px 12px rgba(0,70,148,0.06)` }}
          />
        </label>
      ))}
    </div>
  );
}

type ScanDocShape = {
  projectId?: string;
  documentCategory?: string;
  engineResults?: Record<string, unknown>;
  status?: string;
  fileNames?: string[];
};

export default function ScanAnalysisRoom({
  companyId,
  batchId,
  scanDoc,
}: {
  companyId: string;
  batchId: string;
  scanDoc: ScanDocShape;
}) {
  const { user } = useAuth();
  const { locale } = useLocale();
  const [projectTitle, setProjectTitle] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AiScanEngineId | 'final'>('final');

  const [engineFields, setEngineFields] = useState<Partial<Record<AiScanEngineId, InvoiceFieldSet>>>({});
  const [finalDraft, setFinalDraft] = useState<InvoiceFieldSet>({ ...EMPTY_INVOICE_FIELDS });
  const [referee, setReferee] = useState<RefereeOutcome | null>(null);

  const [committing, setCommitting] = useState(false);
  const [commitMsg, setCommitMsg] = useState<string | null>(null);
  const formRef = React.useRef<HTMLDivElement>(null);

  const tabsEngines = useMemo(
    () => (Object.keys(engineFields) as AiScanEngineId[]).sort(),
    [engineFields]
  );

  useEffect(() => {
    if (!isFirebaseConfigured() || !companyId || !scanDoc.projectId) {
      setProjectTitle(null);
      return;
    }
    const ref = doc(companyProjectsRef(companyId), scanDoc.projectId);
    void getDoc(ref).then((snap) => {
      if (snap.exists()) {
        const n = (snap.data().name as string) || snap.id;
        setProjectTitle(n);
      } else setProjectTitle(scanDoc.projectId ?? null);
    });
  }, [companyId, scanDoc.projectId]);

  useEffect(() => {
    const er = scanDoc.engineResults ?? {};
    const decoded: Partial<Record<AiScanEngineId, InvoiceFieldSet>> = {};

    const keys = (Object.keys(er) as string[]).filter((k) =>
      ['mindstudio', 'gemini', 'document_ai', 'textract'].includes(k)
    ) as AiScanEngineId[];

    for (const eid of keys) {
      const agg = asRecord(er[eid]);
      const files = agg?.files;
      let summary: unknown = null;
      if (Array.isArray(files)) {
        const row = files.find((x) => {
          const r = asRecord(x);
          return r?.ok === true && r?.summary != null;
        });
        summary = row ? asRecord(row)?.summary : null;
      }
      if (summary != null) {
        decoded[eid] = decodeEngineSummary(eid, summary);
      }
    }

    setEngineFields(decoded);
    const outcome = runAiReferee(decoded);
    setReferee(outcome);
    setFinalDraft(cloneFields(outcome.recommendedFields));
  }, [scanDoc.engineResults]);

  useEffect(() => {
    if (activeTab !== 'final' && !tabsEngines.includes(activeTab)) {
      setActiveTab('final');
    }
  }, [tabsEngines, activeTab]);

  const updateEngineField = useCallback((engine: AiScanEngineId, key: keyof InvoiceFieldSet, v: string) => {
    setEngineFields((prev) => ({
      ...prev,
      [engine]: { ...(prev[engine] ?? { ...EMPTY_INVOICE_FIELDS }), [key]: v },
    }));
  }, []);

  const updateFinal = useCallback((key: keyof InvoiceFieldSet, v: string) => {
    setFinalDraft((prev) => ({ ...prev, [key]: v }));
  }, []);

  const applyRefereeToFinal = useCallback(() => {
    if (referee) setFinalDraft(cloneFields(referee.recommendedFields));
  }, [referee]);

  const identifiedProjectLabel =
    finalDraft.projectName.trim() ||
    projectTitle ||
    scanDoc.projectId ||
    '';

  const committed = scanDoc.status === 'committed_to_pl';

  const categoryKey = parseScanDocumentCategory(scanDoc.documentCategory);
  const categoryLabel =
    locale === 'he' ? SCAN_CATEGORY_LABELS[categoryKey].he : SCAN_CATEGORY_LABELS[categoryKey].en;

  const runCommit = async () => {
    if (!user || !scanDoc.projectId) return;
    setCommitting(true);
    setCommitMsg(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/scan/commit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          companyId,
          batchId,
          projectId: scanDoc.projectId,
          fields: finalDraft,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCommitMsg((data as { error?: string }).error || 'שמירה נכשלה');
        return;
      }
      setCommitMsg('נשמר ל־P&L בהצלחה.');
    } finally {
      setCommitting(false);
    }
  };

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="flex flex-col items-center justify-center gap-8" dir="rtl">
      <div className="flex w-full max-w-2xl items-center justify-center">
        <span
          className="inline-flex min-h-12 items-center justify-center rounded-4xl border border-[#004694]/20 bg-white px-6 py-3 text-center text-sm font-black text-[#004694]"
          style={{ boxShadow: `0 4px 20px rgba(0,70,148,0.08)` }}
        >
          {locale === 'he' ? 'סוג מסמך: ' : 'Document type: '}
          {categoryLabel}
        </span>
      </div>
      {referee && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center gap-6"
        >
          {referee.recommendedEngine && <AiAlloyBadge active />}
          <p className="max-w-2xl text-center text-sm leading-relaxed text-gray-600">{referee.reasoningHe}</p>
          {tabsEngines.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-8">
              {tabsEngines.map((eid) => (
                <ProgressOrbGlow
                  key={eid}
                  label={ENGINE_LABELS_HE[eid].split(' ')[0] ?? eid}
                  active={referee.recommendedEngine === eid}
                />
              ))}
            </div>
          )}
        </motion.div>
      )}

      {identifiedProjectLabel && !committed && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex w-full max-w-2xl flex-col items-center justify-center gap-4 rounded-4xl border border-[#FF8C00]/30 bg-white p-6 text-center"
          style={{ boxShadow: `${LED_GLOW_SOFT}` }}
        >
          <p className="text-base font-bold text-[#1a1a1a]">
            מזוהה עבור פרויקט <span style={{ color: BLUE }}>{identifiedProjectLabel}</span>. לשמור לתיק
            הפרויקט?
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <motion.button
              type="button"
              whileHover={{ scale: 1.04, boxShadow: LED_GLOW }}
              whileTap={{ scale: 0.98 }}
              disabled={committing || committed}
              onClick={() => void runCommit()}
              className="flex min-h-12 items-center justify-center gap-2 rounded-4xl px-8 font-black text-white disabled:opacity-50"
              style={{
                backgroundColor: ORANGE,
                boxShadow: `0 0 24px ${ORANGE}88`,
              }}
            >
              <CheckCircle2 className="h-5 w-5" />
              אשר ושמור ל־P&amp;L
            </motion.button>
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={scrollToForm}
              className="flex min-h-12 items-center justify-center gap-2 rounded-4xl border-2 border-gray-200 bg-white px-8 font-bold text-gray-700"
            >
              <PencilLine className="h-5 w-5" />
              ערוך פרטים
            </motion.button>
          </div>
        </motion.div>
      )}

      {commitMsg && (
        <p className="rounded-4xl border border-gray-100 bg-white px-6 py-3 text-center text-sm text-gray-700">
          {commitMsg}
        </p>
      )}

      {committed && (
        <p className="rounded-4xl border border-green-100 bg-green-50 px-6 py-4 text-center font-bold text-green-800">
          אצווה זו כבר נשמרה ל־P&amp;L.
        </p>
      )}

      <div className="flex w-full max-w-5xl flex-wrap items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => setActiveTab('final')}
          className={`min-h-12 rounded-4xl px-6 font-bold transition-all ${
            activeTab === 'final' ? 'text-white' : 'border border-gray-200 bg-white text-gray-600'
          }`}
          style={
            activeTab === 'final'
              ? { backgroundColor: BLUE, boxShadow: `0 0 18px ${BLUE}44` }
              : undefined
          }
        >
          טיוטת שמירה
        </button>
        {tabsEngines.map((eid) => (
          <button
            key={eid}
            type="button"
            onClick={() => setActiveTab(eid)}
            className={`min-h-12 rounded-4xl px-5 text-sm font-bold transition-all ${
              activeTab === eid ? 'text-[#1a1a1a]' : 'border border-gray-200 bg-white text-gray-500'
            }`}
            style={
              activeTab === eid && referee?.recommendedEngine === eid
                ? {
                    border: `2px solid ${ORANGE}`,
                    boxShadow: LED_GLOW,
                  }
                : activeTab === eid
                  ? { border: `2px solid ${BLUE}`, boxShadow: `0 0 12px ${BLUE}33` }
                  : undefined
            }
          >
            {ENGINE_LABELS_HE[eid]}
            {referee?.recommendedEngine === eid && ' ★'}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ type: 'spring', stiffness: 280, damping: 26 }}
          className="w-full max-w-5xl rounded-4xl border border-gray-100 bg-white p-6 sm:p-8"
          style={{
            boxShadow:
              activeTab !== 'final' && referee?.recommendedEngine === activeTab
                ? LED_GLOW_SOFT
                : '0 16px 48px rgba(0,70,148,0.08)',
          }}
        >
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="flex flex-col items-center justify-center"
          >
          {activeTab === 'final' && (
            <div ref={formRef} className="flex w-full flex-col items-center justify-center gap-6">
              <h2 className="text-center text-lg font-black text-[#004694]">עריכה לפני שמירה ל־Event Pipeline</h2>
              <FieldGrid fields={finalDraft} onChange={updateFinal} idPrefix="final" />
              <motion.button
                type="button"
                whileHover={{ scale: 1.03 }}
                onClick={applyRefereeToFinal}
                className="min-h-12 rounded-4xl border-2 px-6 font-bold"
                style={{ borderColor: ORANGE, color: ORANGE, boxShadow: LED_GLOW_SOFT }}
              >
                העתק מהמלצת AI Alloy
              </motion.button>
              <motion.button
                type="button"
                whileHover={{ scale: 1.04, boxShadow: LED_GLOW }}
                whileTap={{ scale: 0.98 }}
                disabled={committing || committed || !scanDoc.projectId}
                onClick={() => void runCommit()}
                className="min-h-12 w-full max-w-md rounded-4xl font-black text-white disabled:opacity-50"
                style={{ backgroundColor: ORANGE, boxShadow: `0 0 28px ${ORANGE}99` }}
              >
                {committing ? 'שומר…' : 'אשר ושמור ל־P&L'}
              </motion.button>
            </div>
          )}

          {activeTab !== 'final' && engineFields[activeTab] && (
            <div className="flex w-full flex-col items-center justify-center gap-6">
              <div className="flex flex-col items-center gap-2 text-center">
                <h2 className="text-lg font-black text-[#004694]">{ENGINE_LABELS_HE[activeTab]}</h2>
                {referee?.recommendedEngine === activeTab && (
                  <motion.span
                    className="rounded-4xl px-4 py-1 text-xs font-black text-[#1a1a1a]"
                    style={{
                      backgroundColor: WHITE,
                      boxShadow: LED_GLOW,
                    }}
                    animate={{
                      boxShadow: [LED_GLOW_SOFT, LED_GLOW, LED_GLOW_SOFT],
                    }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    תוצאה מומלצת — AI Referee
                  </motion.span>
                )}
                {referee && (
                  <p className="text-xs text-gray-400">ציון: {referee.scores[activeTab] ?? '—'}</p>
                )}
              </div>
              <FieldGrid
                fields={engineFields[activeTab]!}
                onChange={(k, v) => updateEngineField(activeTab, k, v)}
                idPrefix={activeTab}
              />
            </div>
          )}
          </motion.div>
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-center gap-4">
        <Link
          href="/scan"
          className="inline-flex min-h-12 items-center justify-center rounded-4xl border border-gray-200 px-6 font-bold text-[#004694]"
        >
          חזרה לסריקה
        </Link>
      </div>
    </div>
  );
}
