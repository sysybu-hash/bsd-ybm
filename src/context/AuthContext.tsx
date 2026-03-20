'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { getFirebaseAuth, isFirebaseConfigured } from '@/lib/firebase';
import { getDb } from '@/lib/firestore';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import type { Timestamp } from 'firebase/firestore';
import { logAuthDomainSetupOnce } from '@/lib/authConsoleHints';

/** `full` = production; `trial` = time/scan limits; `demo` = mock-data-only lock. */
export type AccountTier = 'full' | 'trial' | 'demo';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  /** Legacy demo flag — prefer `accountTier === 'demo'`. */
  isTrialUser: boolean;
  accountTier: AccountTier;
  /** Milliseconds since epoch when `trial` tier ends, if set. */
  trialExpiresAtMs: number | null;
  scanQuota: number | null;
  scansUsed: number | null;
  signInWithGoogle: () => Promise<void>;
  signInWithEmailPassword: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isConfigured: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    return {
      user: null,
      loading: false,
      isTrialUser: false,
      accountTier: 'full',
      trialExpiresAtMs: null,
      scanQuota: null,
      scansUsed: null,
      signInWithGoogle: async () => {},
      signInWithEmailPassword: async () => {},
      signOut: async () => {},
      isConfigured: false,
    };
  }
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTrialUser, setIsTrialUser] = useState(false);
  const [accountTier, setAccountTier] = useState<AccountTier>('full');
  const [trialExpiresAtMs, setTrialExpiresAtMs] = useState<number | null>(null);
  const [scanQuota, setScanQuota] = useState<number | null>(null);
  const [scansUsed, setScansUsed] = useState<number | null>(null);
  const isConfigured = isFirebaseConfigured();

  useEffect(() => {
    logAuthDomainSetupOnce();
  }, []);

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }
    const auth = getFirebaseAuth();
    let cancelled = false;
    setPersistence(auth, browserLocalPersistence).catch(() => {});
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!cancelled) {
        setUser(u);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, [isConfigured]);

  useEffect(() => {
    if (!isConfigured || !user?.uid) {
      setIsTrialUser(false);
      setAccountTier('full');
      setTrialExpiresAtMs(null);
      setScanQuota(null);
      setScansUsed(null);
      return;
    }
    const ref = doc(getDb(), 'users', user.uid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const d = snap.data() as Record<string, unknown> | undefined;
        if (!d) {
          setIsTrialUser(false);
          setAccountTier('full');
          setTrialExpiresAtMs(null);
          setScanQuota(null);
          setScansUsed(null);
          return;
        }
        const rawTier = d.accountTier;
        let tier: AccountTier = 'full';
        if (rawTier === 'trial' || rawTier === 'demo' || rawTier === 'full') {
          tier = rawTier;
        } else if (d.isTrialUser === true) {
          tier = 'demo';
        }
        setAccountTier(tier);
        setIsTrialUser(Boolean(d.isTrialUser));

        const te = d.trialExpiresAt;
        if (te && typeof te === 'object' && 'toMillis' in te) {
          setTrialExpiresAtMs((te as Timestamp).toMillis());
        } else {
          setTrialExpiresAtMs(null);
        }

        const sq = d.scanQuota;
        const su = d.scansUsed;
        setScanQuota(typeof sq === 'number' && Number.isFinite(sq) ? sq : null);
        setScansUsed(typeof su === 'number' && Number.isFinite(su) ? su : null);
      },
      () => {
        setIsTrialUser(false);
        setAccountTier('full');
        setTrialExpiresAtMs(null);
        setScanQuota(null);
        setScansUsed(null);
      }
    );
    return () => unsub();
  }, [isConfigured, user?.uid]);

  const signInWithGoogle = async () => {
    if (!isConfigured) return;
    const auth = getFirebaseAuth();
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signInWithEmailPassword = async (email: string, password: string) => {
    if (!isConfigured) return;
    const auth = getFirebaseAuth();
    await signInWithEmailAndPassword(auth, email.trim(), password);
  };

  const signOut = async () => {
    if (!isConfigured) return;
    const auth = getFirebaseAuth();
    await firebaseSignOut(auth);
  };

  const value: AuthContextValue = {
    user,
    loading,
    isTrialUser,
    accountTier,
    trialExpiresAtMs,
    scanQuota,
    scansUsed,
    signInWithGoogle,
    signInWithEmailPassword,
    signOut,
    isConfigured,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
