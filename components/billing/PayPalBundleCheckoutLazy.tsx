"use client";

import dynamic from "next/dynamic";

const PayPalBundleCheckout = dynamic(() => import("@/components/billing/PayPalBundleCheckout"), {
  ssr: false,
  loading: () => (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0a0b14] p-6 text-center text-sm text-white/45 shadow-sm" dir="rtl">
      טוען תשלום חבילות…
    </div>
  ),
});

type BundleRow = { id: string; name: string; priceIls: number; cheapAdds: number; premiumAdds: number };

export default function PayPalBundleCheckoutLazy(props: { clientId: string; bundles: BundleRow[] }) {
  return <PayPalBundleCheckout {...props} />;
}
