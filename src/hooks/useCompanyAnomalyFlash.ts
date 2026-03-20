'use client';

import { useEffect, useState } from 'react';
import { collection, limit, onSnapshot, query, where } from 'firebase/firestore';
import { useCompany } from '@/context/CompanyContext';
import { getDb } from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';

/**
 * True when company has at least one active anomaly signal (Phase 14 — red flashing LED).
 */
export function useCompanyAnomalyFlash(): { active: boolean; loading: boolean } {
  const { companyId } = useCompany();
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId || !isFirebaseConfigured()) {
      setActive(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    const db = getDb();
    const q = query(
      collection(db, 'companies', companyId, 'anomalySignals'),
      where('active', '==', true),
      limit(1)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setActive(!snap.empty);
        setLoading(false);
      },
      () => {
        setActive(false);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [companyId]);

  return { active, loading };
}
