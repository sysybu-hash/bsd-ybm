import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import {
  canAccessExecutiveSuite,
  canAccessIntelligenceDashboard,
  intelligenceModulesForRole,
} from "@/lib/intelligence-access";
import IntelligenceRoleDashboard from "@/components/intelligence/IntelligenceRoleDashboard";
import ExecutiveDashboardSection from "@/components/executive/ExecutiveDashboardSection";
import { getServerTranslator } from "@/lib/i18n/server";
import { isRtlLocale } from "@/lib/i18n/config";

export default async function IntelligenceDashboardPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  const email = session?.user?.email;

  if (!canAccessIntelligenceDashboard(role)) {
    redirect("/dashboard");
  }

  const modules = intelligenceModulesForRole(role);
  const showExecutive = canAccessExecutiveSuite(role, email);

  const { t, locale } = await getServerTranslator();
  const dir = isRtlLocale(locale) ? "rtl" : "ltr";

  return (
    <div className="space-y-10 pb-16" dir={dir}>
      <header className="flex flex-col gap-3 border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-2xl font-black text-indigo-400 md:text-3xl">
            {t("intelligencePage.title")}
          </h1>
          <p className="mt-2 text-sm font-medium text-gray-500">
            {t("intelligencePage.subtitle", { role: String(role ?? "—") })}
          </p>
          {showExecutive ? (
            <p className="mt-2 text-xs font-semibold text-indigo-400/70">{t("intelligencePage.executiveBelow")}</p>
          ) : null}
        </div>
      </header>

      <IntelligenceRoleDashboard modules={modules} />

      {showExecutive ? (
        <section
          id="executive-suite"
          className="scroll-mt-24 space-y-6 border-t border-gray-100 pt-10"
          aria-label={t("intelligencePage.dividerLabel")}
        >
          <div className="flex flex-wrap items-center gap-3">
            <span className="h-px flex-1 bg-gradient-to-l from-transparent via-indigo-500/20 to-indigo-400/60" />
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400">
              {t("intelligencePage.dividerLabel")}
            </h2>
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-indigo-500/20 to-indigo-400/60" />
          </div>
          <ExecutiveDashboardSection embedded userEmail={email} />
        </section>
      ) : null}
    </div>
  );
}
