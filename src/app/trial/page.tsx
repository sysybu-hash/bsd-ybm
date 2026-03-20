'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import { submitTrialLead, type RegistrationType } from '@/services/auth/LeadService';
import type { SectorId } from '@/config/sectorConfigs';

const SECTORS: { id: SectorId; labelHe: string; labelEn: string }[] = [
  { id: 'CONSTRUCTION', labelHe: 'פרויקטים ושטח', labelEn: 'Projects & field work' },
  { id: 'RENOVATION', labelHe: 'שיפוצים', labelEn: 'Renovation' },
  { id: 'PROPERTY_MGMT', labelHe: 'ניהול נכסים', labelEn: 'Property management' },
  { id: 'ELECTRICAL', labelHe: 'חשמל', labelEn: 'Electrical trades' },
];

export default function TrialRegistrationPage() {
  const { user, signInWithGoogle } = useAuth();
  const { t, dir, locale } = useLocale();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [sector, setSector] = useState<SectorId>('CONSTRUCTION');
  const [registrationType, setRegistrationType] = useState<RegistrationType>('trial');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const idToken = user ? await user.getIdToken() : undefined;
      const res = await submitTrialLead({
        name,
        email,
        phone,
        business_sector: sector,
        registration_type: registrationType,
        idToken,
      });
      if (!res.ok) {
        setMessage({ kind: 'err', text: t('trial.error') });
        return;
      }
      const applied = res.profileApplied ?? res.trialUserApplied;
      const okText =
        registrationType === 'trial'
          ? t('trial.successTrial')
          : t('trial.successDemo');
      setMessage({
        kind: 'ok',
        text: applied ? okText : t('trial.success'),
      });
    } catch {
      setMessage({ kind: 'err', text: t('trial.error') });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-dvh bg-[#FDFDFD] p-6 pt-safe px-safe sm:p-12" dir={dir}>
      <div className="mx-auto flex max-w-lg flex-col items-center justify-center gap-8">
        <Link
          href="/"
          className="self-start text-sm font-bold text-[#004694] underline-offset-4 hover:underline"
        >
          ← Home
        </Link>

        <header className="flex flex-col items-center justify-center gap-2 text-center">
          <h1 className="text-2xl font-black text-[#1a1a1a] sm:text-3xl" style={{ color: '#004694' }}>
            {t('trial.title')}
          </h1>
          <p className="text-sm text-gray-600">{t('trial.subtitle')}</p>
        </header>

        <div className="flex w-full flex-col items-center justify-center gap-4 rounded-4xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
          <fieldset className="flex w-full max-w-sm flex-col items-center justify-center gap-4">
            <legend className="mb-2 text-center text-sm font-bold text-gray-700">
              {t('trial.registrationLabel')}
            </legend>
            <label className="flex w-full cursor-pointer items-center justify-center gap-4 rounded-4xl border border-gray-200 bg-[#FDFDFD] px-4 py-3 has-[:checked]:border-[#004694]">
              <input
                type="radio"
                name="reg"
                checked={registrationType === 'trial'}
                onChange={() => setRegistrationType('trial')}
                className="h-4 w-4"
              />
              <span className="text-center text-sm text-gray-800">{t('trial.optionTrial')}</span>
            </label>
            <label className="flex w-full cursor-pointer items-center justify-center gap-4 rounded-4xl border border-gray-200 bg-[#FDFDFD] px-4 py-3 has-[:checked]:border-[#004694]">
              <input
                type="radio"
                name="reg"
                checked={registrationType === 'demo'}
                onChange={() => setRegistrationType('demo')}
                className="h-4 w-4"
              />
              <span className="text-center text-sm text-gray-800">{t('trial.optionDemo')}</span>
            </label>
          </fieldset>
          <button
            type="button"
            onClick={() => void signInWithGoogle()}
            className="min-h-12 w-full max-w-sm rounded-4xl border-2 border-gray-200 bg-[#FDFDFD] px-6 text-sm font-bold text-[#1a1a1a] transition-colors hover:bg-gray-50"
          >
            Google
          </button>
          <p className="text-center text-xs text-gray-500">
            {registrationType === 'trial' ? t('trial.signInHintTrial') : t('trial.signInHintDemo')}
          </p>
        </div>

        <form
          onSubmit={(e) => void onSubmit(e)}
          className="flex w-full max-w-lg flex-col items-center justify-center gap-4 rounded-4xl border border-gray-200 bg-white/80 p-6 shadow-md backdrop-blur-sm sm:p-8"
        >
          <label className="flex w-full flex-col items-center justify-center gap-2">
            <span className="text-sm font-bold text-gray-700">{t('trial.name')}</span>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="min-h-12 w-full rounded-4xl border border-gray-200 px-4 text-center"
            />
          </label>
          <label className="flex w-full flex-col items-center justify-center gap-2">
            <span className="text-sm font-bold text-gray-700">{t('trial.email')}</span>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="min-h-12 w-full rounded-4xl border border-gray-200 px-4 text-center"
            />
          </label>
          <label className="flex w-full flex-col items-center justify-center gap-2">
            <span className="text-sm font-bold text-gray-700">{t('trial.phone')}</span>
            <input
              required
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="min-h-12 w-full rounded-4xl border border-gray-200 px-4 text-center"
            />
          </label>
          <label className="flex w-full flex-col items-center justify-center gap-2">
            <span className="text-sm font-bold text-gray-700">{t('trial.sector')}</span>
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value as SectorId)}
              className="min-h-12 w-full rounded-4xl border border-gray-200 px-4 text-center"
            >
              {SECTORS.map((s) => (
                <option key={s.id} value={s.id}>
                  {locale === 'he' ? s.labelHe : s.labelEn}
                </option>
              ))}
            </select>
          </label>

          {message && (
            <p
              className={`w-full rounded-4xl px-4 py-3 text-center text-sm font-semibold ${
                message.kind === 'ok' ? 'bg-emerald-50 text-emerald-900' : 'bg-red-50 text-red-900'
              }`}
              role="status"
            >
              {message.text}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="min-h-12 w-full max-w-xs rounded-4xl px-8 text-sm font-black text-white disabled:opacity-50"
            style={{ backgroundColor: '#004694' }}
          >
            {busy ? '…' : t('trial.submit')}
          </button>
        </form>
      </div>
    </div>
  );
}
