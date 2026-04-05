"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Calendar, Eye, FileText, Pencil, Save, Trash2, Upload, X } from "lucide-react";
import { useI18n } from "@/components/I18nProvider";

type Doc = {
  id: string;
  fileName: string;
  type: string;
  status: string;
  createdAt: string;
  aiData?: unknown;
};

type AiShape = {
  vendor?: string;
  total?: number | string;
  summary?: string;
  docType?: string;
};

function readAi(ai: unknown): AiShape {
  return typeof ai === "object" && ai !== null ? (ai as AiShape) : {};
}

export default function ErpDocumentsManager({ initialDocs }: { initialDocs: Doc[] }) {
  const { dir } = useI18n();
  const [docs, setDocs] = useState<Doc[]>(initialDocs);
  const [previewDoc, setPreviewDoc] = useState<Doc | null>(null);
  const [editDoc, setEditDoc] = useState<Doc | null>(null);
  const [saving, setSaving] = useState(false);

  const sorted = useMemo(
    () => [...docs].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [docs],
  );

  const removeDoc = async (id: string) => {
    if (!confirm("למחוק את המסמך לצמיתות?")) return;
    const res = await fetch(`/api/erp/documents/${id}`, { method: "DELETE" });
    if (!res.ok) return;
    setDocs((prev) => prev.filter((d) => d.id !== id));
    if (previewDoc?.id === id) setPreviewDoc(null);
    if (editDoc?.id === id) setEditDoc(null);
  };

  const saveEdit = async () => {
    if (!editDoc) return;
    const ai = readAi(editDoc.aiData);
    setSaving(true);
    try {
      const res = await fetch(`/api/erp/documents/${editDoc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: editDoc.fileName,
          type: editDoc.type,
          status: editDoc.status,
          aiData: {
            vendor: ai.vendor ?? "",
            total: ai.total ?? "",
            summary: ai.summary ?? "",
            docType: ai.docType ?? "",
          },
        }),
      });
      const data = (await res.json()) as { document?: Doc };
      if (!res.ok || !data.document) return;
      setDocs((prev) => prev.map((d) => (d.id === editDoc.id ? data.document! : d)));
      setEditDoc(null);
    } finally {
      setSaving(false);
    }
  };

  if (sorted.length === 0) {
    return (
      <div
        className="col-span-full flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/80 px-6 py-16 text-center"
        dir={dir}
      >
        <div className="rounded-2xl bg-indigo-50 p-4 text-indigo-600 ring-1 ring-indigo-100">
          <FileText size={40} strokeWidth={1.25} aria-hidden />
        </div>
        <div>
          <h3 className="text-lg font-black text-gray-900">אין מסמכים בספרייה</h3>
          <p className="mt-1 max-w-md text-sm text-gray-500">
            העלו חשבונית או מסמך דרך אזור הסריקה בדף ERP — המסמכים יופיעו כאן בטבלה מסודרת.
          </p>
        </div>
        <Link href="/dashboard/erp#erp-multi-scanner" className="btn-primary text-sm">
          <Upload size={18} aria-hidden />
          מעבר לסריקת מסמכים
        </Link>
      </div>
    );
  }

  return (
    <div className="col-span-full space-y-4" dir={dir}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black italic text-gray-900 flex items-center gap-2">
            <FileText className="text-indigo-600" size={22} aria-hidden />
            מסמכים ופענוח AI
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">ניהול, תצוגה מקדימה ועריכת שדות שחולצו</p>
        </div>
      </div>

      {/* מובייל — כרטיסים */}
      <div className="grid gap-3 md:hidden">
        {sorted.map((doc) => {
          const ai = readAi(doc.aiData);
          return (
            <div key={doc.id} className="card-avenue p-4">
              <div className="mb-3 flex items-start justify-between gap-2">
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Calendar size={12} aria-hidden />
                  {new Date(doc.createdAt).toLocaleDateString("he-IL")}
                </span>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600">
                  {doc.status}
                </span>
              </div>
              <p className="truncate text-xs text-gray-500" title={doc.fileName}>
                {doc.fileName}
              </p>
              <h3 className="text-base font-black text-gray-900">{ai.vendor || "ספק כללי"}</h3>
              <p className="text-lg font-black text-gray-900">₪{ai.total ?? 0}</p>
              <p className="mt-1 line-clamp-2 min-h-8 text-xs italic text-gray-500">
                {ai.summary ? `„${ai.summary}"` : "לא חולץ תקציר"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => setPreviewDoc(doc)} className="btn-secondary py-1.5 text-xs">
                  <Eye size={14} aria-hidden />
                  תצוגה
                </button>
                <button type="button" onClick={() => setEditDoc(doc)} className="btn-secondary py-1.5 text-xs">
                  <Pencil size={14} aria-hidden />
                  עריכה
                </button>
                <button
                  type="button"
                  onClick={() => void removeDoc(doc.id)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700"
                >
                  <Trash2 size={14} aria-hidden />
                  מחיקה
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* דסקטופ — טבלה */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-gray-200/90 bg-white shadow-sm ring-1 ring-gray-100/80">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-indigo-50/90 text-start">
              <th className="px-4 py-3 text-xs font-black uppercase tracking-wide text-indigo-900">תאריך</th>
              <th className="px-4 py-3 text-xs font-black uppercase tracking-wide text-indigo-900">קובץ</th>
              <th className="px-4 py-3 text-xs font-black uppercase tracking-wide text-indigo-900">ספק</th>
              <th className="px-4 py-3 text-xs font-black uppercase tracking-wide text-indigo-900">סכום</th>
              <th className="px-4 py-3 text-xs font-black uppercase tracking-wide text-indigo-900">סטטוס</th>
              <th className="px-4 py-3 text-xs font-black uppercase tracking-wide text-indigo-900">פעולות</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((doc) => {
              const ai = readAi(doc.aiData);
              return (
                <tr
                  key={doc.id}
                  className="border-b border-gray-100 transition-colors last:border-0 hover:bg-gray-50/80"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                    {new Date(doc.createdAt).toLocaleDateString("he-IL")}
                  </td>
                  <td className="max-w-[10rem] truncate px-4 py-3 font-medium text-gray-800" title={doc.fileName}>
                    {doc.fileName}
                  </td>
                  <td className="px-4 py-3 font-bold text-gray-900">{ai.vendor || "—"}</td>
                  <td className="px-4 py-3 font-black tabular-nums text-gray-900">₪{ai.total ?? 0}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-bold text-gray-600">
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPreviewDoc(doc)}
                        className="btn-secondary py-1.5 ps-2 pe-2.5 text-xs"
                      >
                        <Eye size={14} aria-hidden />
                        תצוגה
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditDoc(doc)}
                        className="btn-secondary py-1.5 ps-2 pe-2.5 text-xs"
                      >
                        <Pencil size={14} aria-hidden />
                        עריכה
                      </button>
                      <button
                        type="button"
                        onClick={() => void removeDoc(doc.id)}
                        className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-2 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100"
                      >
                        <Trash2 size={14} aria-hidden />
                        מחיקה
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {previewDoc ? (
        <div
          className="fixed inset-0 z-[220] flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-sm"
          onClick={() => setPreviewDoc(null)}
          role="presentation"
        >
          <div
            className="card-avenue max-h-[85vh] w-full max-w-2xl overflow-y-auto p-6 shadow-lg shadow-gray-200/60"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="preview-doc-title"
          >
            <div className="mb-4 flex items-center justify-between gap-3 border-b border-gray-100 pb-4">
              <h3 id="preview-doc-title" className="text-xl font-black text-gray-900">
                תצוגה מקדימה
              </h3>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="rounded-xl border border-gray-200 p-2 text-gray-600 transition hover:bg-gray-50"
                aria-label="סגור"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-gray-600">
              <span className="font-bold text-gray-800">שם קובץ:</span> {previewDoc.fileName}
            </p>
            <p className="mt-1 text-sm text-gray-600">
              <span className="font-bold text-gray-800">סוג:</span> {previewDoc.type}
            </p>
            <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">JSON פענוח</p>
              <pre className="max-h-[40vh] overflow-auto text-xs text-gray-700 whitespace-pre-wrap break-all">
                {JSON.stringify(previewDoc.aiData ?? {}, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      ) : null}

      {editDoc ? (
        <div
          className="fixed inset-0 z-[220] flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-sm"
          onClick={() => setEditDoc(null)}
          role="presentation"
        >
          <div
            className="card-avenue max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6 shadow-lg shadow-gray-200/60"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-doc-title"
          >
            <div className="mb-4 flex items-center justify-between gap-3 border-b border-gray-100 pb-4">
              <h3 id="edit-doc-title" className="text-xl font-black text-gray-900">
                עריכת מסמך
              </h3>
              <button
                type="button"
                onClick={() => setEditDoc(null)}
                className="rounded-xl border border-gray-200 p-2 text-gray-600 transition hover:bg-gray-50"
                aria-label="סגור"
              >
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className="mb-1 block text-xs font-bold text-gray-500">שם קובץ</span>
                <input
                  value={editDoc.fileName}
                  onChange={(e) => setEditDoc({ ...editDoc, fileName: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-gray-500">סוג</span>
                <input
                  value={editDoc.type}
                  onChange={(e) => setEditDoc({ ...editDoc, type: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-gray-500">סטטוס</span>
                <input
                  value={editDoc.status}
                  onChange={(e) => setEditDoc({ ...editDoc, status: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-gray-500">ספק</span>
                <input
                  value={String(readAi(editDoc.aiData).vendor ?? "")}
                  onChange={(e) =>
                    setEditDoc({
                      ...editDoc,
                      aiData: { ...readAi(editDoc.aiData), vendor: e.target.value },
                    })
                  }
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-gray-500">סכום כולל</span>
                <input
                  value={String(readAi(editDoc.aiData).total ?? "")}
                  onChange={(e) =>
                    setEditDoc({
                      ...editDoc,
                      aiData: { ...readAi(editDoc.aiData), total: e.target.value },
                    })
                  }
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </label>
              <label className="block md:col-span-2">
                <span className="mb-1 block text-xs font-bold text-gray-500">סוג מסמך</span>
                <input
                  value={String(readAi(editDoc.aiData).docType ?? "")}
                  onChange={(e) =>
                    setEditDoc({
                      ...editDoc,
                      aiData: { ...readAi(editDoc.aiData), docType: e.target.value },
                    })
                  }
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </label>
              <label className="block md:col-span-2">
                <span className="mb-1 block text-xs font-bold text-gray-500">תקציר</span>
                <textarea
                  value={String(readAi(editDoc.aiData).summary ?? "")}
                  onChange={(e) =>
                    setEditDoc({
                      ...editDoc,
                      aiData: { ...readAi(editDoc.aiData), summary: e.target.value },
                    })
                  }
                  rows={4}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </label>
            </div>
            <div className="mt-6 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
              <button type="button" disabled={saving} onClick={() => void saveEdit()} className="btn-primary text-sm">
                <Save size={16} aria-hidden />
                {saving ? "שומר…" : "שמור שינויים"}
              </button>
              <button type="button" onClick={() => setEditDoc(null)} className="btn-ghost border border-gray-200 text-sm">
                ביטול
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
