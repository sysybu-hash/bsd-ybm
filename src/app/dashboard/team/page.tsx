'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Users, Map, ClipboardList, MapPin, UserCheck, BarChart3, Settings } from 'lucide-react';
import { useMeckanoData } from './useMeckanoData';
import type { AuthorizedZone } from '@/components/AuthorizedZoneEditor';
import { useSubscription } from '@/hooks/useSubscription';
import { useLocale } from '@/context/LocaleContext';

const MeckanoMap = dynamic(() => import('@/components/MeckanoMap'), {
  ssr: false,
  loading: () => (
    <div className="rounded-[32px] border border-gray-200 bg-gray-50 min-h-[400px] flex items-center justify-center text-gray-400">
      טוען מפה...
    </div>
  ),
});

const AuthorizedZoneEditor = dynamic(
  () => import('@/components/AuthorizedZoneEditor').then((m) => m.default),
  { ssr: false }
);

const TABS = [
  { id: 'map', label: 'מפה', icon: Map },
  { id: 'attendance', label: 'נוכחות', icon: ClipboardList },
  { id: 'zones', label: 'אזורים מורשים', icon: MapPin },
  { id: 'employees', label: 'עובדים', icon: UserCheck },
  { id: 'reports', label: 'דוחות', icon: BarChart3 },
  { id: 'settings', label: 'הגדרות', icon: Settings },
] as const;

export default function TeamPage() {
  const { meckanoModuleEnabled, loading: subLoading } = useSubscription();
  const { t, dir } = useLocale();
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]['id']>('map');
  const [zoneEditorOpen, setZoneEditorOpen] = useState(false);
  const [zones, setZones] = useState<AuthorizedZone[]>([]);
  const { attendance, loading, error } = useMeckanoData();

  if (subLoading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[#FDFDFD] p-12" dir={dir}>
        <p className="text-center text-gray-500">{t('team.loading')}</p>
      </div>
    );
  }

  if (!meckanoModuleEnabled) {
    return (
      <div
        className="flex min-h-full flex-col items-center justify-center gap-6 bg-[#FDFDFD] p-12"
        dir={dir}
      >
        <p className="max-w-md text-center text-gray-600">{t('team.meckanoDisabled')}</p>
        <Link
          href="/dashboard/settings/integrations"
          className="flex min-h-12 items-center justify-center rounded-4xl border border-gray-200 bg-white px-8 text-sm font-bold text-[#004694]"
        >
          {t('team.meckanoDisabledCta')}
        </Link>
      </div>
    );
  }

  const handleSaveZone = (zone: AuthorizedZone) => {
    setZones((prev) => [...prev, zone]);
  };

  return (
    <div className="min-h-full bg-[#FFFFFF] p-4 pb-12 sm:p-8 md:p-12">
      <header className="mb-8 flex flex-col items-center justify-center gap-3 text-center sm:mb-12 sm:flex-row sm:items-center">
        <div className="rounded-[40px] bg-[#004694]/10 p-3">
          <Users className="h-8 w-8 text-[#004694]" aria-hidden />
        </div>
        <div>
          <h1 className="text-2xl font-black text-[#1a1a1a] sm:text-3xl">{t('team.title')}</h1>
          <p className="mt-1 text-gray-500">{t('team.subtitle')}</p>
        </div>
      </header>

      <div className="mb-8 flex gap-2 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-[40px] px-5 py-3 font-medium transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#004694] ${
              activeTab === tab.id
                ? 'bg-[#004694] text-white shadow-lg'
                : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 active:bg-gray-100'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'map' && (
        <MeckanoMap className="w-full" />
      )}

      {activeTab === 'attendance' && (
        <div className="bg-white rounded-[32px] border border-gray-100 p-8">
          {loading && <p className="text-gray-500">טוען נוכחות...</p>}
          {error && <p className="text-red-600">{error}</p>}
          {!loading && !error && attendance && (
            <pre className="text-sm text-gray-700 overflow-auto max-h-[400px]">
              {JSON.stringify(attendance, null, 2)}
            </pre>
          )}
          {!loading && !error && !attendance && (
            <p className="text-gray-500">אין נתוני נוכחות</p>
          )}
        </div>
      )}

      {activeTab === 'zones' && (
        <div className="bg-white rounded-[32px] border border-gray-100 p-8">
          <button
            type="button"
            onClick={() => setZoneEditorOpen(true)}
            className="mb-6 px-6 py-3 rounded-[32px] text-white font-bold"
            style={{ backgroundColor: '#004694' }}
          >
            הוסף אזור מורשה
          </button>
          {zones.length === 0 ? (
            <p className="text-gray-500">לא הוגדרו אזורים. הוסף אזור מורשה.</p>
          ) : (
            <ul className="space-y-3">
              {zones.map((z, i) => (
                <li
                  key={i}
                  className="p-4 rounded-[32px] border border-gray-100 flex justify-between items-center"
                >
                  <span className="font-medium">{z.name}</span>
                  <span className="text-gray-500 text-sm">{z.address} — רדיוס {z.radiusMeters}מ</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {activeTab === 'employees' && (
        <div className="bg-white rounded-[32px] border border-gray-100 p-12 flex items-center justify-center min-h-[300px]">
          <p className="text-gray-400">רשימת עובדים — בהמשך יוצגו כאן העובדים ממקאנו.</p>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="bg-white rounded-[32px] border border-gray-100 p-12 flex items-center justify-center min-h-[300px]">
          <p className="text-gray-400">דוחות והנהלת חשבונות — בהכנה.</p>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="bg-white rounded-[32px] border border-gray-100 p-12 flex items-center justify-center min-h-[300px]">
          <p className="text-gray-400">הגדרות צוות מקאנו — בהכנה.</p>
        </div>
      )}

      <AuthorizedZoneEditor
        open={zoneEditorOpen}
        onClose={() => setZoneEditorOpen(false)}
        onSave={handleSaveZone}
      />
    </div>
  );
}
