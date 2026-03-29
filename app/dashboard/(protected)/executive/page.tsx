import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { canAccessExecutiveSuite } from "@/lib/intelligence-access";
import ExecutiveReportCharts from "@/components/executive/ExecutiveReportCharts";
import {
  getAnnualFlowSeries,
  getGlobalIncomeExpenseTotals,
  getGlobalTopPriceSpikes,
  getRecentLoginUsers,
} from "@/lib/executive-report-data";
import { getServerTranslator } from "@/lib/i18n/server";
import { isRtlLocale } from "@/lib/i18n/config";
import { intlLocaleForApp } from "@/lib/i18n/intl-locale";
import { isExecutiveSubscriptionSuperAdmin } from "@/lib/executive-subscription-super-admin";
import { ArrowRight, Building2, TrendingDown, TrendingUp, Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ExecutiveDashboardPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  const email = session?.user?.email;
  if (!canAccessExecutiveSuite(role, email)) {
    redirect("/dashboard");
  }
  const showSuperManage = isExecutiveSubscriptionSuperAdmin(email);

  const { t, locale } = await getServerTranslator();
  const dir = isRtlLocale(locale) ? "rtl" : "ltr";
  const intlTag = intlLocaleForApp(locale);

  const year = new Date().getFullYear();

  const [totals, flowSeries, recentUsers, priceSpikes] = await Promise.all([
    getGlobalIncomeExpenseTotals(),
    getAnnualFlowSeries(year),
    getRecentLoginUsers(20),
    getGlobalTopPriceSpikes(5),
  ]);

  const net = totals.totalIncome - totals.totalExpenses;
  const fmt = (n: number) =>
    `₪${Math.round(n).toLocaleString(intlTag, { maximumFractionDigits: 0 })}`;

  return (
    <div className="space-y-10 pb-16" dir={dir}>
      <header className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">
            {t("executive.kicker")}
          </p>
          <h1 className="text-3xl md:text-4xl font-black italic tracking-tight text-slate-900">
            {t("executive.title")}
          </h1>
          <p className="mt-2 text-slate-500 font-medium max-w-xl">{t("executive.subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-3 self-start">
          {showSuperManage ? (
            <Link
              href="/dashboard/executive/manage-subscriptions"
              className="inline-flex items-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-5 py-3 text-sm font-bold text-violet-900 shadow-sm hover:border-violet-300 transition-colors"
            >
              <ArrowRight size={18} />
              ניהול מנויים מתקדם
            </Link>
          ) : null}
          <Link
            href="/dashboard/executive/subscriptions"
            className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-bold text-emerald-800 shadow-sm hover:border-emerald-300 transition-colors"
          >
            <ArrowRight size={18} />
            ניהול מנויים וגבייה
          </Link>
          <Link
            href="/dashboard/intelligence"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm hover:border-blue-200 hover:text-blue-700 transition-colors"
          >
            <ArrowRight size={18} />
            {t("executive.linkIntelligence")}
          </Link>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <article className="rounded-[2rem] border border-slate-100 bg-gradient-to-br from-white via-blue-50/30 to-white p-8 shadow-xl shadow-slate-200/40 ring-1 ring-slate-50">
          <div className="flex items-center justify-between gap-4 mb-6">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/25">
              <TrendingUp size={22} strokeWidth={2.5} />
            </span>
            <span className="text-xs font-bold text-blue-600/80 uppercase tracking-wider">
              {t("executive.incomeBadge")}
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-500 mb-1">{t("executive.incomeMeta")}</p>
          <p className="text-2xl md:text-3xl font-black text-slate-900 tabular-nums">
            {fmt(totals.totalIncome)}
          </p>
          <p className="mt-4 text-xs text-slate-400 leading-relaxed">{t("executive.incomeHint")}</p>
        </article>

        <article className="rounded-[2rem] border border-slate-100 bg-gradient-to-br from-white via-rose-50/25 to-white p-8 shadow-xl shadow-slate-200/40 ring-1 ring-slate-50">
          <div className="flex items-center justify-between gap-4 mb-6">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500 text-white shadow-lg shadow-rose-500/25">
              <TrendingDown size={22} strokeWidth={2.5} />
            </span>
            <span className="text-xs font-bold text-rose-600/80 uppercase tracking-wider">
              {t("executive.expenseBadge")}
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-500 mb-1">{t("executive.expenseMeta")}</p>
          <p className="text-2xl md:text-3xl font-black text-slate-900 tabular-nums">
            {fmt(totals.totalExpenses)}
          </p>
          <p className="mt-4 text-xs text-slate-400 leading-relaxed">{t("executive.expenseHint")}</p>
        </article>

        <article className="rounded-[2rem] border border-slate-100 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 text-white shadow-2xl shadow-slate-900/20">
          <div className="flex items-center justify-between gap-4 mb-6">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
              <Building2 size={22} strokeWidth={2} />
            </span>
            <span className="text-xs font-bold text-white/50 uppercase tracking-wider">
              {t("executive.netBadge")}
            </span>
          </div>
          <p className="text-sm font-semibold text-white/60 mb-1">{t("executive.netLabel")}</p>
          <p
            className={`text-2xl md:text-3xl font-black tabular-nums ${
              net >= 0 ? "text-emerald-300" : "text-amber-300"
            }`}
          >
            {fmt(net)}
          </p>
          <p className="mt-4 flex items-center gap-2 text-sm text-white/55">
            <Users size={16} className="opacity-70" />
            <span>
              {t("executive.orgsActive", {
                count: totals.orgCount.toLocaleString(intlTag),
              })}
            </span>
          </p>
        </article>
      </section>

      <ExecutiveReportCharts data={flowSeries} year={year} />

      <section className="grid grid-cols-1 gap-8 xl:grid-cols-2">
        <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 md:p-10 shadow-2xl shadow-slate-200/50">
          <h2 className="text-xl md:text-2xl font-black italic text-slate-900 tracking-tight mb-2">
            {t("executive.userActivity")}
          </h2>
          <p className="text-sm text-slate-500 font-medium mb-8">{t("executive.userActivitySub")}</p>
          {recentUsers.length === 0 ? (
            <p className="text-slate-400 text-sm font-medium py-8 text-center">{t("executive.noLogins")}</p>
          ) : (
            <ul className="space-y-3 max-h-[420px] overflow-y-auto pe-1">
              {recentUsers.map((u) => (
                <li
                  key={u.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 px-5 py-4"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">
                      {u.name || u.email || t("executive.userFallback")}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{u.email}</p>
                    {u.organization?.name ? (
                      <p className="text-xs text-slate-400 mt-0.5">{u.organization.name}</p>
                    ) : null}
                  </div>
                  <div className="text-end shrink-0">
                    <p className="text-xs font-bold text-slate-400 uppercase">{t("executive.lastLoginLabel")}</p>
                    <p className="text-sm font-black text-slate-700 tabular-nums">
                      {u.lastLoginAt
                        ? new Intl.DateTimeFormat(intlTag, {
                            dateStyle: "short",
                            timeStyle: "short",
                          }).format(u.lastLoginAt)
                        : "—"}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 md:p-10 shadow-2xl shadow-slate-200/50">
          <h2 className="text-xl md:text-2xl font-black italic text-slate-900 tracking-tight mb-2">
            {t("executive.priceAlerts")}
          </h2>
          <p className="text-sm text-slate-500 font-medium mb-8">{t("executive.priceAlertsSub")}</p>
          {priceSpikes.length === 0 ? (
            <p className="text-slate-400 text-sm font-medium py-8 text-center">{t("executive.noSpikes")}</p>
          ) : (
            <ol className="space-y-4">
              {priceSpikes.map((s, i) => (
                <li
                  key={`${s.normalizedKey}-${s.organizationName}-${i}`}
                  className="rounded-2xl border border-amber-100 bg-gradient-to-l from-amber-50/80 to-white p-5 ring-1 ring-amber-50"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white text-sm font-black">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 leading-snug">{s.description}</p>
                      <p className="text-xs text-slate-500 mt-1 font-medium">{s.organizationName}</p>
                    </div>
                    <span className="text-lg font-black text-amber-700 tabular-nums shrink-0">
                      +{s.changePercent.toFixed(1)}%
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-slate-500 font-medium tabular-nums">
                    {fmt(s.previousPrice)} → {fmt(s.latestPrice)}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>
    </div>
  );
}
