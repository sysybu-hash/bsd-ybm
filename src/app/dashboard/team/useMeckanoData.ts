'use client';

import { useState, useEffect } from 'react';

export type MeckanoAttendance = Record<string, unknown> | null;

export function useMeckanoData() {
  const [attendance, setAttendance] = useState<MeckanoAttendance>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchAttendance() {
      try {
        const res = await fetch('/api/meckano/attendance');
        const data = await res.json();
        if (!cancelled) {
          if (!res.ok) setError(data.error ?? 'שגיאה בטעינת נוכחות');
          else setAttendance(data);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'שגיאה');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAttendance();
    return () => {
      cancelled = true;
    };
  }, []);

  return { attendance, loading, error };
}
