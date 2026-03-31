"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Loader2 } from "lucide-react";
import { useI18n } from "@/components/I18nProvider";

type Props = {
  invoiceId: string;
  amount: number;
  customerName?: string;
  customerEmail?: string;
  /** מסומן בשרת לפי משתני env — בלי לחשוף מפתחות */
  payplusConfigured?: boolean;
  /** dev או PAYPLUS_ALLOW_MOCK=true — כפתור סימולציה בלי PayPlus */
  mockPaymentAllowed?: boolean;
};

/** הסכום והלקוח משמשים לתצוגה בלבד; השרת טוען מחדש מה־DB לפי invoiceId */
export default function PayPlusButton({
  invoiceId,
  amount,
  payplusConfigured = true,
  mockPaymentAllowed = false,
}: Props) {
  const { dir } = useI18n();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function goPay() {
    setErr(null);
    setLoading(true);
    try {
      const r = await fetch("/api/payplus/generate-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId }),
      });
      const j = (await r.json()) as { url?: string; error?: string };
      if (!r.ok) {
        throw new Error(j.error || "שגיאה ביצירת קישור תשלום");
      }
      if (!j.url) {
        throw new Error("לא התקבל קישור מ־PayPlus");
      }
      window.location.href = j.url;
    } catch (e) {
      setErr(e instanceof Error ? e.message : "שגיאה לא ידועה");
      setLoading(false);
    }
  }

  async function mockPay() {
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/payplus/mock-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !data.success) {
        throw new Error(data.error || "סימולציה נכשלה");
      }
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "שגיאה לא ידועה");
    } finally {
      setLoading(false);
    }
  }

  if (!payplusConfigured && mockPaymentAllowed) {
    return (
      <div className="w-full space-y-3" dir={dir}>
        <div className="card-avenue border-blue-200 bg-blue-50/80 p-4 text-start">
          <p className="text-sm font-bold text-blue-900">מצב פיתוח — סימולציית תשלום</p>
          <p className="text-[11px] leading-relaxed text-blue-800/90 mt-1">
            PayPlus לא מוגדר. אפשר לסמן חשבונית כשולמה לבדיקת UI בלבד (ללא סליקה אמיתית).
          </p>
        </div>
        <button
          type="button"
          onClick={mockPay}
          disabled={loading || amount <= 0}
          className="btn-primary w-full py-4 text-sm disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <CreditCard size={20} strokeWidth={2} />
          )}
          {loading
            ? "מעבד סימולציה…"
            : `סימולציית תשלום · ₪${amount.toLocaleString("he-IL")}`}
        </button>
        {err ? (
          <p className="text-center text-xs font-medium text-rose-700" role="alert">
            {err}
          </p>
        ) : null}
      </div>
    );
  }

  if (!payplusConfigured) {
    return (
      <div className="card-avenue w-full space-y-3 border-blue-200 bg-blue-50/80 p-4 text-start" dir={dir}>
        <p className="text-sm font-bold text-blue-900">
          PayPlus עדיין לא מחובר לשרת
        </p>
        <p className="text-xs leading-relaxed text-blue-800/90">
          הוסף ל־<code className="rounded bg-white/80 px-1">.env.local</code> את המשתנים הבאים
          (מלוח הבקרה של PayPlus → API / דפי תשלום), שמור את הקובץ והפעל מחדש את{" "}
          <code className="rounded bg-white/80 px-1">npm run dev</code>:
        </p>
        <ul className="list-disc list-inside text-[11px] text-blue-800/85 font-mono space-y-0.5">
          <li>PAYPLUS_API_KEY</li>
          <li>PAYPLUS_SECRET_KEY</li>
          <li>PAYPLUS_PAYMENT_PAGE_UID</li>
        </ul>
        <p className="text-[11px] text-blue-700/80">
          לסביבת בדיקות אפשר להגדיר גם{" "}
          <code className="rounded bg-white/80 px-1">PAYPLUS_API_URL=https://restapidev.payplus.co.il/api/v1.0</code>
        </p>
        <button
          type="button"
          disabled
          className="w-full flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-100 py-4 px-6 text-sm font-black text-slate-500 cursor-not-allowed"
        >
          <CreditCard size={20} strokeWidth={2} />
          תשלום מאובטח · ₪{amount.toLocaleString("he-IL")}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full" dir={dir}>
      <button
        type="button"
        onClick={goPay}
        disabled={loading || amount <= 0}
        className="btn-primary w-full py-4 text-sm disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="animate-spin" size={20} />
        ) : (
          <CreditCard size={20} strokeWidth={2} />
        )}
        {loading ? "פותח תשלום…" : `תשלום מאובטח · ₪${amount.toLocaleString("he-IL")}`}
      </button>
      {err ? (
        <p className="mt-2 text-center text-xs font-medium text-rose-700" role="alert">
          {err}
        </p>
      ) : null}
    </div>
  );
}
