'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export type DataEnvironmentMode = 'real' | 'demo';

export type DemoModeContextValue = {
  dataMode: DataEnvironmentMode;
  setDataMode: (m: DataEnvironmentMode) => void;
  /**
   * True when user must stay on mock data (`accountTier: demo` or legacy `isTrialUser`, excluding `trial` tier).
   * Name kept for backward compatibility with dashboard copy.
   */
  isTrialUserLocked: boolean;
};

const DemoModeContext = createContext<DemoModeContextValue | null>(null);

export function useDemoMode(): DemoModeContextValue {
  const ctx = useContext(DemoModeContext);
  if (!ctx) {
    return {
      dataMode: 'real',
      setDataMode: () => {},
      isTrialUserLocked: false,
    };
  }
  return ctx;
}

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const { isTrialUser, accountTier } = useAuth();
  const [dataMode, setDataModeState] = useState<DataEnvironmentMode>('real');

  const isDemoDataLocked =
    accountTier === 'demo' || (Boolean(isTrialUser) && accountTier !== 'trial');

  useEffect(() => {
    if (isDemoDataLocked) {
      setDataModeState('demo');
    }
  }, [isDemoDataLocked]);

  const setDataMode = useCallback(
    (m: DataEnvironmentMode) => {
      if (isDemoDataLocked && m === 'real') return;
      setDataModeState(m);
    },
    [isDemoDataLocked]
  );

  const value = useMemo((): DemoModeContextValue => {
    const effective: DataEnvironmentMode = isDemoDataLocked ? 'demo' : dataMode;
    return {
      dataMode: effective,
      setDataMode,
      isTrialUserLocked: isDemoDataLocked,
    };
  }, [dataMode, isDemoDataLocked, setDataMode]);

  return <DemoModeContext.Provider value={value}>{children}</DemoModeContext.Provider>;
}
