"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import confetti from "canvas-confetti";
import { planLabelHe, planPriceIls } from "@/lib/subscription-plans";

const TIER_RANK: Record<string, number> = {
  FREE: 0,
  PRO: 1,
  BUSINESS: 2,
  ENTERPRISE: 3,
};

type Props = {
  clientId: string;
  currentPlan: string;
  subscriptionStatus: string;
};

function purchasablePlans(currentPlan: string): string[] {
  const cur = (currentPlan || "FREE").toUpperCase();
  const rank = TIER_RANK[cur] ?? 0;
  return (["PRO", "BUSINESS"] as const).filter((p) => {
    if ((TIER_RANK[p] ?? 0) <= rank) return false;
    return planPriceIls(p) != null;
  });
}

export default function PayPalSubscriptionCheckout({ clientId, currentPlan, subscriptionStatus }: Props) {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<string>("");
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

  const available = useMemo(() => purchasablePlans(currentPlan), [currentPlan]);

  useEffect(() => {
    if (available.length === 0) {
      setSelectedPlan("");
      return;
    }
    setSelectedPlan((prev) => (available.includes(prev) ? prev : available[0]));
  }, [available]);

  const effectivePlan = selectedPlan || available[0] || "";

  const createOrder = useCallback(async () => {
    setErrorMsg(null);
    const plan = effectivePlan;
    if (!plan) throw new Error("אין תוכנית לבחירה");

    const res = await fetch("/api/paypal/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const data = (await res.json()) as { id?: string; error?: string };
    if (!res.ok || !data.id) {
      throw new Error(data.error || "יצירת הזמנת PayPal נכשלה");
    }
    return data.id;
  }, [effectivePlan]);

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
          className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-900"
          dir="rtl"
        >
          להפעלת תשלום PayPal Live הוסיפו <code className="text-xs">NEXT_PUBLIC_PAYPAL_CLIENT_ID</code> ב־
          <code className="text-xs">.env</code> וב־Vercel.
        </div>
      </div>
    );
  }

  if (available.length === 0) {
    return (
      <div id="paypal-subscription" className="scroll-mt-24">
        <div
          className="rounded-2xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-900"
          dir="rtl"
        >
          המנוי הנוכחי ({planLabelHe(currentPlan)}) מעודכן — אין שדרוג זמין לתשלום ישיר כאן. לשדרוג Enterprise
          פנו לתמיכה.
        </div>
      </div>
    );
  }

  const price = planPriceIls(effectivePlan);

  return (
    <section
      id="paypal-subscription"
      className="scroll-mt-24 rounded-[2rem] border border-[#0070ba]/25 bg-white p-6 md:p-8 shadow-xl shadow-slate-200/40"
      dir="rtl"
    >
      <h2 className="text-xl font-black text-slate-900 mb-2">הפעלת מנוי — PayPal (Live)</h2>
      <p className="text-sm text-slate-600 mb-4">
        בחרו תוכנית, ואז השלימו תשלום בכפתורי PayPal. המטבע: <strong>ILS</strong> (שקל).
      </p>
      <div className="mb-6 rounded-xl border border-sky-100 bg-sky-50/90 px-4 py-3 text-xs text-slate-700 leading-relaxed">
        <strong className="text-slate-900">חשבון חינם:</strong> תוכנית FREE נשארת בלי חיוב כאן. התשלום למטה הוא{" "}
        <strong>רק</strong> לשדרוג ל־Pro / Business. גבייה מלקוחות — דרך &quot;בקשות גבייה&quot; בטבלה ו־PayPal.Me של
        הארגון בהגדרות.
      </div>

      {successMsg ? (
        <div className="mb-6 rounded-2xl border border-emerald-300 bg-gradient-to-br from-emerald-50 to-sky-50 px-5 py-6 text-center">
          <p className="text-lg font-black text-emerald-800 mb-2">הצלחה</p>
          <p className="text-slate-800 font-medium leading-relaxed">{successMsg}</p>
        </div>
      ) : null}

      {errorMsg ? (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {errorMsg}
        </div>
      ) : null}

      <div className="mb-6 flex flex-wrap gap-3">
        {available.map((p) => {
          const pr = planPriceIls(p);
          return (
            <button
              key={p}
              type="button"
              onClick={() => setSelectedPlan(p)}
              className={`rounded-2xl border px-4 py-3 text-sm font-bold transition-all ${
                effectivePlan === p
                  ? "border-[#0070ba] bg-[#0070ba]/10 text-[#005ea6] ring-2 ring-[#0070ba]/30"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300"
              }`}
            >
              {planLabelHe(p)} — ₪{pr?.toLocaleString("he-IL")}
            </button>
          );
        })}
      </div>

      {price != null ? (
        <div className="mb-4 text-center text-slate-600 text-sm">
          סכום לחיוב: <span className="font-black text-slate-900">₪{price.toFixed(2)}</span>
          {subscriptionStatus !== "ACTIVE" ? (
            <span className="block text-xs text-slate-500 mt-1">לאחר התשלום המנוי יסומן כ־ACTIVE</span>
          ) : null}
        </div>
      ) : null}

      <div className="max-w-md mx-auto min-h-[140px]" dir="ltr">
        <PayPalScriptProvider options={options}>
          <PayPalButtons
            style={{ layout: "vertical", shape: "rect", label: "pay" }}
            disabled={Boolean(successMsg) || !effectivePlan}
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
