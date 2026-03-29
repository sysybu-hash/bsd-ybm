import type { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCreditsForDisplay } from "@/lib/org-credits-display";
import GlobalBillingPageClient from "@/components/billing/GlobalBillingPageClient";
import PayPalInvoicesSection from "@/components/billing/PayPalInvoicesSection";
import PayPalSubscriptionCheckoutLazy from "@/components/billing/PayPalSubscriptionCheckoutLazy";
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

const orgSelectBilling = {
  name: true,
  plan: true,
  subscriptionStatus: true,
  creditsRemaining: true,
  monthlyAllowance: true,
  isPayAsYouGo: true,
  companyType: true,
  taxId: true,
  address: true,
  isReportable: true,
  paypalMerchantEmail: true,
  paypalMeSlug: true,
  liveDataTier: true,
} as const;

type OrgBilling = Prisma.OrganizationGetPayload<{ select: typeof orgSelectBilling }>;

async function fetchOrgForBilling(orgId: string): Promise<OrgBilling | null> {
  try {
    return await prisma.organization.findUnique({
      where: { id: orgId },
      select: orgSelectBilling,
    });
  } catch (e) {
    console.warn("[billing] שאילתת ארגון מלאה נכשלה (אולי עמודות חסרות ב-DB) — נסיון מצומצם", e);
    const minimal = await prisma.organization.findUnique({
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
        isReportable: true,
      },
    });
    if (!minimal) return null;
    return {
      ...minimal,
      paypalMerchantEmail: null,
      paypalMeSlug: null,
      liveDataTier: "basic",
    };
  }
}

export default async function BillingPage() {
  const session = await getServerSession(authOptions);
  const orgId = session?.user?.organizationId;

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
    fetchOrgForBilling(orgId),
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
  const paidMonthGross = paidInvoicesMonth.reduce((s, i) => s + (i.amount ?? 0), 0);

  const payRows = dbInvoices.map((inv) => ({
    id: inv.id,
    number: inv.invoiceNumber ?? inv.id.slice(-8).toUpperCase(),
    amount: inv.amount ?? 0,
    status: inv.status,
    date: formatInvoiceDate(inv.createdAt),
    createdAtIso: inv.createdAt.toISOString(),
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
          <p className="mt-2 text-xs text-slate-500">
            רמת נתונים חיים:{" "}
            <span className="font-bold text-slate-700">
              {org.liveDataTier === "premium"
                ? "פרימיום"
                : org.liveDataTier === "standard"
                  ? "מתקדם"
                  : "בסיסי"}
            </span>
            {" — "}
            ניתן לשנות ב־
            <a href="/dashboard/settings?tab=billing" className="font-bold text-blue-700 underline">
              הגדרות › מנויים
            </a>
            .
          </p>
        </div>
      </div>

      <div className="mx-auto mb-8 max-w-[1600px] px-4 sm:px-8">
        <PayPalSubscriptionCheckoutLazy
          clientId={process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? ""}
          currentPlan={org.plan}
          subscriptionStatus={org.subscriptionStatus}
        />
      </div>

      {org.paypalMeSlug || org.paypalMerchantEmail ? (
        <div className="mx-auto mb-6 max-w-[1600px] px-4 sm:px-8">
          <div
            className="rounded-2xl border border-[#0070ba]/30 bg-gradient-to-r from-[#0070ba]/5 to-sky-50 p-5 text-sm text-slate-800"
            dir="rtl"
          >
            <p className="font-bold text-slate-900 mb-2">קבלת תשלומים מלקוחות (PayPal של הארגון)</p>
            <p className="text-xs text-slate-500 mb-2">
              זה חשבון <strong>של הארגון</strong> להפניית לקוחות — לא חשבון מפעיל הפלטפורמה.
            </p>
            {org.paypalMerchantEmail ? (
              <p className="text-slate-600">
                חשבון PayPal:{" "}
                <span className="font-mono font-medium" dir="ltr">
                  {org.paypalMerchantEmail}
                </span>
              </p>
            ) : null}
            {org.paypalMeSlug ? (
              <p className="mt-2">
                <a
                  href={`https://paypal.me/${encodeURIComponent(org.paypalMeSlug)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#0070ba] px-4 py-2.5 font-bold text-white hover:bg-[#005ea6]"
                >
                  פתיחת PayPal.Me לתשלום
                </a>
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      <GlobalBillingPageClient
        organizationName={org.name}
        orgAddress={org.address}
        companyType={org.companyType}
        taxId={org.taxId}
        isReportable={org.isReportable}
        contacts={crmContacts}
        issuedRows={issuedRows}
        paypalRows={payRows}
        paypalMeSlug={org.paypalMeSlug}
        paypalMerchantEmail={org.paypalMerchantEmail}
        stats={{
          monthGross,
          monthVat,
          pendingAmount,
          pendingInvoiceCount: pendingInvoices.length,
          paidMonthGross,
        }}
      />

      <div className="mx-auto max-w-[1600px] px-4 pb-10 sm:px-8">
        <PayPalInvoicesSection
          paypalMeSlug={org.paypalMeSlug}
          paypalMerchantEmail={org.paypalMerchantEmail}
        />
      </div>
    </div>
  );
}
