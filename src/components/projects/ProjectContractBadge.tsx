'use client';

import React, { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { useCompany } from '@/context/CompanyContext';
import { getDb } from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';

export function ProjectContractBadge({ projectId }: { projectId: string }) {
  const { companyId } = useCompany();
  const [signed, setSigned] = useState(false);

  useEffect(() => {
    if (!companyId || !projectId || !isFirebaseConfigured()) return;
    const pref = doc(getDb(), 'companies', companyId, 'projects', projectId);
    const unsub = onSnapshot(pref, (snap) => {
      const d = snap.data() as { contractSignedAt?: unknown } | undefined;
      setSigned(Boolean(d?.contractSignedAt));
    });
    return () => unsub();
  }, [companyId, projectId]);

  if (!signed) return null;

  return (
    <span
      className="inline-flex items-center justify-center rounded-[32px] border border-emerald-300 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-900"
      dir="rtl"
    >
      הסכם נחתם
    </span>
  );
}
