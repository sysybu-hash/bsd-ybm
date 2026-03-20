'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type DashboardErrorEntry = {
  id: string;
  source: string;
  message: string;
  at: number;
};

type DashboardDiagnosticsValue = {
  errors: DashboardErrorEntry[];
  recordError: (source: string, message: string) => void;
  clearErrors: () => void;
};

const DashboardDiagnosticsContext = createContext<DashboardDiagnosticsValue | null>(null);

export function DashboardDiagnosticsProvider({ children }: { children: React.ReactNode }) {
  const [errors, setErrors] = useState<DashboardErrorEntry[]>([]);

  const recordError = useCallback((source: string, message: string) => {
    const entry: DashboardErrorEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      source,
      message,
      at: Date.now(),
    };
    setErrors((prev) => [entry, ...prev].slice(0, 50));
  }, []);

  const clearErrors = useCallback(() => setErrors([]), []);

  const value = useMemo(
    () => ({ errors, recordError, clearErrors }),
    [errors, recordError, clearErrors]
  );

  return (
    <DashboardDiagnosticsContext.Provider value={value}>{children}</DashboardDiagnosticsContext.Provider>
  );
}

export function useDashboardDiagnostics(): DashboardDiagnosticsValue {
  const ctx = useContext(DashboardDiagnosticsContext);
  if (!ctx) {
    return {
      errors: [],
      recordError: () => {},
      clearErrors: () => {},
    };
  }
  return ctx;
}
