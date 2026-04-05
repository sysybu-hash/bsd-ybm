import Link from "next/link";
import { FileText } from "lucide-react";

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
    <section className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
      <h2 className="mb-2 text-2xl font-black text-gray-900">תשלומים PayPal</h2>
      <p className="mb-4 text-sm font-medium text-gray-500">
        <strong>בקשות תשלום</strong> (חשבוניות עסקה לגבייה) מוצגות בטבלת המסמכים למעלה — בלשוניות{" "}
        <span className="font-bold text-gray-700">״הכל״</span> ו־<span className="font-bold text-gray-700">״חשבוניות״</span>
        , עם תג <span className="font-bold text-indigo-600">PayPal</span>. משם אפשר גם לפתוח קישור תשלום כשמוגדר PayPal.Me.
      </p>
      <p className="mb-6 text-sm font-medium text-gray-500">
        חברו מייל ו־PayPal.Me של <strong>הארגון</strong> ב
        <Link href="/dashboard/settings?tab=billing" className="mx-1 font-bold text-indigo-700 underline">
          הגדרות › מנויים
        </Link>
        .
      </p>

      <div className="mx-auto max-w-3xl rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-gray-500 sm:p-10">
        <FileText className="mx-auto mb-4 text-gray-300" size={44} strokeWidth={1.25} />
        <p className="mb-1 font-bold text-gray-700">אין עדיין מסמכים שהונפקו?</p>
        <p className="text-sm max-w-lg mx-auto mb-2">
          השתמשו ב־״הפקת מסמך״ למעלה לחשבונית מס רשמית, או צרו חשבונית בדיקה לגבייה ב־PayPal.
        </p>
        {!hasPaypal ? (
          <p className="mx-auto mb-4 max-w-md rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-2 text-xs text-indigo-700">
            לא הוגדר PayPal לארגון — קישורי תשלום לא יופיעו עד שתשלימו את ההגדרות.
          </p>
        ) : null}
      </div>
    </section>
  );
}
