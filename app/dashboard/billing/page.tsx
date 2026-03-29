import type { Prisma, SubscriptionTier } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCreditsForDisplay } from "@/lib/org-credits-display";
import GlobalBillingPageClient from "@/components/billing/GlobalBillingPageClient";
import PayPalInvoicesSection from "@/components/billing/PayPalInvoicesSection";
import PayPalSubscriptionCheckoutLazy from "@/components/billing/PayPalSubscriptionCheckoutLazy";
import PayPalBundleCheckoutLazy from "@/components/billing/PayPalBundleCheckoutLazy";
import BillingOnboardingCallout from "@/components/billing/BillingOnboardingCallout";
import BillingQuickPayments from "@/components/billing/BillingQuickPayments";
import BillingWorkspaceEditor from "@/components/billing/BillingWorkspaceEditor";
import SubscriptionPricingTable from "@/components/billing/SubscriptionPricingTable";
import ScanUsageRadialCharts from "@/components/billing/ScanUsageRadialCharts";
import { parseBillingWorkspace } from "@/lib/billing-workspace";
import { ShieldCheck } from "lucide-react";
import { tierAllowance, tierLabelHe, ADMIN_SUBSCRIPTION_TIER_OPTIONS } from "@/lib/subscription-tier-config";
import { getEffectiveTierMonthlyPriceIls, getPayPalClientIdPublic } from "@/lib/billing-pricing";

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
  subscriptionTier: true,
  subscriptionStatus: true,
  cheapScansRemaining: true,
  premiumScansRemaining: true,
  maxCompanies: true,
  companyType: true,
  taxId: true,
  address: true,
  isReportable: true,
  paypalMerchantEmail: true,
  paypalMeSlug: true,
  liveDataTier: true,
  billingWorkspaceJson: true,
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
        subscriptionTier: true,
        subscriptionStatus: true,
        cheapScansRemaining: true,
        premiumScansRemaining: true,
        maxCompanies: true,
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
      billingWorkspaceJson: null,
    } as OrgBilling;
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

  const [
    org,
    dbInvoices,
    issuedDocuments,
    issuedThisMonth,
    paidInvoicesMonth,
    crmContacts,
    scanBundles,
    paypalClientId,
  ] = await Promise.all([
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
    prisma.scanBundle.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, priceIls: true, cheapAdds: true, premiumAdds: true },
    }),
    getPayPalClientIdPublic(),
  ]);

  if (!org) {
    return (
      <div className="min-h-0 p-8 text-center text-slate-600" dir="rtl">
        <p className="font-bold">הארגון לא נמצא.</p>
      </div>
    );
  }

  const billingWorkspace = parseBillingWorkspace(org.billingWorkspaceJson);

  const tierAllow = tierAllowance(org.subscriptionTier);
  const tierPriceEntries = await Promise.all(
    ADMIN_SUBSCRIPTION_TIER_OPTIONS.map(async (t) => {
      const p = await getEffectiveTierMonthlyPriceIls(t as SubscriptionTier);
      return [t, p] as const;
    }),
  );
  const tierPricesForTable = Object.fromEntries(tierPriceEntries) as Record<
    string,
    number | null
  >;
  const tierPricesForPayPal = Object.fromEntries(
    tierPriceEntries.filter(([, p]) => p != null) as [string, number][],
  );

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
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100">
      <div className="max-w-[1600px] mx-auto px-4 pt-8 sm:px-8">
        <div className="mb-8 rounded-[1.5rem] border border-white/10 bg-white/[0.06] backdrop-blur-xl p-6 shadow-xl shadow-black/30 text-sm text-slate-300">
          <p className="text-white font-bold mb-1 flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-400 shrink-0" />
            {org.name}
          </p>
          <p>
            מנוי:{" "}
            <span className="font-medium text-white">
              {tierLabelHe(org.subscriptionTier)} ({org.subscriptionTier})
            </span>
            {" · "}
            סטטוס: <span className="font-medium text-white">{org.subscriptionStatus}</span>
            {" · "}
            סיווג מס: <span className="font-medium text-white">{org.companyType}</span>
            {" · "}
            חברות מקס׳: <span className="font-medium text-white">{org.maxCompanies}</span>
          </p>
          <p className="mt-1">
            סריקות זולות נותרו:{" "}
            <span className="font-medium text-sky-300">{formatCreditsForDisplay(org.cheapScansRemaining)}</span>
            {" · "}
            פרימיום נותרו:{" "}
            <span className="font-medium text-violet-300">
              {formatCreditsForDisplay(org.premiumScansRemaining)}
            </span>
          </p>
          <p className="mt-2 text-xs text-slate-500">
            רמת נתונים חיים:{" "}
            <span className="font-bold text-slate-300">
              {org.liveDataTier === "premium"
                ? "פרימיום"
                : org.liveDataTier === "standard"
                  ? "מתקדם"
                  : "בסיסי"}
            </span>
            {" — "}
            לוח מס, PayPal, הזמנת צוות ותפקידים — ב־
            <a href="/dashboard/settings?tab=account" className="font-bold text-sky-400 underline">
              הגדרות › חשבון
            </a>
            {" "}ו־
            <a href="/dashboard/settings?tab=billing" className="font-bold text-sky-400 underline">
              מנויים
            </a>
            .
          </p>
        </div>
      </div>

      <div className="mx-auto mb-10 max-w-[1600px] px-4 sm:px-8">
        <SubscriptionPricingTable tierPricesIls={tierPricesForTable} variant="glass" />
      </div>

      <div className="mx-auto mb-10 max-w-[1600px] px-4 sm:px-8">
        <ScanUsageRadialCharts
          cheapLeft={org.cheapScansRemaining}
          cheapIncluded={tierAllow.cheapScans}
          premiumLeft={org.premiumScansRemaining}
          premiumIncluded={tierAllow.premiumScans}
        />
      </div>

      <div className="mx-auto mb-6 max-w-[1600px] space-y-6 px-4 sm:px-8">
        <BillingOnboardingCallout text={billingWorkspace.onboardingFreePitch} />
        <BillingQuickPayments presets={billingWorkspace.quickPaymentPresets} />
      </div>

      <div className="mx-auto mb-8 max-w-[1600px] px-4 sm:px-8 space-y-8">
        <PayPalSubscriptionCheckoutLazy
          clientId={paypalClientId}
          currentTier={org.subscriptionTier}
          subscriptionStatus={org.subscriptionStatus}
          tierPricesIls={tierPricesForPayPal}
        />
        <PayPalBundleCheckoutLazy clientId={paypalClientId} bundles={scanBundles} />
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

      <div className="mx-auto max-w-[1600px] space-y-8 px-4 pb-10 sm:px-8">
        <BillingWorkspaceEditor initial={billingWorkspace} />
        <PayPalInvoicesSection
          paypalMeSlug={org.paypalMeSlug}
          paypalMerchantEmail={org.paypalMerchantEmail}
        />
      </div>
    </div>
  );
}
