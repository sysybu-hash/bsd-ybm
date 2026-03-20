'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, FileText } from 'lucide-react';
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/CompanyContext';
import { getDb } from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';
import ContractTemplateEditor from '@/components/contracts/ContractTemplateEditor';
import { CONTRACT_PLACEHOLDER_HELP } from '@/lib/contracts/placeholders';
import { MEUHEDET } from '@/components/shell/meuhedet-theme';

const DEFAULT_TEMPLATE = `<h2>הסכם שירות / פרויקט בנייה</h2>
<p>בין <strong>{{companyName}}</strong> לבין הלקוח <strong>{{clientName}}</strong>, בפרויקט <strong>{{projectName}}</strong>.</p>
<p>תקציב משוער: <strong>{{projectBudget}}</strong> ₪ (כולל מע״מ לפי הצורך).</p>
<p>תאריכי יעד: התחלה {{projectStartDate}} · סיום {{projectEndDate}}</p>
<p>התנאים המלאים יפורטו בהמשך ובנספחים.</p>`;

export default function ContractTemplateSettingsPage() {
  const { user } = useAuth();
  const { companyId, isCompanyAdmin } = useCompany();
  const [html, setHtml] = useState(DEFAULT_TEMPLATE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId || !isFirebaseConfigured()) {
      setLoading(false);
      return;
    }
    const ref = doc(getDb(), 'companies', companyId, 'templates', 'contract');
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const d = snap.data() as { bodyHtml?: string } | undefined;
        if (d?.bodyHtml && typeof d.bodyHtml === 'string') {
          setHtml(d.bodyHtml);
        }
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, [companyId]);

  const save = useCallback(async () => {
    if (!user || !companyId || !isCompanyAdmin) return;
    setSaving(true);
    setMsg(null);
    try {
      await setDoc(
        doc(getDb(), 'companies', companyId, 'templates', 'contract'),
        {
          bodyHtml: html,
          kind: 'master_contract',
          updatedAt: serverTimestamp(),
          updatedByUid: user.uid,
        },
        { merge: true }
      );
      setMsg('התבנית נשמרה.');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'שגיאה');
    } finally {
      setSaving(false);
    }
  }, [user, companyId, isCompanyAdmin, html]);

  if (!isCompanyAdmin) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-12 text-center text-sm text-gray-600" dir="rtl">
        גישה למנהלי חברה בלבד.
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#F4F5F7] p-6 pb-28 pt-safe px-safe sm:p-8 md:p-12" dir="rtl">
      <div className="mb-8 flex items-center justify-center gap-4">
        <Link
          href="/dashboard/settings/integrations"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[32px] px-3 text-sm font-bold text-gray-500 hover:text-[#001A4D]"
        >
          <ArrowRight className="h-4 w-4" aria-hidden />
          חזרה להגדרות
        </Link>
      </div>

      <header className="mb-10 flex flex-col items-center justify-center gap-4 text-center">
        <div className="rounded-[32px] p-3" style={{ backgroundColor: `${MEUHEDET.blue}18` }}>
          <FileText className="h-8 w-8" style={{ color: MEUHEDET.blue }} aria-hidden />
        </div>
        <div>
          <h1 className="text-2xl font-black text-[#001A4D]">תבנית הסכם דיגיטלי</h1>
          <p className="mt-2 max-w-xl text-sm text-gray-600">
            עורכים את נוסח ההסכם המאוחד לפרויקטים. {CONTRACT_PLACEHOLDER_HELP}
          </p>
        </div>
      </header>

      {!companyId && <p className="text-center text-gray-500">בחרו חברה מהמתג.</p>}

      {companyId && (
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-center gap-6">
          {loading ? (
            <p className="text-sm text-gray-500">טוען…</p>
          ) : (
            <ContractTemplateEditor key={`${companyId}-loaded`} initialHtml={html} onChangeHtml={setHtml} />
          )}
          <button
            type="button"
            disabled={saving || loading}
            onClick={() => void save()}
            className="min-h-12 rounded-[32px] px-10 py-4 text-sm font-black text-white shadow-md disabled:opacity-50"
            style={{ backgroundColor: MEUHEDET.orange }}
          >
            {saving ? 'שומר…' : 'שמירת תבנית'}
          </button>
          {msg ? (
            <p className="text-center text-sm font-bold text-[#001A4D]" role="status">
              {msg}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
