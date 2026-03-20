'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/CompanyContext';
import { FileSpreadsheet, FileText, ImageIcon, Loader2, Upload } from 'lucide-react';
import { MEUHEDET } from '@/components/shell/meuhedet-theme';

const ACCEPT = '.pdf,.png,.jpg,.jpeg,.webp,.xlsx,.xls';

type ParsedRow = {
  id: string;
  fileName: string;
  transactionDateIso: string | null;
  vendor: string | null;
  totalNis: number | null;
  description: string | null;
  confidenceNotes: string[];
};

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function ImportWizard() {
  const { user } = useAuth();
  const { companyId } = useCompany();
  const [projectId, setProjectId] = useState('');
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [commitBusy, setCommitBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const canRun = Boolean(companyId && user);

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => {
        const res = r.result;
        if (typeof res === 'string') {
          const i = res.indexOf('base64,');
          resolve(i >= 0 ? res.slice(i + 7) : res);
        } else reject(new Error('read_failed'));
      };
      r.onerror = () => reject(r.error ?? new Error('read_failed'));
      r.readAsDataURL(file);
    });

  const parseFiles = useCallback(
    async (files: FileList | File[]) => {
      if (!canRun || !companyId || !user) {
        setMessage('בחרו חברה והתחברו.');
        return;
      }
      const list = Array.from(files).filter((f) => f.size > 0);
      if (list.length === 0) return;
      setBusy(true);
      setMessage(null);
      try {
        const token = await user.getIdToken();
        const payload = {
          companyId,
          files: await Promise.all(
            list.map(async (f) => ({
              fileName: f.name,
              mimeType: f.type || 'application/octet-stream',
              base64: await fileToBase64(f),
            }))
          ),
        };
        const res = await fetch('/api/ai/legacy-import-parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        const json = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          results?: {
            fileName: string;
            invoices?: {
              transactionDateIso: string | null;
              vendor: string | null;
              totalNis: number | null;
              description: string | null;
              confidenceNotes: string[];
            }[];
            error?: string;
          }[];
        };
        if (!res.ok) {
          setMessage((json as { error?: string }).error ?? 'ניתוח נכשל');
          return;
        }
        const next: ParsedRow[] = [];
        for (const block of json.results ?? []) {
          const inv = block.invoices ?? [];
          if (inv.length === 0 && block.error) {
            next.push({
              id: uid(),
              fileName: block.fileName,
              transactionDateIso: null,
              vendor: null,
              totalNis: null,
              description: block.error,
              confidenceNotes: [],
            });
          }
          for (const x of inv) {
            next.push({
              id: uid(),
              fileName: block.fileName,
              transactionDateIso: x.transactionDateIso,
              vendor: x.vendor,
              totalNis: x.totalNis,
              description: x.description,
              confidenceNotes: x.confidenceNotes ?? [],
            });
          }
        }
        setRows((r) => [...next, ...r]);
        setMessage(`נותחו ${list.length} קבצים — ${next.length} שורות`);
      } catch (e) {
        setMessage(e instanceof Error ? e.message : 'שגיאה');
      } finally {
        setBusy(false);
      }
    },
    [canRun, companyId, user]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files?.length) void parseFiles(e.dataTransfer.files);
    },
    [parseFiles]
  );

  const updateRow = (id: string, patch: Partial<ParsedRow>) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const removeRow = (id: string) => setRows((rs) => rs.filter((r) => r.id !== id));

  const validCommit = useMemo(() => {
    if (!projectId.trim()) return false;
    return rows.some((r) => typeof r.totalNis === 'number' && r.totalNis! > 0);
  }, [projectId, rows]);

  const commit = async () => {
    if (!canRun || !user || !companyId || !validCommit) return;
    setCommitBusy(true);
    setMessage(null);
    try {
      const token = await user.getIdToken();
      const body = {
        companyId,
        projectId: projectId.trim(),
        rows: rows
          .filter((r) => typeof r.totalNis === 'number' && r.totalNis! > 0)
          .map((r) => ({
            amount: r.totalNis,
            transactionDateIso: r.transactionDateIso,
            vendor: r.vendor,
            description: r.description,
            sourceFileName: r.fileName,
          })),
      };
      const res = await fetch('/api/ai/legacy-import-commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage((json as { error?: string }).error ?? 'שמירה נכשלה');
        return;
      }
      setMessage(`נשמרו ${(json as { written?: number }).written ?? 0} תנועות לפרויקט`);
      setRows([]);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'שגיאה');
    } finally {
      setCommitBusy(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col items-center justify-center gap-6" dir="rtl">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`flex min-h-[220px] w-full cursor-pointer flex-col items-center justify-center gap-4 rounded-[32px] border-2 border-dashed p-6 transition-colors sm:p-8 ${
          dragOver ? 'border-[#FF7F00] bg-orange-50/40' : 'border-[#001A4D]/25 bg-[#FDFDFD]'
        }`}
        style={{ borderColor: dragOver ? MEUHEDET.orange : undefined }}
      >
        <div className="flex items-center justify-center gap-4">
          <FileText className="h-10 w-10" style={{ color: MEUHEDET.blue }} aria-hidden />
          <ImageIcon className="h-10 w-10" style={{ color: MEUHEDET.teal }} aria-hidden />
          <FileSpreadsheet className="h-10 w-10" style={{ color: MEUHEDET.orange }} aria-hidden />
        </div>
        <p className="text-center text-sm font-bold text-[#001A4D]">גררו לכאן PDF / תמונות / Excel</p>
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-[32px] px-6 py-3 text-sm font-black text-white shadow-md transition-opacity hover:opacity-90">
          <Upload className="h-4 w-4" aria-hidden />
          בחירת קבצים
          <input
            type="file"
            multiple
            accept={ACCEPT}
            className="hidden"
            disabled={busy || !canRun}
            onChange={(e) => {
              if (e.target.files?.length) void parseFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </label>
        {busy ? (
          <span className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            מנתח עם Gemini 1.5 Pro…
          </span>
        ) : null}
      </div>

      <div className="flex w-full max-w-xl flex-col items-center justify-center gap-4 rounded-[32px] border border-gray-200 bg-white p-6">
        <label className="flex w-full flex-col items-center justify-center gap-2 text-center">
          <span className="text-sm font-bold text-[#001A4D]">שיוך אצווה — מזהה פרויקט</span>
          <input
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            placeholder="הדביקו projectId מהדשבורד"
            className="w-full rounded-[32px] border border-gray-200 px-4 py-3 text-center text-sm font-mono"
          />
        </label>
      </div>

      {message ? (
        <p className="text-center text-sm font-bold text-[#001A4D]" role="status">
          {message}
        </p>
      ) : null}

      {rows.length > 0 && (
        <div className="w-full overflow-x-auto rounded-[32px] border border-gray-200 bg-white p-4 sm:p-6">
          <table className="w-full min-w-[640px] border-collapse text-center text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-black text-[#001A4D]">
                <th className="p-2">קובץ</th>
                <th className="p-2">תאריך (ISO)</th>
                <th className="p-2">ספק</th>
                <th className="p-2">סכום ₪</th>
                <th className="p-2">תיאור</th>
                <th className="p-2">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-gray-50">
                  <td className="p-2 text-xs text-gray-600">{r.fileName}</td>
                  <td className="p-2">
                    <input
                      value={r.transactionDateIso ?? ''}
                      onChange={(e) => updateRow(r.id, { transactionDateIso: e.target.value || null })}
                      className="w-full rounded-full border border-gray-200 px-2 py-1 text-xs"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      value={r.vendor ?? ''}
                      onChange={(e) => updateRow(r.id, { vendor: e.target.value || null })}
                      className="w-full rounded-full border border-gray-200 px-2 py-1 text-xs"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      value={r.totalNis ?? ''}
                      onChange={(e) =>
                        updateRow(r.id, {
                          totalNis: e.target.value === '' ? null : Number(e.target.value),
                        })
                      }
                      className="w-full rounded-full border border-gray-200 px-2 py-1 text-xs"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      value={r.description ?? ''}
                      onChange={(e) => updateRow(r.id, { description: e.target.value || null })}
                      className="w-full rounded-full border border-gray-200 px-2 py-1 text-xs"
                    />
                  </td>
                  <td className="p-2">
                    <button
                      type="button"
                      onClick={() => removeRow(r.id)}
                      className="rounded-full px-3 py-1 text-xs font-bold text-red-600 hover:bg-red-50"
                    >
                      הסר
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-6 flex items-center justify-center">
            <button
              type="button"
              disabled={!validCommit || commitBusy}
              onClick={() => void commit()}
              className="min-h-12 rounded-[32px] px-8 py-4 text-sm font-black text-white shadow-md transition-opacity disabled:opacity-50"
              style={{ backgroundColor: MEUHEDET.orange }}
            >
              {commitBusy ? 'שומר…' : 'שמירה אצווה לפרויקט'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
