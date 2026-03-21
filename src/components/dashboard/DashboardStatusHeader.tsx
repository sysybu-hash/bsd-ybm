'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { onSnapshot, query, where, limit, doc, setDoc, serverTimestamp, type Timestamp } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/CompanyContext';
import { useLocale } from '@/context/LocaleContext';
import { useDashboardDiagnostics } from '@/context/DashboardDiagnosticsContext';
import { useDashboardHealthLeds } from '@/hooks/useDashboardHealthLeds';
import { useSubscription } from '@/hooks/useSubscription';
import {
  getDb,
  companyRegistrationQueueRef,
  companyPresenceRef,
  companyRuntimeErrorsRef,
} from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';
import ConnectionTroubleshootModal from '@/components/dashboard/ConnectionTroubleshootModal';
import PublicHeaderClock from '@/components/shell/PublicHeaderClock';
import AdminVerifiedBadge from '@/components/shell/AdminVerifiedBadge';

const GREEN = '#22c55e';
const BLUE = '#004694';
const MEEKANO_LED_BLUE = '#2563eb';
const ORANGE_LED = '#FF8C00';
const RED = '#ef4444';

const ONLINE_WINDOW_MS = 2 * 60 * 1000;
const ERROR_WINDOW_MS = 60 * 60 * 1000;

function tsToMs(v: unknown): number {
  if (v && typeof v === 'object' && 'toMillis' in v && typeof (v as Timestamp).toMillis === 'function') {
    return (v as Timestamp).toMillis();
  }
  return 0;
}

type LedProps = {
  color: string;
  active: boolean;
  pulse?: boolean;
  label: string;
  href?: string;
  onClick?: () => void;
};

function StatusLed({ color, active, pulse, label, href, onClick }: LedProps) {
  const glow = active
    ? { boxShadow: `0 0 12px 2px ${color}`, opacity: 1 }
    : { boxShadow: 'none', opacity: 0.35 };

  const circle = (
    <motion.span
      className="w-3 h-3 rounded-full shrink-0 border border-white/40"
      style={{ backgroundColor: color, ...glow }}
      animate={pulse && active ? { opacity: [1, 0.35, 1], scale: [1, 0.92, 1] } : undefined}
      transition={pulse && active ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' } : undefined}
    />
  );

  const content = (
    <span className="flex items-center justify-center gap-3 min-w-0">
      {circle}
      <span className="text-xs font-bold text-gray-600 truncate">{label}</span>
    </span>
  );

  const className =
    'flex min-h-12 w-full min-w-0 flex-1 items-center justify-center rounded-4xl border border-gray-100 bg-white px-4 py-3 transition-colors hover:bg-gray-50 active:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF8C00] sm:max-w-[200px]';

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className={className} onClick={onClick}>
      {content}
    </button>
  );
}

export default function DashboardStatusHeader() {
  const { user, isConfigured } = useAuth();
  const { companyId, isCompanyAdmin } = useCompany();
  const { t, locale } = useLocale();
  const { meckanoKeyConfigured, meckanoLastSyncedAt, meckanoModuleEnabled } = useSubscription();
  const { errors: clientErrors } = useDashboardDiagnostics();
  const {
    projectHealthCritical,
    staleClientTaskActive,
    scanReviewActive,
  } = useDashboardHealthLeds();

  const [browserOnline, setBrowserOnline] = useState(true);
  const [firestoreState, setFirestoreState] = useState<'unknown' | 'ok' | 'fail'>('unknown');
  const [pendingRegistrationCount, setPendingRegistrationCount] = useState(0);
  const [firestoreRuntimeErrorHits, setFirestoreRuntimeErrorHits] = useState(0);
  const [onlineUserCount, setOnlineUserCount] = useState(0);
  const [apiHealthOk, setApiHealthOk] = useState<boolean | null>(null);
  const [healthMessage, setHealthMessage] = useState<string | undefined>();
  const [meckanoEndpointOk, setMeckanoEndpointOk] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const up = () => setBrowserOnline(navigator.onLine);
    const down = () => setBrowserOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    setBrowserOnline(navigator.onLine);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch('/api/health', { cache: 'no-store' });
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;
        setApiHealthOk(res.ok && json.ok === true);
        setHealthMessage(!res.ok ? (json.error as string) || 'שגיאת שרת' : undefined);
      } catch {
        if (!cancelled) {
          setApiHealthOk(false);
          setHealthMessage('לא ניתן להגיע ל־API');
        }
      }
    };
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (!meckanoModuleEnabled) {
      setMeckanoEndpointOk(true);
      return;
    }
    let cancelled = false;
    const tick = async () => {
      try {
        const integ = await fetch('/api/integrations/status', { cache: 'no-store' }).then((r) => r.json());
        if (cancelled) return;
        const required = !!integ.meckano;
        if (!required) {
          setMeckanoEndpointOk(true);
          return;
        }
        const m = await fetch('/api/meckano/attendance', { cache: 'no-store' });
        const body = await m.json().catch(() => ({}));
        if (cancelled) return;
        const failed = !m.ok || (body && typeof body === 'object' && 'error' in body && body.error);
        setMeckanoEndpointOk(!failed);
      } catch {
        if (!cancelled) setMeckanoEndpointOk(false);
      }
    };
    tick();
    const id = window.setInterval(tick, 45_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [meckanoModuleEnabled]);

  useEffect(() => {
    if (!isConfigured || !user?.uid) {
      setFirestoreState('unknown');
      return;
    }
    const ref = doc(getDb(), 'users', user.uid);
    const unsub = onSnapshot(
      ref,
      () => setFirestoreState('ok'),
      () => setFirestoreState('fail')
    );
    return () => unsub();
  }, [isConfigured, user?.uid]);

  useEffect(() => {
    if (!companyId || !isConfigured) {
      setPendingRegistrationCount(0);
      return;
    }
    const q = query(
      companyRegistrationQueueRef(companyId),
      where('status', '==', 'pending'),
      limit(50)
    );
    const unsub = onSnapshot(
      q,
      (snap) => setPendingRegistrationCount(snap.size),
      () => setPendingRegistrationCount(0)
    );
    return () => unsub();
  }, [companyId, isConfigured]);

  useEffect(() => {
    if (!companyId || !isConfigured) {
      setFirestoreRuntimeErrorHits(0);
      return;
    }
    const since = Date.now() - ERROR_WINDOW_MS;
    const q = query(companyRuntimeErrorsRef(companyId), where('at', '>', since), limit(40));
    const unsub = onSnapshot(
      q,
      (snap) => setFirestoreRuntimeErrorHits(snap.size),
      () => setFirestoreRuntimeErrorHits(0)
    );
    return () => unsub();
  }, [companyId, isConfigured]);

  useEffect(() => {
    if (!companyId || !user?.uid || !isConfigured) return;
    const ref = doc(getDb(), 'companies', companyId, 'presence', user.uid);
    const write = () => {
      setDoc(
        ref,
        {
          uid: user.uid,
          displayName: user.displayName ?? null,
          email: user.email ?? null,
          lastSeen: serverTimestamp(),
        },
        { merge: true }
      ).catch(() => {});
    };
    write();
    const id = window.setInterval(write, 30_000);
    return () => window.clearInterval(id);
  }, [companyId, user?.uid, user?.displayName, user?.email, isConfigured]);

  useEffect(() => {
    if (!companyId || !isConfigured) {
      setOnlineUserCount(0);
      return;
    }
    const unsub = onSnapshot(
      companyPresenceRef(companyId),
      (snap) => {
        const now = Date.now();
        let n = 0;
        snap.forEach((d) => {
          const data = d.data() as { lastSeen?: unknown };
          const ms = tsToMs(data.lastSeen);
          if (ms && now - ms < ONLINE_WINDOW_MS) n += 1;
        });
        setOnlineUserCount(n);
      },
      () => setOnlineUserCount(0)
    );
    return () => unsub();
  }, [companyId, isConfigured]);

  const clientErrorActive = useMemo(
    () => clientErrors.some((e) => Date.now() - e.at < ERROR_WINDOW_MS),
    [clientErrors]
  );

  const greenOn =
    browserOnline &&
    isConfigured &&
    !!user &&
    firestoreState === 'ok' &&
    apiHealthOk === true &&
    (!meckanoModuleEnabled || meckanoEndpointOk) &&
    !!companyId;

  const blueNeedsAttention = pendingRegistrationCount > 0 || scanReviewActive;
  const blueSolid = !blueNeedsAttention;
  const blueFlash = blueNeedsAttention;

  const orangeOn =
    clientErrorActive || firestoreRuntimeErrorHits > 0 || staleClientTaskActive;

  const redOn =
    !browserOnline ||
    !isConfigured ||
    !user ||
    apiHealthOk === false ||
    firestoreState === 'fail' ||
    (!!companyId && projectHealthCritical);

  const meckanoTooltip = useMemo(() => {
    if (!meckanoKeyConfigured) return t('meckano.led.disconnected');
    if (meckanoLastSyncedAt) {
      const loc = locale === 'he' ? 'he-IL' : 'en-US';
      return `${t('meckano.led.lastSynced')} ${meckanoLastSyncedAt.toLocaleString(loc)}`;
    }
    return t('meckano.led.connected');
  }, [meckanoKeyConfigured, meckanoLastSyncedAt, t, locale]);

  const meckanoLedClass =
    'flex min-h-12 w-full min-w-0 flex-1 items-center justify-center rounded-4xl border border-gray-100 bg-white px-4 py-3 transition-colors hover:bg-gray-50 active:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF8C00] sm:max-w-[200px]';

  const meckanoLedInner = (
    <span className="flex min-w-0 items-center justify-center gap-3">
      <motion.span
        className="h-3 w-3 shrink-0 rounded-full border border-white/40"
        style={{
          backgroundColor: MEEKANO_LED_BLUE,
          boxShadow: meckanoKeyConfigured ? `0 0 12px 2px ${MEEKANO_LED_BLUE}` : 'none',
          opacity: meckanoKeyConfigured ? 1 : 0.35,
        }}
      />
      <span className="truncate text-xs font-bold text-gray-600">{t('meckano.led.label')}</span>
    </span>
  );

  return (
    <>
      <header className="shrink-0 border-b border-gray-100 bg-[#FFFFFF] px-4 py-4 pt-safe px-safe sm:px-8 sm:py-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid w-full grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-4">
            <StatusLed
              color={GREEN}
              active={greenOn}
              label="סנכרון מערכת"
              href="/dashboard/settings/sync-status"
            />
            <StatusLed
              color={BLUE}
              active={blueSolid || blueFlash}
              pulse={blueFlash}
              label="אישורים וסריקות"
              href={
                pendingRegistrationCount > 0
                  ? '/dashboard/settings/users'
                  : scanReviewActive
                    ? '/scan'
                    : '/dashboard/settings/users'
              }
            />
            <StatusLed
              color={ORANGE_LED}
              active={orangeOn}
              label="שגיאות מערכת"
              href="/dashboard/settings/logs"
            />
            <StatusLed
              color={RED}
              active={redOn}
              label="חיבור / תקלה"
              onClick={() => setModalOpen(true)}
            />
            {meckanoModuleEnabled &&
              (isCompanyAdmin ? (
                <Link href="/dashboard/settings/integrations" className={meckanoLedClass} title={meckanoTooltip}>
                  {meckanoLedInner}
                </Link>
              ) : (
                <div className={meckanoLedClass} title={meckanoTooltip}>
                  {meckanoLedInner}
                </div>
              ))}
          </div>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <AdminVerifiedBadge />
            <div
              className="inline-flex items-center justify-center gap-3 rounded-4xl border border-gray-100 bg-white px-6 py-3 shadow-sm"
              title="משתמשים פעילים בחברה הנבחרת (לפי דופק נוכחות ב־Firestore)"
            >
              {/* Show at least 1 when the current user is signed in — optimistic self-count */}
              {(() => {
                const displayCount = isConfigured && !!user && !!companyId
                  ? Math.max(onlineUserCount, 1)
                  : onlineUserCount;
                return (
                  <>
                    <motion.span
                      className="h-3 w-3 shrink-0 rounded-full border border-white/40"
                      style={{ backgroundColor: GREEN }}
                      animate={displayCount > 0 ? { opacity: [1, 0.4, 1], scale: [1, 0.9, 1] } : undefined}
                      transition={displayCount > 0 ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : undefined}
                    />
                    <span className="text-sm font-black text-[#1a1a1a]">
                      מחוברים עכשיו: {displayCount}
                    </span>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </header>

      <div className="shrink-0 bg-[#001A4D]">
        <PublicHeaderClock />
      </div>

      <ConnectionTroubleshootModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        browserOnline={browserOnline}
        firebaseConfigured={isConfigured}
        userSignedIn={!!user}
        firestoreState={firestoreState}
        apiHealthOk={apiHealthOk}
        lastHealthMessage={healthMessage}
      />
    </>
  );
}
