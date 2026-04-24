"use client";

import Link from "next/link";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { FilePlus, DollarSign, Clock, AlertCircle, CheckCircle2, XCircle } from "lucide-react";

export type IssuedInvoiceUiStatus = "PAID" | "PENDING" | "OVERDUE" | "CANCELLED";

export type IssuedInvoice = {
  id: string;
  invoiceNumber: string;
  clientName: string;
  issueDate: string;
  amount: number;
  currency: string;
  status: IssuedInvoiceUiStatus;
};

export type IssuedInvoicesWorkspaceProps = {
  totalBilledThisMonth: number;
  pendingAmount: number;
  overdueAmount: number;
  recentInvoices: IssuedInvoice[];
  newIssueHref?: string;
};

/**
 * שכבת מבט-על: חיובי חודש, ממתין, פיגור וטבלת מסמכים מונפקים אחרונים
 */
export function IssuedInvoicesWorkspace({
  totalBilledThisMonth,
  pendingAmount,
  overdueAmount,
  recentInvoices,
  newIssueHref = "/app/documents/issue",
}: IssuedInvoicesWorkspaceProps) {
  const getStatusBadge = (status: IssuedInvoiceUiStatus) => {
    switch (status) {
      case "PAID":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
            <CheckCircle2 size={14} /> שולם
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
            <Clock size={14} /> ממתין לתשלום
          </span>
        );
      case "OVERDUE":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-red-100 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
            <AlertCircle size={14} /> בפיגור
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700">
            <XCircle size={14} /> בוטל
          </span>
        );
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">חשבוניות מס וגבייה</h1>
          <p className="mt-1 text-text-secondary">ניהול חשבוניות מונפקות ללקוחות הארגון</p>
        </div>
        <Link
          href={newIssueHref}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-2.5 font-medium text-white shadow-card transition-colors hover:bg-brand-dark"
        >
          <FilePlus size={20} />
          הפק חשבונית חדשה
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <DashboardCard className="border-l-4 border-l-brand" title="חויב/הופק החודש">
          <div className="flex items-center justify-between">
            <div className="text-3xl font-semibold text-text-primary tabular-nums">
              ₪{totalBilledThisMonth.toLocaleString("he-IL", { maximumFractionDigits: 0 })}
            </div>
            <DollarSign className="text-brand opacity-80" size={28} aria-hidden />
          </div>
        </DashboardCard>

        <DashboardCard className="border-l-4 border-l-blue-500" title="צפי הכנסות (ממתין)">
          <div className="flex items-center justify-between">
            <div className="text-3xl font-semibold text-text-primary tabular-nums">
              ₪{pendingAmount.toLocaleString("he-IL", { maximumFractionDigits: 0 })}
            </div>
            <Clock className="text-blue-500 opacity-80" size={28} aria-hidden />
          </div>
        </DashboardCard>

        <DashboardCard className="border-l-4 border-l-red-500 bg-red-50/30" title="חובות בפיגור">
          <div className="flex items-center justify-between">
            <div className="text-3xl font-semibold text-red-600 tabular-nums">
              ₪{overdueAmount.toLocaleString("he-IL", { maximumFractionDigits: 0 })}
            </div>
            <AlertCircle className="animate-pulse text-red-500" size={28} aria-hidden />
          </div>
        </DashboardCard>
      </div>

      <DashboardCard title="חשבוניות אחרונות">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-start">
            <thead>
              <tr className="border-b border-gray-100 text-sm text-text-secondary">
                <th className="pb-4 pe-4 font-medium">מס׳</th>
                <th className="pb-4 font-medium">לקוח</th>
                <th className="pb-4 font-medium">תאריך הפקה</th>
                <th className="pb-4 font-medium">סכום</th>
                <th className="pb-4 font-medium">סטטוס</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {recentInvoices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-text-secondary">
                    לא נמצאו חשבוניות אחרונות.
                  </td>
                </tr>
              ) : (
                recentInvoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="border-b border-gray-50 transition-colors hover:bg-brand-background/50"
                  >
                    <td className="py-4 pe-4 font-medium text-text-primary">#{invoice.invoiceNumber}</td>
                    <td className="py-4 text-text-secondary">{invoice.clientName}</td>
                    <td className="py-4 text-text-secondary">
                      {new Date(invoice.issueDate).toLocaleDateString("he-IL")}
                    </td>
                    <td className="py-4 font-mono font-medium">
                      {invoice.currency === "ILS" ? "₪" : `${invoice.currency} `}
                      {invoice.amount.toLocaleString("he-IL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-4">{getStatusBadge(invoice.status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </DashboardCard>
    </div>
  );
}
