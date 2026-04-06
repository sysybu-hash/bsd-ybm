import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { Suspense } from "react";
import type { Prisma, ScanBundle, SubscriptionTier } from "@prisma/client";
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
import BillingUnifiedTabsClient from "@/components/billing/BillingUnifiedTabsClient";
import { parseBillingWorkspace } from "@/lib/billing-workspace";
import { ShieldCheck } from "lucide-react";
import { tierAllowance, tierLabelHe, ADMIN_SUBSCRIPTION_TIER_OPTIONS } from "@/lib/subscription-tier-config";
import { getEffectiveTierMonthlyPriceIls, getPayPalClientIdPublic } from "@/lib/billing-pricing";
import { isAdmin } from "@/lib/is-admin";
import AdminSubscriptionControlCenter from "@/components/executive/AdminSubscriptionControlCenter";
import { ensureDefaultScanBundles } from "@/lib/ensure-scan-bundles";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
  title: "מנויים ותשלומים | BSD-YBM Intelligence",
  description: "דוחות, שימוש במנוי, תשלומים וניהול מנויים",
};

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

type SearchParams = Promise<{ tab?: string; orgId?: string }>;

export default async function BillingPage({ searchParams }: { searchParams: SearchParams }) {
  noStore();
  const session = await getServerSession(authOptions);
  const orgId = session?.user?.organizationId;
  const sp = await searchParams;
  const focusOrgId = sp.orgId?.trim() || undefined;
  const steelAdmin = isAdmin(session?.user?.email);

  if (!orgId) {
    return (
      <div className="min-h-0 p-8 text-center text-white/50" dir="rtl">
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

  let adminOrgs:
    | Array<{
        id: string;
        name: string;
        subscriptionTier: SubscriptionTier;
        subscriptionStatus: string;
        cheapScansRemaining: number;
        premiumScansRemaining: number;
        maxCompanies: number;
        trialEndsAt: Date | null;
        primaryEmail: string | null;
        tenantPublicDomain: string | null;
      }>
    | null = null;
  let adminBundles: ScanBundle[] | null = null;
  let adminBillingConfig:
    | {
        paypalClientIdPublic: string | null;
        tierMonthlyPricesJson: Prisma.JsonValue | null;
      }
    | null = null;

  if (steelAdmin) {
    await ensureDefaultScanBundles();
    const [orgRows, bundlesRows, cfg] = await Promise.all([
      prisma.organization.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          subscriptionTier: true,
          subscriptionStatus: true,
          cheapScansRemaining: true,
          premiumScansRemaining: true,
          maxCompanies: true,
          trialEndsAt: true,
          tenantPublicDomain: true,
          users: {
            take: 1,
            orderBy: { createdAt: "asc" },
            select: { email: true },
          },
        },
      }),
      prisma.scanBundle.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.platformBillingConfig.findUnique({ where: { id: "default" } }),
    ]);
    adminOrgs = orgRows.map((o) => ({
      id: o.id,
      name: o.name,
      subscriptionTier: o.subscriptionTier,
      subscriptionStatus: o.subscriptionStatus,
      cheapScansRemaining: o.cheapScansRemaining,
      premiumScansRemaining: o.premiumScansRemaining,
      maxCompanies: o.maxCompanies,
      trialEndsAt: o.trialEndsAt,
      primaryEmail: o.users[0]?.email ?? null,
      tenantPublicDomain: o.tenantPublicDomain ?? null,
    }));
    adminBundles = bundlesRows;
    adminBillingConfig = cfg
      ? {
          paypalClientIdPublic: cfg.paypalClientIdPublic,
          tierMonthlyPricesJson: cfg.tierMonthlyPricesJson,
        }
      : null;
  }

  if (!org) {
    return (
      <div className="min-h-0 p-8 text-center text-white/50" dir="rtl">
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

  const overview = (
    <>
      {/* שלב 1 — סיכום ארגון */}
      <div className="mx-auto max-w-[1600px] px-4 sm:px-8">
        <p className="mb-2 text-xs font-black uppercase tracking-wider text-white/30">
          שלב 1 — סיכום ארגון
        </p>
        <div className="mb-8 rounded-[1.25rem] border border-gray-200 bg-white/[0.03] p-6 text-sm text-white/60">
          <p className="mb-1 flex items-center gap-2 font-bold text-white">
            <ShieldCheck size={18} className="shrink-0 text-emerald-400" />
            {org.name}
          </p>
          <p>
            מנוי:{" "}
            <span className="font-semibold text-white/85">
              {tierLabelHe(org.subscriptionTier)} ({org.subscriptionTier})
            </span>
            {" · "}
            סטטוס: <span className="font-semibold text-white/85">{org.subscriptionStatus}</span>
            {" · "}
            סיווג מס: <span className="font-semibold text-white/85">{org.companyType}</span>
            {" · "}
            חברות מקס׳: <span className="font-semibold text-white/85">{org.maxCompanies}</span>
          </p>
          <p className="mt-1">
            סריקות זולות נותרו:{" "}
            <span className="font-semibold text-sky-400">
              {formatCreditsForDisplay(org.cheapScansRemaining)}
            </span>
            {" · "}
            פרימיום נותרו:{" "}
              <span className="font-semibold text-indigo-400">
              {formatCreditsForDisplay(org.premiumScansRemaining)}
            </span>
          </p>
          <p className="mt-2 text-xs text-white/30">
            רמת נתונים חיים:{" "}
            <span className="font-bold text-gray-500">
              {org.liveDataTier === "premium"
                ? "פרימיום"
                : org.liveDataTier === "standard"
                  ? "מתקדם"
                  : "בסיסי"}
            </span>
            {" — "}
            כל ערכי החשבון, המנויים והאינטגרציות:{" "}
            <a href="/dashboard/settings" className="font-bold text-indigo-400 underline underline-offset-2 hover:text-indigo-300">
              הגדרות
            </a>
            .
          </p>
        </div>
      </div>

      {/* שלב 2 — גרפי שימוש (מוקד ויזואלי) */}
      <div className="mx-auto mb-10 max-w-[1600px] px-4 sm:px-8">
        <p className="mb-3 text-xs font-black uppercase tracking-wider text-white/30">
          שלב 2 — שימוש במנוי (גרפים)
        </p>
        <ScanUsageRadialCharts
          cheapLeft={org.cheapScansRemaining}
          cheapIncluded={tierAllow.cheapScans}
          premiumLeft={org.premiumScansRemaining}
          premiumIncluded={tierAllow.premiumScans}
          variant="dark"
        />
      </div>

      {/* שלב 3 — מחירון ופעולות תשלום */}
      <div className="mx-auto mb-10 max-w-[1600px] px-4 sm:px-8">
        <p className="mb-3 text-xs font-black uppercase tracking-wider text-white/30">
          שלב 3 — מנויים, חבילות ותשלום
        </p>
        <SubscriptionPricingTable tierPricesIls={tierPricesForTable} />
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
            className="rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.07] p-5 text-sm text-gray-600"
            dir="rtl"
          >
            <p className="mb-2 font-bold text-white">קבלת תשלומים מלקוחות (PayPal של הארגון)</p>
            <p className="mb-2 text-xs text-gray-400">
              זה חשבון <strong className="text-gray-500">של הארגון</strong> להפניית לקוחות — לא חשבון מפעיל האתר.
            </p>
            {org.paypalMerchantEmail ? (
              <p className="text-white/50">
                חשבון PayPal:{" "}
                <span className="font-mono font-medium text-gray-700" dir="ltr">
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
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 font-bold text-white hover:bg-indigo-700"
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
    </>
  );

  return (
    <Suspense
      fallback={
        <div
          className="flex min-h-screen items-center justify-center bg-white text-white/50 text-sm font-medium"
          dir="rtl"
        >
          טוען מנויים ותשלומים…
        </div>
      }
    >
      <BillingUnifiedTabsClient
        isSteelAdmin={steelAdmin}
        childrenOverview={overview}
        childrenControl={
          steelAdmin && adminOrgs && adminBundles ? (
            <AdminSubscriptionControlCenter
              initialOrgs={adminOrgs}
              bundles={adminBundles}
              billingConfig={adminBillingConfig}
              focusOrgId={focusOrgId}
            />
          ) : null
        }
      />
    </Suspense>
  );
}
