import Link from "next/link";
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

type Props = {
  /** כאשר מוטמע בדף Intelligence — ללא קישור חזרה כפול */
  embedded?: boolean;
  userEmail: string | null | undefined;
};

export default async function ExecutiveDashboardSection({ embedded, userEmail }: Props) {
  const showSuperManage = isExecutiveSubscriptionSuperAdmin(userEmail);

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
    <div className="space-y-10 pb-8" dir={dir}>
      <header className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-end md:justify-between">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
            {t("executive.kicker")}
          </p>
          <h2 className="text-2xl font-black italic tracking-tight text-gray-900 md:text-3xl">
            {t("executive.title")}
          </h2>
          <p className="mt-2 max-w-xl font-medium text-gray-400">{t("executive.subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-3 self-start">
          {showSuperManage ? (
            <Link
              href="/dashboard/billing?tab=control"
              className="inline-flex items-center gap-2 rounded-2xl border border-indigo-500/40/80 bg-gradient-to-br from-indigo-50 to-gray-50 px-5 py-3 text-sm font-bold text-white shadow-sm ring-1 ring-indigo-200/60 transition-colors hover:border-indigo-400"
            >
              <ArrowRight size={18} />
              מרכז שליטה במנויים
            </Link>
          ) : null}
          {!embedded ? (
            <Link
              href="/dashboard/intelligence"
              className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-600 shadow-sm transition-colors hover:border-indigo-500/30 hover:text-indigo-300"
            >
              <ArrowRight size={18} />
              {t("executive.linkIntelligence")}
            </Link>
          ) : null}
        </div>
      </header>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <article className="card-avenue bg-gradient-to-br from-white via-blue-50/30 to-white p-8 shadow-sm ring-1 ring-gray-50">
          <div className="mb-6 flex items-center justify-between gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/25">
              <TrendingUp size={22} strokeWidth={2.5} />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400/80">
              {t("executive.incomeBadge")}
            </span>
          </div>
          <p className="mb-1 text-sm font-semibold text-gray-400">{t("executive.incomeMeta")}</p>
          <p className="text-2xl font-black tabular-nums text-gray-900 md:text-3xl">
            {fmt(totals.totalIncome)}
          </p>
          <p className="mt-4 text-xs leading-relaxed text-gray-400">{t("executive.incomeHint")}</p>
        </article>

        <article className="card-avenue bg-gradient-to-br from-white via-rose-50/25 to-white p-8 shadow-sm ring-1 ring-gray-50">
          <div className="mb-6 flex items-center justify-between gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500 text-white shadow-lg shadow-rose-500/25">
              <TrendingDown size={22} strokeWidth={2.5} />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600/80">
              {t("executive.expenseBadge")}
            </span>
          </div>
          <p className="mb-1 text-sm font-semibold text-gray-400">{t("executive.expenseMeta")}</p>
          <p className="text-2xl font-black tabular-nums text-gray-900 md:text-3xl">
            {fmt(totals.totalExpenses)}
          </p>
          <p className="mt-4 text-xs leading-relaxed text-gray-400">{t("executive.expenseHint")}</p>
        </article>

        <article className="card-avenue bg-gradient-to-br from-white via-emerald-50/35 to-white p-8 shadow-sm ring-1 ring-gray-50">
          <div className="mb-6 flex items-center justify-between gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/25">
              <Building2 size={22} strokeWidth={2} />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400/90">
              {t("executive.netBadge")}
            </span>
          </div>
          <p className="mb-1 text-sm font-semibold text-gray-400">{t("executive.netLabel")}</p>
          <p
            className={`text-2xl font-black tabular-nums md:text-3xl ${
              net >= 0 ? "text-emerald-400" : "text-indigo-300"
            }`}
          >
            {fmt(net)}
          </p>
          <p className="mt-4 flex items-center gap-2 text-sm text-gray-400">
            <Users size={16} className="text-gray-400" />
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
        <div className="card-avenue bg-white p-8 shadow-sm md:p-10">
          <h3 className="mb-2 text-xl font-black italic tracking-tight text-gray-900 md:text-2xl">
            {t("executive.userActivity")}
          </h3>
          <p className="mb-8 text-sm font-medium text-gray-400">{t("executive.userActivitySub")}</p>
          {recentUsers.length === 0 ? (
            <p className="py-8 text-center text-sm font-medium text-gray-400">{t("executive.noLogins")}</p>
          ) : (
            <ul className="max-h-[420px] space-y-3 overflow-y-auto pe-1">
              {recentUsers.map((u) => (
                <li
                  key={u.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-gray-50/60 px-5 py-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold text-gray-900">
                      {u.name || u.email || t("executive.userFallback")}
                    </p>
                    <p className="truncate text-xs text-gray-400">{u.email}</p>
                    {u.organization?.name ? (
                      <p className="mt-0.5 text-xs text-gray-400">{u.organization.name}</p>
                    ) : null}
                  </div>
                  <div className="shrink-0 text-end">
                    <p className="text-xs font-bold uppercase text-gray-400">{t("executive.lastLoginLabel")}</p>
                    <p className="text-sm font-black tabular-nums text-gray-600">
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

        <div className="card-avenue bg-white p-8 shadow-sm md:p-10">
          <h3 className="mb-2 text-xl font-black italic tracking-tight text-gray-900 md:text-2xl">
            {t("executive.priceAlerts")}
          </h3>
          <p className="mb-8 text-sm font-medium text-gray-400">{t("executive.priceAlertsSub")}</p>
          {priceSpikes.length === 0 ? (
            <p className="py-8 text-center text-sm font-medium text-gray-400">{t("executive.noSpikes")}</p>
          ) : (
            <ol className="space-y-4">
              {priceSpikes.map((s, i) => (
                <li
                  key={`${s.normalizedKey}-${s.organizationName}-${i}`}
                  className="rounded-2xl border border-indigo-500/20 bg-gradient-to-l from-indigo-50/80 to-white p-5 ring-1 ring-indigo-50"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-sm font-black text-white">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold leading-snug text-gray-900">{s.description}</p>
                      <p className="mt-1 text-xs font-medium text-gray-400">{s.organizationName}</p>
                    </div>
                    <span className="shrink-0 text-lg font-black tabular-nums text-indigo-300">
                      +{s.changePercent.toFixed(1)}%
                    </span>
                  </div>
                  <p className="mt-3 text-xs font-medium tabular-nums text-gray-400">
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
