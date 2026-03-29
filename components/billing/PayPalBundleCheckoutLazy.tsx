"use client";

import dynamic from "next/dynamic";

const PayPalBundleCheckout = dynamic(() => import("@/components/billing/PayPalBundleCheckout"), {
  ssr: false,
  loading: () => (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 text-center text-slate-500 text-sm" dir="rtl">
      טוען תשלום חבילות…
    </div>
  ),
});

type BundleRow = { id: string; name: string; priceIls: number; cheapAdds: number; premiumAdds: number };

export default function PayPalBundleCheckoutLazy(props: { clientId: string; bundles: BundleRow[] }) {
  return <PayPalBundleCheckout {...props} />;
}
