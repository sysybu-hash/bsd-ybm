"use client";

import { useMemo, useState } from "react";
import { Calendar, Eye, Pencil, Save, Trash2, X } from "lucide-react";

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
      <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl text-slate-500 italic bg-white/60">
        המערכת ממתינה למסמך הראשון שלך לסריקה...
      </div>
    );
  }

  return (
    <>
      {sorted.map((doc) => {
        const ai = readAi(doc.aiData);
        return (
          <div
            key={doc.id}
            className="bg-white border border-slate-100 p-6 rounded-3xl shadow-lg shadow-slate-200/40 hover:border-blue-200 hover:shadow-xl transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <span className="text-slate-400 text-xs flex items-center gap-1">
                <Calendar size={12} />
                {new Date(doc.createdAt).toLocaleDateString("he-IL")}
              </span>
              <span className="text-[10px] rounded-full bg-slate-100 px-2 py-1 font-bold text-slate-600">
                {doc.status}
              </span>
            </div>
            <h3 className="text-lg font-black mb-1">{ai.vendor || "ספק כללי"}</h3>
            <div className="text-xl font-black text-slate-900 mb-2">₪{ai.total || 0}</div>
            <p className="text-xs text-slate-500 italic leading-relaxed line-clamp-3 min-h-10">
              "{ai.summary || "לא חולץ תקציר"}"
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPreviewDoc(doc)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 text-blue-700 px-3 py-1.5 text-xs font-bold"
              >
                <Eye size={14} /> תצוגה מקדימה
              </button>
              <button
                type="button"
                onClick={() => setEditDoc(doc)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 text-amber-800 px-3 py-1.5 text-xs font-bold"
              >
                <Pencil size={14} /> עריכה
              </button>
              <button
                type="button"
                onClick={() => void removeDoc(doc.id)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 text-rose-700 px-3 py-1.5 text-xs font-bold"
              >
                <Trash2 size={14} /> מחיקה
              </button>
            </div>
          </div>
        );
      })}

      {previewDoc ? (
        <div
          className="fixed inset-0 z-[220] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-black">תצוגה מקדימה למסמך</h3>
              <button type="button" onClick={() => setPreviewDoc(null)} className="p-2 rounded-lg bg-slate-100">
                <X size={16} />
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-2">
              <strong>שם קובץ:</strong> {previewDoc.fileName}
            </p>
            <p className="text-sm text-slate-600 mb-4">
              <strong>סוג:</strong> {previewDoc.type}
            </p>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold text-slate-500 mb-2">JSON פענוח</p>
              <pre className="text-xs text-slate-700 whitespace-pre-wrap break-all">
                {JSON.stringify(previewDoc.aiData ?? {}, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      ) : null}

      {editDoc ? (
        <div
          className="fixed inset-0 z-[220] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setEditDoc(null)}
        >
          <div
            className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full p-6"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-black">עריכת מסמך</h3>
              <button type="button" onClick={() => setEditDoc(null)} className="p-2 rounded-lg bg-slate-100">
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                value={editDoc.fileName}
                onChange={(e) => setEditDoc({ ...editDoc, fileName: e.target.value })}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="שם קובץ"
              />
              <input
                value={editDoc.type}
                onChange={(e) => setEditDoc({ ...editDoc, type: e.target.value })}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="סוג"
              />
              <input
                value={editDoc.status}
                onChange={(e) => setEditDoc({ ...editDoc, status: e.target.value })}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="סטטוס"
              />
              <input
                value={String(readAi(editDoc.aiData).vendor ?? "")}
                onChange={(e) =>
                  setEditDoc({
                    ...editDoc,
                    aiData: { ...readAi(editDoc.aiData), vendor: e.target.value },
                  })
                }
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="ספק"
              />
              <input
                value={String(readAi(editDoc.aiData).total ?? "")}
                onChange={(e) =>
                  setEditDoc({
                    ...editDoc,
                    aiData: { ...readAi(editDoc.aiData), total: e.target.value },
                  })
                }
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="סכום כולל"
              />
              <input
                value={String(readAi(editDoc.aiData).docType ?? "")}
                onChange={(e) =>
                  setEditDoc({
                    ...editDoc,
                    aiData: { ...readAi(editDoc.aiData), docType: e.target.value },
                  })
                }
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="סוג מסמך"
              />
              <textarea
                value={String(readAi(editDoc.aiData).summary ?? "")}
                onChange={(e) =>
                  setEditDoc({
                    ...editDoc,
                    aiData: { ...readAi(editDoc.aiData), summary: e.target.value },
                  })
                }
                className="md:col-span-2 min-h-24 rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="תקציר"
              />
            </div>
            <button
              type="button"
              disabled={saving}
              onClick={() => void saveEdit()}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 text-white px-4 py-2 text-sm font-bold disabled:opacity-50"
            >
              <Save size={14} />
              {saving ? "שומר..." : "שמור שינויים"}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
