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
  accent: string;
  iconBg?: string;
};

const ACCENT: Record<string, { activeBg: string; activeText: string; activeBorder: string; iconBg: string; iconText: string; activeIconBg: string; activeIconText: string }> = {
  indigo:  { activeBg: "bg-indigo-500/20", activeText: "text-indigo-300",  activeBorder: "border-indigo-500/30",  iconBg: "bg-white/[0.06]",  iconText: "text-white/50",  activeIconBg: "bg-indigo-500",   activeIconText: "text-white" },
  emerald: { activeBg: "bg-emerald-500/20",activeText: "text-emerald-300", activeBorder: "border-emerald-500/30", iconBg: "bg-white/[0.06]",  iconText: "text-white/50",  activeIconBg: "bg-emerald-500",  activeIconText: "text-white" },
  sky:     { activeBg: "bg-sky-500/20",    activeText: "text-sky-300",     activeBorder: "border-sky-500/30",     iconBg: "bg-white/[0.06]",  iconText: "text-white/50",  activeIconBg: "bg-sky-500",      activeIconText: "text-white" },
  rose:    { activeBg: "bg-rose-500/20",   activeText: "text-rose-300",    activeBorder: "border-rose-500/30",    iconBg: "bg-white/[0.06]",  iconText: "text-white/50",  activeIconBg: "bg-rose-500",     activeIconText: "text-white" },
  amber:   { activeBg: "bg-amber-500/20",  activeText: "text-amber-300",   activeBorder: "border-amber-500/30",   iconBg: "bg-white/[0.06]",  iconText: "text-white/50",  activeIconBg: "bg-amber-400",    activeIconText: "text-white" },
  blue:    { activeBg: "bg-indigo-500/20", activeText: "text-indigo-300",  activeBorder: "border-indigo-500/30",  iconBg: "bg-white/[0.06]",  iconText: "text-white/50",  activeIconBg: "bg-indigo-500",   activeIconText: "text-white" },
};

function SidebarLink({ href, icon, label, badge, onClick, isActive, accent }: NavLinkProps) {
  const a = ACCENT[accent] ?? ACCENT.indigo;
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all duration-150 ${
        isActive
          ? `${a.activeBg} ${a.activeText} ring-1 ${a.activeBorder}`
          : "text-white/45 hover:bg-white/[0.07] hover:text-white/90"
      }`}
    >
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[14px] transition-all ${
        isActive ? `${a.activeIconBg} ${a.activeIconText} shadow-sm` : `${a.iconBg} ${a.iconText} group-hover:bg-white/[0.10] group-hover:text-white/70`
      }`}>
        {icon}
      </span>
      <span className="flex-1 truncate leading-none">{label}</span>
      {badge && (
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${isActive ? "bg-white/20 text-white" : "border border-white/[0.12] bg-white/[0.06] text-white/40"}`}>
          {badge}
        </span>
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
    <div className="mb-1 mt-5 flex items-center gap-2 px-3 first:mt-2">
      <div className="h-px flex-1 bg-white/[0.07]" />
      <p className="text-[9px] font-black uppercase tracking-[0.15em] text-white/25">{label}</p>
      <div className="h-px flex-1 bg-white/[0.07]" />
    </div>
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
    <div className="border-t border-white/[0.07] bg-white/[0.03] p-3">
      <div className="flex items-center gap-3 rounded-2xl border border-white/[0.10] bg-white/[0.06] px-3 py-2.5">
        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-xs font-black text-white shadow-md shadow-indigo-600/30">
          {serverUser.image ? (
            <Image src={serverUser.image} alt="" width={36} height={36} className="h-9 w-9 rounded-xl object-cover" />
          ) : userInitials}
          <span className="absolute -bottom-0.5 -end-0.5 flex h-3 w-3 items-center justify-center rounded-full border-2 border-white bg-emerald-500" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-black leading-tight text-white/90">{userName}</p>
          <p className="truncate text-[10px] leading-tight text-white/35 mt-0.5">{serverEmail}</p>
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="shrink-0 rounded-lg p-1.5 text-white/25 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
          title="התנתקות"
        >
          <LogOut size={13} />
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5 px-1">
        <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-bold text-indigo-300">{userRole.replaceAll("_", " ")}</span>
        <span className="rounded-full border border-white/[0.10] bg-white/[0.05] px-2.5 py-0.5 text-[10px] font-semibold text-white/30" dir="ltr">ORG·{orgId.slice(-6).toUpperCase()}</span>
      </div>
    </div>
  );

  const SidebarShell = ({ onNav }: { onNav?: () => void }) => (
    <>
      {/* Logo */}
      <Link href="/" className="group flex items-center gap-3 border-b border-white/[0.07] px-5 py-5 transition-opacity hover:opacity-90" onClick={onNav}>
        <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-black text-white shadow-lg shadow-indigo-500/30 transition-transform group-hover:scale-105">
          B
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-[#0f101a]" />
        </div>
        <div>
          <p className="text-[15px] font-black leading-tight tracking-wide text-white">BSD<span className="text-indigo-400">-YBM</span></p>
          <p className="mt-0.5 text-[10px] leading-none text-white/30 font-medium">Business Platform</p>
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
          className="flex w-full items-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.05] px-3 py-2 text-[12px] font-semibold text-white/50 transition-colors hover:bg-white/[0.09] hover:text-white/80"
        />
      </div>

      <UserCard />
    </>
  );

  return (
    <div className="flex min-h-screen max-w-[100vw] overflow-x-hidden bg-[#f8f9fb]" dir={dir}>

      {/* ══ SIDEBAR — Desktop ══ */}
      <aside className="hidden w-64 shrink-0 flex-col border-e border-white/[0.07] bg-[#0f101a] shadow-xl md:fixed md:inset-y-0 md:start-0 md:flex">
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
        className={`fixed inset-y-0 start-0 z-[190] flex w-64 flex-col border-e border-white/[0.07] bg-[#0f101a] shadow-xl shadow-black/40 transition-transform duration-300 ease-out md:hidden ${
          mobileOpen ? "translate-x-0" : (dir === "rtl" ? "translate-x-full pointer-events-none" : "-translate-x-full pointer-events-none")
        }`}
        aria-hidden={!mobileOpen}
      >
        <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-4">
          <span className="text-sm font-black text-white">BSD<span className="text-indigo-400">-YBM</span></span>
          <button
            type="button"
            className="rounded-xl p-2 text-white/30 transition-colors hover:bg-white/[0.08] hover:text-white"
            onClick={() => setMobileOpen(false)}
          >
            <X size={16} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3">
          <NavContent onNav={() => setMobileOpen(false)} />
        </nav>
        <div className="px-3 pb-2">
          <LanguageSwitcher showLabel className="flex w-full items-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.05] px-3 py-2 text-[12px] font-semibold text-white/50" />
        </div>
        <UserCard />
      </aside>

      {/* ══ MAIN ══ */}
      <main className="relative flex min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden md:ms-64" style={{ WebkitOverflowScrolling: "touch" }}>

        {/* Mobile topbar */}
        <div className="sticky top-0 z-[120] flex items-center justify-between gap-3 border-b border-gray-200/80 bg-white/95 px-4 py-3 shadow-sm md:hidden" style={{ backdropFilter: "blur(8px)" }}>
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
        <header className="sticky top-0 z-[110] hidden border-b border-gray-100 bg-white/95 px-8 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] md:block" style={{ backdropFilter: "blur(12px)" }}>
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">BSD-YBM</span>
              <span className="text-gray-300">/</span>
              <h1 className="text-[15px] font-black text-gray-900">{pageTitle}</h1>
              {showAdmin && (
                <span className="flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-600 border border-amber-200">
                  <Shield size={10} />Admin
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
            <div className="flex items-center justify-between gap-3 overflow-hidden rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-600 to-indigo-500 px-5 py-4 shadow-md shadow-indigo-600/20">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white">
                  <Zap size={16} />
                </div>
                <div>
                  <p className="text-sm font-black text-white">
                    {trialBannerDaysLeft === 1
                      ? t("layout.trialBannerOne")
                      : t("layout.trialBannerMany", { days: String(trialBannerDaysLeft) })}
                  </p>
                  <p className="text-[11px] text-indigo-200">שדרג עכשיו לפני שייגמר הניסיון</p>
                </div>
              </div>
              <Link
                href="/dashboard/billing"
                className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-black text-indigo-700 shadow-sm transition-all hover:bg-indigo-50 hover:shadow-md"
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