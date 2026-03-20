'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { getDb } from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';
import {
  clampInactivityMinutes,
  DEFAULT_INACTIVITY_MINUTES,
  minutesToMs,
  readInactivityMinutesFromLocalStorage,
  writeInactivityMinutesToLocalStorage,
} from '@/lib/inactivityPreferences';

/**
 * Effective idle timeout: `companies/{companyId}.inactivityTimeoutMinutes` (when set) →
 * `users/{uid}.inactivityTimeoutMinutes` → LocalStorage → default 10 min.
 */
export function useInactivityTimeoutMs(
  uid: string | null | undefined,
  companyId?: string | null
): { timeoutMs: number; minutes: number } {
  const [minutes, setMinutes] = useState<number>(() => {
    const fromLs = readInactivityMinutesFromLocalStorage();
    return fromLs ?? DEFAULT_INACTIVITY_MINUTES;
  });

  const companyRawRef = useRef<number | undefined>(undefined);
  const userRawRef = useRef<number | undefined>(undefined);
  const companyIdRef = useRef<string | null | undefined>(companyId);

  companyIdRef.current = companyId;

  const recompute = useCallback(() => {
    const cid = companyIdRef.current;
    let next: number;
    if (cid && companyRawRef.current != null && Number.isFinite(companyRawRef.current)) {
      next = clampInactivityMinutes(companyRawRef.current);
    } else if (userRawRef.current != null && Number.isFinite(userRawRef.current)) {
      next = clampInactivityMinutes(userRawRef.current);
    } else {
      const ls = readInactivityMinutesFromLocalStorage();
      next = ls ?? DEFAULT_INACTIVITY_MINUTES;
    }
    setMinutes(next);
    writeInactivityMinutesToLocalStorage(next);
  }, []);

  useEffect(() => {
    const fromLs = readInactivityMinutesFromLocalStorage();
    if (fromLs != null) setMinutes(fromLs);
  }, [uid, companyId]);

  useEffect(() => {
    if (!companyId || !isFirebaseConfigured()) {
      companyRawRef.current = undefined;
      recompute();
      return;
    }
    const ref = doc(getDb(), 'companies', companyId);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          companyRawRef.current = undefined;
        } else {
          const d = snap.data() as Record<string, unknown>;
          const raw = d.inactivityTimeoutMinutes;
          companyRawRef.current = typeof raw === 'number' ? raw : undefined;
        }
        recompute();
      },
      () => {}
    );
    return () => unsub();
  }, [companyId, recompute]);

  useEffect(() => {
    if (!uid || !isFirebaseConfigured()) return;
    const ref = doc(getDb(), 'users', uid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          userRawRef.current = undefined;
        } else {
          const d = snap.data() as Record<string, unknown>;
          const raw = d.inactivityTimeoutMinutes;
          userRawRef.current = typeof raw === 'number' ? raw : undefined;
        }
        recompute();
      },
      () => {}
    );
    return () => unsub();
  }, [uid, recompute]);

  const timeoutMs = useMemo(() => minutesToMs(minutes), [minutes]);

  return { timeoutMs, minutes };
}
