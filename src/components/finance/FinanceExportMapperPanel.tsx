'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import {
  EXPORT_TEMPLATES,
  exportFinanceDataset,
  mergeFieldMapping,
  triggerBrowserDownload,
  type BsdFieldKey,
  type ExportFormat,
  type FieldMapping,
  type FinanceSoftware,
} from '@/services/finance/ExportFactory';
import { fetchCompanyFinanceRows } from '@/services/reports/financesCsvExport';
import { getDb } from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';
import { useLocale } from '@/context/LocaleContext';

const SOFTWARE_ORDER: FinanceSoftware[] = ['hashvashvet', 'priority', 'sap', 'quickbooks', 'generic_csv'];

const BSD_FIELD_LIST: { key: BsdFieldKey; labelHe: string; labelEn: string }[] = [
  { key: 'recordId', labelHe: 'מזהה רשומה', labelEn: 'Record ID' },
  { key: 'date', labelHe: 'תאריך', labelEn: 'Date' },
  { key: 'amount', labelHe: 'סכום', labelEn: 'Amount' },
  { key: 'currency', labelHe: 'מטבע', labelEn: 'Currency' },
  { key: 'vendor', labelHe: 'ספק (שם)', labelEn: 'Vendor name' },
  { key: 'supplierId', labelHe: 'מזהה ספק', labelEn: 'Supplier ID' },
  { key: 'tax', labelHe: 'מס / מע״מ', labelEn: 'Tax / VAT' },
  { key: 'projectId', labelHe: 'פרויקט / מחלקה', labelEn: 'Project / class' },
  { key: 'category', labelHe: 'קטגוריה', labelEn: 'Category' },
  { key: 'type', labelHe: 'סוג תנועה', labelEn: 'Transaction type' },
  { key: 'description', labelHe: 'תיאור', labelEn: 'Description' },
  { key: 'hours', labelHe: 'שעות', labelEn: 'Hours' },
  { key: 'teamMemberName', labelHe: 'עובד', labelEn: 'Team member' },
];

type FirestoreExportDoc = {
  software?: FinanceSoftware;
  mapping?: FieldMapping;
  format?: ExportFormat;
};

export default function FinanceExportMapperPanel({ companyId }: { companyId: string | null }) {
  const { t, dir, locale } = useLocale();
  const [software, setSoftware] = useState<FinanceSoftware>('hashvashvet');
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [mapping, setMapping] = useState<FieldMapping>(() => ({
    ...EXPORT_TEMPLATES.hashvashvet.defaultMapping,
  }));
  const [loadingDoc, setLoadingDoc] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId || !isFirebaseConfigured()) {
      setLoadingDoc(false);
      return;
    }
    const ref = doc(getDb(), 'companies', companyId, 'settings', 'financeExport');
    const unsub = onSnapshot(
      ref,
      (snap) => {
        setLoadingDoc(false);
        if (!snap.exists()) return;
        const d = snap.data() as FirestoreExportDoc;
        if (d.software && EXPORT_TEMPLATES[d.software]) {
          setSoftware(d.software);
        }
        if (d.format === 'csv' || d.format === 'xlsx' || d.format === 'json') {
          setFormat(d.format);
        }
        if (d.mapping && typeof d.mapping === 'object') {
          setMapping(mergeFieldMapping(d.software ?? 'hashvashvet', d.mapping as FieldMapping));
        }
      },
      () => setLoadingDoc(false)
    );
    return () => unsub();
  }, [companyId]);

  const templateKeys = useMemo(() => EXPORT_TEMPLATES[software].columnOrder, [software]);

  const handleSoftwareChange = (s: FinanceSoftware) => {
    setSoftware(s);
    setMapping({ ...EXPORT_TEMPLATES[s].defaultMapping });
  };

  const saveMapping = useCallback(async () => {
    if (!companyId || !isFirebaseConfigured()) return;
    setBusy(true);
    setMessage(null);
    try {
      await setDoc(
        doc(getDb(), 'companies', companyId, 'settings', 'financeExport'),
        {
          software,
          format,
          mapping,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setMessage(t('finance.export.saveOk'));
    } catch {
      setMessage(t('finance.export.saveFail'));
    } finally {
      setBusy(false);
    }
  }, [companyId, software, format, mapping, t]);

  const resetDefaults = useCallback(() => {
    setMapping({ ...EXPORT_TEMPLATES[software].defaultMapping });
    setMessage(null);
  }, [software]);

  const runExport = useCallback(async () => {
    if (!companyId) return;
    setBusy(true);
    setMessage(null);
    try {
      const rows = await fetchCompanyFinanceRows(companyId);
      const artifact = await exportFinanceDataset(rows, software, format, mapping);
      triggerBrowserDownload(artifact);
      setMessage(t('finance.export.downloadOk'));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : t('finance.export.downloadFail'));
    } finally {
      setBusy(false);
    }
  }, [companyId, software, format, mapping, t]);

  const bsdLabel = (key: BsdFieldKey) => {
    const row = BSD_FIELD_LIST.find((x) => x.key === key);
    if (!row) return key;
    return locale === 'he' ? row.labelHe : row.labelEn;
  };

  if (!companyId) return null;

  return (
    <section
      className="flex w-full max-w-4xl flex-col items-center justify-center gap-4 rounded-4xl border border-gray-100 bg-[#FDFDFD] p-6 sm:p-8"
      dir={dir}
    >
      <div className="flex w-full flex-col items-center justify-center gap-2 text-center">
        <h2 className="text-lg font-black text-[#1a1a1a]" style={{ color: 'var(--brand-primary, #004694)' }}>
          {t('finance.export.mapperTitle')}
        </h2>
        <p className="text-sm text-gray-500">{t('finance.export.mapperHint')}</p>
      </div>

      <div className="flex w-full flex-col items-center justify-center gap-4 sm:flex-row sm:flex-wrap">
        <label className="flex flex-col items-center justify-center gap-2 text-sm font-bold text-gray-600">
          {t('finance.export.software')}
          <select
            value={software}
            onChange={(e) => handleSoftwareChange(e.target.value as FinanceSoftware)}
            className="min-h-11 min-w-[200px] rounded-4xl border border-gray-200 bg-white px-4 py-2 text-center"
            disabled={loadingDoc || busy}
          >
            {SOFTWARE_ORDER.map((s) => (
              <option key={s} value={s}>
                {locale === 'he' ? EXPORT_TEMPLATES[s].labelHe : EXPORT_TEMPLATES[s].labelEn}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col items-center justify-center gap-2 text-sm font-bold text-gray-600">
          {t('finance.export.format')}
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as ExportFormat)}
            className="min-h-11 min-w-[160px] rounded-4xl border border-gray-200 bg-white px-4 py-2 text-center"
            disabled={busy}
          >
            <option value="csv">CSV (UTF-8 BOM)</option>
            <option value="xlsx">XLSX</option>
            <option value="json">JSON</option>
          </select>
        </label>
      </div>

      <div className="w-full overflow-x-auto rounded-4xl border border-gray-100">
        <table className="w-full min-w-[520px] border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50 text-center">
              <th className="p-4 font-bold text-gray-700">{t('finance.export.colBsd')}</th>
              <th className="p-4 font-bold text-gray-700">{t('finance.export.colTarget')}</th>
            </tr>
          </thead>
          <tbody>
            {templateKeys.map((key) => (
              <tr key={key} className="border-t border-gray-100">
                <td className="p-4 text-center font-medium text-gray-800">{bsdLabel(key)}</td>
                <td className="p-4">
                  <input
                    type="text"
                    value={mapping[key] ?? ''}
                    onChange={(e) =>
                      setMapping((m) => ({
                        ...m,
                        [key]: e.target.value,
                      }))
                    }
                    className="min-h-11 w-full rounded-4xl border border-gray-200 bg-white px-4 py-2 text-center text-[#1a1a1a]"
                    disabled={busy}
                    placeholder={EXPORT_TEMPLATES[software].defaultMapping[key] ?? ''}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex w-full flex-col items-center justify-center gap-4 sm:flex-row">
        <button
          type="button"
          disabled={busy}
          onClick={() => void saveMapping()}
          className="inline-flex min-h-12 min-w-[140px] items-center justify-center rounded-4xl border-2 border-[#1a1a1a] bg-white px-6 text-sm font-bold text-[#1a1a1a] disabled:opacity-50"
        >
          {t('finance.export.saveMapping')}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={resetDefaults}
          className="inline-flex min-h-12 min-w-[140px] items-center justify-center rounded-4xl border border-gray-200 bg-white px-6 text-sm font-bold text-gray-700 disabled:opacity-50"
        >
          {t('finance.export.resetDefaults')}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void runExport()}
          className="inline-flex min-h-12 min-w-[160px] items-center justify-center rounded-4xl px-6 text-sm font-bold text-white disabled:opacity-50"
          style={{ backgroundColor: 'var(--brand-primary, #004694)' }}
        >
          {busy ? t('finance.export.exporting') : t('finance.export.download')}
        </button>
      </div>

      {message && (
        <p className="text-center text-sm font-semibold text-gray-700" role="status">
          {message}
        </p>
      )}
    </section>
  );
}
