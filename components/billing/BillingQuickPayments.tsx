"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Zap, ArrowDown } from "lucide-react";
import { createQuickPaymentInvoiceAction } from "@/app/actions/billing-invoice";
import { planPriceIls } from "@/lib/subscription-plans";

export default function BillingQuickPayments() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [custom, setCustom] = useState("");

  const run = (amount: number, description: string) => {
    startTransition(async () => {
      const r = await createQuickPaymentInvoiceAction(amount, description);
      if (r.ok) router.refresh();
      else window.alert(r.error);
    });
  };

  const scrollToPayPalSubscribe = () => {
    document.getElementById("paypal-subscription")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const pro = planPriceIls("PRO");
  const bus = planPriceIls("BUSINESS");

  const applyCustom = () => {
    const n = Number(String(custom).replace(",", ".").trim());
    if (!Number.isFinite(n) || n <= 0) {
      window.alert("הזינו מספר חיובי");
      return;
    }
    run(n, `בקשת תשלום ₪${n.toLocaleString("he-IL")} (מותאם)`);
    setCustom("");
  };

  const btn =
    "rounded-2xl border px-4 py-3 text-sm font-black transition-all disabled:opacity-50 disabled:pointer-events-none";

  return (
    <section
      className="rounded-[2rem] border border-indigo-200/80 bg-gradient-to-br from-indigo-50/90 to-white p-6 md:p-8 shadow-lg shadow-indigo-100/40"
      dir="rtl"
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="rounded-xl bg-indigo-600 p-2.5 text-white shrink-0">
          <Zap size={22} aria-hidden />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900">אפשרויות תשלום וגבייה</h2>
          <p className="text-sm text-slate-600 mt-1 leading-relaxed">
            <strong>בקשות גבייה</strong> (₪10 / סכום מותאם / סכום כמו מחירון) נוצרות כשורה בטבלה ומקבלות קישור PayPal.Me
            אם הגדרתם אותו. <strong>מנוי חודשי אמיתי</strong> — רק דרך כפתורי PayPal בשלב &quot;הפעלת מנוי&quot; למטה (לא
            אותה פעולה כמו בקשת גבייה).
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <button
          type="button"
          disabled={pending}
          onClick={() => run(10, "תשלום חד-פעמי ₪10")}
          className={`${btn} border-indigo-300 bg-white text-indigo-900 hover:bg-indigo-50`}
        >
          ₪10 — בקשת גבייה
        </button>
        {pro != null ? (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              run(pro, `בקשת תשלום חד-פעמית בסכום מחירון Pro (₪${pro}) — לא מנוי מחודש`)
            }
            className={`${btn} border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100`}
          >
            ₪{pro.toLocaleString("he-IL")} — כמו Pro (חד-פעמי)
          </button>
        ) : null}
        {bus != null ? (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              run(bus, `בקשת תשלום חד-פעמית בסכום מחירון Business (₪${bus}) — לא מנוי מחודש`)
            }
            className={`${btn} border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100`}
          >
            ₪{bus.toLocaleString("he-IL")} — כמו Business (חד-פעמי)
          </button>
        ) : null}
        <button
          type="button"
          disabled={pending}
          onClick={scrollToPayPalSubscribe}
          className={`${btn} border-[#0070ba] bg-[#0070ba] text-white hover:bg-[#005ea6] inline-flex items-center gap-2`}
        >
          <ArrowDown size={18} aria-hidden />
          מנוי חודשי — PayPal (למטה)
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end max-w-xl">
        <div className="flex-1">
          <label className="block text-xs font-bold text-slate-500 mb-1">סכום מותאם (בקשת גבייה)</label>
          <input
            type="text"
            inputMode="decimal"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="למשל: 150"
            dir="ltr"
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 font-mono text-sm"
          />
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={applyCustom}
          className="rounded-xl bg-slate-900 text-white px-6 py-2.5 text-sm font-black hover:bg-slate-800 disabled:opacity-50 shrink-0"
        >
          צור בקשה
        </button>
      </div>
    </section>
  );
}
