import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { canAccessExecutiveSuite } from "@/lib/intelligence-access";
import ExecutiveSuite from "@/components/intelligence/ExecutiveSuite";
import ForecastChart from "@/components/intelligence/ForecastChart";
import ForecastSimulator from "@/components/intelligence/ForecastSimulator";
import ValuationWidget from "@/components/intelligence/ValuationWidget";
import { ArrowRight } from "lucide-react";

export default async function ExecutiveDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!canAccessExecutiveSuite(session?.user?.role)) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-10" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-black text-[var(--primary-color,#3b82f6)]">
          Executive Suite וחיזויים
        </h1>
        <Link
          href="/dashboard/intelligence"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-blue-600"
        >
          <ArrowRight size={18} />
          ללוח Intelligence מלא
        </Link>
      </div>

      <ExecutiveSuite />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <ForecastChart />
        <ForecastSimulator />
      </div>

      <div className="max-w-lg">
        <ValuationWidget />
      </div>
    </div>
  );
}
