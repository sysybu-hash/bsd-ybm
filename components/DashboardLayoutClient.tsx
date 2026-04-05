"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Cable,
  Compass,
  CreditCard,
  LayoutDashboard,
  Layers,
  LogOut,
  Menu,
  ReceiptText,
  Settings,
  Shield,
  X,
  Zap,
  Clock,
  ChevronLeft,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import DashboardBottomDock from "@/components/DashboardBottomDock";
import PostRegisterWelcomeSheet from "@/components/PostRegisterWelcomeSheet";
import DashboardNotificationBell from "@/components/DashboardNotificationBell";
import { useI18n } from "@/components/I18nProvider";
import LanguageSwitcher from "@/components/LanguageSwitcher";

function routeActive(pathname: string, href: string): boolean {
  const p = pathname.replace(/\/$/, "") || "/";
  const h = href.replace(/\/$/, "") || "/";
  if (h === "/dashboard") return p === "/dashboard";
  if (h === "/dashboard/admin") return p === "/dashboard/admin";
  return p === h || p.startsWith(`${h}/`);
}

type NavLinkProps = {
  href: string;
  icon: ReactNode;
  label: string;
  badge?: string;
  onClick?: () => void;
  isActive: boolean;
  accent: string; // tailwind color name e.g. "indigo"
};

const ACCENT: Record<string, { bg: string; text: string; border: string; dot: string; iconActive: string }> = {
  indigo:  { bg: "bg-indigo-50",  text: "text-indigo-700",  border: "border-r-indigo-500",  dot: "bg-indigo-500",  iconActive: "bg-indigo-100 text-indigo-700" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-r-emerald-500", dot: "bg-emerald-500", iconActive: "bg-emerald-100 text-emerald-700" },
  sky:     { bg: "bg-sky-50",     text: "text-sky-700",     border: "border-r-sky-500",     dot: "bg-sky-500",     iconActive: "bg-sky-100 text-sky-700" },
  rose:    { bg: "bg-rose-50",    text: "text-rose-700",    border: "border-r-rose-500",    dot: "bg-rose-500",    iconActive: "bg-rose-100 text-rose-700" },
  amber:   { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-r-amber-500",   dot: "bg-amber-500",   iconActive: "bg-amber-100 text-amber-700" },
  blue:    { bg: "bg-indigo-50",  text: "text-indigo-700",  border: "border-r-indigo-500",  dot: "bg-indigo-500",  iconActive: "bg-indigo-100 text-indigo-700" },
};

function SidebarLink({ href, icon, label, badge, onClick, isActive, accent }: NavLinkProps) {
  const a = ACCENT[accent] ?? ACCENT.indigo;
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all duration-150 ${
        isActive
          ? `${a.bg} ${a.text} border-r-2 ${a.border} shadow-sm`
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      }`}
    >
      {/* Icon */}
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[14px] transition-all ${
        isActive ? a.iconActive : "text-gray-400 group-hover:text-indigo-600"
      }`}>
        {icon}
      </span>
      <span className="flex-1 truncate leading-none">{label}</span>
      {badge && (
        <span className="rounded-full border border-indigo-100 bg-white px-2 py-0.5 text-[10px] font-bold text-indigo-700">
          {badge}
        </span>
      )}
      {isActive && (
        <motion.span
          layoutId="indigo-active-pill"
          className={`absolute end-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-s-full ${a.dot}`}
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
        />
      )}
    </Link>
  );
}

type Props = {
  children: ReactNode;
  orgId: string;
  userRole: string;
  isAdminUser: boolean;
  trialBannerDaysLeft: number | null;
  serverUser: { email: string; name: string | null; image: string | null };
};

export default function DashboardLayoutClient({
  children,
  orgId,
  userRole,
  isAdminUser,
  trialBannerDaysLeft,
  serverUser,
}: Props) {
  const { t, dir } = useI18n();
  const pathname = usePathname() ?? "";
  const [mobileOpen, setMobileOpen] = useState(false);

  const serverEmail = serverUser.email.trim();
  const showAdmin = isAdminUser;
  const userName = serverUser.name ?? serverEmail.split("@")[0] ?? "User";
  const userInitials = userName.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase();

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [mobileOpen]);

  useEffect(() => {
    const fn = () => { if (window.matchMedia("(min-width: 768px)").matches) setMobileOpen(false); };
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  const navItems = [
    { href: "/dashboard",              icon: <LayoutDashboard size={15} />, label: t("dashboard.main"),     accent: "indigo" },
    { href: "/dashboard/ai",           icon: <Zap size={15} />,             label: "AI וסריקה",             accent: "indigo" },
    { href: "/dashboard/business",     icon: <Layers size={15} />,          label: "מרכז עסקי",             accent: "emerald" },
    { href: "/dashboard/erp/invoice",  icon: <ReceiptText size={15} />,     label: t("dashboard.invoices"), accent: "rose" },
    { href: "/dashboard/meckano",      icon: <Clock size={15} />,           label: t("dashboard.meckano"),  accent: "sky" },
    { href: "/dashboard/billing",      icon: <CreditCard size={15} />,      label: t("dashboard.billing"),  accent: "indigo" },
    { href: "/dashboard/settings",     icon: <Settings size={15} />,        label: t("dashboard.settings"), accent: "blue" },
  ];

  const toolItems = [
    { href: "/dashboard/control-center", icon: <Compass size={15} />,  label: t("dashboard.mission"),   accent: "emerald" },
    { href: "/dashboard/operator",       icon: <Cable size={15} />,    label: t("dashboard.executive"), accent: "indigo" },
    { href: "/dashboard/help",           icon: <BookOpen size={15} />, label: t("nav.tutorial"),        accent: "amber" },
  ];

  const pageTitle = (() => {
    if (routeActive(pathname, "/dashboard/control-center")) return t("dashboard.mission");
    if (routeActive(pathname, "/dashboard/operator"))       return t("dashboard.executive");
    if (routeActive(pathname, "/dashboard/ai"))             return "AI וסריקה";
    if (routeActive(pathname, "/dashboard/business"))       return "מרכז עסקי";
    if (routeActive(pathname, "/dashboard/crm"))            return t("dashboard.crm");
    if (routeActive(pathname, "/dashboard/erp/invoice"))    return t("dashboard.erp");
    if (routeActive(pathname, "/dashboard/erp"))            return t("dashboard.erp");
    if (routeActive(pathname, "/dashboard/billing"))        return t("dashboard.billing");
    if (routeActive(pathname, "/dashboard/settings"))       return t("dashboard.settings");
    if (routeActive(pathname, "/dashboard/meckano"))        return t("dashboard.meckano");
    if (routeActive(pathname, "/dashboard/help"))           return t("nav.tutorial");
    if (routeActive(pathname, "/dashboard/admin"))          return "Admin";
    return t("dashboard.main");
  })();

  const SectionLabel = ({ label }: { label: string }) => (
    <p className="mb-1.5 mt-5 px-3 text-[10px] font-black uppercase tracking-[0.12em] text-gray-400 first:mt-2">
      {label}
    </p>
  );

  const NavContent = ({ onNav }: { onNav?: () => void }) => (
    <div>
      <SectionLabel label="ניווט ראשי" />
      {navItems.map((item) => (
        <SidebarLink key={item.href} {...item} onClick={onNav} isActive={routeActive(pathname, item.href)} />
      ))}
      <SectionLabel label="כלים" />
      {toolItems.map((item) => (
        <SidebarLink key={item.href} {...item} onClick={onNav} isActive={routeActive(pathname, item.href)} />
      ))}
      {showAdmin && (
        <>
          <SectionLabel label="מנהל" />
          <SidebarLink
            href="/dashboard/admin"
            icon={<Shield size={15} />}
            label="Admin"
            badge="🔑"
            onClick={onNav}
            isActive={routeActive(pathname, "/dashboard/admin")}
            accent="amber"
          />
        </>
      )}
    </div>
  );

  const UserCard = () => (
    <div className="border-t border-gray-200 p-3">
      <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2.5 shadow-sm">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-xs font-black text-white shadow-sm">
          {serverUser.image ? (
            <Image src={serverUser.image} alt="" width={32} height={32} className="h-8 w-8 rounded-lg object-cover" />
          ) : userInitials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-bold leading-tight text-gray-900">{userName}</p>
          <p className="truncate text-[10px] leading-tight text-gray-500">{serverEmail}</p>
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="shrink-0 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white hover:text-rose-500"
          title="התנתקות"
        >
          <LogOut size={13} />
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5 px-1">
        <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700">{userRole.replaceAll("_", " ")}</span>
        <span className="rounded-full border border-gray-200 bg-white px-2.5 py-0.5 text-[10px] font-bold text-gray-600" dir="ltr">ORG {orgId.slice(-6).toUpperCase()}</span>
      </div>
    </div>
  );

  const SidebarShell = ({ onNav }: { onNav?: () => void }) => (
    <>
      {/* Logo */}
      <Link href="/" className="flex items-center gap-3 px-5 py-5 transition-opacity hover:opacity-90" onClick={onNav}>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-xs font-black text-white shadow-sm">
          B
        </div>
        <div>
          <p className="text-[14px] font-black leading-tight tracking-wide text-gray-900">BSD-YBM</p>
          <p className="mt-0.5 text-[10px] leading-none text-gray-500">Platform</p>
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-1 thin-scrollbar">
        <NavContent onNav={onNav} />
      </nav>

      {/* Language */}
      <div className="px-3 pb-2">
        <LanguageSwitcher
          showLabel
          className="flex w-full items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-semibold text-gray-600 shadow-sm transition-colors hover:bg-gray-50 hover:text-gray-900"
        />
      </div>

      <UserCard />
    </>
  );

  return (
    <div className="flex min-h-screen max-w-[100vw] overflow-x-hidden bg-gray-50" dir={dir}>

      {/* ══ SIDEBAR — Desktop ══ */}
      <aside className="hidden w-64 shrink-0 flex-col bg-white shadow-sm md:fixed md:inset-y-0 md:start-0 md:flex">
        <SidebarShell />
      </aside>

      {/* ══ MOBILE BACKDROP ══ */}
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-[180] bg-gray-900/35 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close"
        />
      )}

      {/* ══ MOBILE DRAWER ══ */}
      <aside
        className={`fixed inset-y-0 start-0 z-[190] flex w-64 flex-col bg-white shadow-xl shadow-gray-900/12 transition-transform duration-300 ease-out md:hidden ${
          mobileOpen ? "translate-x-0" : (dir === "rtl" ? "translate-x-full pointer-events-none" : "-translate-x-full pointer-events-none")
        }`}
        aria-hidden={!mobileOpen}
      >
        <div className="flex items-center justify-between px-4 py-4">
          <span className="text-sm font-black text-gray-900">BSD-YBM</span>
          <button
            type="button"
            className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900"
            onClick={() => setMobileOpen(false)}
          >
            <X size={16} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3">
          <NavContent onNav={() => setMobileOpen(false)} />
        </nav>
        <div className="px-3 pb-2">
          <LanguageSwitcher showLabel className="flex w-full items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-semibold text-gray-600 shadow-sm" />
        </div>
        <UserCard />
      </aside>

      {/* ══ MAIN ══ */}
      <main className="relative flex min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden md:ms-64" style={{ WebkitOverflowScrolling: "touch" }}>

        {/* Mobile topbar */}
        <div className="sticky top-0 z-[120] flex items-center justify-between gap-3 border-b border-gray-200/80 bg-white px-4 py-3 shadow-sm md:hidden">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white p-2 text-gray-700 shadow-sm"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={16} className="text-indigo-600" />
          </button>
          <p className="text-sm font-black text-gray-900">BSD<span className="text-indigo-600">-YBM</span></p>
          <div className="flex items-center gap-1">
            <DashboardNotificationBell />
            <LanguageSwitcher />
          </div>
        </div>

        {/* Desktop header */}
        <header className="sticky top-0 z-[110] hidden border-b border-gray-200/70 bg-white px-8 py-4 shadow-sm md:block">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              {/* Breadcrumb-style title */}
              <span className="text-xs font-semibold text-gray-400">BSD-YBM</span>
              <span className="text-gray-300">/</span>
              <h1 className="text-base font-black text-gray-900">{pageTitle}</h1>
              {showAdmin && (
                <span className="flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                  <Sparkles size={10} />Admin
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <DashboardNotificationBell />
              <LanguageSwitcher />
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-5 pb-[max(7rem,env(safe-area-inset-bottom,0px))] sm:px-5 md:px-8 md:py-7 md:pb-14">

          {/* Trial banner */}
          {trialBannerDaysLeft !== null && (
            <div className="flex items-center justify-between gap-3 overflow-hidden rounded-2xl border border-indigo-200 bg-indigo-50 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
                  <Zap size={14} />
                </div>
                <p className="text-sm font-bold text-indigo-900">
                  {trialBannerDaysLeft === 1
                    ? t("layout.trialBannerOne")
                    : t("layout.trialBannerMany", { days: String(trialBannerDaysLeft) })}
                </p>
              </div>
              <Link
                href="/dashboard/billing"
                className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-indigo-600/25 transition-colors hover:bg-indigo-700"
              >
                {t("layout.trialUpgrade")}
                <ChevronRight size={12} />
              </Link>
            </div>
          )}

          {/* Page transition wrapper */}
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
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