"use client";

import dynamic from "next/dynamic";

const PayPalBundleCheckout = dynamic(() => import("@/components/billing/PayPalBundleCheckout"), {
  ssr: false,
  loading: () => (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500 shadow-sm" dir="rtl">
      טוען תשלום חבילות…
    </div>
  ),
});

type BundleRow = { id: string; name: string; priceIls: number; cheapAdds: number; premiumAdds: number };

export default function PayPalBundleCheckoutLazy(props: { clientId: string; bundles: BundleRow[] }) {
  return <PayPalBundleCheckout {...props} />;
}
