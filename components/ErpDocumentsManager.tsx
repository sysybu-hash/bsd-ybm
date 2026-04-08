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
        className="col-span-full flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50 px-6 py-16 text-center"
        dir={dir}
      >
        <div className="rounded-2xl bg-white shadow-sm p-5 border border-slate-200">
          <FileText size={44} strokeWidth={1.5} className="text-blue-500" aria-hidden />
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-800">אין מסמכים בספרייה</h3>
          <p className="mt-2 max-w-sm mx-auto text-sm text-slate-500 font-medium">
            עדיין לא הועלו חשבוניות או מסמכים. העלו מסמכים דרך אזור הסריקה ותוכלו לנהל אותם כאן.
          </p>
        </div>
        <Link href="/dashboard/erp#erp-multi-scanner" className="btn-primary flex items-center gap-2 mt-2">
          <Upload size={18} aria-hidden />
          מעבר לסריקת מסמכים
        </Link>
      </div>
    );
  }

  return (
    <div className="col-span-full space-y-6" dir={dir}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-black italic text-slate-900 flex items-center gap-2">
            <FileText className="text-blue-600" size={24} aria-hidden />
            מסמכים ופענוח AI
          </h2>
          <p className="mt-1 text-sm text-slate-500">ניהול, תצוגה מקדימה ועריכת שדות שחולצו מתהליך הפענוח</p>
        </div>
      </div>

      {/* מובייל — כרטיסים */}
      <div className="grid gap-4 md:hidden">
        {sorted.map((doc) => {
          const ai = readAi(doc.aiData);
          return (
            <div key={doc.id} className="card-avenue rounded-2xl p-5">
              <div className="mb-4 flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wide">
                  <Calendar size={14} aria-hidden />
                  {new Date(doc.createdAt).toLocaleDateString("he-IL")}
                </span>
                <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-500 border border-slate-200 shadow-sm">
                  {doc.status}
                </span>
              </div>
              <h3 className="text-lg font-black text-slate-900 truncate">
                {ai.vendor || "ספק כללי"}
              </h3>
              <p className="text-2xl font-black text-blue-700 mt-1">₪{ai.total ?? 0}</p>
              
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mt-3">
                <p className="truncate text-xs font-bold text-slate-500 mb-1" title={doc.fileName}>
                   מסמך מרופרנס: <span className="text-slate-700 font-medium">{doc.fileName}</span>
                </p>
                <p className="line-clamp-2 min-h-8 text-xs italic text-slate-500 leading-relaxed">
                  {ai.summary ? `„${ai.summary}"` : "לא חולץ תקציר"}
                </p>
              </div>
              
              <div className="mt-4 flex flex-wrap gap-2 pt-2">
                <button type="button" onClick={() => setPreviewDoc(doc)} className="btn-secondary py-1.5 px-3 text-xs flex-1 justify-center">
                  <Eye size={14} aria-hidden />
                  תצוגה
                </button>
                <button type="button" onClick={() => setEditDoc(doc)} className="btn-secondary py-1.5 px-3 text-xs flex-1 justify-center">
                  <Pencil size={14} aria-hidden />
                  עריכה
                </button>
                <button
                  type="button"
                  onClick={() => void removeDoc(doc.id)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 shadow-sm hover:bg-rose-100 flex-none"
                >
                  <Trash2 size={14} aria-hidden />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* דסקטופ — טבלה */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200 bg-surface-white shadow-sm ring-1 ring-slate-100">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-blue-200 bg-blue-50 text-start">
              <th className="px-5 py-4 text-xs font-black uppercase tracking-widest text-blue-900 border-e border-blue-100/50 w-32">תאריך סריקה</th>
              <th className="px-5 py-4 text-xs font-black uppercase tracking-widest text-blue-900 border-e border-blue-100/50">קובץ</th>
              <th className="px-5 py-4 text-xs font-black uppercase tracking-widest text-blue-900 border-e border-blue-100/50">ספק / ישות</th>
              <th className="px-5 py-4 text-xs font-black uppercase tracking-widest text-blue-900 border-e border-blue-100/50 w-32">סכום השובר</th>
              <th className="px-5 py-4 text-xs font-black uppercase tracking-widest text-blue-900 border-e border-blue-100/50 w-28">סטטוס</th>
              <th className="px-5 py-4 text-xs font-black uppercase tracking-widest text-blue-900 w-44">פעולות מערכת</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sorted.map((doc) => {
              const ai = readAi(doc.aiData);
              return (
                <tr
                  key={doc.id}
                  className="transition-colors hover:bg-blue-50/30 group"
                >
                  <td className="whitespace-nowrap px-5 py-4 text-slate-500 font-medium">
                    {new Date(doc.createdAt).toLocaleDateString("he-IL")}
                  </td>
                  <td className="max-w-[12rem] truncate px-5 py-4 font-medium text-slate-700" title={doc.fileName}>
                    {doc.fileName}
                  </td>
                  <td className="px-5 py-4 font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                     {ai.vendor || "—"}
                  </td>
                  <td className="px-5 py-4 font-black tabular-nums text-slate-900">₪{ai.total ?? 0}</td>
                  <td className="px-5 py-4">
                    <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-black text-slate-500 shadow-sm">
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewDoc(doc)}
                        className="btn-secondary py-1.5 px-2 text-xs opacity-80 hover:opacity-100"
                        title="תצוגה מקדימה"
                      >
                        <Eye size={15} aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditDoc(doc)}
                        className="btn-secondary py-1.5 px-2 text-xs opacity-80 hover:opacity-100"
                        title="עריכת רשומה"
                      >
                        <Pencil size={15} aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => void removeDoc(doc.id)}
                        className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 p-1.5 text-rose-700 hover:bg-rose-100 transition-colors shadow-sm"
                        title="מחיקת מסמך"
                      >
                        <Trash2 size={15} aria-hidden />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* מודלים */}
      {previewDoc ? (
        <div
          className="fixed inset-0 z-[220] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          onClick={() => setPreviewDoc(null)}
          role="presentation"
        >
          <div
            className="card-avenue max-h-[85vh] w-full max-w-2xl overflow-y-auto p-6 md:p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="preview-doc-title"
          >
            <div className="mb-6 flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
               <div>
                  <h3 id="preview-doc-title" className="text-xl font-black italic text-slate-900">
                    תצוגה מקדימה של נתונים מרקע
                  </h3>
                  <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wide">זיהוי מסמך - {previewDoc.fileName}</p>
               </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="rounded-xl border border-slate-200 p-2 text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
                aria-label="סגור"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
               <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 shadow-sm">
                  <span className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">סוג קובץ מקורי</span>
                  <span className="font-medium text-slate-700 text-sm mt-0.5">{previewDoc.type}</span>
               </div>
               <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 shadow-sm">
                  <span className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">תאריך עיבוד</span>
                  <span className="font-medium text-slate-700 text-sm mt-0.5">{new Date(previewDoc.createdAt).toLocaleString("he-IL")}</span>
               </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-900 p-5 shadow-inner">
              <div className="flex items-center gap-2 mb-3">
                 <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                 <p className="text-xs font-bold uppercase tracking-widest text-slate-400">JSON Data Payload</p>
              </div>
              <pre className="max-h-[40vh] overflow-auto text-[13px] text-blue-300 whitespace-pre-wrap break-all font-mono leading-relaxed">
                {JSON.stringify(previewDoc.aiData ?? {}, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      ) : null}

      {editDoc ? (
        <div
          className="fixed inset-0 z-[220] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          onClick={() => setEditDoc(null)}
          role="presentation"
        >
          <div
            className="card-avenue max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6 md:p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-doc-title"
          >
            <div className="mb-6 flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
               <div>
                  <h3 id="edit-doc-title" className="text-xl font-black italic text-slate-900">
                    עדכון רשומת מסמך
                  </h3>
                  <p className="text-xs font-bold text-slate-500 mt-1">תיקון שגוי או הוספת פרטים חסרים שפענוח ה-AI פספס</p>
               </div>
              <button
                type="button"
                onClick={() => setEditDoc(null)}
                className="rounded-xl border border-slate-200 p-2 text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
                aria-label="סגור"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">שם קובץ מקורי</span>
                <input
                  value={editDoc.fileName}
                  onChange={(e) => setEditDoc({ ...editDoc, fileName: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium shadow-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">פורמט קובץ</span>
                <input
                  value={editDoc.type}
                  onChange={(e) => setEditDoc({ ...editDoc, type: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">שיוך וסטטוס</span>
                <input
                  value={editDoc.status}
                  onChange={(e) => setEditDoc({ ...editDoc, status: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
              </label>
              
              <div className="md:col-span-2 mt-2 mb-1">
                 <span className="text-[10px] font-black uppercase text-blue-500 tracking-widest bg-blue-50 px-2 py-1 rounded border border-blue-100">שדות נתונים חולצו (AI)</span>
              </div>
              
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-slate-700">שם הספק / ישות</span>
                <input
                  value={String(readAi(editDoc.aiData).vendor ?? "")}
                  onChange={(e) =>
                    setEditDoc({
                      ...editDoc,
                      aiData: { ...readAi(editDoc.aiData), vendor: e.target.value },
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-slate-700">סכום כולל לתשלום (₪)</span>
                <input
                  value={String(readAi(editDoc.aiData).total ?? "")}
                  onChange={(e) =>
                    setEditDoc({
                      ...editDoc,
                      aiData: { ...readAi(editDoc.aiData), total: e.target.value },
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-blue-700"
                />
              </label>
              <label className="block md:col-span-2">
                <span className="mb-1.5 block text-xs font-bold text-slate-700">סוג מסמך מזוהה (חשבונית, קבלה וכו')</span>
                <input
                  value={String(readAi(editDoc.aiData).docType ?? "")}
                  onChange={(e) =>
                    setEditDoc({
                      ...editDoc,
                      aiData: { ...readAi(editDoc.aiData), docType: e.target.value },
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
              </label>
              <label className="block md:col-span-2">
                <span className="mb-1.5 block text-xs font-bold text-slate-700">תקציר כללי שנוצר</span>
                <textarea
                  value={String(readAi(editDoc.aiData).summary ?? "")}
                  onChange={(e) =>
                    setEditDoc({
                      ...editDoc,
                      aiData: { ...readAi(editDoc.aiData), summary: e.target.value },
                    })
                  }
                  rows={4}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all leading-relaxed"
                />
              </label>
            </div>
            
            <div className="mt-8 flex flex-wrap gap-3 border-t border-slate-100 pt-6">
              <button type="button" disabled={saving} onClick={() => void saveEdit()} className="btn-primary shadow-lg shadow-blue-500/20">
                <Save size={18} aria-hidden />
                {saving ? "שומר ומעבד…" : "שמירת שינויים למסד נתונים"}
              </button>
              <button type="button" onClick={() => setEditDoc(null)} className="btn-secondary border-slate-200">
                ביטול עריכה
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
