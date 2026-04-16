import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Zap } from "lucide-react";
import {
  canAccessExecutiveSuite,
  canAccessIntelligenceDashboard,
  intelligenceModulesForRole,
} from "@/lib/intelligence-access";
import IntelligenceRoleDashboard from "@/components/intelligence/IntelligenceRoleDashboard";
import AutonomousNegotiationCenter from "@/components/intelligence/AutonomousNegotiationCenter";
import ExecutiveDashboardSection from "@/components/executive/ExecutiveDashboardSection";
import { getServerTranslator } from "@/lib/i18n/server";
import { isRtlLocale } from "@/lib/i18n/config";

export async function IntelligenceDashboardContent({
  fallbackHref = "/app",
}: {
  fallbackHref?: string;
} = {}) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  const email = session?.user?.email;

  if (!canAccessIntelligenceDashboard(role)) {
    redirect(fallbackHref);
  }

  const modules = intelligenceModulesForRole(role);
  const showExecutive = canAccessExecutiveSuite(role, email);

  const { t, locale } = await getServerTranslator();
  const dir = isRtlLocale(locale) ? "rtl" : "ltr";

  return (
    <div className="space-y-10 pb-16" dir={dir}>
      <header className="flex flex-col gap-3 border-b border-gray-100 pb-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 md:text-3xl italic">
              {t("intelligence.pageTitle")}
            </h1>
            <p className="mt-2 text-sm font-medium text-slate-500">
              {t("intelligence.pageSubtitle")}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-teal-50 border border-teal-100 rounded-2xl px-4 py-2 text-xs font-black text-teal-700 shadow-sm">
             <Zap size={14} className="text-amber-500 fill-amber-500" /> {t("intelligence.syncActive")}
          </div>
        </div>
      </header>

      {/* 🚀 Autonomous Negotiation Agent - WORLD FIRST */}
      <section className="card-avenue rounded-[2rem] p-6 lg:p-8 bg-white shadow-xl shadow-blue-900/5 relative overflow-hidden border border-slate-200">
         <div className="absolute top-0 end-0 h-32 w-32 bg-teal-500/5 blur-3xl rounded-full" />
         <AutonomousNegotiationCenter />
      </section>

      <div className="border-t border-slate-100 pt-10">
        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6">מודולי מודיעין לתפקיד: {role}</h2>
        <IntelligenceRoleDashboard modules={modules} />
      </div>

      {showExecutive ? (
        <section
          id="executive-suite"
          className="scroll-mt-24 space-y-6 border-t border-gray-100 pt-10"
          aria-label={t("intelligencePage.dividerLabel")}
        >
          <div className="flex flex-wrap items-center gap-3">
            <span className="h-px flex-1 bg-gradient-to-l from-transparent via-teal-500/20 to-teal-400/60" />
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-teal-400">
              {t("intelligencePage.dividerLabel")}
            </h2>
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-teal-500/20 to-teal-400/60" />
          </div>
          <ExecutiveDashboardSection embedded userEmail={email} />
        </section>
      ) : null}
    </div>
  );
}
