'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { X, FolderOpen, FileStack, Sparkles, Trash2, ScanLine } from 'lucide-react';
import { onSnapshot } from 'firebase/firestore';
import { useCompany } from '@/context/CompanyContext';
import { companyProjectsRef } from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';
import { ALLOY_ENGINE_META, type AiScanEngineId } from '@/services/scan/alloyEngines';
import { useLocale } from '@/context/LocaleContext';
import {
  SCAN_CATEGORY_LABELS,
  SCAN_DOCUMENT_CATEGORIES,
  type ScanDocumentCategory,
} from '@/lib/scan/documentCategories';

const WHITE = '#FFFFFF';
const ORANGE = '#FF8C00';
const BLUE = '#004694';

const ENGINE_IDS: AiScanEngineId[] = ['mindstudio', 'gemini', 'document_ai', 'textract'];

export type UnifiedScanModalProps = {
  open: boolean;
  onClose?: () => void;
  /** Full-page cockpit (e.g. /scan) — no dimmed backdrop dismiss */
  embedded?: boolean;
};

type BatchItem = {
  id: string;
  file: File;
  previewUrl: string | null;
  isPortrait?: boolean;
};

type EngineRunState = 'idle' | 'running' | 'done' | 'error';

function EngineOrb({
  engineId,
  label,
  state,
  progress,
}: {
  engineId: string;
  label: string;
  state: EngineRunState;
  progress: number;
}) {
  const r = 40;
  const c = 2 * Math.PI * r;
  const dash = c * (1 - Math.min(100, Math.max(0, progress)) / 100);

  const glow =
    state === 'running'
      ? `0 0 24px ${ORANGE}, 0 0 48px ${ORANGE}66`
      : state === 'done'
        ? `0 0 16px #22c55e88`
        : state === 'error'
          ? `0 0 16px #ef444488`
          : 'none';

  return (
    <motion.div
      className="flex flex-col items-center justify-center gap-4 rounded-4xl border border-white/50 bg-white/40 p-6 shadow-lg backdrop-blur-md"
      style={{ boxShadow: `${glow}, 0 12px 40px rgba(0,70,148,0.08)` }}
      whileHover={{ scale: 1.03, y: -2 }}
      transition={{ type: 'spring', stiffness: 320, damping: 22 }}
    >
      <div className="relative flex h-[112px] w-[112px] items-center justify-center">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(0,70,148,0.12)" strokeWidth="8" />
          <motion.circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={state === 'error' ? '#ef4444' : ORANGE}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={c}
            initial={false}
            animate={{ strokeDashoffset: dash }}
            transition={{ type: 'spring', stiffness: 120, damping: 18 }}
            style={{ filter: state === 'running' ? `drop-shadow(0 0 6px ${ORANGE})` : undefined }}
          />
        </svg>
        <span className="absolute text-center text-xs font-black text-[#1a1a1a]">
          {state === 'running' ? `${Math.round(progress)}%` : state === 'done' ? '✓' : state === 'error' ? '!' : '…'}
        </span>
      </div>
      <span className="max-w-[7rem] text-center text-xs font-bold leading-tight text-[#004694]">{label}</span>
      <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{engineId}</span>
    </motion.div>
  );
}

function FilePreviewCard({ item }: { item: BatchItem }) {
  const { file, previewUrl, isPortrait } = item;
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      className="flex flex-col items-center justify-center gap-4 overflow-hidden rounded-4xl border border-white/60 bg-white/50 p-4 shadow-md backdrop-blur-sm"
      style={{
        aspectRatio: isPortrait ? '3 / 4' : '4 / 3',
        maxHeight: isPortrait ? 'min(52vh, 22rem)' : 'min(40vh, 18rem)',
        width: '100%',
        maxWidth: isPortrait ? '14rem' : '20rem',
      }}
    >
      {previewUrl && !isPdf && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt=""
          className="max-h-full max-w-full rounded-2xl object-contain shadow-inner"
        />
      )}
      {isPdf && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <FileStack className="h-12 w-12 text-[#004694]/70" aria-hidden />
          <span className="text-xs font-bold text-gray-500">PDF</span>
        </div>
      )}
      {!previewUrl && !isPdf && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <FileStack className="h-10 w-10 text-gray-400" aria-hidden />
        </div>
      )}
      <p className="line-clamp-2 w-full text-center text-xs font-medium text-gray-600">{file.name}</p>
    </motion.div>
  );
}

export default function UnifiedScanModal({ open, onClose, embedded }: UnifiedScanModalProps) {
  const router = useRouter();
  const { locale } = useLocale();
  const { companyOptions, companyId: ctxCompanyId, setCompanyId } = useCompany();

  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);

  const [batch, setBatch] = useState<BatchItem[]>([]);
  const [selectedEngines, setSelectedEngines] = useState<Set<AiScanEngineId>>(
    () => new Set(['gemini'])
  );

  const [engineProgress, setEngineProgress] = useState<
    Record<string, { progress: number; state: EngineRunState }>
  >({});

  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [documentCategory, setDocumentCategory] = useState<ScanDocumentCategory>('invoice');

  const fileRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (ctxCompanyId && !selectedCompanyId) setSelectedCompanyId(ctxCompanyId);
  }, [ctxCompanyId, selectedCompanyId]);

  useEffect(() => {
    if (!isFirebaseConfigured() || !selectedCompanyId) {
      setProjects([]);
      return;
    }
    const unsub = onSnapshot(companyProjectsRef(selectedCompanyId), (snap) => {
      const rows: { id: string; name: string }[] = [];
      snap.forEach((d) => {
        const n = (d.data().name as string) || d.id;
        rows.push({ id: d.id, name: n });
      });
      setProjects(rows);
    });
    return () => unsub();
  }, [selectedCompanyId]);

  const revokePreviews = useCallback((items: BatchItem[]) => {
    items.forEach((i) => {
      if (i.previewUrl) URL.revokeObjectURL(i.previewUrl);
    });
  }, []);

  const addFiles = useCallback(
    (list: FileList | File[]) => {
      const arr = Array.from(list);
      setBatch((prev) => {
        const next = [...prev];
        for (const file of arr) {
          const id = `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`;
          let previewUrl: string | null = null;
          let isPortrait: boolean | undefined;
          if (file.type.startsWith('image/')) {
            previewUrl = URL.createObjectURL(file);
            isPortrait = true;
            const img = new Image();
            img.onload = () => {
              isPortrait = img.naturalHeight >= img.naturalWidth;
              setBatch((b) =>
                b.map((x) => (x.id === id ? { ...x, isPortrait } : x))
              );
            };
            img.src = previewUrl;
          }
          next.push({ id, file, previewUrl, isPortrait });
        }
        return next;
      });
    },
    []
  );

  const clearBatch = useCallback(() => {
    setBatch((prev) => {
      revokePreviews(prev);
      return [];
    });
  }, [revokePreviews]);

  const batchRef = useRef(batch);
  batchRef.current = batch;
  useEffect(() => {
    return () => revokePreviews(batchRef.current);
  }, [revokePreviews]);

  const toggleEngine = (id: AiScanEngineId) => {
    setSelectedEngines((s) => {
      const n = new Set(s);
      if (n.has(id)) {
        if (n.size > 1) n.delete(id);
      } else {
        n.add(id);
      }
      return n;
    });
  };

  const runAlloyScan = async () => {
    setError(null);
    if (!selectedCompanyId || !projectId) {
      setError('נא לבחור חברה ופרויקט.');
      return;
    }
    if (batch.length === 0) {
      setError('נא להוסיף קבצים לסריקה.');
      return;
    }
    if (selectedEngines.size === 0) {
      setError('נא לבחור לפחות מנוע אחד.');
      return;
    }

    setCtxCompanyIfNeeded(selectedCompanyId);

    const initial: Record<string, { progress: number; state: EngineRunState }> = {};
    ENGINE_IDS.forEach((e) => {
      initial[e] = { progress: 0, state: selectedEngines.has(e) ? 'idle' : 'idle' };
    });
    selectedEngines.forEach((e) => {
      initial[e] = { progress: 0, state: 'running' };
    });
    setEngineProgress(initial);
    setScanning(true);

    const formData = new FormData();
    formData.append('companyId', selectedCompanyId);
    formData.append('projectId', projectId);
    formData.append('documentCategory', documentCategory);
    formData.append('engines', JSON.stringify([...selectedEngines]));
    batch.forEach((b) => formData.append('files', b.file));

    try {
      const res = await fetch('/api/scan/alloy', { method: 'POST', body: formData });
      if (!res.ok || !res.body) {
        const t = await res.text();
        throw new Error(t || 'סריקה נכשלה');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finalBatchId: string | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.trim()) continue;
          let ev: Record<string, unknown>;
          try {
            ev = JSON.parse(line) as Record<string, unknown>;
          } catch {
            continue;
          }

          if (ev.type === 'engine_progress' && typeof ev.engine === 'string') {
            const eng = ev.engine;
            const state = ev.state === 'done' ? 'done' : ev.state === 'running' ? 'running' : 'idle';
            const progress = typeof ev.progress === 'number' ? ev.progress : 0;
            setEngineProgress((p) => ({
              ...p,
              [eng]: { state: state as EngineRunState, progress },
            }));
          }

          if (ev.type === 'engine_completed' && typeof ev.engine === 'string') {
            const eng = ev.engine;
            const result = ev.result as { ok?: boolean } | undefined;
            setEngineProgress((p) => ({
              ...p,
              [eng]: {
                state: result?.ok === false ? 'error' : 'done',
                progress: 100,
              },
            }));
          }

          if (ev.type === 'error') {
            throw new Error(String(ev.message ?? 'שגיאה'));
          }

          if (ev.type === 'done' && typeof ev.batchId === 'string') {
            finalBatchId = ev.batchId;
          }
        }
      }

      if (finalBatchId) {
        router.push(
          `/dashboard/scan/results/${encodeURIComponent(finalBatchId)}?companyId=${encodeURIComponent(selectedCompanyId)}`
        );
        if (!embedded && onClose) onClose();
      } else {
        setError('הסריקה הסתיימה ללא מזהה אצווה.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'שגיאה');
      setEngineProgress((p) => {
        const n = { ...p };
        selectedEngines.forEach((eng) => {
          n[eng] = { progress: n[eng]?.progress ?? 0, state: 'error' };
        });
        return n;
      });
    } finally {
      setScanning(false);
    }
  };

  function setCtxCompanyIfNeeded(cid: string) {
    if (ctxCompanyId !== cid) setCompanyId(cid);
  }

  const cockpit = (
    <motion.div
      className={
        embedded
          ? 'relative min-h-dvh w-full overflow-y-auto bg-[#FDFDFD] p-4 sm:p-6 md:p-12'
          : 'fixed inset-0 z-[200] flex items-center justify-center bg-[#004694]/20 p-4 backdrop-blur-md'
      }
      dir="rtl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="relative flex w-full max-w-6xl flex-col gap-4 rounded-4xl border border-white/70 bg-white/75 p-6 shadow-2xl backdrop-blur-xl sm:gap-6 sm:p-8 md:p-12"
        style={{
          perspective: '1200px',
          boxShadow: `0 24px 80px rgba(0,70,148,0.12), 0 0 0 1px rgba(255,255,255,0.8) inset, 0 -8px 32px ${ORANGE}18`,
          transform: 'translateZ(0)',
        }}
        initial={{ y: 24, rotateX: 4, opacity: 0 }}
        animate={{ y: 0, rotateX: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 28 }}
      >
        {!embedded && onClose && (
          <button
            type="button"
            aria-label="סגור"
            onClick={onClose}
            className="absolute left-4 top-4 z-10 flex h-12 w-12 items-center justify-center rounded-4xl border border-gray-200 bg-white/90 text-gray-600 shadow-sm transition-colors hover:border-[#FF8C00] hover:text-[#FF8C00] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF8C00]"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <motion.div
            className="flex h-16 w-16 items-center justify-center rounded-4xl text-white shadow-lg"
            style={{
              backgroundColor: BLUE,
              boxShadow: `0 8px 28px ${BLUE}55`,
            }}
            whileHover={{ scale: 1.06, boxShadow: `0 12px 36px ${ORANGE}66` }}
          >
            <ScanLine className="h-8 w-8" aria-hidden />
          </motion.div>
          <h1 className="text-2xl font-black text-[#1a1a1a] sm:text-3xl" style={{ color: BLUE }}>
            AI Scanning Cockpit
          </h1>
          <p className="max-w-xl text-sm text-gray-500">
            לוח בקרה — בחרו חברה, פרויקט, סוג מסמך, מנועים וקבצים. סריקת Alloy מריצה מנועים במקביל ומתעדת באירועי
            ה־Pipeline.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center gap-4 rounded-4xl border border-white/80 bg-white/60 p-6 shadow-inner backdrop-blur-sm">
          <span className="text-center text-sm font-bold text-[#004694]">
            {locale === 'he' ? 'סוג מסמך (ניתוח AI)' : 'Document type (AI analysis)'}
          </span>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {SCAN_DOCUMENT_CATEGORIES.map((cat) => {
              const label = locale === 'he' ? SCAN_CATEGORY_LABELS[cat].he : SCAN_CATEGORY_LABELS[cat].en;
              const active = documentCategory === cat;
              return (
                <motion.button
                  key={cat}
                  type="button"
                  onClick={() => setDocumentCategory(cat)}
                  className={`min-h-12 max-w-[14rem] rounded-4xl border-2 px-4 py-3 text-center text-xs font-bold sm:text-sm ${
                    active ? 'border-[#FF8C00] text-[#1a1a1a]' : 'border-gray-200 bg-white/80 text-gray-500'
                  }`}
                  style={
                    active
                      ? {
                          backgroundColor: WHITE,
                          boxShadow: `0 0 20px ${ORANGE}44, inset 0 0 0 1px ${ORANGE}33`,
                        }
                      : undefined
                  }
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {label}
                </motion.button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 md:gap-6">
          <div className="flex flex-col items-center justify-center gap-4 rounded-4xl border border-white/80 bg-white/60 p-6 shadow-inner backdrop-blur-sm">
            <label className="w-full text-center text-sm font-bold text-[#004694]">חברה</label>
            <select
              value={selectedCompanyId}
              onChange={(e) => {
                setSelectedCompanyId(e.target.value);
                setProjectId('');
                setCtxCompanyIfNeeded(e.target.value);
              }}
              className="min-h-12 w-full max-w-sm rounded-4xl border border-gray-200 bg-white px-4 text-center text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-[#FF8C00]"
            >
              <option value="">— בחרו —</option>
              {companyOptions.map((c) => (
                <option key={c.companyId} value={c.companyId}>
                  {c.displayName}
                </option>
              ))}
            </select>

            <label className="w-full text-center text-sm font-bold text-[#004694]">פרויקט</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              disabled={!selectedCompanyId}
              className="min-h-12 w-full max-w-sm rounded-4xl border border-gray-200 bg-white px-4 text-center text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-[#FF8C00] disabled:opacity-50"
            >
              <option value="">— בחרו פרויקט —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col items-center justify-center gap-4 rounded-4xl border border-white/80 bg-white/60 p-6 backdrop-blur-sm">
            <span className="text-sm font-bold text-[#004694]">מנועי AI</span>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {ENGINE_IDS.map((id) => {
                const on = selectedEngines.has(id);
                return (
                  <motion.button
                    key={id}
                    type="button"
                    onClick={() => toggleEngine(id)}
                    className={`min-h-12 rounded-4xl border-2 px-4 py-3 text-center text-xs font-bold transition-shadow sm:text-sm ${
                      on
                        ? 'border-[#FF8C00] text-[#1a1a1a]'
                        : 'border-gray-200 bg-white/80 text-gray-500'
                    }`}
                    style={
                      on
                        ? {
                            backgroundColor: WHITE,
                            boxShadow: `0 0 20px ${ORANGE}44, inset 0 0 0 1px ${ORANGE}33`,
                          }
                        : undefined
                    }
                    whileHover={{ scale: 1.04, boxShadow: `0 0 24px ${ORANGE}55` }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {ALLOY_ENGINE_META[id].label}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>

        <div
          className="flex min-h-[200px] flex-col items-center justify-center gap-4 rounded-4xl border-2 border-dashed border-[#004694]/25 bg-white/50 p-6 backdrop-blur-md transition-colors sm:min-h-[240px] sm:p-8"
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
          }}
        >
          <Sparkles className="h-10 w-10 text-[#FF8C00]" style={{ filter: `drop-shadow(0 0 8px ${ORANGE})` }} />
          <p className="text-center text-sm font-medium text-gray-600">
            גררו לכאן קבצים, תיקייה או השתמשו בכפתורים
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => fileRef.current?.click()}
              className="min-h-12 rounded-4xl border border-gray-200 bg-white px-6 font-bold text-[#004694] shadow-sm"
              style={{ boxShadow: `0 4px 20px rgba(0,70,148,0.08)` }}
            >
              בחר קבצים
            </motion.button>
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => folderRef.current?.click()}
              className="flex min-h-12 items-center justify-center gap-2 rounded-4xl border border-gray-200 bg-white px-6 font-bold text-[#004694]"
            >
              <FolderOpen className="h-4 w-4" />
              בחר תיקייה
            </motion.button>
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={clearBatch}
              disabled={batch.length === 0}
              className="flex min-h-12 items-center justify-center gap-2 rounded-4xl border border-red-100 bg-red-50 px-6 font-bold text-red-700 disabled:opacity-40"
            >
              <Trash2 className="h-4 w-4" />
              נקה אצווה
            </motion.button>
          </div>
          <input
            ref={fileRef}
            type="file"
            multiple
            className="hidden"
            accept="image/*,.pdf,application/pdf"
            onChange={(e) => {
              if (e.target.files?.length) addFiles(e.target.files);
              e.target.value = '';
            }}
          />
          <input
            ref={folderRef}
            type="file"
            className="hidden"
            {...({ webkitdirectory: '', directory: '' } as React.InputHTMLAttributes<HTMLInputElement>)}
            multiple
            onChange={(e) => {
              if (e.target.files?.length) addFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </div>

        {batch.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-4">
            <AnimatePresence mode="popLayout">
              {batch.map((item) => (
                <FilePreviewCard key={item.id} item={item} />
              ))}
            </AnimatePresence>
          </div>
        )}

        {(scanning || Object.keys(engineProgress).some((k) => engineProgress[k]?.state !== 'idle')) && (
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
            {ENGINE_IDS.filter((e) => selectedEngines.has(e)).map((e) => (
              <EngineOrb
                key={e}
                engineId={e}
                label={ALLOY_ENGINE_META[e].label}
                state={engineProgress[e]?.state ?? 'idle'}
                progress={engineProgress[e]?.progress ?? 0}
              />
            ))}
          </div>
        )}

        {error && (
          <p className="rounded-4xl border border-red-100 bg-red-50 py-3 text-center text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <motion.button
            type="button"
            disabled={scanning}
            onClick={() => void runAlloyScan()}
            className="min-h-12 w-full max-w-md rounded-4xl px-8 py-4 text-lg font-black text-white sm:w-auto"
            style={{
              background: `linear-gradient(145deg, ${ORANGE}, #e67e00)`,
              boxShadow: `0 0 28px ${ORANGE}88, 0 8px 24px rgba(0,70,148,0.15)`,
            }}
            whileHover={{
              scale: scanning ? 1 : 1.04,
              boxShadow: `0 0 40px ${ORANGE}, 0 12px 32px rgba(0,70,148,0.2)`,
            }}
            whileTap={{ scale: scanning ? 1 : 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 18 }}
          >
            {scanning ? 'מריץ סריקת Alloy…' : 'RUN AI ALLOY SCAN'}
          </motion.button>
          {embedded && (
            <Link
              href="/dashboard"
              className="inline-flex min-h-12 items-center justify-center rounded-4xl border border-gray-200 px-6 font-bold text-[#004694]"
            >
              חזרה לדשבורד
            </Link>
          )}
        </div>
      </motion.div>
    </motion.div>
  );

  if (!mounted) return null;

  if (embedded) {
    return (
      <AnimatePresence mode="wait">
        {open ? <motion.div key="cockpit">{cockpit}</motion.div> : null}
      </AnimatePresence>
    );
  }

  return createPortal(
    <AnimatePresence>
      {open ? cockpit : null}
    </AnimatePresence>,
    document.body
  );
}
