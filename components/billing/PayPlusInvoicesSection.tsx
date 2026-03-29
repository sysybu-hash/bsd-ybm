import {
  FileText,
  CheckCircle,
  Clock,
} from "lucide-react";
import PayPlusButton from "@/components/billing/PayPlusButton";
import SeedTestInvoiceButton from "@/components/billing/SeedTestInvoiceButton";

export type PayPlusInvoiceRow = {
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
  invoices: PayPlusInvoiceRow[];
  payplusConfigured: boolean;
  mockPaymentAllowed: boolean;
};

export default function PayPlusInvoicesSection({
  invoices,
  payplusConfigured,
  mockPaymentAllowed,
}: Props) {
  return (
    <section className="rounded-[2.5rem] border border-slate-100 bg-[#f8fafc] p-6 sm:p-8">
      <h2 className="text-2xl font-black text-slate-900 mb-2">תשלומים PayPlus</h2>
      <p className="text-sm text-slate-500 font-medium mb-8">
        חשבוניות עסקה לתשלום מאובטח — הסטטוס מתעדכן אוטומטית לאחר אישור.
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
              className="bg-white rounded-[2rem] p-6 md:p-8 border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col md:flex-row items-center justify-between gap-6 transition-all hover:border-blue-100"
            >
              <div className="flex items-start gap-5 w-full md:w-auto">
                <div
                  className={`p-4 rounded-2xl shrink-0 ${
                    invoice.status === "PAID" ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
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
                    שולם בהצלחה
                  </div>
                ) : (
                  <div className="min-w-[200px] w-full md:w-auto">
                    <PayPlusButton
                      invoiceId={invoice.id}
                      amount={invoice.amount}
                      customerName={invoice.customerName}
                      customerEmail={invoice.customerEmail}
                      payplusConfigured={payplusConfigured}
                      mockPaymentAllowed={mockPaymentAllowed}
                    />
                    <p className="text-center text-[10px] text-slate-400 mt-2 flex items-center justify-center gap-1 font-bold">
                      <Clock size={12} /> ממתין לתשלום
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
