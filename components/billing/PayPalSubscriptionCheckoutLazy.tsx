"use client";

import dynamic from "next/dynamic";

const PayPalSubscriptionCheckout = dynamic(
  () => import("@/components/billing/PayPalSubscriptionCheckout"),
  {
    ssr: false,
    loading: () => (
      <div
        className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center text-slate-500 text-sm"
        dir="rtl"
      >
        טוען אפשרויות תשלום PayPal…
      </div>
    ),
  },
);

type Props = {
  clientId: string;
  currentPlan: string;
  subscriptionStatus: string;
};

/** עטיפה: PayPal SDK רק בדפדפן — לא ב-SSR (מונע שגיאות שרת ב-Vercel) */
export default function PayPalSubscriptionCheckoutLazy(props: Props) {
  return <PayPalSubscriptionCheckout {...props} />;
}
