"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, Loader2 } from "lucide-react";
import { createTestInvoiceAction } from "@/app/actions/billing-invoice";

export default function SeedTestInvoiceButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const r = await createTestInvoiceAction();
          if (r.ok) {
            router.refresh();
          } else {
            window.alert(r.error);
          }
        });
      }}
      className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/25 transition hover:bg-blue-500 disabled:opacity-60"
    >
      {pending ? (
        <Loader2 className="animate-spin" size={18} />
      ) : (
        <PlusCircle size={18} />
      )}
      {pending ? "יוצר…" : "צור חשבונית בדיקה (₪250)"}
    </button>
  );
}
