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
  ChevronRight,
  ChevronLeft,
  Home,
  Bell,
  Search,
  Zap,
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
  variant?: "default" | "danger" | "warning";
};

function NavItem({ href, icon, label, onClick, badge, className = "", variant = "default" }: NavItemProps) {
  const pathname = usePathname() ?? "";
  const active = routeActive(pathname, href);
  const { dir } = useI18n();

  const variantStyles = {
    default: active
      ? "bg-blue-500/15 text-white"
      : "text-slate-400 hover:bg-white/6 hover:text-slate-200",
    danger: "text-rose-400 hover:bg-rose-500/10 hover:text-rose-300",
    warning: active
      ? "bg-orange-500/15 text-orange-300"
      : "text-orange-400 hover:bg-orange-500/10 hover:text-orange-300",
  };

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`relative group flex w-full min-w-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-150 ${variantStyles[variant]} ${className}`}
    >
      {/* Active indicator bar */}
      {active && variant === "default" && (
        <span
          className="absolute inset-y-1.5 start-0 w-0.5 rounded-e-full bg-blue-400"
          aria-hidden
        />
      )}

      {/* Icon */}
      <span className={`flex shrink-0 items-center justify-center transition-transform duration-150 ${
        active ? "text-blue-400 scale-110" : "group-hover:scale-105"
      }`}>
        {icon}
      </span>

      <span className="min-w-0 flex-1 truncate">{label}</span>

      {badge}

      {active && (
        dir === "rtl"
          ? <ChevronLeft size={12} className="shrink-0 text-blue-400/70" />
          : <ChevronRight size={12} className="shrink-0 text-blue-400/70" />
      )}
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
    dir === "rtl"
      ? "translate-x-full pointer-events-none"
      : "-translate-x-full pointer-events-none";

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
    <nav className="flex w-full min-w-0 flex-col gap-0.5 thin-scrollbar overflow-y-auto">
      {/* Main section label */}
      <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-600">
        ניהול
      </p>
      <NavItem href="/dashboard"         icon={<LayoutDashboard size={16} />} label={t("dashboard.main")}        onClick={onNavigate} />
      <NavItem href="/dashboard/crm"     icon={<Users size={16} />}            label={t("dashboard.crm")}         onClick={onNavigate} />
      <NavItem href="/dashboard/erp"     icon={<FileText size={16} />}         label={t("dashboard.erp")}         onClick={onNavigate} />
      <NavItem href="/dashboard/ai"      icon={<Sparkles size={16} />}         label={t("dashboard.aiHub")}       onClick={onNavigate} />
      {canAccessIntelligenceDashboard(userRole) && (
        <NavItem href="/dashboard/intelligence" icon={<Briefcase size={16} />} label={t("dashboard.intelligence")} onClick={onNavigate} />
      )}

      {/* Divider */}
      <div className="my-3 border-t border-white/8" />

      <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-600">
        חשבון
      </p>
      <NavItem href="/dashboard/billing"  icon={<CreditCard size={16} />} label={t("dashboard.billing")}  onClick={onNavigate} />
      <NavItem href="/dashboard/settings" icon={<Settings size={16} />}   label={t("dashboard.settings")} onClick={onNavigate} />

      {showAdminLink && (
        <>
          <div className="my-3 border-t border-white/8" />
          <NavItem
            href="/dashboard/admin"
            icon={<Shield size={16} />}
            label={t("dashboard.admin")}
            onClick={onNavigate}
            variant="warning"
          />
        </>
      )}
    </nav>
  );

  return (
    <div
      className="flex min-h-app max-w-[100vw] overflow-x-hidden bg-slate-50 text-slate-900"
      dir={dir}
    >
      {/* ═══ SIDEBAR — Desktop (Dark) ═══ */}
      <aside
        className="hidden w-64 shrink-0 flex-col border-e border-white/6 md:fixed md:inset-y-0 md:start-0 md:flex"
        style={{ background: "var(--sidebar-bg)" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-5 py-5 border-b border-white/8">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white font-black text-xs shadow-lg"
            style={{ backgroundColor: "var(--primary-color)" }}
            aria-hidden
          >
            B
          </div>
          <Link
            href="/"
            className="flex items-center gap-0.5 text-lg font-black italic tracking-tight hover:opacity-80 transition-opacity"
          >
            <span style={{ color: "var(--primary-color)" }}>BSD-</span>
            <span className="text-white">YBM</span>
          </Link>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto p-4 pt-5">
          <NavLinks />
        </div>

        {/* Bottom */}
        <div
          className="border-t border-white/8 p-4 space-y-3"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        >
          <LanguageSwitcher showLabel className="text-slate-400" />
          <DashboardSidebarUserCard serverUser={serverUser} />
        </div>
      </aside>

      {/* ═══ DRAWER BACKDROP ═══ */}
      {mobileNavOpen && (
        <button
          type="button"
          className="fixed inset-0 z-[180] bg-black/50 backdrop-blur-[2px] md:hidden"
          aria-label={t("nav.close")}
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* ═══ DRAWER — Mobile ═══ */}
      <aside
        className={`fixed inset-y-0 start-0 z-[190] flex w-[min(18rem,88vw)] flex-col border-e border-white/8 p-4 shadow-2xl transition-transform duration-200 ease-out md:hidden ${
          mobileNavOpen ? "translate-x-0" : drawerClosedTransform
        }`}
        style={{
          background: "var(--sidebar-bg)",
          paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
        }}
        aria-hidden={!mobileNavOpen}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-5 pb-4 border-b border-white/8">
          <Link
            href="/"
            className="flex items-center gap-0.5 text-lg font-black italic"
            onClick={() => setMobileNavOpen(false)}
          >
            <span style={{ color: "var(--primary-color)" }}>BSD-</span>
            <span className="text-white">YBM</span>
          </Link>
          <button
            type="button"
            className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
            onClick={() => setMobileNavOpen(false)}
            aria-label={t("nav.close")}
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <NavLinks onNavigate={() => setMobileNavOpen(false)} />
        </div>

        <div className="space-y-3 pt-4 border-t border-white/8">
          <LanguageSwitcher showLabel />
          <DashboardSidebarUserCard serverUser={serverUser} />
        </div>
      </aside>

      {/* ═══ MAIN CONTENT ═══ */}
      <main
        className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden md:ms-64"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {/* ── Mobile top bar ── */}
        <div className="sticky top-0 z-[120] flex items-center justify-between gap-3 border-b border-slate-200/80 bg-white px-4 py-3 shadow-sm md:hidden">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
            onClick={() => setMobileNavOpen(true)}
            aria-expanded={mobileNavOpen}
            aria-label={t("nav.open")}
          >
            <Menu size={18} style={{ color: "var(--primary-color)" }} />
          </button>
          <Link href="/" className="flex items-center gap-0.5 text-base font-black italic">
            <span style={{ color: "var(--primary-color)" }}>BSD-</span>
            <span className="text-slate-900">YBM</span>
          </Link>
          <LanguageSwitcher />
        </div>

        {/* ── Desktop top header ── */}
        <header className="sticky top-0 z-[110] hidden items-center justify-between gap-4 border-b border-slate-200/80 bg-white/95 px-6 py-3.5 backdrop-blur-md shadow-sm md:flex">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs">
              <Home size={13} />
              <span>/</span>
            </div>
            <h1 className="text-sm font-bold text-slate-900">{pageTitle}</h1>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
            >
              <Home size={13} />
              לאתר
            </Link>
          </div>
        </header>

        {/* ── Page content ── */}
        <div className="flex flex-1 flex-col gap-5 p-4 pb-[max(7rem,env(safe-area-inset-bottom,0px))] sm:p-6 md:p-8 md:pb-14">

          {/* Trial banner */}
          {trialBannerDaysLeft !== null && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-blue-600 shrink-0" />
                <p className="text-sm font-bold text-blue-900">
                  {trialBannerDaysLeft === 1
                    ? t("layout.trialBannerOne")
                    : t("layout.trialBannerMany", { days: String(trialBannerDaysLeft) })}
                </p>
              </div>
              <Link
                href="/dashboard/billing"
                className="shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-black text-white shadow-sm hover:bg-blue-700 transition-colors"
              >
                {t("layout.trialUpgrade")}
              </Link>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="min-h-0 min-w-0 max-w-full flex-1"
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
