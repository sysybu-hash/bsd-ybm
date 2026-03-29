"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  LogOut,
  Shield,
  CreditCard,
  Menu,
  X,
  Sparkles,
  Briefcase,
  BarChart3,
  MapPinned,
} from "lucide-react";
import DashboardGlobalSearch from "@/components/DashboardGlobalSearch";
import DashboardBottomDock from "@/components/DashboardBottomDock";
import PostRegisterWelcomeSheet from "@/components/PostRegisterWelcomeSheet";
import DashboardNotificationBell from "@/components/DashboardNotificationBell";
import UserBadge from "@/components/UserBadge";
import { useI18n } from "@/components/I18nProvider";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import {
  canAccessExecutiveSuite,
  canAccessIntelligenceDashboard,
} from "@/lib/intelligence-access";
import { hasMeckanoAccess } from "@/lib/meckano-access";
const navClass =
  "flex w-full min-w-0 items-center gap-3 p-3 rounded-xl transition-all text-slate-600 hover:bg-slate-100 hover:text-slate-950 text-start";

type Props = {
  children: ReactNode;
  orgId: string;
  userRole: string;
  /** אימייל מהשרת (גיבוי לפני הידרציית Session בצד לקוח) */
  userEmail: string | null;
  /** מספר ימים שנותרו בניסיון FREE — null אם אין באנר */
  trialBannerDaysLeft: number | null;
  /** מחושב בשרת — ללא מסתמכות על SUPER_ADMIN בלבד בצד לקוח */
  showAdminNav: boolean;
  userImage: string | null;
};

export default function DashboardLayoutClient({
  children,
  orgId,
  userRole,
  userEmail,
  trialBannerDaysLeft,
  showAdminNav,
  userImage,
}: Props) {
  const { t, dir } = useI18n();
  const { data: sessionData } = useSession();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const effectiveEmail = (sessionData?.user?.email ?? userEmail ?? "").trim();
  const isSpecialClient = hasMeckanoAccess(effectiveEmail);
  const showMeckanoLink = isSpecialClient;
  const meckanoOperatorMinimalNav = isSpecialClient;
  const showAdminLink = showAdminNav && !isSpecialClient;
  const showExecutiveDashboard =
    !meckanoOperatorMinimalNav && canAccessExecutiveSuite(userRole, effectiveEmail);

  const drawerClosedTransform =
    dir === "rtl" ? "translate-x-full pointer-events-none" : "-translate-x-full pointer-events-none";

  useEffect(() => {
    if (!mobileNavOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen]);

  useEffect(() => {
    const onResize = () => {
      if (window.matchMedia("(min-width: 768px)").matches) setMobileNavOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      <Link href="/dashboard" className={navClass} onClick={onNavigate}>
        <LayoutDashboard size={20} className="text-[var(--primary-color,#3b82f6)]" />{" "}
        <span className="font-medium">{t("dashboard.main")}</span>
      </Link>
      <Link href="/dashboard/crm" className={navClass} onClick={onNavigate}>
        <Users size={20} /> <span>{t("dashboard.crm")}</span>
      </Link>
      <Link href="/dashboard/erp" className={navClass} onClick={onNavigate}>
        <FileText size={20} /> <span>{t("dashboard.erp")}</span>
      </Link>
      {!meckanoOperatorMinimalNav ? (
        <Link
          href="/dashboard/ai"
          className={`${navClass} ring-1 ring-blue-100 bg-blue-50/40 hover:bg-blue-50`}
          onClick={onNavigate}
        >
          <Sparkles size={20} className="text-[var(--primary-color,#3b82f6)]" />{" "}
          <span className="font-semibold text-slate-900">{t("dashboard.aiHub")}</span>
        </Link>
      ) : null}
      {!meckanoOperatorMinimalNav && canAccessIntelligenceDashboard(userRole) ? (
        <Link href="/dashboard/intelligence" className={navClass} onClick={onNavigate}>
          <Briefcase size={20} className="text-[var(--primary-color,#3b82f6)]" />{" "}
          <span>{t("dashboard.intelligence")}</span>
        </Link>
      ) : null}
      {!meckanoOperatorMinimalNav && showExecutiveDashboard ? (
        <Link href="/dashboard/executive" className={navClass} onClick={onNavigate}>
          <BarChart3 size={20} className="text-emerald-600" />{" "}
          <span>{t("dashboard.executive")}</span>
        </Link>
      ) : null}
      {showMeckanoLink ? (
        <Link href="/dashboard/meckano" className={navClass} onClick={onNavigate}>
          <MapPinned size={20} className="text-rose-500" />{" "}
          <span>{t("dashboard.meckano")}</span>
        </Link>
      ) : null}
      <Link href="/dashboard/billing" className={navClass} onClick={onNavigate}>
        <CreditCard size={20} /> <span>{t("dashboard.billing")}</span>
      </Link>
      <Link href="/dashboard/settings" className={navClass} onClick={onNavigate}>
        <Settings size={20} /> <span>{t("dashboard.settings")}</span>
      </Link>
      {showAdminLink && (
        <>
          <Link
            href="/dashboard/admin"
            className={`${navClass} border border-amber-200 bg-amber-50/60 hover:bg-amber-50`}
            onClick={onNavigate}
          >
            <Shield size={20} className="text-amber-600" />{" "}
            <span className="text-amber-900 font-medium">{t("dashboard.admin")}</span>
          </Link>
          <Link
            href="/dashboard/admin/mission"
            className={`${navClass} border border-slate-200 bg-slate-50/80 hover:bg-slate-100`}
            onClick={onNavigate}
          >
            <Sparkles size={20} className="text-slate-700" />{" "}
            <span className="text-slate-800 font-medium">{t("dashboard.mission")}</span>
          </Link>
        </>
      )}
    </>
  );

  return (
    <div
      className="flex min-h-app max-w-[100vw] bg-slate-50 text-slate-900 overflow-x-hidden"
      dir={dir}
    >
      {/* תפריט צד — שולחן עבודה בלבד */}
      <aside className="hidden md:flex w-64 shrink-0 border-l border-slate-200 bg-white p-6 flex-col justify-between shadow-sm">
        <div>
          <Link
            href="/"
            className="block text-2xl font-black italic tracking-tighter mb-10 hover:opacity-90"
            style={{ color: "var(--primary-color, #3b82f6)" }}
          >
            BSD-YBM<span className="text-slate-900">.</span>
          </Link>
          <nav className="flex w-full min-w-0 flex-col gap-1">
            <NavLinks />
          </nav>
        </div>
        <div className="space-y-3 border-t border-slate-100 pt-4">
          <LanguageSwitcher showLabel className="px-1" />
          <Link
            href="/api/auth/signout"
            className="flex items-center gap-3 p-3 text-slate-500 hover:text-red-600 rounded-xl transition-colors"
          >
            <LogOut size={20} /> <span>{t("dashboard.logout")}</span>
          </Link>
        </div>
      </aside>

      {/* מגירת ניווט — מובייל */}
      {mobileNavOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-[180] bg-slate-900/40 backdrop-blur-[2px] md:hidden"
          aria-label={t("nav.close")}
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 start-0 z-[190] flex w-[min(20rem,88vw)] flex-col justify-between border-e border-slate-200 bg-white p-5 shadow-2xl transition-transform duration-200 ease-out md:hidden ${
          mobileNavOpen ? "translate-x-0" : drawerClosedTransform
        }`}
        style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
        aria-hidden={!mobileNavOpen}
      >
        <div>
          <div className="mb-8 flex items-center justify-between gap-2">
            <Link
              href="/"
              className="text-xl font-black italic tracking-tighter hover:opacity-90"
              style={{ color: "var(--primary-color, #3b82f6)" }}
              onClick={() => setMobileNavOpen(false)}
            >
              BSD-YBM<span className="text-slate-900">.</span>
            </Link>
            <button
              type="button"
              className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
              onClick={() => setMobileNavOpen(false)}
              aria-label={t("nav.close")}
            >
              <X size={22} />
            </button>
          </div>
          <nav className="flex w-full min-w-0 flex-col gap-1">
            <NavLinks onNavigate={() => setMobileNavOpen(false)} />
          </nav>
        </div>
        <div className="space-y-3">
          <LanguageSwitcher showLabel className="px-1" />
          <Link
            href="/api/auth/signout"
            className="flex items-center gap-3 p-3 text-slate-500 hover:text-red-600 rounded-xl transition-colors"
            onClick={() => setMobileNavOpen(false)}
          >
            <LogOut size={20} /> <span>{t("dashboard.logout")}</span>
          </Link>
        </div>
      </aside>

      <main
        className="relative flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden p-4 pb-[max(6.5rem,env(safe-area-inset-bottom,0px))] sm:p-6 sm:pb-[max(6.5rem,env(safe-area-inset-bottom,0px))] md:p-8 md:pb-10"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {/* סרגל עליון מובייל — תפריט נסתר עד לפתיחה */}
        <div className="sticky top-0 z-[120] -mx-4 -mt-4 mb-2 flex items-center justify-between gap-3 border-b border-slate-200/80 bg-slate-50/95 px-4 py-3 backdrop-blur-sm sm:-mx-6 sm:px-6 md:hidden">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-800 shadow-sm"
            onClick={() => setMobileNavOpen(true)}
            aria-expanded={mobileNavOpen}
            aria-label={t("nav.open")}
          >
            <Menu size={20} className="text-[var(--primary-color,#3b82f6)]" />
            {t("nav.menu")}
          </button>
          <Link
            href="/"
            className="text-lg font-black italic truncate max-w-[50%]"
            style={{ color: "var(--primary-color, #3b82f6)" }}
          >
            BSD-YBM<span className="text-slate-900">.</span>
          </Link>
        </div>

        {trialBannerDaysLeft !== null ? (
          <div
            className="rounded-2xl border border-amber-200/90 bg-gradient-to-r from-amber-50 via-orange-50/80 to-amber-50 px-4 py-3 text-center shadow-sm sm:text-start"
            role="status"
          >
            <p className="text-sm font-bold text-amber-950">
              {trialBannerDaysLeft === 1
                ? t("layout.trialBannerOne")
                : t("layout.trialBannerMany", { days: String(trialBannerDaysLeft) })}{" "}
              <Link
                href="/dashboard/billing"
                className="font-black text-blue-700 underline decoration-2 underline-offset-2 hover:text-blue-900"
              >
                {t("layout.trialUpgrade")}
              </Link>{" "}
              {t("layout.trialSuffix")}
            </p>
          </div>
        ) : null}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
          <p className="text-sm text-slate-500 hidden md:block">{t("dashboard.smartArchiveHint")}</p>
          <div className="flex flex-wrap items-center gap-2 md:gap-3 justify-end w-full md:w-auto">
            <DashboardNotificationBell />
            <DashboardGlobalSearch />
            <UserBadge fallbackEmail={userEmail} fallbackImage={userImage} />
          </div>
        </div>
        <div className="min-h-0 min-w-0 max-w-full flex-1 overflow-x-hidden">{children}</div>
        <DashboardBottomDock orgId={orgId} />
        <PostRegisterWelcomeSheet />
      </main>
    </div>
  );
}
