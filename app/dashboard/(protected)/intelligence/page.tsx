import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import {
  canAccessIntelligenceDashboard,
  intelligenceModulesForRole,
} from "@/lib/intelligence-access";
import IntelligenceRoleDashboard from "@/components/intelligence/IntelligenceRoleDashboard";
import { ArrowRight } from "lucide-react";

export default async function IntelligenceDashboardPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;

  if (!canAccessIntelligenceDashboard(role)) {
    redirect("/dashboard");
  }

  const modules = intelligenceModulesForRole(role);

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-[var(--primary-color,#3b82f6)]">
            לוח Intelligence
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            רכיבים לפי תפקיד ({role}) — ניתן לערוך ב־
            <code className="mx-1 text-xs bg-slate-100 px-1 rounded">
              lib/intelligence-access.ts
            </code>
          </p>
        </div>
        <Link
          href="/dashboard/executive"
          className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:underline"
        >
          דף Executive וגרפים
          <ArrowRight size={18} className="rotate-180" />
        </Link>
      </div>

      <IntelligenceRoleDashboard modules={modules} />
    </div>
  );
}
