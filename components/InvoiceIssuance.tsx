"use client";

import { useState, useCallback, useEffect, useRef } from "react";
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
import { trackWizardEvent } from "@/lib/client-telemetry";

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

const INVOICE_DRAFT_KEY = "bsd-erp:invoice-draft";
const INVOICE_STEP_KEY = "bsd-erp:invoice-step";

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
export default function InvoiceIssuance({ orgId, prefillClientName, prefillContactId }: { orgId: string; prefillClientName?: string; prefillContactId?: string }) {
  void orgId; // used implicitly via session on the server

  /* ---------- state ---------- */
  const [docType, setDocType] = useState<DocType>("INVOICE");
  const [clientName, setClientName] = useState("");
  const [contactId, setContactId] = useState<string | undefined>(prefillContactId);
  const [items, setItems] = useState<LineItem[]>([emptyItem()]);
  const [dueDate, setDueDate] = useState("");
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<IssuedDoc | null>(null);
  const [error, setError] = useState("");

  /* ---------- CRM autocomplete ---------- */
  const [crmSuggestions, setCrmSuggestions] = useState<{ id: string; name: string; value: number | null }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const crmFetchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchCrmSuggestions = useCallback(async (q: string) => {
    if (!q.trim()) { setCrmSuggestions([]); return; }
    try {
      const res = await fetch(`/api/crm/contacts?q=${encodeURIComponent(q)}`);
      if (!res.ok) return;
      const data = await res.json();
      setCrmSuggestions((data.contacts ?? []).slice(0, 8).map((c: { id: string; name: string; value: number | null }) => ({ id: c.id, name: c.name, value: c.value })));
    } catch { /* silent */ }
  }, []);

  const handleClientNameChange = (v: string) => {
    setClientName(v);
    setContactId(undefined);
    if (crmFetchRef.current) clearTimeout(crmFetchRef.current);
    crmFetchRef.current = setTimeout(() => fetchCrmSuggestions(v), 250);
    setShowSuggestions(true);
  };

  const selectCrmContact = (c: { id: string; name: string; value: number | null }) => {
    setClientName(c.name);
    setContactId(c.id);
    setCrmSuggestions([]);
    setShowSuggestions(false);
    if (c.value && c.value > 0 && items.length === 1 && !items[0].desc && items[0].price === 0) {
      setItems([{ desc: "שירותים / מוצרים", qty: 1, price: c.value }]);
    }
  };

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

  useEffect(() => {
    try {
      const rawStep = window.localStorage.getItem(INVOICE_STEP_KEY);
      if (rawStep === "1" || rawStep === "2" || rawStep === "3" || rawStep === "4") {
        setWizardStep(Number(rawStep) as 1 | 2 | 3 | 4);
      }
      const rawDraft = window.localStorage.getItem(INVOICE_DRAFT_KEY);
      if (!rawDraft) return;
      const parsed = JSON.parse(rawDraft) as {
        docType?: DocType;
        clientName?: string;
        dueDate?: string;
        items?: LineItem[];
      };
      if (parsed.docType) setDocType(parsed.docType);
      if (typeof parsed.clientName === "string") setClientName(parsed.clientName);
      if (typeof parsed.dueDate === "string") setDueDate(parsed.dueDate);
      if (Array.isArray(parsed.items) && parsed.items.length > 0) {
        setItems(
          parsed.items.map((it) => ({
            desc: String(it.desc ?? ""),
            qty: Math.max(1, Number(it.qty ?? 1)),
            price: Math.max(0, Number(it.price ?? 0)),
          })),
        );
      }
    } catch {
      // Ignore malformed local storage payload.
    }
  }, []);

  // Pre-fill client name from URL (e.g. coming from CRM CLOSED_WON contact)
  useEffect(() => {
    if (prefillClientName) {
      setClientName(prefillClientName);
      setWizardStep(1);
    }
    if (prefillContactId) setContactId(prefillContactId);
  }, [prefillClientName, prefillContactId]);

  useEffect(() => {
    window.localStorage.setItem(INVOICE_STEP_KEY, String(wizardStep));
  }, [wizardStep]);

  useEffect(() => {
    void trackWizardEvent("invoice_step_view", `step=${wizardStep}`);
  }, [wizardStep]);

  useEffect(() => {
    const payload = { docType, clientName, dueDate, items };
    window.localStorage.setItem(INVOICE_DRAFT_KEY, JSON.stringify(payload));
  }, [docType, clientName, dueDate, items]);

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
          contactId: contactId || undefined,
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
      setWizardStep(4);
      window.localStorage.removeItem(INVOICE_DRAFT_KEY);
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
    <div className="mx-auto max-w-5xl space-y-6" dir="rtl">
      {/* ---- Header ---- */}
      <section className="overflow-hidden rounded-[32px] border border-white/[0.08] bg-[#0a0b14] shadow-sm">
        <div className="bg-[linear-gradient(135deg,_#f8fbff_0%,_#eef6ff_55%,_#ffffff_100%)] px-6 py-7 md:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-[#0a0b14] px-3 py-1 text-xs font-black text-indigo-300">Invoice workspace</p>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-white">הנפקת מסמכים</h1>
              <p className="mt-2 text-sm leading-6 text-white/55">חשבוניות, קבלות וזיכויים במסך פשוט יותר: פרטים, פריטים, בדיקה, סיום.</p>
            </div>
            <button
              onClick={loadHistory}
              className="flex items-center justify-center gap-1.5 rounded-2xl border border-white/[0.08] bg-[#0a0b14] px-4 py-3 text-sm font-semibold text-white/65 shadow-sm transition-colors hover:bg-white/[0.03]"
            >
              היסטוריה
              <ChevronDown
                size={16}
                className={`transition-transform ${showHistory ? "rotate-180" : ""}`}
              />
            </button>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-indigo-500/20 bg-[#0a0b14] px-4 py-4">
              <p className="text-xs font-bold text-white/45">סוג מסמך</p>
              <p className="mt-1 text-lg font-black text-white">{typeLabel}</p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-[#0a0b14] px-4 py-4">
              <p className="text-xs font-bold text-white/45">פריטים</p>
              <p className="mt-1 text-2xl font-black text-white">{items.length}</p>
            </div>
            <div className="rounded-2xl border border-indigo-500/20 bg-[#0a0b14] px-4 py-4">
              <p className="text-xs font-bold text-white/45">סה&quot;כ נוכחי</p>
              <p className="mt-1 text-2xl font-black text-white">₪{total.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/[0.07] px-6 py-5 md:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-base font-black text-white">התקדמות מונחית</h2>
              <p className="mt-1 text-sm text-white/45">הטיוטה נשמרת אוטומטית גם אם יוצאים מהעמוד.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setWizardStep(s as 1 | 2 | 3 | 4)}
                  className={`rounded-2xl px-4 py-2.5 text-sm font-bold transition ${
                    wizardStep === s
                      ? "bg-gray-900 text-white"
                      : "border border-white/[0.08] bg-[#0a0b14] text-white/65 hover:bg-white/[0.03]"
                  }`}
                >
                  {s === 1 ? "1. פרטים" : s === 2 ? "2. פריטים" : s === 3 ? "3. בדיקה" : "4. סיום"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---- Success toast ---- */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="flex items-center gap-3 rounded-[24px] border border-emerald-500/25 bg-emerald-500/15 px-5 py-4 text-emerald-800 shadow-sm"
          >
            <CheckCircle2 size={22} className="shrink-0" />
            <span className="text-sm font-semibold">
              {typeLabel} #{success.number} הונפקה בהצלחה — סה״כ ₪{success.total.toLocaleString()}
            </span>
            <button
              onClick={() => setSuccess(null)}
              className="mr-auto text-xs font-bold text-emerald-400 hover:underline"
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
            className="rounded-[24px] border border-rose-500/25 bg-rose-500/[0.08] px-5 py-3 text-sm font-semibold text-rose-300 shadow-sm"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════ Form Card ════════ */}
      <motion.div
        layout
        className="rounded-[30px] border border-white/[0.08] bg-[#0a0b14] p-6 shadow-sm sm:p-8"
      >
        {wizardStep === 1 && (
          <>
            <label className="mb-2 block text-sm font-bold text-white/55">סוג מסמך</label>
            <p className="mb-5 text-sm leading-6 text-white/45">בוחרים קודם את סוג המסמך ואת פרטי הלקוח, ורק אחר כך ממשיכים לפריטים.</p>
            <div className="mb-6 flex flex-wrap gap-2">
              {DOC_TYPES.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setDocType(value)}
                  className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                    docType === value
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                      : "border border-white/[0.08] bg-white/[0.03] text-white/55 hover:bg-white/[0.05]"
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>

            <div className="mb-6 grid gap-4 sm:grid-cols-2">
              <div className="relative">
                <label className="mb-1.5 block text-sm font-bold text-white/55">שם לקוח</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => handleClientNameChange(e.target.value)}
                  onFocus={() => clientName && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  placeholder="לדוגמה: חברת אלפא בע״מ — או חפש מ-CRM"
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white/75 placeholder:text-white/35 focus:border-indigo-400 focus:bg-[#0a0b14] focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                />
                {contactId && (
                  <span className="absolute end-3 top-10 text-[10px] font-black text-emerald-400 bg-emerald-500/15 rounded-full px-2 py-0.5">CRM ✓</span>
                )}
                {showSuggestions && crmSuggestions.length > 0 && (
                  <div className="absolute z-50 top-full mt-1 w-full rounded-xl border border-white/[0.08] bg-[#0a0b14] shadow-xl overflow-hidden">
                    <p className="px-3 py-1.5 text-[9px] font-black text-white/35 uppercase tracking-wider border-b border-white/[0.07]">לקוחות CRM</p>
                    {crmSuggestions.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onMouseDown={() => selectCrmContact(c)}
                        className="flex items-center justify-between w-full px-3 py-2 text-sm text-right hover:bg-indigo-500/15 transition"
                      >
                        <span className="font-bold text-white">{c.name}</span>
                        {c.value != null && <span className="text-xs text-emerald-400 font-black">₪{c.value.toLocaleString()}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-bold text-white/55">תאריך יעד לתשלום</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white/75 focus:border-indigo-400 focus:bg-[#0a0b14] focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => setWizardStep(2)}
              className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700"
            >
              המשך לפריטים
            </button>
          </>
        )}

        {wizardStep === 2 && (
          <>
            <label className="mb-2 block text-sm font-bold text-white/55">פריטים</label>
            <p className="mb-5 text-sm leading-6 text-white/45">כל שורה נשארת פשוטה: תיאור, כמות, מחיר וסכום שורה.</p>
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-wrap items-end gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03]/60 p-3 sm:flex-nowrap"
                >
                  <div className="min-w-0 flex-1">
                    <label className="mb-1 block text-xs font-semibold text-white/45">תיאור</label>
                    <input
                      type="text"
                      value={item.desc}
                      onChange={(e) => updateItem(idx, "desc", e.target.value)}
                      placeholder="תיאור הפריט"
                      className="w-full rounded-lg border border-white/[0.08] bg-[#0a0b14] px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                    />
                  </div>
                  <div className="w-20">
                    <label className="mb-1 block text-xs font-semibold text-white/45">כמות</label>
                    <input
                      type="number"
                      min={1}
                      value={item.qty}
                      onChange={(e) => updateItem(idx, "qty", Math.max(1, +e.target.value))}
                      className="w-full rounded-lg border border-white/[0.08] bg-[#0a0b14] px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                    />
                  </div>
                  <div className="w-28">
                    <label className="mb-1 block text-xs font-semibold text-white/45">מחיר ליח׳ ₪</label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={item.price || ""}
                      onChange={(e) => updateItem(idx, "price", Math.max(0, +e.target.value))}
                      className="w-full rounded-lg border border-white/[0.08] bg-[#0a0b14] px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                    />
                  </div>
                  <div className="w-24 text-left">
                    <label className="mb-1 block text-xs font-semibold text-white/45">סה״כ</label>
                    <span className="block py-2 text-sm font-bold text-white/65">
                      ₪{(item.qty * item.price).toLocaleString()}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="mb-0.5 rounded-lg p-2 text-white/35 transition-colors hover:bg-rose-500/[0.08] hover:text-red-500"
                    aria-label="הסר פריט"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setItems((prev) => [...prev, emptyItem()])}
                className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-indigo-400 transition-colors hover:bg-indigo-500/15"
              >
                <Plus size={16} /> הוסף פריט
              </button>
              <button
                type="button"
                onClick={() => setWizardStep(1)}
                className="rounded-xl border border-white/[0.08] bg-[#0a0b14] px-4 py-2 text-sm font-bold text-white/65 hover:bg-white/[0.03]"
              >
                חזרה לפרטי מסמך
              </button>
              <button
                type="button"
                onClick={() => setWizardStep(3)}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700"
              >
                המשך לבדיקה
              </button>
            </div>
          </>
        )}

        {wizardStep === 3 && (
          <>
            <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-5 text-sm">
              <p className="font-bold text-white/75">סיכום לפני הנפקה</p>
              <p className="mt-1 text-white/55">{typeLabel} עבור {clientName || "לקוח ללא שם"}</p>
              <p className="text-white/55">פריטים: {items.length}</p>
            </div>

            <div className="mt-6 space-y-1 border-t border-white/[0.07] pt-4 text-left">
              <div className="flex justify-between text-sm text-white/45">
                <span>סכום לפני מע״מ</span>
                <span className="font-semibold text-white/65">₪{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-white/45">
                <span>מע״מ (17%)</span>
                <span className="font-semibold text-white/65">₪{vat.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-white/75">
                <span>סה״כ לתשלום</span>
                <span className="text-indigo-400">₪{total.toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setWizardStep(2)}
                className="rounded-xl border border-white/[0.08] bg-[#0a0b14] px-4 py-2 text-sm font-bold text-white/65 hover:bg-white/[0.03]"
              >
                חזרה לעריכת פריטים
              </button>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                disabled={saving}
                onClick={submit}
                className="flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-base font-extrabold text-white shadow-lg shadow-indigo-600/25 transition-colors hover:bg-indigo-700 disabled:opacity-60"
              >
                {saving ? <Loader2 size={20} className="animate-spin" /> : <Send size={18} />}
                {saving ? "מנפיק..." : `הנפק ${typeLabel}`}
              </motion.button>
            </div>
          </>
        )}

        {wizardStep === 4 && (
          <div className="rounded-[24px] border border-emerald-500/25 bg-emerald-500/15 p-5 text-sm text-emerald-900 shadow-sm">
            <p className="font-black">המסמך הונפק בהצלחה.</p>
            <p className="mt-1">אפשר לעבור להיסטוריה או להתחיל מסמך חדש.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setWizardStep(1);
                  setSuccess(null);
                }}
                className="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800"
              >
                מסמך חדש
              </button>
              <button
                type="button"
                onClick={() => setShowHistory(true)}
                className="rounded-xl border border-emerald-300 bg-[#0a0b14] px-4 py-2 text-xs font-bold text-emerald-900 hover:bg-emerald-100"
              >
                צפייה בהיסטוריה
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* ════════ History ════════ */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#0a0b14] shadow-sm"
          >
            <div className="border-b border-white/[0.07] px-6 py-4">
              <h2 className="text-lg font-extrabold text-white/75">מסמכים שהונפקו</h2>
            </div>
            {history.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-white/35">
                לא הונפקו מסמכים עדיין
              </p>
            ) : (
              <div className="divide-y divide-white/[0.07]">
                {history.map((doc) => {
                  const dt = DOC_TYPES.find((t) => t.value === doc.type);
                  const Icon = dt?.icon ?? FileText;
                  return (
                    <div
                      key={doc.id}
                      className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-white/[0.03]"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-400">
                        <Icon size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-white/65">
                          {dt?.label} #{doc.number}
                        </p>
                        <p className="text-xs text-white/35">{doc.clientName}</p>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-white/65">
                          ₪{doc.total.toLocaleString()}
                        </p>
                        <p className="text-xs text-white/35">
                          {new Date(doc.date).toLocaleDateString("he-IL")}
                        </p>
                      </div>
                      <span
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                          doc.status === "PAID"
                            ? "bg-emerald-500/15 text-emerald-400"
                            : doc.status === "CANCELLED"
                              ? "bg-rose-500/[0.08] text-rose-400"
                              : "bg-amber-500/15 text-amber-400"
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
