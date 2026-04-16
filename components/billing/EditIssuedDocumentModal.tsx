"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Plus,
  Trash2,
  Calculator,
  User,
  FileText,
  Receipt,
  Edit3,
  AlertTriangle,
} from "lucide-react";
import { CompanyType, DocStatus, DocType } from "@prisma/client";
import {
  updateIssuedDocument,
  deleteIssuedDocument,
} from "@/app/dashboard/billing/actions";
import { calculateIssuedDocumentTotals, VAT_RATE } from "@/lib/billing-calculations";
import type { IssuedDocRow } from "@/components/billing/GlobalBillingPageClient";

type LineItem = { desc: string; qty: number; price: number };

type Props = {
  doc: IssuedDocRow;
  companyType: CompanyType;
  isReportable: boolean;
  onClose: () => void;
  onSaved: () => void;
};

export default function EditIssuedDocumentModal({
  doc,
  companyType,
  isReportable,
  onClose,
  onSaved,
}: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [clientName, setClientName] = useState(doc.clientName);
  const [docType, setDocType] = useState<DocType>(doc.docType);
  const [status, setStatus] = useState<DocStatus>(doc.status);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  /* ── Line items: parse from doc.items ── */
  function parseItems(raw: unknown): LineItem[] {
    if (!Array.isArray(raw)) return [{ desc: "", qty: 1, price: 0 }];
    const parsed = raw
      .map((r) => {
        if (!r || typeof r !== "object") return null;
        const o = r as Record<string, unknown>;
        return {
          desc: String(o.desc ?? ""),
          qty: Number(o.qty ?? 1),
          price: Number(o.price ?? 0),
        };
      })
      .filter(Boolean) as LineItem[];
    return parsed.length > 0 ? parsed : [{ desc: "", qty: 1, price: 0 }];
  }

  const [items, setItems] = useState<LineItem[]>(() => parseItems(doc.items));

  const totals = useMemo(() => {
    const netAmount = items.reduce((s, i) => s + i.qty * i.price, 0);
    return calculateIssuedDocumentTotals(netAmount, companyType, isReportable);
  }, [items, companyType, isReportable]);

  const vatPercentLabel =
    companyType === CompanyType.EXEMPT_DEALER ? "0%" : `${Math.round(VAT_RATE * 100)}%`;

  const addItem = () => setItems((p) => [...p, { desc: "", qty: 1, price: 0 }]);
  const removeItem = (i: number) =>
    setItems((p) => (p.length <= 1 ? p : p.filter((_, idx) => idx !== i)));
  const updateItem = (i: number, field: keyof LineItem, val: string | number) =>
    setItems((p) => p.map((it, idx) => (idx === i ? { ...it, [field]: val } : it)));

  const handleSave = async () => {
    if (!clientName.trim()) { setErr("נא למלא שם לקוח."); return; }
    if (!items.some((i) => i.desc.trim())) { setErr("נא למלא לפחות פריט אחד."); return; }
    setSaving(true); setErr(null);
    const r = await updateIssuedDocument({
      id: doc.id,
      type: docType,
      clientName: clientName.trim(),
      netAmount: totals.net,
      items,
      status,
    });
    setSaving(false);
    if (r.ok) { onSaved(); router.refresh(); onClose(); }
    else setErr(r.error);
  };

  const handleDelete = () => {
    startTransition(async () => {
      const r = await deleteIssuedDocument(doc.id);
      if (r.ok) { onSaved(); router.refresh(); onClose(); }
      else setErr(r.error);
    });
  };

  const inputCls = "w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-500/15";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-gray-900/40 p-4"
      dir="rtl"
      role="dialog"
      aria-modal="true"
    >
      <div className="my-8 w-full max-w-3xl overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
        {/* Header */}
        <div className="relative flex items-center justify-between gap-4 border-b border-gray-100 px-6 py-5">
          <div className="absolute inset-y-0 start-0 w-1.5 bg-teal-600" />
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/15 text-teal-400">
              <Edit3 size={18} />
            </div>
            <div>
              <p className="font-black text-gray-900">עריכת מסמך #{doc.number}</p>
              <p className="text-xs text-gray-400">שינויים יישמרו ויחשבו מחדש</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 transition"
            aria-label="סגור"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-5">
          {err && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <AlertTriangle size={15} className="mt-0.5 shrink-0" />
              {err}
            </div>
          )}

          {/* Type + client row */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 flex items-center gap-1.5">
                <Receipt size={12} /> סוג מסמך
              </label>
              <div className="relative">
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as DocType)}
                  className={inputCls + " appearance-none"}
                >
                  <option value={DocType.INVOICE_RECEIPT}>חשבונית מס קבלה</option>
                  <option value={DocType.INVOICE}>חשבונית מס</option>
                  <option value={DocType.RECEIPT}>קבלה</option>
                  <option value={DocType.CREDIT_NOTE}>חשבונית זיכוי</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 flex items-center gap-1.5">
                <User size={12} /> שם לקוח
              </label>
              <input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="שם לקוח / חברה"
                className={inputCls}
              />
            </div>
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 flex items-center gap-1.5">
              <FileText size={12} /> סטטוס
            </label>
            <div className="flex gap-2">
              {([DocStatus.PENDING, DocStatus.PAID, DocStatus.CANCELLED] as DocStatus[]).map((s) => {
                const labels: Record<DocStatus, string> = {
                  PENDING: "בהמתנה", PAID: "שולם", CANCELLED: "בוטל",
                };
                const colors: Record<DocStatus, string> = {
                  PENDING: "border-amber-500/30 bg-amber-500/15 text-amber-400",
                  PAID: "border-emerald-500/30 bg-emerald-500/15 text-emerald-400",
                  CANCELLED: "border-gray-200 bg-gray-50 text-gray-500",
                };
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={`rounded-xl border px-4 py-2 text-xs font-bold transition ${
                      status === s ? colors[s] + " ring-2 ring-offset-1 ring-current/30" : "border-gray-200 bg-white text-gray-400 hover:bg-gray-50"
                    }`}
                  >
                    {labels[s]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Line items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h3 className="text-sm font-black text-gray-700 flex items-center gap-1.5">
                <Calculator size={14} /> פירוט שורות
              </h3>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1 rounded-lg bg-teal-500/15 px-3 py-1.5 text-xs font-bold text-teal-400 hover:bg-teal-500/25 transition"
              >
                <Plus size={13} /> הוסף שורה
              </button>
            </div>

            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-6">
                  <input
                    placeholder="תיאור השירות/מוצר..."
                    value={item.desc}
                    onChange={(e) => updateItem(idx, "desc", e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    min={0}
                    step="any"
                    placeholder="כמות"
                    value={item.qty}
                    onChange={(e) => updateItem(idx, "qty", Number(e.target.value))}
                    className={inputCls + " text-center"}
                  />
                </div>
                <div className="col-span-3">
                  <input
                    type="number"
                    min={0}
                    step="any"
                    placeholder="מחיר יח׳"
                    value={item.price}
                    onChange={(e) => updateItem(idx, "price", Number(e.target.value))}
                    className={inputCls}
                  />
                </div>
                <div className="col-span-1 flex justify-center">
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    disabled={items.length <= 1}
                    className="text-gray-400 hover:text-rose-500 transition disabled:opacity-30"
                    aria-label="מחק שורה"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-400 font-medium">
              <span>סה״כ לפני מע״מ:</span>
              <span>₪{totals.net.toLocaleString("he-IL", { maximumFractionDigits: 2 })}</span>
            </div>
            {isReportable && companyType !== CompanyType.EXEMPT_DEALER && (
              <div className="flex justify-between text-xs text-gray-400">
                <span>מע״מ ({vatPercentLabel}):</span>
                <span>₪{totals.vat.toLocaleString("he-IL", { maximumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-black text-white border-t border-gray-200 pt-2">
              <span>סה״כ לתשלום:</span>
              <span className="text-teal-300">₪{totals.total.toLocaleString("he-IL", { maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-6 py-4">
          <div>
            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/[0.08] transition"
              >
                <Trash2 size={13} /> מחק מסמך
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-rose-600">למחוק לצמיתות?</span>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="rounded-xl bg-rose-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-400 transition"
                >
                  כן, מחק
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-50 transition"
                >
                  ביטול
                </button>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50 transition"
            >
              ביטול
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-teal-500/15 px-5 py-2 text-sm font-bold text-white shadow-sm shadow-teal-500/25 hover:bg-teal-400 transition disabled:opacity-50"
            >
              {saving ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : null}
              שמור שינויים
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
