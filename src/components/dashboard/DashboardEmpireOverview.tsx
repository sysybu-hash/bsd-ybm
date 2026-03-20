'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { FileSignature, HardHat, ScanLine } from 'lucide-react';
import { collection, limit, onSnapshot, query } from 'firebase/firestore';
import { useCompany } from '@/context/CompanyContext';
import { useCompanyFinancials } from '@/hooks/useCompanyFinancials';
import { getDb, companyQuotesRef, companyScansRef } from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';

type ScanPreview = { id: string; preview: string };

/**
 * Phase 20 — Single overview: project health, recent OCR, pending quote/contract signatures.
 * All listeners are scoped to `companies/{selectedCompanyId}/…` (multi-tenant).
 */
export default function DashboardEmpireOverview() {
  const { companyId } = useCompany();
  const { allProjects, loading: finLoading } = useCompanyFinancials();
  const [scans, setScans] = useState<ScanPreview[]>([]);
  const [pendingQuotes, setPendingQuotes] = useState(0);
  const [unsignedProjects, setUnsignedProjects] = useState(0);

  useEffect(() => {
    if (!companyId || !isFirebaseConfigured()) {
      setScans([]);
      setPendingQuotes(0);
      setUnsignedProjects(0);
      return;
    }
    const db = getDb();
    const base = ['companies', companyId] as const;

    const unsubScans = onSnapshot(
      query(collection(db, ...base, 'scans'), limit(24)),
      (snap) => {
        const rows: ScanPreview[] = [];
        snap.forEach((d) => {
          const data = d.data() as Record<string, unknown>;
          const preview = String(
            data.aiSummary ?? data.summary ?? data.notes ?? data.status ?? d.id
          ).slice(0, 120);
          rows.push({ id: d.id, preview });
        });
        rows.sort((a, b) => b.id.localeCompare(a.id));
        setScans(rows.slice(0, 5));
      },
      () => setScans([])
    );

    const unsubQuotes = onSnapshot(
      query(companyQuotesRef(companyId), limit(120)),
      (snap) => {
        let n = 0;
        snap.forEach((d) => {
          const x = d.data() as Record<string, unknown>;
          if (x.status === 'awaiting_signature') n += 1;
        });
        setPendingQuotes(n);
      },
      () => setPendingQuotes(0)
    );

    const unsubProj = onSnapshot(collection(db, ...base, 'projects'), (snap) => {
      let n = 0;
      snap.forEach((d) => {
        const data = d.data() as { contractSignedAt?: unknown };
        if (!data.contractSignedAt) n += 1;
      });
      setUnsignedProjects(n);
    });

    return () => {
      unsubScans();
      unsubQuotes();
      unsubProj();
    };
  }, [companyId]);

  const projectLine = useMemo(() => {
    if (!allProjects.length) return 'אין פרויקטים בטעינה.';
    const ok = allProjects.filter((p) => p.budgeted > 0 && p.actual <= p.budgeted * 1.02).length;
    return `${allProjects.length} פרויקטים · ${ok} בטווח תקציב תקין (הערכה).`;
  }, [allProjects]);

  if (!companyId) {
    return (
      <section
        className="mx-auto mb-8 w-full max-w-6xl rounded-[32px] border border-dashed border-gray-200 bg-[#FDFDFD] p-6 text-center text-sm text-gray-500"
        dir="rtl"
      >
        בחרו חברה מהמתג לסקירת האימפריה.
      </section>
    );
  }

  return (
    <section
      className="empire-shimmer-gold mx-auto mb-8 flex w-full max-w-6xl flex-col items-center justify-center gap-6 rounded-[32px] border border-amber-200/80 bg-[#FDFDFD] p-6 shadow-sm sm:p-8"
      dir="rtl"
    >
      <h2 className="text-center text-xl font-black text-[#001A4D] sm:text-2xl">סקירת לוח בקרה</h2>
      <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
        <div className="flex flex-col items-center justify-center gap-4 rounded-[32px] border border-gray-100 bg-white p-6 text-center shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-[32px] bg-[#004694]/10 text-[#004694]">
            <HardHat className="h-7 w-7" aria-hidden />
          </div>
          <h3 className="text-lg font-black text-[#1a1a1a]">סטטוס פרויקטים</h3>
          <p className="text-sm text-gray-600">{finLoading ? 'טוען…' : projectLine}</p>
          <Link
            href="/dashboard/projects"
            className="text-sm font-bold text-[#FF7F00] underline-offset-4 hover:underline"
          >
            לפרויקטים
          </Link>
        </div>

        <div className="flex flex-col items-center justify-center gap-4 rounded-[32px] border border-gray-100 bg-white p-6 text-center shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-[32px] bg-[#004694]/10 text-[#004694]">
            <ScanLine className="h-7 w-7" aria-hidden />
          </div>
          <h3 className="text-lg font-black text-[#1a1a1a]">OCR אחרון</h3>
          {scans.length === 0 ? (
            <p className="text-sm text-gray-500">אין סריקות אחרונות להצגה.</p>
          ) : (
            <ul className="w-full max-w-sm space-y-2 text-right text-xs text-gray-700">
              {scans.map((s) => (
                <li key={s.id} className="rounded-[32px] border border-gray-100 px-3 py-2">
                  {s.preview}
                </li>
              ))}
            </ul>
          )}
          <Link href="/dashboard/archive-search" className="text-sm font-bold text-[#FF7F00] underline-offset-4 hover:underline">
            לארכיון חיפוש
          </Link>
        </div>

        <div className="flex flex-col items-center justify-center gap-4 rounded-[32px] border border-gray-100 bg-white p-6 text-center shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-[32px] bg-[#004694]/10 text-[#004694]">
            <FileSignature className="h-7 w-7" aria-hidden />
          </div>
          <h3 className="text-lg font-black text-[#1a1a1a]">חתימות ממתינות</h3>
          <p className="text-sm text-gray-600">
            פרויקטים ללא חתימת חוזה: <strong>{unsignedProjects}</strong>
          </p>
          <p className="text-sm text-gray-600">
            הצעות מחיר לחתימה: <strong>{pendingQuotes}</strong>
          </p>
          <Link
            href="/dashboard/contracts"
            className="text-sm font-bold text-[#FF7F00] underline-offset-4 hover:underline"
          >
            לחדר חתימה
          </Link>
        </div>
      </div>
    </section>
  );
}
