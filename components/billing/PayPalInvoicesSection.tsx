import Link from "next/link";
import { FileText, CheckCircle, Clock, ExternalLink } from "lucide-react";
import SeedTestInvoiceButton from "@/components/billing/SeedTestInvoiceButton";

export type PayPalInvoiceRow = {
  id: string;
  number: string;
  amount: number;
  status: string;
  date: string;
  description: string;
  customerName: string;
  customerEmail: string;
};

type Props = {
  invoices: PayPalInvoiceRow[];
  paypalMeSlug: string | null;
  paypalMerchantEmail: string | null;
};

function paypalMeUrl(slug: string, amount: number) {
  const clean = slug.replace(/^\/+|\/+$/g, "");
  const a = Math.max(0, Math.round(amount * 100) / 100);
  return `https://www.paypal.com/paypalme/${encodeURIComponent(clean)}/${a}`;
}

export default function PayPalInvoicesSection({
  invoices,
  paypalMeSlug,
  paypalMerchantEmail,
}: Props) {
  const hasPaypal = Boolean(paypalMeSlug?.trim() || paypalMerchantEmail?.trim());

  return (
    <section className="rounded-[2.5rem] border border-slate-100 bg-[#f8fafc] p-6 sm:p-8">
      <h2 className="text-2xl font-black text-slate-900 mb-2">תשלומים PayPal</h2>
      <p className="text-sm text-slate-500 font-medium mb-6">
        כאן מוצג חשבון PayPal <strong>של הארגון</strong> לגבייה מלקוחות. חברו מייל ו־PayPal.Me ב
        <Link href="/dashboard/settings?tab=billing" className="mx-1 font-bold text-blue-700 underline">
          הגדרות › מנויים
        </Link>
        .
      </p>

      <div className="grid grid-cols-1 gap-6 max-w-5xl mx-auto">
        {invoices.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-slate-200 bg-white p-12 text-center text-slate-500">
            <FileText className="mx-auto mb-4 text-slate-300" size={48} strokeWidth={1.25} />
            <p className="font-bold text-slate-700 text-lg mb-1">אין חשבוניות להצגה</p>
            <p className="text-sm max-w-md mx-auto mb-4">
              חשבוניות שיווצרו עבור הארגון יופיעו כאן.
            </p>
            <SeedTestInvoiceButton />
          </div>
        ) : (
          invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="bg-white rounded-[2rem] p-6 md:p-8 border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col md:flex-row items-center justify-between gap-6 transition-all hover:border-[#0070ba]/30"
            >
              <div className="flex items-start gap-5 w-full md:w-auto">
                <div
                  className={`p-4 rounded-2xl shrink-0 ${
                    invoice.status === "PAID" ? "bg-emerald-50 text-emerald-600" : "bg-sky-50 text-[#0070ba]"
                  }`}
                >
                  <FileText size={32} strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 mb-1">{invoice.description}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 font-medium">
                    <span>חשבונית עסקה #{invoice.number}</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full" />
                    <span>{invoice.date}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-6 w-full md:w-auto border-t md:border-t-0 border-slate-100 pt-6 md:pt-0">
                <div className="text-center md:text-left">
                  <p className="text-3xl font-black italic tracking-tighter text-slate-900">
                    ₪{invoice.amount.toLocaleString("he-IL")}
                  </p>
                </div>

                {invoice.status === "PAID" ? (
                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-600 px-6 py-4 rounded-2xl font-black min-w-[200px] justify-center">
                    <CheckCircle size={20} />
                    שולם
                  </div>
                ) : (
                  <div className="flex flex-col items-stretch gap-2 min-w-[220px] w-full md:w-auto">
                    {paypalMeSlug?.trim() ? (
                      <a
                        href={paypalMeUrl(paypalMeSlug.trim(), invoice.amount)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0070ba] px-6 py-4 font-black text-white shadow-md hover:bg-[#005ea6]"
                      >
                        <ExternalLink size={18} aria-hidden />
                        תשלום ב־PayPal
                      </a>
                    ) : null}
                    {paypalMerchantEmail?.trim() && !paypalMeSlug?.trim() ? (
                      <p className="text-center text-xs text-slate-600">
                        שליחת תשלום ל־
                        <span className="font-mono font-bold" dir="ltr">
                          {paypalMerchantEmail.trim()}
                        </span>
                      </p>
                    ) : null}
                    {!hasPaypal ? (
                      <Link
                        href="/dashboard/settings?tab=billing"
                        className="text-center text-sm font-bold text-[#0070ba] underline"
                      >
                        הגדרת PayPal בהגדרות
                      </Link>
                    ) : null}
                    <p className="text-center text-[10px] text-slate-400 flex items-center justify-center gap-1 font-bold">
                      <Clock size={12} aria-hidden /> עדכון &quot;שולם&quot; — ידני או דרך מערכת עתידית
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
