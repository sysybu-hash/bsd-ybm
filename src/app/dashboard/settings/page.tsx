'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  FileText,
  Lock,
  Settings2,
  Users,
  ScrollText,
  Activity,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { useCompany } from '@/context/CompanyContext';
import { useLocale } from '@/context/LocaleContext';
import { isFirebaseConfigured } from '@/lib/firebase';

/** Client-side env diagnostics — shows which keys are present */
function EnvDiagnosticBanner({ locale }: { locale: string }) {
  const isHe = locale === 'he';
  const fbConfigured = isFirebaseConfigured();

  const checks = [
    { key: 'NEXT_PUBLIC_FIREBASE_API_KEY', label: 'Firebase API Key', present: fbConfigured },
    { key: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID', label: 'Firebase Project ID', present: fbConfigured },
    {
      key: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
      label: 'Firebase Auth Domain',
      present: !!(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
    },
  ];

  const allGood = checks.every((c) => c.present);

  if (allGood) {
    return (
      <div className="mx-auto mb-6 flex max-w-3xl items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
        {isHe ? 'Firebase מוגדר כראוי — כל מפתחות הסביבה נמצאו.' : 'Firebase is properly configured — all env keys found.'}
      </div>
    );
  }

  return (
    <div className="mx-auto mb-6 max-w-3xl rounded-xl border border-orange-200 bg-orange-50 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-bold text-orange-800">
        <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden />
        {isHe
          ? 'חסרים קובצי סביבה — הסבר server_not_configured'
          : 'Missing env vars — explains server_not_configured errors'}
      </div>
      <div className="mb-3 space-y-1.5">
        {checks.map((c) => (
          <div key={c.key} className="flex items-center gap-2 text-xs">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${c.present ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <code className="font-mono text-gray-700">{c.key}</code>
            <span className={`font-semibold ${c.present ? 'text-emerald-700' : 'text-red-600'}`}>
              {c.present ? '✓' : isHe ? '✗ חסר' : '✗ missing'}
            </span>
          </div>
        ))}
      </div>
      <p className="text-xs text-orange-700">
        {isHe
          ? 'העתק את הקובץ .env.local.example לקובץ .env.local והשלם את הערכים מה-Firebase Console.'
          : 'Copy .env.local.example → .env.local and fill in values from Firebase Console → Project Settings.'}
      </p>
    </div>
  );
}

const LINKS = [
  { href: '/dashboard/settings/security', icon: Lock, labelHe: 'אבטחה וזמן', labelEn: 'Security & timer', minRole: 'all' as const },
  { href: '/dashboard/settings/company', icon: Building2, labelHe: 'מותג חברה', labelEn: 'Company brand', minRole: 'admin' as const },
  {
    href: '/dashboard/settings/integrations',
    icon: Settings2,
    labelHe: 'חיבורים',
    labelEn: 'Integrations',
    minRole: 'admin' as const,
  },
  {
    href: '/dashboard/settings/contracts',
    icon: FileText,
    labelHe: 'תבניות הסכם',
    labelEn: 'Contract templates',
    minRole: 'admin' as const,
  },
  { href: '/dashboard/settings/users', icon: Users, labelHe: 'משתמשים', labelEn: 'Users', minRole: 'admin' as const },
  { href: '/dashboard/settings/logs', icon: ScrollText, labelHe: 'יומנים', labelEn: 'Logs', minRole: 'admin' as const },
  { href: '/dashboard/settings/sync-status', icon: Activity, labelHe: 'סטטוס סנכרון', labelEn: 'Sync status', minRole: 'admin' as const },
];

export default function SettingsHubPage() {
  const { isCompanyAdmin } = useCompany();
  const { dir, locale } = useLocale();
  const title = locale === 'he' ? 'הגדרות' : 'Settings';
  const subtitle =
    locale === 'he' ? 'Jerusalem Builders ERP — bsd-ybm' : 'Jerusalem Builders ERP — bsd-ybm';

  const visible = LINKS.filter((l) => l.minRole === 'all' || (l.minRole === 'admin' && isCompanyAdmin));

  return (
    <div className="min-h-full bg-white p-4 pb-16 sm:p-8 md:p-12" dir={dir}>
      <EnvDiagnosticBanner locale={locale} />
      <header className="mb-8 flex flex-col items-center justify-center gap-4 text-center sm:mb-12">
        <h1 className="text-2xl font-black text-[#0f172a] sm:text-3xl">{title}</h1>
        <p className="text-sm font-medium text-slate-500">{subtitle}</p>
        <Link
          href="/dashboard"
          className="inline-flex min-h-12 items-center justify-center gap-4 rounded-[32px] border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          {locale === 'he' ? 'חזרה לדשבורד' : 'Back to dashboard'}
        </Link>
      </header>

      <div className="mx-auto grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
        {visible.map(({ href, icon: Icon, labelHe, labelEn }) => (
          <Link
            key={href}
            href={href}
            className="flex min-h-[120px] flex-col items-center justify-center gap-4 rounded-[32px] border border-slate-200 bg-white p-6 text-center shadow-sm transition-shadow hover:border-[#004694]/30 hover:shadow-md"
          >
            <div className="rounded-[32px] bg-[#004694]/10 p-3">
              <Icon className="h-7 w-7 text-[#004694]" aria-hidden />
            </div>
            <span className="font-bold text-slate-900">{locale === 'he' ? labelHe : labelEn}</span>
            <ArrowRight className={`h-4 w-4 text-slate-400 ${dir === 'rtl' ? 'rotate-180' : ''}`} aria-hidden />
          </Link>
        ))}
      </div>

      {!isCompanyAdmin && (
        <p className="mx-auto mt-8 max-w-lg text-center text-sm text-slate-500">
          {locale === 'he'
            ? 'חלק מההגדרות זמינות למנהלי חברה בלבד.'
            : 'Some settings are available to company admins only.'}
        </p>
      )}
    </div>
  );
}
