import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCreditsForDisplay } from "@/lib/org-credits-display";
import { calculatePayPlusNet } from "@/lib/billing-calculations";
import GlobalBillingPageClient from "@/components/billing/GlobalBillingPageClient";
import PayPlusInvoicesSection from "@/components/billing/PayPlusInvoicesSection";
import { ShieldCheck } from "lucide-react";

function formatInvoiceDate(d: Date) {
  return new Intl.DateTimeFormat("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

function monthStart(d: Date) {
  const t = new Date(d);
  t.setDate(1);
  t.setHours(0, 0, 0, 0);
  return t;
}

export default async function BillingPage() {
  const session = await getServerSession(authOptions);
  const orgId = session?.user?.organizationId;

  const payplusConfigured = Boolean(
    process.env.PAYPLUS_API_KEY?.trim() &&
      process.env.PAYPLUS_SECRET_KEY?.trim() &&
      process.env.PAYPLUS_PAYMENT_PAGE_UID?.trim(),
  );

  const mockPaymentAllowed =
    process.env.NODE_ENV === "development" || process.env.PAYPLUS_ALLOW_MOCK === "true";

  if (!orgId) {
    return (
      <div className="min-h-0 p-8 text-center text-slate-600" dir="rtl">
        <p className="font-bold">אין ארגון משויך — לא ניתן להציג מרכז פיננסי.</p>
      </div>
    );
  }

  const start = monthStart(new Date());

  const [org, dbInvoices, issuedDocuments, issuedThisMonth, paidInvoicesMonth, crmContacts] =
    await Promise.all([
    prisma.organization.findUnique({
      where: { id: orgId },
      select: {
        name: true,
        plan: true,
        subscriptionStatus: true,
        creditsRemaining: true,
        monthlyAllowance: true,
        isPayAsYouGo: true,
        companyType: true,
        taxId: true,
        address: true,
      },
    }),
    prisma.invoice.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.issuedDocument.findMany({
      where: { organizationId: orgId },
      orderBy: { date: "desc" },
      take: 200,
    }),
    prisma.issuedDocument.findMany({
      where: { organizationId: orgId, date: { gte: start } },
    }),
    prisma.invoice.findMany({
      where: {
        organizationId: orgId,
        status: "PAID",
        paidAt: { gte: start },
      },
    }),
    prisma.contact.findMany({
      where: { organizationId: orgId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!org) {
    return (
      <div className="min-h-0 p-8 text-center text-slate-600" dir="rtl">
        <p className="font-bold">הארגון לא נמצא.</p>
      </div>
    );
  }

  const monthGross = issuedThisMonth.reduce((s, d) => s + d.total, 0);
  const monthVat = issuedThisMonth.reduce((s, d) => s + d.vat, 0);
  const pendingInvoices = dbInvoices.filter((i) => i.status !== "PAID");
  const pendingAmount = pendingInvoices.reduce((s, i) => s + (i.amount ?? 0), 0);
  let netAfterPayPlusMonth = 0;
  for (const inv of paidInvoicesMonth) {
    netAfterPayPlusMonth += calculatePayPlusNet(inv.amount ?? 0).net;
  }

  const payRows = dbInvoices.map((inv) => ({
    id: inv.id,
    number: inv.invoiceNumber ?? inv.id.slice(-8).toUpperCase(),
    amount: inv.amount ?? 0,
    status: inv.status,
    date: formatInvoiceDate(inv.createdAt),
    description: inv.description ?? "חשבונית",
    customerName: inv.customerName ?? session?.user?.name ?? "לקוח",
    customerEmail: inv.customerEmail ?? session?.user?.email ?? "",
  }));

  const issuedRows = issuedDocuments.map((d) => ({
    id: d.id,
    docType: d.type,
    number: d.number,
    dateLabel: formatInvoiceDate(d.date),
    dateIso: d.date.toISOString(),
    clientName: d.clientName,
    status: d.status,
    total: d.total,
    amount: d.amount,
    vat: d.vat,
    items: d.items,
  }));

  return (
    <div className="min-h-0 bg-[#f8fafc] font-sans text-slate-900">
      <div className="max-w-[1600px] mx-auto px-4 pt-8 sm:px-8">
        <div className="mb-8 rounded-[1.5rem] border border-slate-100 bg-white p-6 shadow-lg shadow-slate-200/40 text-sm text-slate-600">
          <p className="text-slate-900 font-bold mb-1 flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-500 shrink-0" />
            {org.name}
          </p>
          <p>
            מנוי: <span className="font-medium text-slate-800">{org.plan}</span>
            {" · "}
            סטטוס: <span className="font-medium text-slate-800">{org.subscriptionStatus}</span>
            {" · "}
            סיווג מס: <span className="font-medium text-slate-800">{org.companyType}</span>
          </p>
          <p className="mt-1">
            סריקות שנותרו:{" "}
            <span className="font-medium text-slate-800">{formatCreditsForDisplay(org.creditsRemaining)}</span>
            {" · "}
            מכסה חודשית:{" "}
            <span className="font-medium text-slate-800">{formatCreditsForDisplay(org.monthlyAllowance)}</span>
            {org.isPayAsYouGo ? (
              <span className="text-emerald-600 mr-2 font-medium"> · Pay-as-you-go פעיל</span>
            ) : null}
          </p>
        </div>
      </div>

      <GlobalBillingPageClient
        organizationName={org.name}
        orgAddress={org.address}
        companyType={org.companyType}
        taxId={org.taxId}
        contacts={crmContacts}
        issuedRows={issuedRows}
        stats={{
          monthGross,
          monthVat,
          pendingAmount,
          pendingInvoiceCount: pendingInvoices.length,
          netAfterPayPlusMonth,
        }}
        payPlusBlock={
          <PayPlusInvoicesSection
            invoices={payRows}
            payplusConfigured={payplusConfigured}
            mockPaymentAllowed={mockPaymentAllowed}
          />
        }
      />
    </div>
  );
}
