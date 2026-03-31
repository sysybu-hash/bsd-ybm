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
  ChevronLeft,
} from "lucide-react";
import DashboardBottomDock from "@/components/DashboardBottomDock";
import PostRegisterWelcomeSheet from "@/components/PostRegisterWelcomeSheet";
import DashboardSidebarUserCard from "@/components/DashboardSidebarUserCard";
import { useI18n } from "@/components/I18nProvider";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { canAccessIntelligenceDashboard } from "@/lib/intelligence-access";
import { isAdmin } from "@/lib/is-admin";

function routeActive(pathname: string, href: string): boolean {
  const p = (pathname.replace(/\/$/, "") || "/") as string;
  const h = (href.replace(/\/$/, "") || "/") as string;
  if (h === "/dashboard") return p === "/dashboard";
  if (h === "/dashboard/admin") return p === "/dashboard/admin";
  return p === h || p.startsWith(`${h}/`);
}

type NavItemProps = {
  href: string;
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  badge?: ReactNode;
  className?: string;
};

function NavItem({ href, icon, label, onClick, badge, className = "" }: NavItemProps) {
  const pathname = usePathname() ?? "";
  const active = routeActive(pathname, href);

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`group flex w-full min-w-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
        active
          ? "bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200/70"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      } ${className}`}
    >
      <span
        className={`flex shrink-0 items-center justify-center rounded-lg p-1.5 transition-colors ${
          active ? "bg-blue-100 text-blue-700" : "text-slate-400 group-hover:text-slate-700"
        }`}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {badge}
      {active && <ChevronLeft size={14} className="shrink-0 text-blue-400" />}
    </Link>
  );
}

type Props = {
  children: ReactNode;
  orgId: string;
  userRole: string;
  trialBannerDaysLeft: number | null;
  serverUser: { email: string; name: string | null; image: string | null };
};

export default function DashboardLayoutClient({
  children,
  orgId,
  userRole,
  trialBannerDaysLeft,
  serverUser,
}: Props) {
  const { t, dir } = useI18n();
  const pathname = usePathname() ?? "";
  const { data: sessionData, status: sessionStatus } = useSession();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const serverEmail = serverUser.email.trim();
  const clientEmail = (sessionData?.user?.email ?? "").trim();
  const navReady =
    sessionStatus === "authenticated" || serverEmail.length > 0 || clientEmail.length > 0;
  const gateEmail = serverEmail;
  const showAdminLink = navReady && gateEmail.length > 0 && isAdmin(gateEmail);

  const drawerClosedTransform =
    dir === "rtl" ? "translate-x-full pointer-events-none" : "-translate-x-full pointer-events-none";

  const titleMap: Record<string, string> = {
    "/dashboard": t("dashboard.main"),
    "/dashboard/crm": t("dashboard.crm"),
    "/dashboard/erp": t("dashboard.erp"),
    "/dashboard/ai": t("dashboard.aiHub"),
    "/dashboard/intelligence": t("dashboard.intelligence"),
    "/dashboard/executive": t("dashboard.intelligence"),
    "/dashboard/billing": t("dashboard.billing"),
    "/dashboard/settings": t("dashboard.settings"),
    "/dashboard/admin": "Master Admin",
  };
  const pageTitle = titleMap[pathname] ?? "BSD-YBM";

  useEffect(() => {
    if (!mobileNavOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [mobileNavOpen]);

  useEffect(() => {
    const onResize = () => {
      if (window.matchMedia("(min-width: 768px)").matches) setMobileNavOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="flex w-full min-w-0 flex-col gap-0.5">
      <NavItem
        href="/dashboard"
        icon={<LayoutDashboard size={17} />}
        label={t("dashboard.main")}
        onClick={onNavigate}
      />
      <NavItem
        href="/dashboard/crm"
        icon={<Users size={17} />}
        label={t("dashboard.crm")}
        onClick={onNavigate}
      />
      <NavItem
        href="/dashboard/erp"
        icon={<FileText size={17} />}
        label={t("dashboard.erp")}
        onClick={onNavigate}
      />
      <NavItem
        href="/dashboard/ai"
        icon={<Sparkles size={17} />}
        label={t("dashboard.aiHub")}
        onClick={onNavigate}
      />
      {canAccessIntelligenceDashboard(userRole) ? (
        <NavItem
          href="/dashboard/intelligence"
          icon={<Briefcase size={17} />}
          label={t("dashboard.intelligence")}
          onClick={onNavigate}
        />
      ) : null}

      {/* ─── קו הפרדה ─── */}
      <div className="my-2 border-t border-slate-100" />

      <NavItem
        href="/dashboard/billing"
        icon={<CreditCard size={17} />}
        label={t("dashboard.billing")}
        onClick={onNavigate}
      />
      <NavItem
        href="/dashboard/settings"
        icon={<Settings size={17} />}
        label={t("dashboard.settings")}
        onClick={onNavigate}
      />
      {showAdminLink && (
        <NavItem
          href="/dashboard/admin"
          icon={<Shield size={17} />}
          label={t("dashboard.admin")}
          onClick={onNavigate}
          className="mt-1 border border-orange-100 bg-orange-50/60 text-orange-900 hover:bg-orange-50"
        />
      )}
    </nav>
  );

  return (
    <div
      className="flex min-h-app max-w-[100vw] overflow-x-hidden bg-slate-50 text-slate-900"
      dir={dir}
    >
      {/* ═══ SIDEBAR — Desktop ═══ */}
      <aside className="hidden w-64 shrink-0 flex-col justify-between border-e border-slate-200 bg-white shadow-sm md:fixed md:inset-y-0 md:start-0 md:flex">
        {/* לוגו */}
        <div className="flex flex-col gap-6 p-5">
          <Link
            href="/"
            className="flex items-center gap-1 text-xl font-black italic tracking-tighter hover:opacity-85"
          >
            <span style={{ color: "var(--primary-color, #2563eb)" }}>BSD-</span>
            <span className="text-slate-900">YBM</span>
          </Link>

          <NavLinks />
        </div>

        {/* Bottom */}
        <div className="space-y-3 border-t border-slate-100 p-5">
          <LanguageSwitcher showLabel className="px-1" />
          <DashboardSidebarUserCard serverUser={serverUser} />
        </div>
      </aside>

      {/* ═══ DRAWER BACKDROP — Mobile ═══ */}
      {mobileNavOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-[180] bg-slate-900/30 backdrop-blur-[2px] md:hidden"
          aria-label={t("nav.close")}
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}

      {/* ═══ DRAWER — Mobile ═══ */}
      <aside
        className={`fixed inset-y-0 start-0 z-[190] flex w-[min(20rem,88vw)] flex-col justify-between border-e border-slate-200 bg-white p-5 shadow-2xl transition-transform duration-200 ease-out md:hidden ${
          mobileNavOpen ? "translate-x-0" : drawerClosedTransform
        }`}
        style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
        aria-hidden={!mobileNavOpen}
      >
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between gap-2">
            <Link
              href="/"
              className="flex items-center gap-1 text-lg font-black italic tracking-tighter"
              onClick={() => setMobileNavOpen(false)}
            >
              <span style={{ color: "var(--primary-color, #2563eb)" }}>BSD-</span>
              <span className="text-slate-900">YBM</span>
            </Link>
            <button
              type="button"
              className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
              onClick={() => setMobileNavOpen(false)}
              aria-label={t("nav.close")}
            >
              <X size={20} />
            </button>
          </div>
          <NavLinks onNavigate={() => setMobileNavOpen(false)} />
        </div>
        <div className="space-y-3">
          <LanguageSwitcher showLabel className="px-1" />
          <DashboardSidebarUserCard serverUser={serverUser} />
        </div>
      </aside>

      {/* ═══ MAIN CONTENT ═══ */}
      <main
        className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden md:ms-64"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {/* Mobile top bar */}
        <div className="sticky top-0 z-[120] flex items-center justify-between gap-3 border-b border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur-sm md:hidden">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-800 shadow-sm"
            onClick={() => setMobileNavOpen(true)}
            aria-expanded={mobileNavOpen}
            aria-label={t("nav.open")}
          >
            <Menu size={18} style={{ color: "var(--primary-color, #2563eb)" }} />
            {t("nav.menu")}
          </button>
          <Link
            href="/"
            className="flex items-center gap-0.5 text-base font-black italic"
          >
            <span style={{ color: "var(--primary-color, #2563eb)" }}>BSD-</span>
            <span className="text-slate-900">YBM</span>
          </Link>
        </div>

        {/* Desktop top header */}
        <header className="sticky top-0 z-[110] hidden items-center justify-between border-b border-slate-200/80 bg-white/95 px-6 py-4 backdrop-blur-md md:flex">
          <h1 className="text-base font-black tracking-tight text-slate-900">{pageTitle}</h1>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 transition hover:text-slate-900"
            >
              לאתר
            </Link>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pb-[max(6.5rem,env(safe-area-inset-bottom,0px))] sm:p-6 sm:pb-[max(6.5rem,env(safe-area-inset-bottom,0px))] md:p-8 md:pb-12">
          {/* Trial banner */}
          {trialBannerDaysLeft !== null ? (
            <div
              className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 shadow-sm"
              role="status"
            >
              <p className="text-sm font-bold text-blue-900">
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

          <p className="hidden text-xs font-medium text-slate-400 md:block">{t("dashboard.smartArchiveHint")}</p>

          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="min-h-0 min-w-0 max-w-full flex-1 overflow-x-hidden"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>

        <DashboardBottomDock orgId={orgId} />
        <PostRegisterWelcomeSheet />
      </main>
    </div>
  );
}
