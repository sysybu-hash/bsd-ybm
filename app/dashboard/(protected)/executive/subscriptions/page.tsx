import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { canAccessExecutiveSuite } from "@/lib/intelligence-access";
import { prisma } from "@/lib/prisma";
import { ensureDefaultScanBundles } from "@/lib/ensure-scan-bundles";
import ExecutiveSubscriptionsPanel from "@/components/executive/ExecutiveSubscriptionsPanel";
import { ArrowRight } from "lucide-react";
import { isExecutiveSubscriptionSuperAdmin } from "@/lib/executive-subscription-super-admin";

export const dynamic = "force-dynamic";

export default async function ExecutiveSubscriptionsPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  const email = session?.user?.email;
  if (!canAccessExecutiveSuite(role, email)) {
    redirect("/dashboard");
  }

  await ensureDefaultScanBundles();

  const [orgs, bundles, billingConfig] = await Promise.all([
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
    prisma.platformBillingConfig.findUnique({
      where: { id: "default" },
    }),
  ]);

  const initialOrgs = orgs.map((o) => ({
    id: o.id,
    name: o.name,
    subscriptionTier: o.subscriptionTier,
    subscriptionStatus: o.subscriptionStatus,
    cheapScansRemaining: o.cheapScansRemaining,
    premiumScansRemaining: o.premiumScansRemaining,
    maxCompanies: o.maxCompanies,
    trialEndsAt: o.trialEndsAt,
    primaryEmail: o.users[0]?.email ?? null,
  }));

  const showSuperManage = isExecutiveSubscriptionSuperAdmin(email);

  return (
    <div className="space-y-8 pb-16" dir="rtl">
      <header className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-center md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">Executive</p>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900">ניהול מנויים וגבייה</h1>
          <p className="mt-2 text-slate-500 font-medium max-w-xl">
            ממשק בלעדי לבעלי הפלטפורמה: רמות מנוי, מחירי PayPal, חבילות סריקה והזמנות במייל.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 self-start">
          {showSuperManage ? (
            <Link
              href="/dashboard/executive/manage-subscriptions"
              className="inline-flex items-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-5 py-3 text-sm font-bold text-violet-900 shadow-sm hover:border-violet-300 transition-colors"
            >
              <ArrowRight size={18} />
              ניהול מנויים מתקדם (SuperAdmin)
            </Link>
          ) : null}
          <Link
            href="/dashboard/executive"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm hover:border-emerald-200 hover:text-emerald-700 transition-colors"
          >
            <ArrowRight size={18} />
            חזרה לדוח Executive
          </Link>
        </div>
      </header>

      <ExecutiveSubscriptionsPanel
        initialOrgs={initialOrgs}
        bundles={bundles}
        billingConfig={
          billingConfig
            ? {
                paypalClientIdPublic: billingConfig.paypalClientIdPublic,
                tierMonthlyPricesJson: billingConfig.tierMonthlyPricesJson,
              }
            : null
        }
      />
    </div>
  );
}
