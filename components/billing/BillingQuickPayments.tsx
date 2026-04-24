"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Zap, ArrowDown } from "lucide-react";
import { createQuickPaymentInvoiceAction } from "@/app/actions/billing-invoice";
import type { QuickPaymentPreset } from "@/lib/billing-workspace";

type Props = {
  presets: QuickPaymentPreset[];
};

export default function BillingQuickPayments({ presets }: Props) {
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
      className="rounded-2xl border border-teal-500/30/80 bg-gradient-to-br from-teal-50/90 to-white p-6 shadow-sm md:p-8"
      dir="rtl"
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="rounded-xl bg-teal-600 p-2.5 text-white shrink-0">
          <Zap size={22} aria-hidden />
        </div>
        <div>
          <h2 className="text-xl font-black text-gray-900">אפשרויות תשלום וגבייה</h2>
          <p className="text-sm text-gray-500 mt-1 leading-relaxed">
            <strong>בקשות גבייה</strong> נוצרות כשורה בטבלה ומקבלות קישור PayPal.Me אם הגדרתם אותו.{" "}
            <strong>מנוי חודשי אמיתי</strong> — רק דרך כפתורי PayPal ב־&quot;הפעלת מנוי&quot; למטה. לעריכת הכפתורים:{" "}
            <Link href="/app/settings/billing" className="font-bold text-teal-300 underline">
              הגדרות › מנויים
            </Link>
            .
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        {presets.map((p, i) => (
          <button
            key={`${p.amountNis}-${p.label}-${i}`}
            type="button"
            disabled={pending}
            onClick={() =>
              run(
                p.amountNis,
                p.invoiceDescription?.trim() ||
                  `בקשת תשלום — ${p.label} (₪${p.amountNis.toLocaleString("he-IL")})`,
              )
            }
            className={`${btn} border-teal-500/30 bg-white text-teal-700 hover:bg-teal-500/15`}
          >
            {p.label}
          </button>
        ))}
        <button
          type="button"
          disabled={pending}
          onClick={scrollToPayPalSubscribe}
          className={`${btn} inline-flex items-center gap-2 border-teal-600 bg-teal-600 text-white hover:bg-teal-700`}
        >
          <ArrowDown size={18} aria-hidden />
          מנוי חודשי — PayPal (למטה)
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end max-w-xl">
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-400 mb-1">סכום מותאם (בקשת גבייה)</label>
          <input
            type="text"
            inputMode="decimal"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="למשל: 150"
            dir="ltr"
            className="w-full rounded-xl border border-gray-100 px-4 py-2.5 text-gray-900 font-mono text-sm"
          />
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={applyCustom}
          className="rounded-xl bg-teal-600 text-white px-6 py-2.5 text-sm font-black hover:bg-teal-700 disabled:opacity-50 shrink-0"
        >
          צור בקשה
        </button>
      </div>
    </section>
  );
}
