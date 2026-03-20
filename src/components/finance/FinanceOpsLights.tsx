'use client';

import React, { useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/CompanyContext';
import { useCompanyAnomalyFlash } from '@/hooks/useCompanyAnomalyFlash';
import { useSubscription } from '@/hooks/useSubscription';
import Dashboard4Lights, { type FleetLight } from '@/components/shell/Dashboard4Lights';
import type { ProjectHealthRow } from '@/hooks/useCompanyFinancials';

export default function FinanceOpsLights({
  allProjects,
}: {
  allProjects: ProjectHealthRow[];
}) {
  const { user } = useAuth();
  const { companyId } = useCompany();
  const { active: anomalyActive } = useCompanyAnomalyFlash();
  const { meckanoModuleEnabled } = useSubscription();
  const [projectId, setProjectId] = useState('');
  const [scanBusy, setScanBusy] = useState(false);
  const [scanMsg, setScanMsg] = useState<string | null>(null);

  const lights: FleetLight[] = useMemo(
    () => [
      { id: 'sync', label: 'סנכרון נתונים', state: 'green', detail: 'Firestore / אירועים' },
      { id: 'security', label: 'אבטחה / מפתחות', state: 'amber', detail: 'BYOK Gemini' },
      { id: 'vision', label: 'Gramoshka Vision', state: 'green', detail: 'תכניות' },
      {
        id: 'meckano',
        label: 'Meckano',
        state: meckanoModuleEnabled ? 'green' : 'off',
        detail: meckanoModuleEnabled ? 'מופעל בתוכנית' : 'כבוי',
      },
      {
        id: 'anomaly',
        label: 'אנומליות (BOQ)',
        state: anomalyActive ? 'red' : 'green',
        flash: anomalyActive,
        detail: anomalyActive ? 'סטיה > 10% — בדיקה נדרשת' : 'בטווח התקין',
      },
    ],
    [anomalyActive, meckanoModuleEnabled]
  );

  const runScan = async () => {
    if (!user || !companyId || !projectId.trim()) {
      setScanMsg('בחרו פרויקט והתחברו.');
      return;
    }
    setScanBusy(true);
    setScanMsg(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/ai/anomaly-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ companyId, projectId: projectId.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setScanMsg((json as { error?: string }).error ?? 'סריקה נכשלה');
        return;
      }
      setScanMsg(
        (json as { anomaly?: boolean }).anomaly
          ? 'זוהתה אנומליה — נורית אדומה מהבהבת'
          : 'לא זוהתה סטיה משמעותית'
      );
    } catch (e) {
      setScanMsg(e instanceof Error ? e.message : 'שגיאה');
    } finally {
      setScanBusy(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-center gap-6">
      <Dashboard4Lights lights={lights} title="לוח בקרה תפעולי — 5 נורות" />
      <div className="flex w-full max-w-xl flex-col items-center justify-center gap-4 rounded-[32px] border border-gray-200 bg-[#FDFDFD] p-6">
        <p className="text-center text-sm font-bold text-[#001A4D]">הרצת מנוע אנומליות (מול BOQ + חשבוניות)</p>
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="w-full rounded-[32px] border border-gray-200 px-4 py-3 text-center text-sm font-bold"
        >
          <option value="">— בחרו פרויקט —</option>
          {allProjects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={scanBusy || !projectId}
          onClick={() => void runScan()}
          className="min-h-12 rounded-[32px] px-8 py-4 text-sm font-black text-white disabled:opacity-50"
          style={{ backgroundColor: '#001A4D' }}
        >
          {scanBusy ? 'סורק…' : 'הרץ סריקה'}
        </button>
        {scanMsg ? <p className="text-center text-xs font-bold text-gray-600">{scanMsg}</p> : null}
      </div>
    </div>
  );
}
