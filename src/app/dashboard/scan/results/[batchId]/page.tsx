'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { doc, onSnapshot } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { ArrowRight, ScanLine } from 'lucide-react';
import { getDb, companyCollectionRef } from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';
import ScanAnalysisRoom from '@/components/scan/analysis/ScanAnalysisRoom';
import { useCompany } from '@/context/CompanyContext';
import { useSubscription } from '@/hooks/useSubscription';

const BLUE = '#004694';
const ORANGE = '#FF8C00';

type ScanDoc = {
  projectId?: string;
  engineResults?: Record<string, unknown>;
  status?: string;
  fileNames?: string[];
  [key: string]: unknown;
};

function ScanBatchResultInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const batchId = typeof params?.batchId === 'string' ? params.batchId : '';
  const companyId = searchParams.get('companyId') ?? '';
  const { companyId: selectedCompanyId } = useCompany();
  const { hasFeature, plan } = useSubscription();
  const scanAllowed = hasFeature('multi_engine_scan');
  const companyMismatch =
    Boolean(companyId && selectedCompanyId && companyId !== selectedCompanyId);

  const [exists, setExists] = useState<boolean | null>(null);
  const [scanDoc, setScanDoc] = useState<ScanDoc | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured() || !companyId || !batchId) {
      setExists(false);
      setScanDoc(null);
      return;
    }
    const ref = doc(companyCollectionRef('scans', companyId), batchId);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        setExists(snap.exists());
        if (snap.exists()) {
          setScanDoc(snap.data() as ScanDoc);
        } else {
          setScanDoc(null);
        }
      },
      () => {
        setExists(false);
        setScanDoc(null);
      }
    );
    return () => unsub();
  }, [companyId, batchId]);

  return (
    <div className="min-h-full bg-[#FFFFFF] p-4 pb-12 sm:p-8 md:p-12" dir="rtl">
      <div className="mb-8 flex items-center justify-center gap-4">
        <Link
          href="/scan"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-4xl px-3 text-sm font-bold text-gray-500 transition-colors hover:text-[#1a1a1a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF8C00]"
        >
          <ArrowRight className="h-4 w-4" />
          חזרה ללוח הסריקה
        </Link>
      </div>

      <motion.header
        className="mb-10 flex flex-col items-center justify-center gap-4 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 28 }}
      >
        <motion.div
          className="flex h-16 w-16 items-center justify-center rounded-4xl text-white"
          style={{
            backgroundColor: BLUE,
            boxShadow: `0 8px 32px ${BLUE}55, 0 0 24px ${ORANGE}33`,
          }}
          animate={{
            boxShadow: [
              `0 8px 32px ${BLUE}55, 0 0 20px ${ORANGE}44`,
              `0 12px 40px ${BLUE}66, 0 0 32px ${ORANGE}66`,
              `0 8px 32px ${BLUE}55, 0 0 20px ${ORANGE}44`,
            ],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ScanLine className="h-8 w-8" aria-hidden />
        </motion.div>
        <h1 className="text-2xl font-black sm:text-3xl" style={{ color: BLUE }}>
          חדר ניתוח — AI Results Room
        </h1>
        <p className="font-mono text-xs text-gray-500 sm:text-sm">batch: {batchId || '—'}</p>
      </motion.header>

      {!companyId && (
        <div className="mx-auto max-w-xl rounded-4xl border border-gray-100 bg-white p-8 text-center text-gray-600 shadow-sm">
          חסר מזהה חברה (הוסיפו ?companyId= לכתובת).
        </div>
      )}

      {companyId && companyMismatch && (
        <div className="mx-auto max-w-xl rounded-4xl border border-amber-100 bg-amber-50 p-8 text-center text-sm text-amber-900">
          מזהה החברה בכתובת אינו תואם לחברה הנבחרת במתג. בחרו את אותה חברה או עדכנו את הקישור.
        </div>
      )}

      {companyId && !companyMismatch && !scanAllowed && (
        <div className="mx-auto max-w-xl rounded-4xl border border-gray-100 bg-[#FDFDFD] p-8 text-center text-gray-600">
          <p className="font-bold">חדר הניתוח זמין בתוכנית Alloy בלבד.</p>
          <p className="mt-2 text-xs text-gray-500">תוכנית נוכחית: {plan}</p>
        </div>
      )}

      {companyId && !companyMismatch && scanAllowed && exists === null && (
        <p className="text-center text-gray-500">טוען…</p>
      )}

      {companyId && !companyMismatch && scanAllowed && exists === false && (
        <div className="mx-auto max-w-xl rounded-4xl border border-gray-100 bg-white p-8 text-center text-gray-600">
          לא נמצאה רשומת אצווה או אין הרשאת קריאה.
        </div>
      )}

      {companyId && !companyMismatch && scanAllowed && exists === true && scanDoc && (
        <ScanAnalysisRoom companyId={companyId} batchId={batchId} scanDoc={scanDoc} />
      )}

      <div className="mt-12 flex justify-center">
        <Link
          href="/dashboard"
          className="inline-flex min-h-12 items-center justify-center rounded-4xl px-8 font-bold text-white"
          style={{
            backgroundColor: ORANGE,
            boxShadow: `0 0 24px ${ORANGE}88, 0 0 12px ${ORANGE}cc`,
          }}
        >
          דשבורד
        </Link>
      </div>
    </div>
  );
}

export default function ScanBatchResultPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center bg-[#FFFFFF] p-12 text-sm text-gray-500" dir="rtl">
          טוען…
        </div>
      }
    >
      <ScanBatchResultInner />
    </Suspense>
  );
}
