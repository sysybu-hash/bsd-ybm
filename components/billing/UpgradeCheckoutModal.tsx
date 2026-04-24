"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CreditCard, ShieldCheck, X } from "lucide-react";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import type { SubscriptionTierKey } from "@/lib/subscription-tier-config";

export type UpgradeCheckoutPlanDetails = {
  id: string;
  name: string;
  /** מחיר להצגה/מסרים; אם `totalLabel` מוגדר הוא מקודם */
  price: number;
  isAnnual: boolean;
  features: string[];
  /** אם הוגדר (למשל «בהתאמה אישית»), מוצג במקום סכום ₪ */
  totalLabel?: string;
};

type UpgradeCheckoutModalProps = {
  isOpen: boolean;
  onClose: () => void;
  isProcessing: boolean;
  planDetails: UpgradeCheckoutPlanDetails | null;
  /** מזהה PayPal לצד הלקוח; אם חסר — נלקח מ־NEXT_PUBLIC בזמן ריצה */
  clientId?: string;
};

const PLAN_ID_TO_TIER: Record<string, SubscriptionTierKey> = {
  CHEAP: "DEALER",
  PREMIUM: "COMPANY",
  VIP: "CORPORATE",
  DEALER: "DEALER",
  COMPANY: "COMPANY",
  CORPORATE: "CORPORATE",
  HOUSEHOLD: "HOUSEHOLD",
};

function resolveTier(planId: string): SubscriptionTierKey | null {
  const u = String(planId ?? "")
    .trim()
    .toUpperCase();
  return PLAN_ID_TO_TIER[u] ?? null;
}

export function UpgradeCheckoutModal({
  isOpen,
  onClose,
  isProcessing: parentProcessing,
  planDetails,
  clientId: clientIdProp,
}: UpgradeCheckoutModalProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const clientId = (clientIdProp ?? process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "").trim();

  const isProcessing = parentProcessing || busy;

  const options = useMemo(
    () => ({
      clientId,
      currency: "ILS",
      intent: "capture" as const,
    }),
    [clientId],
  );

  const postCreateOrder = useCallback(async () => {
    setErrorMessage(null);
    if (!planDetails) throw new Error("אין פרטי תוכנית");
    const tier = resolveTier(planDetails.id);
    if (!tier || tier === "FREE") {
      throw new Error("תוכנית לא חוקית לתשלום");
    }

    const res = await fetch("/api/billing/paypal/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tier,
        billingCycle: planDetails.isAnnual ? "annual" : "monthly",
      }),
    });
    const data = (await res.json()) as { id?: string; error?: string };
    if (!res.ok || !data.id) {
      throw new Error(data.error || "יצירת הזמנת PayPal נכשלה");
    }
    return data.id;
  }, [planDetails]);

  const onApprove = useCallback(
    async (data: { orderID?: string }) => {
      setErrorMessage(null);
      const orderID = data.orderID;
      if (!orderID) throw new Error("חסר מזהה הזמנה");

      setBusy(true);
      try {
        const res = await fetch("/api/billing/paypal/capture-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderID }),
        });
        const j = (await res.json()) as { ok?: boolean; message?: string; error?: string };
        if (!res.ok || !j.ok) {
          throw new Error(j.error || "אישור תשלום נכשל");
        }
        const msg =
          j.message || "התשלום הושלם — המנוי עודכן. מעבירים ללוח הבקרה.";
        setSuccessMessage(msg);
        router.refresh();
        window.setTimeout(() => {
          router.push("/app");
        }, 1200);
      } finally {
        setBusy(false);
      }
    },
    [router],
  );

  if (!isOpen || !planDetails) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div
        role="presentation"
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={!isProcessing ? onClose : undefined}
        onKeyDown={undefined}
      />
      <div className="relative z-10 flex w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl md:flex-row">
        <button
          type="button"
          onClick={onClose}
          disabled={isProcessing}
          className="absolute left-4 top-4 z-20 rounded-full bg-gray-100 p-2 text-gray-500 transition-colors hover:bg-gray-200 disabled:opacity-50"
          aria-label="סגור"
        >
          <X size={18} aria-hidden />
        </button>

        <div className="flex w-full flex-col justify-center border-brand-light/30 border-s bg-brand-surface p-8 md:w-2/5">
          <div className="mb-6">
            <h3 className="mb-1 text-xl font-bold text-brand-dark">סיכום הזמנה</h3>
            <p className="text-sm text-text-secondary">מערכת BSD-YBM</p>
          </div>

          <div className="mb-8 space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-text-primary">תוכנית:</span>
              <span className="font-bold">{planDetails.name}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-text-primary">מחזור חיוב:</span>
              <span>{planDetails.isAnnual ? "שנתי (חיסכון 20%)" : "חודשי"}</span>
            </div>
            <div className="my-2 h-px w-full bg-brand-light/40" />
            <div className="flex items-end justify-between">
              <span className="font-bold text-text-primary">סך הכל:</span>
              <div className="text-end">
                {planDetails.totalLabel ? (
                  <span className="text-3xl font-extrabold text-brand">{planDetails.totalLabel}</span>
                ) : (
                  <span className="text-3xl font-extrabold text-brand">₪{planDetails.price}</span>
                )}
                <span className="mt-1 block text-xs text-text-secondary">
                  + מע״מ כחוק. תשלום {planDetails.isAnnual ? "שנתי" : "חודשי"}.
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-medium text-emerald-700">
            <ShieldCheck size={16} className="mt-0.5 shrink-0" aria-hidden />
            <span>תשלום מאובטח. לאחר אישור PayPal יעודכן המנוי בארגון.</span>
          </div>
        </div>

        <div className="flex w-full flex-col justify-center bg-white p-8 md:w-3/5">
          {successMessage ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
              <p className="text-lg font-bold text-emerald-800">הצלחה</p>
              <p className="mt-2 text-sm text-emerald-900">{successMessage}</p>
              <p className="mt-3 text-xs text-emerald-700">מעבירים ללוח הבקרה…</p>
            </div>
          ) : (
            <>
              <h2 className="mb-2 text-2xl font-bold text-text-primary">אמצעי תשלום</h2>
              <p className="mb-6 text-sm text-text-secondary">השלימו את התשלום ב-PayPal לשדרוג המנוי.</p>

              {errorMessage ? (
                <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                  {errorMessage}
                </div>
              ) : null}

              {!clientId ? (
                <p className="text-sm text-amber-800">
                  חסר <code className="text-xs">NEXT_PUBLIC_PAYPAL_CLIENT_ID</code> — לא ניתן להטעין את PayPal.
                </p>
              ) : (
                <div className="min-h-[120px] w-full max-w-md" dir="ltr">
                  <PayPalScriptProvider
                    key={`${planDetails.id}-${planDetails.isAnnual}-${clientId}`}
                    options={options}
                  >
                    <PayPalButtons
                      style={{ layout: "vertical", shape: "rect", label: "pay" }}
                      disabled={isProcessing}
                      createOrder={async () => {
                        setBusy(true);
                        try {
                          return await postCreateOrder();
                        } finally {
                          setBusy(false);
                        }
                      }}
                      onApprove={(data) =>
                        onApprove(data).catch((e) => {
                          setErrorMessage(e instanceof Error ? e.message : "שגיאה");
                          throw e;
                        })
                      }
                      onError={(err) => {
                        console.error(err);
                        setErrorMessage("שגיאת PayPal — נסו שוב");
                      }}
                    />
                  </PayPalScriptProvider>
                </div>
              )}

              <div className="relative my-4 flex items-center py-2">
                <div className="flex-grow border-gray-100 border-t" />
                <span className="mx-4 shrink-0 text-gray-400 text-xs">או</span>
                <div className="flex-grow border-gray-100 border-t" />
              </div>
              <button
                type="button"
                disabled
                className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border-2 border-gray-200 py-3 font-medium text-text-primary opacity-60"
              >
                <CreditCard size={18} className="text-gray-400" aria-hidden />
                כרטיס אשראי — בקרוב
              </button>

              <ul className="mt-8 space-y-2">
                {planDetails.features.slice(0, 3).map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-text-secondary text-xs">
                    <Check className="text-emerald-500" size={14} aria-hidden />
                    {feature}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
