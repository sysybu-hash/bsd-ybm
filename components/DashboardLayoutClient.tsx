"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  BriefcaseBusiness,
  Cable,
  Compass,
  LayoutDashboard,
  Users,
  FileText,
  ReceiptText,
  Settings,
  Shield,
  CreditCard,
  Menu,
  X,
  Sparkles,
  TrendingUp,
  Zap,
  LogOut,
} from "lucide-react";
import DashboardBottomDock from "@/components/DashboardBottomDock";
import PostRegisterWelcomeSheet from "@/components/PostRegisterWelcomeSheet";
import DashboardNotificationBell from "@/components/DashboardNotificationBell";
import { useI18n } from "@/components/I18nProvider";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { canAccessIntelligenceDashboard } from "@/lib/intelligence-access";
import { isAdmin } from "@/lib/is-admin";

const DASHBOARD_SIMPLE_MODE_KEY = "bsd-dashboard:simple-mode";

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
  color: string; // tailwind color name: blue, violet, emerald, etc.
};

function SidebarLink({ href, icon, label, onClick, isActive, color }: NavLinkProps) {
  const colorMap: Record<string, { active: string; icon: string; dot: string }> = {
    blue:    { active: "bg-blue-500/12 text-indigo-400",    icon: "text-indigo-400",    dot: "bg-blue-400" },
    violet:  { active: "bg-violet-500/12 text-violet-400",  icon: "text-violet-400",  dot: "bg-violet-400" },
    emerald: { active: "bg-emerald-500/12 text-emerald-400", icon: "text-emerald-400", dot: "bg-emerald-400" },
    indigo:  { active: "bg-indigo-500/12 text-indigo-400",  icon: "text-indigo-400",  dot: "bg-indigo-400" },
    sky:     { active: "bg-sky-500/12 text-sky-400",     icon: "text-sky-400",     dot: "bg-sky-400" },
    rose:    { active: "bg-rose-500/12 text-rose-400",    icon: "text-rose-400",    dot: "bg-rose-400" },
    amber:   { active: "bg-amber-500/12 text-amber-400",   icon: "text-amber-400",   dot: "bg-amber-400" },
  };
  const c = colorMap[color] ?? colorMap.blue;

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all duration-200 ${
        isActive ? c.active : "text-slate-500 hover:bg-white/5 hover:text-slate-300"
      }`}
    >
      {isActive && (
        <motion.span
          layoutId="sidebar-pill"
          className={`absolute inset-y-1.5 start-0 w-[3px] rounded-e-full ${c.dot}`}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      )}
      <span className={`transition-colors ${isActive ? c.icon : "text-slate-600"}`}>
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [simpleMode, setSimpleMode] = useState(true);

  const serverEmail = serverUser.email.trim();
  const navReady = sessionStatus === "authenticated" || serverEmail.length > 0;
  const showAdmin = navReady && isAdmin(serverEmail);

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

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DASHBOARD_SIMPLE_MODE_KEY);
      if (raw === "0") setSimpleMode(false);
      if (raw === "1") setSimpleMode(true);
    } catch {
      setSimpleMode(true);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(DASHBOARD_SIMPLE_MODE_KEY, simpleMode ? "1" : "0");
  }, [simpleMode]);

  /* Nav items */
  const navItems = [
    { href: "/dashboard/control-center", icon: <Compass size={17} />, label: "מרכז תפעול", color: "emerald" },
    { href: "/dashboard/operations", icon: <BriefcaseBusiness size={17} />, label: "מרכז צמיחה", color: "sky" },
    { href: "/dashboard/operator", icon: <Cable size={17} />, label: "עוזר תפעולי", color: "indigo" },
    { href: "/dashboard",       icon: <LayoutDashboard size={17} />, label: t("dashboard.main"),         color: "blue" },
    { href: "/dashboard/crm",   icon: <Users size={17} />,           label: t("dashboard.crm"),          color: "violet" },
    { href: "/dashboard/erp",   icon: <FileText size={17} />,        label: t("dashboard.erp"),          color: "emerald" },
    { href: "/dashboard/erp/invoice", icon: <ReceiptText size={17} />, label: "חשבוניות", color: "rose" },
    ...(!simpleMode ? [{ href: "/dashboard/ai", icon: <Sparkles size={17} />, label: t("dashboard.aiHub"), color: "indigo" }] : []),
  ];

  const navItemsBottom = [
    ...(!simpleMode && canAccessIntelligenceDashboard(userRole) ? [
      { href: "/dashboard/intelligence", icon: <TrendingUp size={17} />, label: t("dashboard.intelligence"), color: "sky" },
    ] : []),
    { href: "/dashboard/billing",  icon: <CreditCard size={17} />, label: t("dashboard.billing"),  color: "rose" },
    { href: "/dashboard/settings", icon: <Settings size={17} />,   label: t("dashboard.settings"), color: "blue" },
    { href: "/dashboard/help", icon: <BookOpen size={17} />, label: "מדריך תפעול", color: "amber" },
  ];

  const drawerHidden = dir === "rtl" ? "translate-x-full pointer-events-none" : "-translate-x-full pointer-events-none";

  const titleMap: Record<string, string> = {
    "/dashboard/control-center": "מרכז תפעול",
    "/dashboard/operations": "מרכז צמיחה",
    "/dashboard/operator": "עוזר תפעולי",
    "/dashboard": t("dashboard.main"),
    "/dashboard/crm": t("dashboard.crm"),
    "/dashboard/erp": t("dashboard.erp"),
    "/dashboard/erp/invoice": "מערכת חשבוניות",
    "/dashboard/ai": t("dashboard.aiHub"),
    "/dashboard/intelligence": t("dashboard.intelligence"),
    "/dashboard/billing": t("dashboard.billing"),
    "/dashboard/settings": t("dashboard.settings"),
    "/dashboard/help": "מדריך תפעול",
    "/dashboard/admin": "Admin",
  };
  const pageTitle = titleMap[pathname] ?? "BSD-YBM";

  const NavContent = ({ onNav }: { onNav?: () => void }) => (
    <>
      <div className="space-y-0.5">
        {navItems.map((item) => (
          <SidebarLink key={item.href} {...item} onClick={onNav} isActive={routeActive(pathname, item.href)} />
        ))}
      </div>
      <div className="my-3 border-t border-white/6" />
      <div className="space-y-0.5">
        {navItemsBottom.map((item) => (
          <SidebarLink key={item.href} {...item} onClick={onNav} isActive={routeActive(pathname, item.href)} />
        ))}
      </div>
      {showAdmin && !simpleMode && (
        <>
          <div className="my-3 border-t border-white/6" />
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
    <div className="border-t border-white/6 p-3">
      <div className="flex items-center gap-3 rounded-xl px-2 py-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-black text-white shadow">
          {serverUser.image ? (
            <Image src={serverUser.image} alt="" width={36} height={36} className="h-9 w-9 rounded-lg object-cover" />
          ) : userInitials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-slate-200">{userName}</p>
          <p className="truncate text-[10px] text-slate-500">{serverEmail}</p>
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="shrink-0 rounded-lg p-2 text-slate-600 hover:bg-rose-500/15 hover:text-rose-400 transition-colors"
          title="התנתקות"
        >
          <LogOut size={14} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen max-w-[100vw] overflow-x-hidden bg-[#f4f6fa]" dir={dir}>

      {/* ═══ SIDEBAR — Desktop ═══ */}
      <aside
        className="hidden w-56 shrink-0 flex-col md:fixed md:inset-y-0 md:start-0 md:flex"
        style={{
          background: "#0c1221",
          borderInlineEnd: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 px-5 py-5 hover:opacity-80 transition-opacity">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-black text-white shadow-md">
            B
          </div>
          <div>
            <p className="text-sm font-black text-white leading-none tracking-tight">
              BSD<span className="text-indigo-400">-YBM</span>
            </p>
            <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-slate-600 mt-0.5">Platform</p>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-2">
          <NavContent />
        </nav>

        {/* Language */}
        <div className="px-3 py-1">
          <LanguageSwitcher showLabel className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-semibold text-slate-500 hover:bg-white/5 hover:text-slate-300 transition-colors" />
        </div>

        <UserCard />
      </aside>

      {/* ═══ MOBILE BACKDROP ═══ */}
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-[180] bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close"
        />
      )}

      {/* ═══ MOBILE DRAWER ═══ */}
      <aside
        className={`fixed inset-y-0 start-0 z-[190] flex w-64 flex-col shadow-2xl transition-transform duration-250 ease-out md:hidden ${
          mobileOpen ? "translate-x-0" : drawerHidden
        }`}
        style={{ background: "#0c1221", borderInlineEnd: "1px solid rgba(255,255,255,0.04)" }}
        aria-hidden={!mobileOpen}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/6">
          <Link href="/" className="text-sm font-black text-white" onClick={() => setMobileOpen(false)}>
            BSD<span className="text-indigo-400">-YBM</span>
          </Link>
          <button type="button" className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors" onClick={() => setMobileOpen(false)}>
            <X size={16} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          <NavContent onNav={() => setMobileOpen(false)} />
        </nav>
        <UserCard />
      </aside>

      {/* ═══ MAIN AREA ═══ */}
      <main className="relative flex min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden md:ms-56" style={{ WebkitOverflowScrolling: "touch" }}>

        {/* Mobile header */}
        <div className="sticky top-0 z-[120] flex items-center justify-between gap-3 border-b border-slate-200/80 bg-white/95 px-4 py-3 shadow-sm backdrop-blur-md md:hidden">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-700 shadow-sm"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={16} className="text-indigo-600" />
          </button>
          <p className="text-sm font-black text-slate-900">BSD<span className="text-indigo-600">-YBM</span></p>
          <div className="flex items-center gap-1">
            <DashboardNotificationBell />
            <LanguageSwitcher />
          </div>
        </div>

        {/* Desktop header */}
        <header className="sticky top-0 z-[110] hidden items-center justify-between gap-4 border-b border-slate-200/60 bg-white/97 px-6 py-2.5 backdrop-blur-md md:flex">
          <div className="flex items-center gap-3">
            <p className="text-sm font-bold text-slate-800">{pageTitle}</p>
            <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500" dir="ltr">{serverEmail}</span>
            {showAdmin && <span className="rounded-lg bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">Admin</span>}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSimpleMode((v) => !v)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              {simpleMode ? "מצב פשוט" : "מצב מתקדם"}
            </button>
            <DashboardNotificationBell />
            <Link href="/" className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors">
              לאתר
            </Link>
          </div>
        </header>

        {/* Content */}
        <div className="flex flex-1 flex-col gap-5 p-4 pb-[max(7rem,env(safe-area-inset-bottom,0px))] sm:p-5 md:p-6 md:pb-14">

          {trialBannerDaysLeft !== null && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-indigo-600 shrink-0" />
                <p className="text-sm font-bold text-indigo-900">
                  {trialBannerDaysLeft === 1 ? t("layout.trialBannerOne") : t("layout.trialBannerMany", { days: String(trialBannerDaysLeft) })}
                </p>
              </div>
              <Link href="/dashboard/billing" className="shrink-0 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition-colors">
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
