'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Lock } from 'lucide-react';
import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { getDb } from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';
import { useLocale } from '@/context/LocaleContext';
import {
  clampInactivityMinutes,
  DEFAULT_INACTIVITY_MINUTES,
  MAX_INACTIVITY_MINUTES,
  MIN_INACTIVITY_MINUTES,
  writeInactivityMinutesToLocalStorage,
} from '@/lib/inactivityPreferences';
import { MEUHEDET } from '@/components/shell/meuhedet-theme';

export default function SecuritySettingsPage() {
  const { user } = useAuth();
  const { t, dir } = useLocale();
  const [minutes, setMinutes] = useState(DEFAULT_INACTIVITY_MINUTES);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid || !isFirebaseConfigured()) return;
    const ref = doc(getDb(), 'users', user.uid);
    void getDoc(ref).then((snap) => {
      if (!snap.exists()) return;
      const raw = (snap.data() as Record<string, unknown>).inactivityTimeoutMinutes;
      if (typeof raw === 'number') setMinutes(clampInactivityMinutes(raw));
    });
  }, [user?.uid]);

  const save = useCallback(async () => {
    if (!user?.uid || !isFirebaseConfigured()) {
      setMsg(t('settings.security.saveFail'));
      return;
    }
    setSaving(true);
    setMsg(null);
    const m = clampInactivityMinutes(minutes);
    writeInactivityMinutesToLocalStorage(m);
    try {
      await updateDoc(doc(getDb(), 'users', user.uid), {
        inactivityTimeoutMinutes: m,
        inactivityPreferenceUpdatedAt: serverTimestamp(),
      });
      setMsg(t('settings.security.saved'));
    } catch {
      setMsg(t('settings.security.saveFail'));
    } finally {
      setSaving(false);
    }
  }, [user?.uid, minutes, t]);

  if (!user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-12 text-center text-sm text-gray-600" dir={dir}>
        {t('select.signIn')}
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#FDFDFD] p-6 pb-28 pt-safe px-safe sm:p-8 md:p-12" dir={dir}>
      <div className="mb-8 flex items-center justify-center gap-4">
        <Link
          href="/dashboard"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[32px] px-3 text-sm font-bold text-gray-500 transition-colors hover:text-[#001A4D] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF8C00]"
        >
          <ArrowRight className="h-4 w-4" aria-hidden />
          {t('settings.security.back')}
        </Link>
      </div>

      <header className="mb-10 flex flex-col items-center justify-center gap-4 text-center">
        <div className="rounded-[32px] p-3" style={{ backgroundColor: `${MEUHEDET.blue}18` }}>
          <Lock className="h-8 w-8" style={{ color: MEUHEDET.blue }} aria-hidden />
        </div>
        <div>
          <h1 className="text-2xl font-black text-[#001A4D]">{t('settings.security.title')}</h1>
          <p className="mt-2 max-w-xl text-sm text-gray-600">{t('settings.security.subtitle')}</p>
          <p className="mt-4 max-w-xl text-xs text-gray-500">{t('settings.security.showHint')}</p>
        </div>
      </header>

      <section className="mx-auto flex max-w-xl flex-col items-center justify-center gap-8 rounded-[32px] border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <label className="flex w-full flex-col items-center justify-center gap-4 text-center">
          <span className="text-sm font-bold text-gray-800">{t('settings.security.minutesLabel')}</span>
          <input
            type="range"
            min={MIN_INACTIVITY_MINUTES}
            max={MAX_INACTIVITY_MINUTES}
            value={minutes}
            onChange={(e) => setMinutes(clampInactivityMinutes(Number(e.target.value)))}
            className="h-4 w-full max-w-md cursor-pointer accent-[#004694]"
          />
          <span className="text-2xl font-black text-[#004694]">{minutes}</span>
        </label>

        <button
          type="button"
          disabled={saving}
          onClick={() => void save()}
          className="btn-primary-empire min-h-12 w-full max-w-xs rounded-[32px] px-8 py-4 text-sm font-black text-white disabled:opacity-50"
        >
          {saving ? '…' : t('settings.security.save')}
        </button>

        {msg ? (
          <p className="text-center text-sm font-bold text-[#001A4D]" role="status">
            {msg}
          </p>
        ) : null}
      </section>
    </div>
  );
}
