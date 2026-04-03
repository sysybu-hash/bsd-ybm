"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Plus,
  Trash2,
  Send,
  CheckCircle2,
  Receipt,
  CreditCard,
  FileDown,
  ChevronDown,
  Loader2,
} from "lucide-react";

/* ───── סוגי מסמכים ───── */
const DOC_TYPES = [
  { value: "INVOICE", label: "חשבונית מס", icon: FileText },
  { value: "RECEIPT", label: "קבלה", icon: Receipt },
  { value: "INVOICE_RECEIPT", label: "חשבונית מס / קבלה", icon: CreditCard },
  { value: "CREDIT_NOTE", label: "הודעת זיכוי", icon: FileDown },
] as const;

type DocType = (typeof DOC_TYPES)[number]["value"];

interface LineItem {
  desc: string;
  qty: number;
  price: number;
}

const emptyItem = (): LineItem => ({ desc: "", qty: 1, price: 0 });

/* ───── IssuedDoc — מה שחוזר מהשרת ───── */
interface IssuedDoc {
  id: string;
  type: DocType;
  number: number;
  clientName: string;
  amount: number;
  vat: number;
  total: number;
  status: "PENDING" | "PAID" | "CANCELLED";
  items: LineItem[];
  date: string;
  dueDate: string | null;
}

/* ═══════════════════════════════════════════════════════════ */
export default function InvoiceIssuance({ orgId }: { orgId: string }) {
  void orgId; // used implicitly via session on the server

  /* ---------- state ---------- */
  const [docType, setDocType] = useState<DocType>("INVOICE");
  const [clientName, setClientName] = useState("");
  const [items, setItems] = useState<LineItem[]>([emptyItem()]);
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<IssuedDoc | null>(null);
  const [error, setError] = useState("");

  /* ---------- history ---------- */
  const [history, setHistory] = useState<IssuedDoc[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  /* ---------- helpers ---------- */
  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);
  const vat = Math.round(subtotal * 0.17 * 100) / 100;
  const total = Math.round((subtotal + vat) * 100) / 100;

  const updateItem = (idx: number, field: keyof LineItem, val: string | number) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [field]: val } : it)));
  };

  const removeItem = (idx: number) => {
    setItems((prev) => (prev.length === 1 ? [emptyItem()] : prev.filter((_, i) => i !== idx)));
  };

  const loadHistory = useCallback(async () => {
    if (historyLoaded) {
      setShowHistory((v) => !v);
      return;
    }
    try {
      const res = await fetch("/api/erp/issued-documents");
      if (!res.ok) throw new Error("failed");
      const data = await res.json();
      setHistory(data.documents ?? []);
      setHistoryLoaded(true);
      setShowHistory(true);
    } catch {
      setError("שגיאה בטעינת היסטוריית מסמכים");
    }
  }, [historyLoaded]);

  /* ---------- submit ---------- */
  const submit = async () => {
    if (!clientName.trim()) {
      setError("נא להזין שם לקוח");
      return;
    }
    if (items.some((i) => !i.desc.trim() || i.qty <= 0 || i.price <= 0)) {
      setError("נא למלא את כל שדות הפריטים (תיאור, כמות > 0, מחיר > 0)");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/erp/issued-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: docType,
          clientName: clientName.trim(),
          items,
          dueDate: dueDate || undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        throw new Error(d?.error || "שגיאה בהנפקה");
      }
      const data = await res.json();
      setSuccess(data.document);
      setHistory((prev) => [data.document, ...prev]);
      // reset
      setClientName("");
      setItems([emptyItem()]);
      setDueDate("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "שגיאה בהנפקה");
    } finally {
      setSaving(false);
    }
  };

  /* ---------- type label ---------- */
  const typeLabel = DOC_TYPES.find((t) => t.value === docType)?.label ?? "";

  /* ═══════════════════════════════════════════════════════════ */
  return (
    <div className="mx-auto max-w-3xl space-y-6" dir="rtl">
      {/* ---- Header ---- */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">הנפקת מסמכים</h1>
          <p className="mt-1 text-sm text-slate-500">
            הנפקת חשבוניות מס, קבלות, חשבוניות מס/קבלה והודעות זיכוי
          </p>
        </div>
        <button
          onClick={loadHistory}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
        >
          היסטוריה
          <ChevronDown
            size={16}
            className={`transition-transform ${showHistory ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {/* ---- Success toast ---- */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-800 shadow-sm"
          >
            <CheckCircle2 size={22} className="shrink-0" />
            <span className="text-sm font-semibold">
              {typeLabel} #{success.number} הונפקה בהצלחה — סה״כ ₪{success.total.toLocaleString()}
            </span>
            <button
              onClick={() => setSuccess(null)}
              className="mr-auto text-xs font-bold text-emerald-600 hover:underline"
            >
              סגור
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---- Error ---- */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════ Form Card ════════ */}
      <motion.div
        layout
        className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8"
      >
        {/* Doc type pills */}
        <label className="mb-2 block text-sm font-bold text-slate-600">סוג מסמך</label>
        <div className="mb-6 flex flex-wrap gap-2">
          {DOC_TYPES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setDocType(value)}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                docType === value
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                  : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {/* Client + Due date */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-600">שם לקוח</label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="לדוגמה: חברת אלפא בע״מ"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-600">תאריך יעד לתשלום</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
            />
          </div>
        </div>

        {/* Line items */}
        <label className="mb-2 block text-sm font-bold text-slate-600">פריטים</label>
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="flex flex-wrap items-end gap-2 rounded-xl border border-slate-100 bg-slate-50/60 p-3 sm:flex-nowrap"
            >
              <div className="min-w-0 flex-1">
                <label className="mb-1 block text-xs font-semibold text-slate-500">תיאור</label>
                <input
                  type="text"
                  value={item.desc}
                  onChange={(e) => updateItem(idx, "desc", e.target.value)}
                  placeholder="תיאור הפריט"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                />
              </div>
              <div className="w-20">
                <label className="mb-1 block text-xs font-semibold text-slate-500">כמות</label>
                <input
                  type="number"
                  min={1}
                  value={item.qty}
                  onChange={(e) => updateItem(idx, "qty", Math.max(1, +e.target.value))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                />
              </div>
              <div className="w-28">
                <label className="mb-1 block text-xs font-semibold text-slate-500">מחיר ליח׳ ₪</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={item.price || ""}
                  onChange={(e) => updateItem(idx, "price", Math.max(0, +e.target.value))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                />
              </div>
              <div className="w-24 text-left">
                <label className="mb-1 block text-xs font-semibold text-slate-500">סה״כ</label>
                <span className="block py-2 text-sm font-bold text-slate-700">
                  ₪{(item.qty * item.price).toLocaleString()}
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeItem(idx)}
                className="mb-0.5 rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                aria-label="הסר פריט"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setItems((prev) => [...prev, emptyItem()])}
          className="mt-3 flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-indigo-600 transition-colors hover:bg-indigo-50"
        >
          <Plus size={16} /> הוסף פריט
        </button>

        {/* Totals */}
        <div className="mt-6 space-y-1 border-t border-slate-100 pt-4 text-left">
          <div className="flex justify-between text-sm text-slate-500">
            <span>סכום לפני מע״מ</span>
            <span className="font-semibold text-slate-700">₪{subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-500">
            <span>מע״מ (17%)</span>
            <span className="font-semibold text-slate-700">₪{vat.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-base font-extrabold text-slate-800">
            <span>סה״כ לתשלום</span>
            <span className="text-indigo-600">₪{total.toLocaleString()}</span>
          </div>
        </div>

        {/* Submit */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          disabled={saving}
          onClick={submit}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3.5 text-base font-extrabold text-white shadow-lg shadow-indigo-600/25 transition-colors hover:bg-indigo-700 disabled:opacity-60"
        >
          {saving ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Send size={18} />
          )}
          {saving ? "מנפיק..." : `הנפק ${typeLabel}`}
        </motion.button>
      </motion.div>

      {/* ════════ History ════════ */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm"
          >
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-extrabold text-slate-800">מסמכים שהונפקו</h2>
            </div>
            {history.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-slate-400">
                לא הונפקו מסמכים עדיין
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {history.map((doc) => {
                  const dt = DOC_TYPES.find((t) => t.value === doc.type);
                  const Icon = dt?.icon ?? FileText;
                  return (
                    <div
                      key={doc.id}
                      className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-slate-50"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                        <Icon size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-700">
                          {dt?.label} #{doc.number}
                        </p>
                        <p className="text-xs text-slate-400">{doc.clientName}</p>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-slate-700">
                          ₪{doc.total.toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-400">
                          {new Date(doc.date).toLocaleDateString("he-IL")}
                        </p>
                      </div>
                      <span
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                          doc.status === "PAID"
                            ? "bg-emerald-50 text-emerald-700"
                            : doc.status === "CANCELLED"
                              ? "bg-red-50 text-red-600"
                              : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {doc.status === "PAID"
                          ? "שולם"
                          : doc.status === "CANCELLED"
                            ? "בוטל"
                            : "ממתין"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
