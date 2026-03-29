import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { isExecutiveSubscriptionSuperAdmin } from "@/lib/executive-subscription-super-admin";
import { prisma } from "@/lib/prisma";
import ManageSubscriptionsPanel from "@/components/executive/ManageSubscriptionsPanel";
import { ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ManageSubscriptionsPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!isExecutiveSubscriptionSuperAdmin(email)) {
    redirect("/dashboard");
  }

  const orgs = await prisma.organization.findMany({
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
  });

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

  return (
    <div className="space-y-8 pb-16" dir="rtl">
      <header className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-center md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-500 mb-2">
            SuperAdmin
          </p>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900">ניהול מנויים מתקדם</h1>
          <p className="mt-2 text-slate-500 font-medium max-w-xl">
            יצירת משתמשים, התאמת יתרות סריקה והזמנות עם טוקן — גישה מוגבלת לחשבון מנהל בלבד.
          </p>
        </div>
        <Link
          href="/dashboard/executive/subscriptions"
          className="inline-flex items-center gap-2 self-start rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm hover:border-violet-200 hover:text-violet-800 transition-colors"
        >
          <ArrowRight size={18} />
          חזרה לניהול מנויים כללי
        </Link>
      </header>

      <ManageSubscriptionsPanel initialOrgs={initialOrgs} />
    </div>
  );
}
