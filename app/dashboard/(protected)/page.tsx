import BsdYbmDashboard from "@/app/components/BsdYbmDashboard";
import FinancialInsightsWidget from "@/components/FinancialInsightsWidget";
import { getOrgDashboardHomeData } from "@/lib/dashboard-home-data";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { Compass, CreditCard, Settings, Users } from "lucide-react";

export default async function DashboardHomePage() {
  const session = await getServerSession(authOptions);
  const homeData = await getOrgDashboardHomeData(session?.user?.organizationId);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6" dir="rtl">
        <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700">
          <Compass size={14} />
          תפעול מהיר
        </p>
        <h1 className="text-2xl font-black text-slate-900">הפעלה קלה של האתר והמנויים</h1>
        <p className="mt-2 text-sm text-slate-600">
          אם הסתבכת עם המסכים, תעבוד דרך מרכז התפעול. שם כל הפעולות מרוכזות צעד-אחר-צעד.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/dashboard/control-center" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800">
            מעבר למרכז תפעול
          </Link>
          <Link href="/dashboard/billing" className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
            <CreditCard size={14} /> מנויים
          </Link>
          <Link href="/dashboard/settings" className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
            <Settings size={14} /> הגדרות
          </Link>
          <Link href="/dashboard/settings?tab=account" className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
            <Users size={14} /> משתמשים
          </Link>
        </div>
      </section>
      <FinancialInsightsWidget organizationId={session?.user?.organizationId} />
      <BsdYbmDashboard homeData={homeData} />
    </div>
  );
}
