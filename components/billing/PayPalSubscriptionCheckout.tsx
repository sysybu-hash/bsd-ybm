"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import confetti from "canvas-confetti";
import { useI18n } from "@/components/I18nProvider";
import { purchasableTierKeysAbove, planLabelHe, planPriceIls } from "@/lib/subscription-plans";
import type { SubscriptionTierKey } from "@/lib/subscription-tier-config";

type TierPriceMap = Partial<Record<SubscriptionTierKey, number>>;

type Props = {
  clientId: string;
  currentTier: string;
  subscriptionStatus: string;
  /** מחירים אפקטיביים מהשרת (עוקפים את ברירת המחדל בקוד) */
  tierPricesIls?: TierPriceMap | null;
};

function priceForTier(tier: string, map?: TierPriceMap | null): number | null {
  const t = tier.toUpperCase() as SubscriptionTierKey;
  const fromMap = map?.[t];
  if (typeof fromMap === "number" && Number.isFinite(fromMap)) return fromMap;
  return planPriceIls(tier);
}

export default function PayPalSubscriptionCheckout({
  clientId,
  currentTier,
  subscriptionStatus,
  tierPricesIls,
}: Props) {
  const { dir } = useI18n();
  const router = useRouter();
  const [selectedTier, setSelectedTier] = useState<string>("");
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

  const available = useMemo(
    () => purchasableTierKeysAbove(currentTier),
    [currentTier],
  );

  useEffect(() => {
    if (available.length === 0) {
      setSelectedTier("");
      return;
    }
    setSelectedTier((prev) => (available.includes(prev as SubscriptionTierKey) ? prev : available[0]));
  }, [available]);

  const effectiveTier = selectedTier || available[0] || "";

  const createOrder = useCallback(async () => {
    setErrorMsg(null);
    const tier = effectiveTier;
    if (!tier) throw new Error("אין רמה לבחירה");

    const res = await fetch("/api/paypal/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier }),
    });
    const data = (await res.json()) as { id?: string; error?: string };
    if (!res.ok || !data.id) {
      throw new Error(data.error || "יצירת הזמנת PayPal נכשלה");
    }
    return data.id;
  }, [effectiveTier]);

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

      const msg =
        j.message ||
        "תודה! המנוי שלך הופעל. ברוך הבא לשדרה שמחברת בין כולם";
      setSuccessMsg(msg);
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.65 } });
      router.refresh();
    },
    [router],
  );

  if (!clientId?.trim()) {
    return (
      <div id="paypal-subscription" className="scroll-mt-24">
        <div
          className="card-avenue border-indigo-500/30 bg-indigo-500/15 px-4 py-3 text-sm text-indigo-800"
          dir={dir}
        >
          להפעלת תשלום PayPal Live הוסיפו <code className="text-xs">NEXT_PUBLIC_PAYPAL_CLIENT_ID</code> ב־
          <code className="text-xs">.env</code> או הגדירו מזהה בלוח הבקרה לבעלי פלטפורמה.
        </div>
      </div>
    );
  }

  if (available.length === 0) {
    return (
      <div id="paypal-subscription" className="scroll-mt-24">
        <div
          className="card-avenue border-emerald-500/25 bg-emerald-500/15 px-4 py-3 text-sm text-emerald-900"
          dir={dir}
        >
          המנוי הנוכחי ({planLabelHe(currentTier)}) מעודכן — אין שדרוג זמין לתשלום ישיר כאן. לשדרוג נוסף פנו
          לתמיכה.
        </div>
      </div>
    );
  }

  const price = priceForTier(effectiveTier, tierPricesIls ?? undefined);

  return (
    <section
      id="paypal-subscription"
      className="card-avenue scroll-mt-24 border-indigo-500/20 bg-white p-6 shadow-sm md:p-8"
      dir={dir}
    >
      <h2 className="mb-2 text-xl font-black text-white">הפעלת מנוי — PayPal (Live)</h2>
      <p className="mb-4 text-sm text-gray-500">
        בחרו רמת מנוי, ואז השלימו תשלום בכפתורי PayPal. המטבע: <strong>ILS</strong> (שקל).
      </p>
      <div className="mb-6 rounded-xl border border-indigo-500/20 bg-indigo-500/15 px-4 py-3 text-xs leading-relaxed text-gray-600">
        <strong className="text-white">חשבון חינם:</strong> רמת FREE נשארת בלי חיוב כאן. התשלום למטה הוא{" "}
        <strong>רק</strong> לשדרוג למשק בית / עוסק / חברה / תאגיד. גבייה מלקוחות — דרך &quot;בקשות גבייה&quot; ו־
        PayPal.Me של הארגון בהגדרות.
      </div>

      {successMsg ? (
        <div className="mb-6 rounded-2xl border border-emerald-500/25 bg-emerald-500/15 px-5 py-6 text-center">
          <p className="text-lg font-black text-emerald-800 mb-2">הצלחה</p>
          <p className="font-medium leading-relaxed text-gray-700">{successMsg}</p>
        </div>
      ) : null}

      {errorMsg ? (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {errorMsg}
        </div>
      ) : null}

      <div className="mb-6 flex flex-wrap gap-3">
        {available.map((t) => {
          const pr = priceForTier(t, tierPricesIls ?? undefined);
          return (
            <button
              key={t}
              type="button"
              onClick={() => setSelectedTier(t)}
              className={`rounded-2xl border px-4 py-3 text-sm font-bold transition-all ${
                effectiveTier === t
                  ? "border-indigo-500/40 bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-200"
                  : "border-gray-200 bg-white/[0.03] text-gray-600 hover:border-indigo-500/30"
              }`}
            >
              {planLabelHe(t)} — ₪{pr?.toLocaleString("he-IL")}
            </button>
          );
        })}
      </div>

      {price != null ? (
        <div className="mb-4 text-center text-sm text-gray-500">
          סכום לחיוב: <span className="font-black text-white">₪{price.toFixed(2)}</span>
          {subscriptionStatus !== "ACTIVE" ? (
            <span className="mt-1 block text-xs text-gray-400">לאחר התשלום המנוי יסומן כ־ACTIVE</span>
          ) : null}
        </div>
      ) : null}

      <div className="max-w-md mx-auto min-h-[140px]" dir="ltr">
        <PayPalScriptProvider options={options}>
          <PayPalButtons
            style={{ layout: "vertical", shape: "rect", label: "pay" }}
            disabled={Boolean(successMsg) || !effectiveTier}
            createOrder={createOrder}
            onApprove={(data) =>
              onApprove(data).catch((e) => {
                setErrorMsg(e instanceof Error ? e.message : "שגיאה");
                throw e;
              })
            }
            onError={(err) => {
              console.error(err);
              setErrorMsg("שגיאת PayPal — נסו שוב או בדקו את הקונסול");
            }}
          />
        </PayPalScriptProvider>
      </div>
    </section>
  );
}
