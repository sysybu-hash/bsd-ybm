import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { hasMeckanoAccess } from "@/lib/meckano-access";
import { isPlatformDeveloperEmail } from "@/lib/platform-developers";
import MissionControl from "@/components/MissionControl";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default async function AdminMissionPage() {
  const session = await getServerSession(authOptions);
  if (hasMeckanoAccess(session?.user?.email)) {
    redirect("/dashboard");
  }
  if (!isPlatformDeveloperEmail(session?.user?.email)) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-black text-[var(--primary-color,#3b82f6)]">
          בקרת משימות
        </h1>
        <Link
          href="/dashboard/admin"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-blue-600"
        >
          <ArrowRight size={18} className="rotate-180" />
          חזרה ל־Master Admin
        </Link>
      </div>
      <MissionControl />

      <section className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6">
        <h2 className="text-lg font-black text-slate-800 mb-2">Intelligence</h2>
        <p className="text-sm text-slate-600 mb-4">
          לוח המודולים מוצג בדף ייעודי לפי תפקיד. כמנהל־על יש לך גישה מלאה.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/intelligence"
            className="inline-flex items-center rounded-xl bg-blue-600 text-white font-bold px-5 py-2.5 text-sm hover:bg-blue-500"
          >
            ללוח Intelligence
          </Link>
          <Link
            href="/dashboard/executive"
            className="inline-flex items-center rounded-xl border border-slate-200 bg-white font-bold px-5 py-2.5 text-sm text-slate-800 hover:bg-slate-100"
          >
            Executive וגרפים
          </Link>
          <Link
            href="/dashboard/meckano"
            className="inline-flex items-center rounded-xl border border-slate-200 bg-white font-bold px-5 py-2.5 text-sm text-slate-800 hover:bg-slate-100"
          >
            מקאנו (עובדים)
          </Link>
        </div>
      </section>
    </div>
  );
}
