"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Plus,
  Trash2,
  Calculator,
  User,
  FileText,
  Receipt,
  Check,
} from "lucide-react";
import { CompanyType, DocType } from "@prisma/client";
import { createIssuedDocument } from "@/app/dashboard/billing/actions";
import { calculateIssuedDocumentTotals, VAT_RATE } from "@/lib/billing-calculations";

export type CrmContactOption = { id: string; name: string };

type LineItem = { desc: string; qty: number; price: number };

type Props = {
  isOpen: boolean;
  onClose: () => void;
  contacts: CrmContactOption[];
  companyType: CompanyType;
  isReportable: boolean;
};

export default function CreateIssuedDocumentModal({
  isOpen,
  onClose,
  contacts,
  companyType,
  isReportable,
}: Props) {
  const router = useRouter();
  const [clientName, setClientName] = useState("");
  const [docType, setDocType] = useState<DocType>(DocType.INVOICE_RECEIPT);
  const [items, setItems] = useState<LineItem[]>([{ desc: "", qty: 1, price: 0 }]);
  const [loading, setLoading] = useState(false);

  const totals = useMemo(() => {
    const netAmount = items.reduce((sum, item) => sum + item.qty * item.price, 0);
    return calculateIssuedDocumentTotals(netAmount, companyType, isReportable);
  }, [items, companyType, isReportable]);

  if (!isOpen) return null;

  const addItem = () => setItems((prev) => [...prev, { desc: "", qty: 1, price: 0 }]);
  const removeItem = (index: number) =>
    setItems((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));

  const updateItem = (index: number, field: keyof LineItem, value: string | number) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!clientName.trim() || !items.some((i) => i.desc.trim())) {
      window.alert("נא למלא שם לקוח ולפחות פריט אחד עם תיאור.");
      return;
    }
    setLoading(true);
    try {
      const res = await createIssuedDocument({
        type: docType,
        clientName: clientName.trim(),
        netAmount: totals.net,
        items,
      });
      if (res.ok) {
        window.alert(`מסמך #${res.docNumber} הופק בהצלחה!`);
        setClientName("");
        setDocType(DocType.INVOICE_RECEIPT);
        setItems([{ desc: "", qty: 1, price: 0 }]);
        onClose();
        router.refresh();
      } else {
        window.alert(res.error);
      }
    } catch {
      window.alert("שגיאה בהפקת המסמך");
    } finally {
      setLoading(false);
    }
  };

  const vatPercentLabel =
    companyType === CompanyType.EXEMPT_DEALER ? "0%" : `${Math.round(VAT_RATE * 100)}%`;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 overflow-y-auto"
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="issued-doc-modal-title"
    >
      <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden my-8">
        <div className="bg-gradient-to-r from-blue-700 to-indigo-600 p-8 text-white flex justify-between items-center gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="bg-white/20 p-3 rounded-2xl shrink-0">
              <FileText />
            </div>
            <div className="min-w-0">
              <h2 id="issued-doc-modal-title" className="text-2xl font-black italic tracking-tighter">
                הפקת מסמך חדש
              </h2>
              <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mt-1">
                {!isReportable
                  ? "מזכר פנימי — ללא דיווח מס"
                  : companyType === CompanyType.EXEMPT_DEALER
                    ? "עוסק פטור (ללא מע״מ)"
                    : "עוסק מורשה / חברה (17% מע״מ)"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="hover:rotate-90 transition-transform bg-white/10 p-2 rounded-full shrink-0"
            aria-label="סגור"
          >
            <X size={22} />
          </button>
        </div>

        <div className="p-10 space-y-8 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-sm font-black text-slate-500 flex items-center gap-2">
                <Receipt size={16} /> סוג המסמך
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value as DocType)}
                className="w-full bg-slate-50 p-4 rounded-2xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500 font-bold outline-none"
              >
                <option value={DocType.INVOICE_RECEIPT}>חשבונית מס קבלה</option>
                <option value={DocType.INVOICE}>חשבונית מס</option>
                <option value={DocType.RECEIPT}>קבלה</option>
                <option value={DocType.CREDIT_NOTE}>חשבונית זיכוי</option>
              </select>
              <p className="text-xs text-slate-500 leading-relaxed mt-2">
                כל סוגי המסמכים הללו זמינים לכל ארגון לפי{" "}
                <strong>סיווג המס והדיווח</strong> שהגדיר מנהל הארגון בהגדרות. מע״מ וניסוח המסמך
                מחושבים אוטומטית לפי הסיווג. גבייה מהלקוח — בדף{" "}
                <span className="font-semibold text-slate-700">מנוי ותשלומים</span> (PayPal), לפי
                תוכנית ומגבלות המנוי.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-black text-slate-500 flex items-center gap-2">
                <User size={16} /> שם הלקוח (CRM)
              </label>
              <input
                list="crm-contacts-billing"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="חפש לקוח קיים או הקלד שם חדש..."
                className="w-full bg-slate-50 p-4 rounded-2xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500 font-bold outline-none"
              />
              <datalist id="crm-contacts-billing">
                {contacts.map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                <Calculator size={18} /> פירוט השירותים
              </h3>
              <button
                type="button"
                onClick={addItem}
                className="text-blue-600 font-bold text-sm flex items-center gap-1 hover:bg-blue-50 px-3 py-1 rounded-lg transition-colors"
              >
                <Plus size={16} /> הוסף שורה
              </button>
            </div>

            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                <div className="md:col-span-6">
                  <input
                    placeholder="תיאור השירות/מוצר..."
                    value={item.desc}
                    onChange={(e) => updateItem(index, "desc", e.target.value)}
                    className="w-full bg-white p-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none font-medium"
                  />
                </div>
                <div className="md:col-span-2">
                  <input
                    type="number"
                    min={0}
                    step="any"
                    placeholder="כמות"
                    value={item.qty}
                    onChange={(e) => updateItem(index, "qty", Number(e.target.value))}
                    className="w-full bg-white p-3 rounded-xl border border-slate-200 text-center font-bold"
                  />
                </div>
                <div className="md:col-span-3">
                  <input
                    type="number"
                    min={0}
                    step="any"
                    placeholder="מחיר יח׳"
                    value={item.price}
                    onChange={(e) => updateItem(index, "price", Number(e.target.value))}
                    className="w-full bg-white p-3 rounded-xl border border-slate-200 text-left font-black"
                  />
                </div>
                <div className="md:col-span-1 flex justify-center">
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    disabled={items.length <= 1}
                    className="text-slate-300 hover:text-red-500 transition-colors disabled:opacity-30"
                    aria-label="מחק שורה"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-3">
            <div className="flex justify-between text-slate-500 font-bold">
              <span>סה״כ לפני מע״מ:</span>
              <span>₪{totals.net.toLocaleString("he-IL", { maximumFractionDigits: 2 })}</span>
            </div>
            {isReportable ? (
              <div className="flex justify-between text-slate-400 font-medium">
                <span>מע״מ ({vatPercentLabel}):</span>
                <span>₪{totals.vat.toLocaleString("he-IL", { maximumFractionDigits: 2 })}</span>
              </div>
            ) : null}
            <div className="flex justify-between text-2xl font-black text-slate-900 pt-3 border-t border-slate-200">
              <span>סה״כ לתשלום:</span>
              <span className="italic">
                ₪{totals.total.toLocaleString("he-IL", { maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        <div className="p-8 bg-slate-50/50 flex flex-wrap justify-end gap-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-8 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-colors"
          >
            ביטול
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={loading}
            className="bg-gradient-to-r from-blue-700 to-indigo-600 text-white px-12 py-4 rounded-2xl font-black shadow-xl shadow-blue-200 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              "מפיק מסמך..."
            ) : (
              <>
                <Check size={20} /> {isReportable ? "הפק מסמך רשמי" : "הפק מזכר פנימי"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
