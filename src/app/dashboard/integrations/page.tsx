'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Plug, ExternalLink, DatabaseZap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { seedPrimaryCompany, PRIMARY_COMPANY_NAME, PRIMARY_ADMIN_NAME } from '@/services/firestore/seedService';

const BRAND = '#004694';
const ORANGE = '#FF8C00';

const PUBLIC_INTEGRATION_KEYS = new Set([
  'firebase',
  'database',
  'googleOAuth',
  'apiUrl',
  'apiAuth',
  'siteUrl',
  'meckano',
]);

type IntegrationStatusRow = {
  firebase: boolean;
  database: boolean;
  googleOAuth: boolean;
  apiUrl: boolean;
  apiAuth: boolean;
  siteUrl: boolean;
  gemini: boolean;
  meckano: boolean;
  mindStudio: boolean;
  googleMaps: boolean;
  groq: boolean;
  openRouter: boolean;
  googleDocumentAi: boolean;
  azureDocumentAi: boolean;
  scope?: 'admin' | 'public';
};

function IntegrationCard({
  title,
  description,
  connected,
  link,
}: {
  title: string;
  description: string;
  connected: boolean;
  link?: string;
}) {
  return (
    <div className="rounded-[32px] border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md active:shadow-sm sm:p-8">
      <div className="flex flex-row-reverse items-start justify-between gap-4">
        {link ? (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-[32px] p-2 text-gray-400 transition-colors hover:bg-[#004694]/5 hover:text-[#004694] active:bg-[#004694]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#004694]"
            aria-label="פתח קישור"
          >
            <ExternalLink size={20} className="shrink-0" />
          </a>
        ) : (
          <span className="min-w-11 shrink-0" aria-hidden />
        )}
        <div className="min-w-0 flex-1 text-right">
          <h3 className="text-lg font-bold text-[#1a1a1a] sm:text-xl">{title}</h3>
          <p className="mt-2 text-gray-500">{description}</p>
          <span
            className={`mt-4 inline-block rounded-[32px] px-4 py-2 text-sm font-medium ${
              connected ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
            }`}
          >
            {connected ? 'מחובר' : 'לא מוגדר'}
          </span>
        </div>
      </div>
    </div>
  );
}

const INTEGRATIONS: Array<{
  key: keyof IntegrationStatusRow;
  title: string;
  description: string;
  link?: string;
}> = [
  { key: 'firebase', title: 'Firebase', description: 'אימות ואחסון', link: 'https://firebase.google.com' },
  { key: 'database', title: 'Neon / Prisma', description: 'מסד נתונים PostgreSQL', link: 'https://neon.tech' },
  { key: 'googleOAuth', title: 'Google OAuth', description: 'התחברות ו־Drive', link: 'https://console.cloud.google.com' },
  { key: 'apiUrl', title: 'API (Nest)', description: 'כתובת שרת אחורי', link: undefined },
  { key: 'apiAuth', title: 'JWT / API Auth', description: 'אימות קריאות API', link: undefined },
  { key: 'siteUrl', title: 'כתובת האתר', description: 'NEXT_PUBLIC_SITE_URL', link: undefined },
  { key: 'gemini', title: 'Gemini AI', description: 'ניתוח מסמכים', link: 'https://ai.google.dev' },
  { key: 'meckano', title: 'מקאנו', description: 'נוכחות צוות', link: 'https://meckano.co.il' },
  { key: 'mindStudio', title: 'MindStudio', description: 'סריקת מסמכים ו־AI', link: 'https://mindstudio.ai' },
  { key: 'googleMaps', title: 'Google Maps', description: 'מפת נוכחות ואזורים', link: 'https://maps.google.com' },
  { key: 'groq', title: 'Groq', description: 'מנוע AI (צ\'אט/סריקה)', link: 'https://groq.com' },
  { key: 'openRouter', title: 'OpenRouter', description: 'מנועי AI מרובים', link: 'https://openrouter.ai' },
  { key: 'googleDocumentAi', title: 'Google Document AI', description: 'ניתוח מסמכים', link: 'https://cloud.google.com/document-ai' },
  { key: 'azureDocumentAi', title: 'Azure Document AI', description: 'ניתוח מסמכים', link: 'https://azure.microsoft.com/documentai' },
];

export default function IntegrationsPage() {
  const [status, setStatus] = useState<IntegrationStatusRow | null>(null);
  const [seedLoading, setSeedLoading] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const headers: HeadersInit = { cache: 'no-store' };
      try {
        if (user) {
          const t = await user.getIdToken();
          headers.Authorization = `Bearer ${t}`;
        }
        const res = await fetch('/api/integrations/status', { headers });
        const j = (await res.json()) as IntegrationStatusRow;
        if (!cancelled) setStatus(j);
      } catch {
        if (!cancelled) setStatus(null);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const visibleIntegrations = useMemo(() => {
    if (!status || status.scope === 'admin') return INTEGRATIONS;
    return INTEGRATIONS.filter((item) => PUBLIC_INTEGRATION_KEYS.has(item.key));
  }, [status]);

  const handleSeed = async () => {
    if (!user?.uid) {
      setSeedResult('יש להתחבר קודם עם Google.');
      return;
    }

    setSeedLoading(true);
    setSeedResult(null);

    try {
      await seedPrimaryCompany({ uid: user.uid, email: user.email });
      setSeedResult('Seed הושלם בהצלחה. החברה והאדמין נוצרו/עודכנו.');
    } catch (err) {
      setSeedResult(err instanceof Error ? err.message : 'Seed נכשל');
    } finally {
      setSeedLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-[#FFFFFF] p-4 pb-12 sm:p-8 md:p-12" dir="rtl">
      <header className="mb-8 flex flex-col items-center justify-center gap-3 text-center sm:mb-12 sm:flex-row sm:items-center">
        <div className="rounded-[32px] p-3" style={{ backgroundColor: `${BRAND}20` }}>
          <Plug className="h-8 w-8" style={{ color: BRAND }} aria-hidden />
        </div>
        <div>
          <h1 className="text-2xl font-black text-[#1a1a1a] sm:text-3xl">חיבורים</h1>
          <p className="mt-1 text-gray-500">סטטוס שירותים (מפתחות AI — למנהלי פלטפורמה מאומתים בלבד)</p>
        </div>
      </header>

      {status?.scope === 'public' && (
        <p className="mx-auto mb-6 max-w-2xl rounded-[32px] border border-amber-200 bg-amber-50/90 px-4 py-3 text-center text-sm font-bold text-amber-950">
          מוצגים כאן רק סטטוסי תשתית. פרטי מנועי AI מוסתרים — התחברו עם אימייל מנהל פלטפורמה כדי לראות את הלוח המלא.
        </p>
      )}

      <div className="mb-8 rounded-[32px] border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-4 flex flex-row-reverse items-center gap-3">
          <DatabaseZap className="h-6 w-6 shrink-0" style={{ color: ORANGE }} />
          <h2 className="text-right text-xl font-bold text-[#1a1a1a]">אתחול חברה ראשית (חד-פעמי)</h2>
        </div>

        <p className="mb-2 text-right text-gray-600">חברה: {PRIMARY_COMPANY_NAME}</p>
        <p className="mb-6 text-right text-gray-600">אדמין ראשי: {PRIMARY_ADMIN_NAME}</p>

        <button
          type="button"
          onClick={handleSeed}
          disabled={seedLoading}
          className="btn-primary-empire min-h-12 rounded-[32px] px-6 py-3 text-base font-bold text-white transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#004694] disabled:opacity-60"
          style={{ backgroundColor: ORANGE }}
        >
          {seedLoading ? 'מאתחל...' : 'בצע Seed ראשוני'}
        </button>

        {seedResult && <p className="mt-4 text-right text-sm text-gray-700">{seedResult}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
        {visibleIntegrations.map((item) => (
          <IntegrationCard
            key={item.key}
            title={item.title}
            description={item.description}
            connected={status ? Boolean(status[item.key]) : false}
            link={item.link}
          />
        ))}
      </div>
    </div>
  );
}
