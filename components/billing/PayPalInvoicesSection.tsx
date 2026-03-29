import Link from "next/link";
import { FileText } from "lucide-react";
import SeedTestInvoiceButton from "@/components/billing/SeedTestInvoiceButton";

export type PayPalInvoiceRow = {
  id: string;
  number: string;
  amount: number;
  status: string;
  date: string;
  /** למיון מול מסמכים שהונפקו */
  createdAtIso: string;
  description: string;
  customerName: string;
  customerEmail: string;
};

type Props = {
  paypalMeSlug: string | null;
  paypalMerchantEmail: string | null;
};

export default function PayPalInvoicesSection({
  paypalMeSlug,
  paypalMerchantEmail,
}: Props) {
  const hasPaypal = Boolean(paypalMeSlug?.trim() || paypalMerchantEmail?.trim());

  return (
    <section className="rounded-[2.5rem] border border-slate-100 bg-[#f8fafc] p-6 sm:p-8">
      <h2 className="text-2xl font-black text-slate-900 mb-2">תשלומים PayPal</h2>
      <p className="text-sm text-slate-500 font-medium mb-4">
        <strong>בקשות תשלום</strong> (חשבוניות עסקה לגבייה) מוצגות בטבלת המסמכים למעלה — בלשוניות{" "}
        <span className="font-bold text-slate-700">״הכל״</span> ו־<span className="font-bold text-slate-700">״חשבוניות״</span>
        , עם תג <span className="font-bold text-[#0070ba]">PayPal</span>. משם אפשר גם לפתוח קישור תשלום כשמוגדר PayPal.Me.
      </p>
      <p className="text-sm text-slate-500 font-medium mb-6">
        חברו מייל ו־PayPal.Me של <strong>הארגון</strong> ב
        <Link href="/dashboard/settings?tab=billing" className="mx-1 font-bold text-blue-700 underline">
          הגדרות › מנויים
        </Link>
        .
      </p>

      <div className="rounded-[2rem] border border-dashed border-slate-200 bg-white p-8 sm:p-10 text-center text-slate-500 max-w-3xl mx-auto">
        <FileText className="mx-auto mb-4 text-slate-300" size={44} strokeWidth={1.25} />
        <p className="font-bold text-slate-700 mb-1">אין עדיין מסמכים שהונפקו?</p>
        <p className="text-sm max-w-lg mx-auto mb-2">
          השתמשו ב־״הפקת מסמך״ למעלה לחשבונית מס רשמית, או צרו חשבונית בדיקה לגבייה ב־PayPal.
        </p>
        {!hasPaypal ? (
          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2 max-w-md mx-auto mb-4">
            לא הוגדר PayPal לארגון — קישורי תשלום לא יופיעו עד שתשלימו את ההגדרות.
          </p>
        ) : null}
        <SeedTestInvoiceButton />
      </div>
    </section>
  );
}
