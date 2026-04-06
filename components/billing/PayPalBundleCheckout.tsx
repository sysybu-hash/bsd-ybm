"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";

type BundleRow = {
  id: string;
  name: string;
  priceIls: number;
  cheapAdds: number;
  premiumAdds: number;
};

type Props = {
  clientId: string;
  bundles: BundleRow[];
};

export default function PayPalBundleCheckout({ clientId, bundles }: Props) {
  const router = useRouter();
  const [bundleId, setBundleId] = useState<string>(bundles[0]?.id ?? "");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const options = useMemo(
    () => ({
      clientId,
      currency: "ILS",
      intent: "capture" as const,
    }),
    [clientId],
  );

  const selected = bundles.find((b) => b.id === bundleId) ?? bundles[0];

  const createOrder = useCallback(async () => {
    setErrorMsg(null);
    if (!selected) throw new Error("אין חבילה זמינה");
    const res = await fetch("/api/paypal/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bundleId: selected.id }),
    });
    const data = (await res.json()) as { id?: string; error?: string };
    if (!res.ok || !data.id) {
      throw new Error(data.error || "יצירת הזמנה נכשלה");
    }
    return data.id;
  }, [selected]);

  const onApprove = useCallback(
    async (data: { orderID?: string }) => {
      setErrorMsg(null);
      const orderID = data.orderID;
      if (!orderID) throw new Error("חסר מזהה הזמנה");
      const res = await fetch("/api/paypal/capture-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderID }),
      });
      const j = (await res.json()) as { ok?: boolean; message?: string; error?: string };
      if (!res.ok || !j.ok) {
        throw new Error(j.error || "אישור תשלום נכשל");
      }
      setSuccessMsg(j.message || "החבילה נוספה ליתרה שלכם.");
      router.refresh();
    },
    [router],
  );

  if (!clientId?.trim() || bundles.length === 0) {
    return null;
  }

  return (
    <section
      id="paypal-bundles"
      className="scroll-mt-24 rounded-2xl border border-indigo-500/20 bg-[#0a0b14] p-6 shadow-sm md:p-8"
      dir="rtl"
    >
      <h2 className="mb-2 text-xl font-black text-white">רכישת בנדל סריקות</h2>
      <p className="mb-4 text-sm text-white/55">
        כשמכסת המנוי נגמרה — ניתן לרכוש חבילת סריקות חד־פעמית (נוסף על היתרה הקיימת).
      </p>

      {successMsg ? (
        <div className="mb-4 rounded-xl border border-emerald-500/25 bg-emerald-500/15 px-4 py-3 text-sm text-emerald-900">
          {successMsg}
        </div>
      ) : null}
      {errorMsg ? (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {errorMsg}
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap gap-2">
        {bundles.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => setBundleId(b.id)}
            className={`rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
              bundleId === b.id
                ? "border-indigo-600 bg-indigo-600 text-white"
                : "border-white/[0.08] bg-[#0a0b14] text-white/65 hover:border-indigo-500/30"
            }`}
          >
            {b.name} — ₪{b.priceIls.toFixed(2)}
          </button>
        ))}
      </div>

      {selected ? (
        <p className="mb-4 text-sm text-white/55">
          נוסף ליתרה: <strong>{selected.cheapAdds}</strong> סריקות זולות, <strong>{selected.premiumAdds}</strong>{" "}
          פרימיום · <strong>₪{selected.priceIls.toFixed(2)}</strong>
        </p>
      ) : null}

      <div className="max-w-md mx-auto min-h-[120px]" dir="ltr">
        <PayPalScriptProvider options={options}>
          <PayPalButtons
            style={{ layout: "vertical", shape: "rect", label: "pay" }}
            disabled={Boolean(successMsg) || !selected}
            createOrder={createOrder}
            onApprove={(data) =>
              onApprove(data).catch((e) => {
                setErrorMsg(e instanceof Error ? e.message : "שגיאה");
                throw e;
              })
            }
            onError={(err) => {
              console.error(err);
              setErrorMsg("שגיאת PayPal");
            }}
          />
        </PayPalScriptProvider>
      </div>
    </section>
  );
}
