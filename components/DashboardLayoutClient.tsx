"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  Shield,
  CreditCard,
  Menu,
  X,
  Sparkles,
  Briefcase,
  MapPinned,
} from "lucide-react";
import DashboardBottomDock from "@/components/DashboardBottomDock";
import PostRegisterWelcomeSheet from "@/components/PostRegisterWelcomeSheet";
import DashboardSidebarUserCard from "@/components/DashboardSidebarUserCard";
import { useI18n } from "@/components/I18nProvider";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import {
  canAccessIntelligenceDashboard,
} from "@/lib/intelligence-access";
import { hasMeckanoAccess } from "@/lib/meckano-access";
import { isAdmin } from "@/lib/is-admin";

/** רדיוס 16px — שפת „השדרה” */
function routeActive(pathname: string, href: string): boolean {
  const p = (pathname.replace(/\/$/, "") || "/") as string;
  const h = (href.replace(/\/$/, "") || "/") as string;
  if (h === "/dashboard") return p === "/dashboard";
  /** נתיב הורה ללא התאמת ילדים (למשל /admin לעומת /admin/mission) */
  if (h === "/dashboard/admin") return p === "/dashboard/admin";
  return p === h || p.startsWith(`${h}/`);
}

function navItemClass(pathname: string, href: string, extra?: string) {
  const active = routeActive(pathname, href);
  const base =
    "flex w-full min-w-0 items-center gap-3 rounded-2xl border p-3 text-start transition-all duration-300";
  if (active) {
    return `${base} border-amber-300/90 bg-gradient-to-l from-amber-50 via-white to-slate-50 text-slate-900 shadow-md shadow-amber-200/30 ring-1 ring-amber-200/70 ${extra ?? ""}`;
  }
  return `${base} border-transparent text-slate-600 hover:border-slate-200/90 hover:bg-white hover:text-slate-900 hover:shadow-md hover:shadow-slate-200/40 ${extra ?? ""}`;
}

type Props = {
  children: ReactNode;
  orgId: string;
  userRole: string;
  /** מספר ימים שנותרו בניסיון FREE — null אם אין באנר */
  trialBannerDaysLeft: number | null;
};

export default function DashboardLayoutClient({
  children,
  orgId,
  userRole,
  trialBannerDaysLeft,
}: Props) {
  const { t, dir } = useI18n();
  const pathname = usePathname() ?? "";
  const { data: sessionData, status: sessionStatus } = useSession();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  /** ניווט רגיש (אדמין / אקזקוטיב / מקנ״ו) — רק אחרי אימות סשן בצד הלקוח, לפי אימייל מה־session בלבד */
  const navReady = sessionStatus === "authenticated";
  const liveEmail = navReady ? (sessionData?.user?.email ?? "").trim() : "";
  const isSpecialClient = navReady && hasMeckanoAccess(liveEmail);
  const showMeckanoLink = isSpecialClient;
  const meckanoOperatorMinimalNav = isSpecialClient;
  const showAdminLink = navReady && !isSpecialClient && isAdmin(liveEmail);

  const drawerClosedTransform =
    dir === "rtl" ? "translate-x-full pointer-events-none" : "-translate-x-full pointer-events-none";
  const titleMap: Record<string, string> = {
    "/dashboard": "לוח בקרה",
    "/dashboard/crm": "ניהול לקוחות",
    "/dashboard/erp": "ניהול ותפעול",
    "/dashboard/ai": "לוח סריקה",
    "/dashboard/intelligence": "Intelligence",
    "/dashboard/meckano": "Mekano",
    "/dashboard/billing": "מנויים ותשלומים",
    "/dashboard/settings": "הגדרות",
    "/dashboard/admin": "MASTER ADMIN",
  };
  const pageTitle = titleMap[pathname] ?? "BSD-YBM";

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
      <Link href="/dashboard" className={navItemClass(pathname, "/dashboard")} onClick={onNavigate}>
        <LayoutDashboard size={20} className="text-[var(--primary-color,#3b82f6)]" />{" "}
        <span className="font-medium">{t("dashboard.main")}</span>
      </Link>
      <Link href="/dashboard/crm" className={navItemClass(pathname, "/dashboard/crm")} onClick={onNavigate}>
        <Users size={20} className="text-slate-500" /> <span>{t("dashboard.crm")}</span>
      </Link>
      <Link href="/dashboard/erp" className={navItemClass(pathname, "/dashboard/erp")} onClick={onNavigate}>
        <FileText size={20} className="text-slate-500" /> <span>{t("dashboard.erp")}</span>
      </Link>
      {!meckanoOperatorMinimalNav ? (
        <Link
          href="/dashboard/ai"
          className={navItemClass(pathname, "/dashboard/ai", "ring-1 ring-amber-100/80")}
          onClick={onNavigate}
        >
          <Sparkles size={20} className="text-amber-600" />{" "}
          <span className="font-semibold">{t("dashboard.aiHub")}</span>
        </Link>
      ) : null}
      {!meckanoOperatorMinimalNav && canAccessIntelligenceDashboard(userRole) ? (
        <Link
          href="/dashboard/intelligence"
          className={navItemClass(pathname, "/dashboard/intelligence")}
          onClick={onNavigate}
        >
          <Briefcase size={20} className="text-[var(--primary-color,#3b82f6)]" />{" "}
          <span>{t("dashboard.intelligence")}</span>
        </Link>
      ) : null}
      {showMeckanoLink ? (
        <Link href="/dashboard/meckano" className={navItemClass(pathname, "/dashboard/meckano")} onClick={onNavigate}>
          <MapPinned size={20} className="text-rose-500" />{" "}
          <span>{t("dashboard.meckano")}</span>
        </Link>
      ) : null}
      <Link href="/dashboard/billing" className={navItemClass(pathname, "/dashboard/billing")} onClick={onNavigate}>
        <CreditCard size={20} className="text-slate-500" /> <span>{t("dashboard.billing")}</span>
      </Link>
      <Link href="/dashboard/settings" className={navItemClass(pathname, "/dashboard/settings")} onClick={onNavigate}>
        <Settings size={20} className="text-slate-500" /> <span>{t("dashboard.settings")}</span>
      </Link>
      {showAdminLink && (
        <>
          <Link
            href="/dashboard/admin"
            className={navItemClass(pathname, "/dashboard/admin", "border-amber-200/80 bg-amber-50/60")}
            onClick={onNavigate}
          >
            <Shield size={20} className="text-amber-600" />{" "}
            <span className="font-medium text-amber-950">{t("dashboard.admin")}</span>
          </Link>
        </>
      )}
    </>
  );

  return (
    <div
      className="flex min-h-app max-w-[100vw] overflow-x-hidden bg-gradient-to-b from-white via-slate-50/95 to-slate-100/80 text-slate-900"
      dir={dir}
    >
      {/* תפריט צד — שולחן עבודה בלבד */}
      <aside className="hidden w-72 shrink-0 flex-col justify-between border-l border-slate-200/90 bg-white/95 p-6 shadow-xl shadow-slate-200/40 backdrop-blur-md md:fixed md:inset-y-0 md:right-0 md:flex">
        <div>
          <Link
            href="/"
            className="mb-10 block text-2xl font-black italic tracking-tighter hover:opacity-90"
            style={{ color: "var(--primary-color, #b8860b)" }}
          >
            BSD-YBM<span className="text-slate-900">.</span>
          </Link>
          <nav className="flex w-full min-w-0 flex-col gap-1">
            <NavLinks />
          </nav>
        </div>
        <div className="space-y-3 border-t border-slate-100 pt-4">
          <LanguageSwitcher showLabel className="px-1" />
          <DashboardSidebarUserCard />
        </div>
      </aside>

      {/* מגירת ניווט — מובייל */}
      {mobileNavOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-[180] bg-slate-200/55 backdrop-blur-[2px] md:hidden"
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
              className="text-xl font-black italic tracking-tighter text-slate-900 hover:opacity-90"
              style={{ color: "var(--primary-color, #b8860b)" }}
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
          <DashboardSidebarUserCard />
        </div>
      </aside>

      <main
        className="relative flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden p-4 pb-[max(6.5rem,env(safe-area-inset-bottom,0px))] sm:p-6 sm:pb-[max(6.5rem,env(safe-area-inset-bottom,0px))] md:mr-72 md:p-8 md:pb-10"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {/* סרגל עליון מובייל — תפריט נסתר עד לפתיחה */}
        <div className="sticky top-0 z-[120] -mx-4 -mt-4 mb-2 flex items-center justify-between gap-3 border-b border-slate-200/90 bg-white/95 px-4 py-3 backdrop-blur-sm sm:-mx-6 sm:px-6 md:hidden">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-800 shadow-sm"
            onClick={() => setMobileNavOpen(true)}
            aria-expanded={mobileNavOpen}
            aria-label={t("nav.open")}
          >
            <Menu size={20} className="text-[var(--primary-color,#b8860b)]" />
            {t("nav.menu")}
          </button>
          <Link
            href="/"
            className="max-w-[50%] truncate text-lg font-black italic text-slate-900"
            style={{ color: "var(--primary-color, #b8860b)" }}
          >
            BSD-YBM<span className="text-slate-900">.</span>
          </Link>
        </div>

        <header className="sticky top-0 z-[110] hidden md:flex items-center justify-between rounded-2xl border border-slate-200/90 bg-white/90 px-5 py-4 shadow-sm shadow-slate-200/40 backdrop-blur-md">
          <h1 className="text-lg font-black tracking-tight text-slate-900">{pageTitle}</h1>
        </header>

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
        <p className="hidden text-sm text-slate-500 md:block">{t("dashboard.smartArchiveHint")}</p>
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="min-h-0 min-w-0 max-w-full flex-1 overflow-x-hidden"
          >
            {children}
          </motion.div>
        </AnimatePresence>
        <DashboardBottomDock orgId={orgId} />
        <PostRegisterWelcomeSheet />
      </main>
    </div>
  );
}
