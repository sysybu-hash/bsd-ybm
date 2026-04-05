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
  ChevronRight,
  Sparkles,
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
  onClick?: () => void;
  isActive: boolean;
  color: string;
};

const COLOR_MAP: Record<string, { grad: string; glow: string; dot: string }> = {
  blue:    { grad: "from-blue-500 to-blue-600",    glow: "shadow-blue-500/40",    dot: "bg-blue-500" },
  violet:  { grad: "from-violet-500 to-violet-600",glow: "shadow-violet-500/40",  dot: "bg-violet-500" },
  emerald: { grad: "from-emerald-500 to-teal-500", glow: "shadow-emerald-500/40", dot: "bg-emerald-500" },
  indigo:  { grad: "from-indigo-500 to-indigo-600",glow: "shadow-indigo-500/40",  dot: "bg-indigo-500" },
  sky:     { grad: "from-sky-500 to-cyan-500",     glow: "shadow-sky-500/40",     dot: "bg-sky-500" },
  rose:    { grad: "from-rose-500 to-pink-500",    glow: "shadow-rose-500/40",    dot: "bg-rose-500" },
  amber:   { grad: "from-amber-400 to-orange-500", glow: "shadow-amber-500/40",   dot: "bg-amber-400" },
};

function SidebarLink({ href, icon, label, onClick, isActive, color }: NavLinkProps) {
  const c = COLOR_MAP[color] ?? COLOR_MAP.blue;
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[13px] font-semibold transition-all duration-200 ${
        isActive
          ? "bg-white/10 text-white"
          : "text-slate-400 hover:bg-white/6 hover:text-slate-200"
      }`}
    >
      {/* Icon wrapper */}
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg transition-all duration-200 ${
          isActive
            ? `${c.grad} ${c.glow} text-white scale-105`
            : "from-slate-700 to-slate-800 shadow-none text-slate-400 group-hover:from-slate-600 group-hover:to-slate-700 group-hover:text-slate-200"
        }`}
      >
        {icon}
      </span>
      <span className="truncate leading-none">{label}</span>
      {isActive && (
        <motion.span
          layoutId="sidebar-active-dot"
          className={`absolute start-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-full ${c.dot}`}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
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
    { href: "/dashboard",              icon: <LayoutDashboard size={15} />, label: t("dashboard.main"),     color: "blue" },
    { href: "/dashboard/business",     icon: <Layers size={15} />,          label: "מרכז עסקי",             color: "emerald" },
    { href: "/dashboard/erp/invoice",  icon: <ReceiptText size={15} />,     label: t("dashboard.invoices"), color: "rose" },
    { href: "/dashboard/meckano",      icon: <Clock size={15} />,           label: t("dashboard.meckano"),  color: "sky" },
    { href: "/dashboard/billing",      icon: <CreditCard size={15} />,      label: t("dashboard.billing"),  color: "violet" },
    { href: "/dashboard/settings",     icon: <Settings size={15} />,        label: t("dashboard.settings"), color: "indigo" },
  ];

  const supportItems = [
    { href: "/dashboard/control-center", icon: <Compass size={15} />, label: t("dashboard.mission"),   color: "emerald" },
    { href: "/dashboard/operator",       icon: <Cable size={15} />,   label: t("dashboard.executive"), color: "indigo" },
    { href: "/dashboard/help",           icon: <BookOpen size={15} />,label: t("nav.tutorial"),        color: "amber" },
  ];

  const drawerHidden = dir === "rtl" ? "translate-x-full pointer-events-none" : "-translate-x-full pointer-events-none";

  const pageTitle = (() => {
    if (routeActive(pathname, "/dashboard/control-center")) return t("dashboard.mission");
    if (routeActive(pathname, "/dashboard/operator"))       return t("dashboard.executive");
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

  const NavContent = ({ onNav }: { onNav?: () => void }) => (
    <div className="space-y-0.5">
      <p className="px-3 pb-1 pt-2 text-[10px] font-black uppercase tracking-widest text-slate-600">ניווט ראשי</p>
      {navItems.map((item) => (
        <SidebarLink key={item.href} {...item} onClick={onNav} isActive={routeActive(pathname, item.href)} />
      ))}
      <p className="px-3 pb-1 pt-4 text-[10px] font-black uppercase tracking-widest text-slate-600">כלים</p>
      {supportItems.map((item) => (
        <SidebarLink key={item.href} {...item} onClick={onNav} isActive={routeActive(pathname, item.href)} />
      ))}
      {showAdmin && (
        <>
          <p className="px-3 pb-1 pt-4 text-[10px] font-black uppercase tracking-widest text-slate-600">מנהל</p>
          <SidebarLink
            href="/dashboard/admin"
            icon={<Shield size={15} />}
            label="Admin"
            onClick={onNav}
            isActive={routeActive(pathname, "/dashboard/admin")}
            color="amber"
          />
        </>
      )}
    </div>
  );

  const UserCard = () => (
    <div className="border-t border-slate-800 p-4">
      <div className="flex items-center gap-3 rounded-2xl bg-white/6 px-3 py-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-black text-white shadow-md shadow-blue-500/30">
          {serverUser.image ? (
            <Image src={serverUser.image} alt="" width={36} height={36} className="h-9 w-9 rounded-xl object-cover" />
          ) : userInitials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-bold text-white leading-tight">{userName}</p>
          <p className="truncate text-[10px] text-slate-500 leading-tight">{serverEmail}</p>
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="shrink-0 rounded-xl p-2 text-slate-500 transition-colors hover:bg-white/10 hover:text-rose-400"
          title="התנתקות"
        >
          <LogOut size={13} />
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5 px-1 text-[10px] font-bold">
        <span className="rounded-full bg-white/8 px-2.5 py-1 text-slate-400">{userRole.replaceAll("_", " ")}</span>
        <span className="rounded-full bg-white/8 px-2.5 py-1 text-slate-400" dir="ltr">ORG {orgId.slice(-6).toUpperCase()}</span>
      </div>
    </div>
  );

  const SidebarShell = ({ onNav }: { onNav?: () => void }) => (
    <>
      {/* Logo */}
      <Link href="/" className="flex items-center gap-3 px-5 py-5 transition-opacity hover:opacity-80" onClick={onNav}>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-black text-white shadow-lg shadow-blue-500/30">
          B
        </div>
        <div>
          <p className="text-sm font-black leading-none text-white">BSD<span className="text-blue-400">-YBM</span></p>
          <p className="mt-0.5 text-[10px] text-slate-500">Platform</p>
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 thin-scrollbar">
        <NavContent onNav={onNav} />
      </nav>

      {/* Language */}
      <div className="px-3 py-2">
        <LanguageSwitcher
          showLabel
          className="flex w-full items-center gap-2 rounded-2xl bg-white/6 px-3 py-2.5 text-[12px] font-semibold text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-200"
        />
      </div>

      <UserCard />
    </>
  );

  return (
    <div className="flex min-h-screen max-w-[100vw] overflow-x-hidden bg-slate-50" dir={dir}>

      {/* ══ SIDEBAR — Desktop ══ */}
      <aside className="hidden w-64 shrink-0 flex-col bg-slate-950 md:fixed md:inset-y-0 md:start-0 md:flex">
        <SidebarShell />
      </aside>

      {/* ══ MOBILE BACKDROP ══ */}
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-[180] bg-slate-950/50 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close"
        />
      )}

      {/* ══ MOBILE DRAWER ══ */}
      <aside
        className={`fixed inset-y-0 start-0 z-[190] flex w-64 flex-col bg-slate-950 shadow-2xl transition-transform duration-300 ease-out md:hidden ${
          mobileOpen ? "translate-x-0" : drawerHidden
        }`}
        aria-hidden={!mobileOpen}
      >
        <div className="flex items-center justify-between px-4 py-4">
          <span className="text-sm font-black text-white">BSD<span className="text-blue-400">-YBM</span></span>
          <button
            type="button"
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
            onClick={() => setMobileOpen(false)}
          >
            <X size={16} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-2">
          <NavContent onNav={() => setMobileOpen(false)} />
        </nav>
        <div className="px-3 py-2">
          <LanguageSwitcher showLabel className="flex w-full items-center gap-2 rounded-2xl bg-white/6 px-3 py-2.5 text-[12px] font-semibold text-slate-400" />
        </div>
        <UserCard />
      </aside>

      {/* ══ MAIN ══ */}
      <main className="relative flex min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden md:ms-64" style={{ WebkitOverflowScrolling: "touch" }}>

        {/* Mobile topbar */}
        <div className="sticky top-0 z-[120] flex items-center justify-between gap-3 border-b border-slate-200/80 bg-white/95 px-4 py-3 shadow-sm backdrop-blur-md md:hidden">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-slate-700 shadow-sm"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={16} className="text-blue-600" />
          </button>
          <p className="text-sm font-black text-slate-900">BSD<span className="text-blue-600">-YBM</span></p>
          <div className="flex items-center gap-1">
            <DashboardNotificationBell />
            <LanguageSwitcher />
          </div>
        </div>

        {/* Desktop header */}
        <header className="sticky top-0 z-[110] hidden border-b border-slate-200/70 bg-white/95 px-8 py-4 shadow-sm backdrop-blur-md md:block">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-black text-slate-900">{pageTitle}</h1>
              {showAdmin && (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                  <Sparkles size={10} className="inline me-1" />Admin
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

          {trialBannerDaysLeft !== null && (
            <div className="flex items-center justify-between gap-3 overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-l from-blue-50 to-indigo-50 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                  <Zap size={14} />
                </div>
                <p className="text-sm font-bold text-slate-800">
                  {trialBannerDaysLeft === 1
                    ? t("layout.trialBannerOne")
                    : t("layout.trialBannerMany", { days: String(trialBannerDaysLeft) })}
                </p>
              </div>
              <Link href="/dashboard/billing" className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-blue-600/30 transition-colors hover:bg-blue-700">
                {t("layout.trialUpgrade")} <ChevronRight size={12} />
              </Link>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
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
