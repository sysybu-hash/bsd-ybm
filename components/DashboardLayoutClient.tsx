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
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  ReceiptText,
  Settings,
  Shield,
  Users,
  X,
  Zap,
} from "lucide-react";
import DashboardBottomDock from "@/components/DashboardBottomDock";
import PostRegisterWelcomeSheet from "@/components/PostRegisterWelcomeSheet";
import DashboardNotificationBell from "@/components/DashboardNotificationBell";
import { useI18n } from "@/components/I18nProvider";
import LanguageSwitcher from "@/components/LanguageSwitcher";

/* ─── helpers ─── */
function routeActive(pathname: string, href: string): boolean {
  const p = pathname.replace(/\/$/, "") || "/";
  const h = href.replace(/\/$/, "") || "/";
  if (h === "/dashboard") return p === "/dashboard";
  if (h === "/dashboard/admin") return p === "/dashboard/admin";
  return p === h || p.startsWith(`${h}/`);
}

/* ─── Nav link ─── */
type NavLinkProps = {
  href: string;
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  isActive: boolean;
  color: string;
};

function SidebarLink({ href, icon, label, onClick, isActive, color }: NavLinkProps) {
  const colorMap: Record<string, { active: string; icon: string; dot: string }> = {
    blue: { active: "bg-blue-600 text-white shadow-sm shadow-blue-600/20", icon: "text-white", dot: "bg-blue-600" },
    violet: { active: "bg-violet-600 text-white shadow-sm shadow-violet-600/20", icon: "text-white", dot: "bg-violet-600" },
    emerald: { active: "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20", icon: "text-white", dot: "bg-emerald-600" },
    indigo: { active: "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20", icon: "text-white", dot: "bg-indigo-600" },
    sky: { active: "bg-sky-600 text-white shadow-sm shadow-sky-600/20", icon: "text-white", dot: "bg-sky-600" },
    rose: { active: "bg-rose-600 text-white shadow-sm shadow-rose-600/20", icon: "text-white", dot: "bg-rose-600" },
    amber: { active: "bg-amber-500 text-white shadow-sm shadow-amber-500/20", icon: "text-white", dot: "bg-amber-500" },
  };
  const c = colorMap[color] ?? colorMap.blue;

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`relative flex items-center gap-3 rounded-2xl px-3 py-3 text-[13px] font-semibold transition-all duration-200 ${
        isActive ? c.active : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      {isActive && (
        <motion.span
          layoutId="sidebar-pill"
          className={`absolute inset-y-2 start-1 w-1 rounded-full ${c.dot}`}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      )}
      <span className={`transition-colors ${isActive ? c.icon : "text-slate-400"}`}>
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </Link>
  );
}

/* ─── Layout ─── */
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
  const orgShortId = orgId.slice(-6).toUpperCase();

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
    { href: "/dashboard", icon: <LayoutDashboard size={17} />, label: t("dashboard.main"), color: "blue" },
    { href: "/dashboard/crm", icon: <Users size={17} />, label: t("dashboard.crm"), color: "violet" },
    { href: "/dashboard/erp", icon: <FileText size={17} />, label: t("dashboard.erp"), color: "emerald" },
    { href: "/dashboard/erp/invoice", icon: <ReceiptText size={17} />, label: t("dashboard.invoices"), color: "rose" },
    { href: "/dashboard/billing", icon: <CreditCard size={17} />, label: t("dashboard.billing"), color: "rose" },
    { href: "/dashboard/settings", icon: <Settings size={17} />, label: t("dashboard.settings"), color: "blue" },
  ];

  const supportItems = [
    { href: "/dashboard/control-center", icon: <Compass size={17} />, label: t("dashboard.mission"), color: "emerald" },
    { href: "/dashboard/operator", icon: <Cable size={17} />, label: t("dashboard.executive"), color: "indigo" },
    { href: "/dashboard/help", icon: <BookOpen size={17} />, label: t("nav.tutorial"), color: "amber" },
  ];

  const drawerHidden = dir === "rtl" ? "translate-x-full pointer-events-none" : "-translate-x-full pointer-events-none";

  const pageTitle = (() => {
    if (routeActive(pathname, "/dashboard/control-center")) return t("dashboard.mission");
    if (routeActive(pathname, "/dashboard/operator")) return t("dashboard.executive");
    if (routeActive(pathname, "/dashboard/operations")) return t("dashboard.intelligence");
    if (routeActive(pathname, "/dashboard/crm")) return t("dashboard.crm");
    if (routeActive(pathname, "/dashboard/erp/invoice")) return t("dashboard.erp");
    if (routeActive(pathname, "/dashboard/erp")) return t("dashboard.erp");
    if (routeActive(pathname, "/dashboard/billing")) return t("dashboard.billing");
    if (routeActive(pathname, "/dashboard/settings")) return t("dashboard.settings");
    if (routeActive(pathname, "/dashboard/help")) return t("nav.tutorial");
    if (routeActive(pathname, "/dashboard/admin")) return "Admin";
    return t("dashboard.main");
  })();

  const NavContent = ({ onNav }: { onNav?: () => void }) => (
    <>
      <div className="space-y-0.5">
        {navItems.map((item) => (
          <SidebarLink key={item.href} {...item} onClick={onNav} isActive={routeActive(pathname, item.href)} />
        ))}
      </div>
      <div className="my-3 border-t border-slate-100" />
      <div className="space-y-0.5">
        {supportItems.map((item) => (
          <SidebarLink key={item.href} {...item} onClick={onNav} isActive={routeActive(pathname, item.href)} />
        ))}
      </div>
      {showAdmin && (
        <>
          <div className="my-4 border-t border-white/6" />
          <SidebarLink
            href="/dashboard/admin"
            icon={<Shield size={17} />}
            label="Admin"
            onClick={onNav}
            isActive={routeActive(pathname, "/dashboard/admin")}
            color="amber"
          />
        </>
      )}
    </>
  );

  const UserCard = () => (
    <div className="border-t border-slate-200 p-4">
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-3">
        <div className="flex items-center gap-3 rounded-xl px-1 py-1">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-xs font-black text-white shadow-sm">
            {serverUser.image ? (
              <Image src={serverUser.image} alt="" width={36} height={36} className="h-10 w-10 rounded-2xl object-cover" />
            ) : userInitials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-slate-900">{userName}</p>
            <p className="truncate text-[11px] text-slate-500">{serverEmail}</p>
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="shrink-0 rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
            title="התנתקות"
          >
            <LogOut size={14} />
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-500">
          <span className="rounded-full bg-white px-2.5 py-1">{userRole.replaceAll("_", " ")}</span>
          <span className="rounded-full bg-white px-2.5 py-1" dir="ltr">ORG {orgShortId}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen max-w-[100vw] overflow-x-hidden bg-slate-50" dir={dir}>

      {/* ═══ SIDEBAR — Desktop ═══ */}
      <aside
        className="hidden w-64 shrink-0 flex-col border-e border-slate-200 bg-white md:fixed md:inset-y-0 md:start-0 md:flex"
      >
        <Link href="/" className="flex items-center gap-3 px-5 py-5 transition-opacity hover:opacity-80">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-sm font-black text-white">
            B
          </div>
          <div>
            <p className="text-sm font-black leading-none text-slate-900">BSD<span className="text-slate-400">-YBM</span></p>
            <p className="mt-0.5 text-[10px] text-slate-400">Workspace</p>
          </div>
        </Link>

        <nav className="flex-1 overflow-y-auto px-4 py-3">
          <NavContent />
        </nav>

        <div className="px-4 py-1">
          <LanguageSwitcher showLabel className="flex w-full items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-[13px] font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900" />
        </div>

        <UserCard />
      </aside>

      {/* ═══ MOBILE BACKDROP ═══ */}
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-[180] bg-slate-950/25 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close"
        />
      )}

      {/* ═══ MOBILE DRAWER ═══ */}
      <aside
        className={`fixed inset-y-0 start-0 z-[190] flex w-64 flex-col shadow-2xl transition-transform duration-250 ease-out md:hidden ${
          mobileOpen ? "translate-x-0" : drawerHidden
        }`}
        style={{ background: "rgba(255,255,255,0.97)", borderInlineEnd: "1px solid rgba(148,163,184,0.2)" }}
        aria-hidden={!mobileOpen}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
          <Link href="/" className="text-sm font-black text-slate-900" onClick={() => setMobileOpen(false)}>
            BSD<span className="text-blue-600">-YBM</span>
          </Link>
          <button type="button" className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900" onClick={() => setMobileOpen(false)}>
            <X size={16} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          <NavContent onNav={() => setMobileOpen(false)} />
        </nav>
        <UserCard />
      </aside>

      {/* ═══ MAIN AREA ═══ */}
      <main className="relative flex min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden md:ms-64" style={{ WebkitOverflowScrolling: "touch" }}>

        {/* Mobile header */}
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
        <header className="sticky top-0 z-[110] hidden border-b border-slate-200 bg-white px-8 py-4 md:block">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-6">
            <h1 className="text-xl font-black text-slate-900">{pageTitle}</h1>
            <div className="flex items-center gap-2">
              {showAdmin ? <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">Admin</span> : null}
              <DashboardNotificationBell />
              <LanguageSwitcher />
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-5 pb-[max(7rem,env(safe-area-inset-bottom,0px))] sm:px-5 md:px-8 md:py-7 md:pb-14">

          {trialBannerDaysLeft !== null && (
            <div className="flex items-center justify-between gap-3 rounded-3xl border border-blue-100 bg-white px-5 py-4 shadow-sm">
              <div className="flex items-center gap-2">
                <Zap size={14} className="shrink-0 text-blue-600" />
                <p className="text-sm font-bold text-slate-900">
                  {trialBannerDaysLeft === 1 ? t("layout.trialBannerOne") : t("layout.trialBannerMany", { days: String(trialBannerDaysLeft) })}
                </p>
              </div>
              <Link href="/dashboard/billing" className="shrink-0 rounded-2xl bg-blue-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-700">
                {t("layout.trialUpgrade")}
              </Link>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
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
