"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  BookOpen, Compass, CreditCard, LayoutDashboard, Layers,
  LogOut, Menu, ReceiptText, Settings, Shield, X, Zap, Clock,
  ChevronRight, Bot, Users as UsersIcon, ShieldCheck
} from "lucide-react";
import DashboardBottomDock from "@/components/DashboardBottomDock";
import PostRegisterWelcomeSheet from "@/components/PostRegisterWelcomeSheet";
import DashboardNotificationBell from "@/components/DashboardNotificationBell";
import { useI18n } from "@/components/I18nProvider";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useIndustryConfig } from "@/hooks/use-industry-config";
import AdminSystemHealth from "@/components/admin/AdminSystemHealth";

function routeActive(pathname: string, href: string): boolean {
  const p = pathname.replace(/\/$/, "") || "/";
  const h = href.replace(/\/$/, "") || "/";
  if (h === "/dashboard") return p === "/dashboard";
  if (h === "/dashboard/admin") return p === "/dashboard/admin";
  return p === h || p.startsWith(`${h}/`);
}

const COLOR_MAP: Record<string, { active: string; dot: string }> = {
  indigo:  { active: "bg-indigo-50 text-indigo-700 border-indigo-200",   dot: "bg-indigo-500" },
  emerald: { active: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  rose:    { active: "bg-rose-50 text-rose-700 border-rose-200",          dot: "bg-rose-500" },
  sky:     { active: "bg-sky-50 text-sky-700 border-sky-200",             dot: "bg-sky-500" },
  amber:   { active: "bg-amber-50 text-amber-700 border-amber-200",       dot: "bg-amber-500" },
  violet:  { active: "bg-violet-50 text-violet-700 border-violet-200",    dot: "bg-violet-500" },
  slate:   { active: "bg-slate-50 text-slate-700 border-slate-200",       dot: "bg-slate-500" },
};

function SidebarLink({
  href, icon, label, badge, onClick, isActive, color = "indigo",
}: {
  href: string; icon: ReactNode; label: string; badge?: string;
  onClick?: () => void; isActive: boolean; color?: string;
}) {
  const c = COLOR_MAP[color] ?? COLOR_MAP.indigo;
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all duration-150 ${
        isActive
          ? `${c.active} border`
          : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
      }`}
    >
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
        isActive ? "text-current" : "text-gray-400 group-hover:text-gray-600"
      }`}>
        {icon}
      </span>
      <span className="flex-1 truncate leading-none">{label}</span>
      {badge && (
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500">{badge}</span>
      )}
      {isActive && <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${c.dot}`} />}
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
  children, orgId, userRole, isAdminUser, trialBannerDaysLeft, serverUser,
}: Props) {
  const { t, locale, dir } = useI18n();
  const industry = useIndustryConfig();
  const pathname = usePathname() ?? "";
  const [mobileOpen, setMobileOpen] = useState(false);

  const serverEmail = serverUser.email.trim();
  const userName = serverUser.name ?? serverEmail.split("@")[0] ?? "User";
  const userInitials = userName.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase();

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [mobileOpen]);

  const navItems = [
    { href: "/dashboard",             icon: <LayoutDashboard size={15} />, label: t("dashboard.main"),     color: "indigo"  },
    { href: "/dashboard/control-center", icon: <ShieldCheck size={15} />, label: "מרכז בקרה אחוד (Master)", color: "emerald" },
    { href: "/dashboard/ai",          icon: <Zap size={15} />,            label: t("dashboard.aiHub"),    color: "violet"  },
    { href: "/dashboard/invoices",    icon: <ReceiptText size={15} />,    label: "מערכת חשבוניות",     color: "rose"    },
  ];

  const toolItems = [
    { href: "/dashboard/settings",    icon: <Settings size={15} />,       label: "הגדרות פלטפורמה",      color: "slate"   },
    { href: "/dashboard/meckano",    icon: <Clock size={15} />,          label: t("dashboard.meckano"),  color: "sky"     },
    { href: "/dashboard/help",           icon: <BookOpen size={15} />, label: t("dashboard.nav.tutorial"), color: "amber"   },
  ];

  const pageTitle = (() => {
    if (routeActive(pathname, "/dashboard/control-center")) return "מרכז בקרה אחוד";
    if (routeActive(pathname, "/dashboard/ai"))             return t("dashboard.aiHub");
    if (routeActive(pathname, "/dashboard/settings"))       return "הגדרות פלטפורמה";
    if (routeActive(pathname, "/dashboard/meckano"))        return t("dashboard.meckano");
    if (routeActive(pathname, "/dashboard/help"))           return t("dashboard.nav.tutorial");
    if (routeActive(pathname, "/dashboard/invoices"))       return "ניהול כספים וחשבוניות";
    if (routeActive(pathname, "/dashboard/admin"))          return t("dashboard.nav.admin");
    return t("dashboard.main");
  })();

  const SectionLabel = ({ label }: { label: string }) => (
    <div className="mb-1 mt-5 px-3 first:mt-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">{label}</p>
    </div>
  );

  const NavContent = ({ onNav }: { onNav?: () => void }) => (
    <div className="space-y-0.5">
      <SectionLabel label={t("dashboard.nav.main")} />
      {navItems.map((item) => (
        <SidebarLink key={item.href} {...item} onClick={onNav} isActive={routeActive(pathname, item.href)} />
      ))}
      <SectionLabel label={t("dashboard.nav.tools")} />
      {toolItems.map((item) => (
        <SidebarLink key={item.href} {...item} onClick={onNav} isActive={routeActive(pathname, item.href)} />
      ))}
      {isAdminUser && (
        <>
          <SectionLabel label={t("dashboard.nav.admin")} />
          <SidebarLink
            href="/dashboard/admin"
            icon={<Shield size={15} />}
            label={t("dashboard.nav.admin")}
            badge="🔑"
            onClick={onNav}
            isActive={routeActive(pathname, "/dashboard/admin")}
            color="amber"
          />
        </>
      )}
    </div>
  );

  const UserCard = () => (
    <div className="border-t border-gray-100 bg-gray-50/80 p-3">
      <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-3 py-2.5 shadow-sm">
        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-xs font-black text-white">
          {serverUser.image ? (
            <Image src={serverUser.image} alt="" width={36} height={36} className="h-9 w-9 rounded-xl object-cover" />
          ) : userInitials}
          <span className="absolute -bottom-0.5 -end-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-bold leading-tight text-gray-900">{userName}</p>
          <p className="truncate text-[10px] leading-tight text-gray-400 mt-0.5">{serverEmail}</p>
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="shrink-0 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-rose-50 hover:text-rose-500"
          title={t("dashboard.nav.logout")}
        >
          <LogOut size={13} />
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5 px-1">
        <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold text-indigo-600">
          {(userRole || "").replaceAll("_", " ")}
        </span>
        <span className="rounded-full border border-gray-100 bg-gray-100 px-2.5 py-0.5 text-[10px] font-semibold text-gray-400" dir="ltr">
          ORG·{orgId.slice(-6).toUpperCase()}
        </span>
      </div>
    </div>
  );

  const SidebarShell = ({ onNav }: { onNav?: () => void }) => (
    <>
      <Link href="/" className="group flex items-center gap-3 border-b border-gray-100 px-5 py-5 transition-opacity hover:opacity-90" onClick={onNav}>
        <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-sm font-black text-white shadow-md shadow-indigo-200 transition-transform group-hover:scale-105">
          B
          <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-white" />
        </div>
        <div>
          <p className="text-[15px] font-black leading-tight tracking-wide text-gray-900">
              BSD-YBM פתרונות AI
          </p>
          <p className="mt-0.5 text-[10px] leading-none text-gray-400 font-medium">Business Platform</p>
        </div>
      </Link>
      <nav className="flex-1 overflow-y-auto px-3 py-1 thin-scrollbar">
        <NavContent onNav={onNav} />
      </nav>
      <div className="px-3 pb-2">
        <LanguageSwitcher
          showLabel
          className="flex w-full items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-[12px] font-semibold text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
        />
      </div>
      <UserCard />
    </>
  );

  return (
    <div className="flex min-h-screen max-w-[100vw] overflow-x-hidden bg-white md:bg-gray-50" dir={dir}>

      {/* SIDEBAR — Desktop */}
      <aside className="hidden w-64 shrink-0 flex-col border-e border-gray-200 bg-white md:fixed md:inset-y-0 md:start-0 md:flex">
        <SidebarShell />
      </aside>

      {/* MOBILE DRAWER */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-[180] bg-black/40 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside
            className={`fixed inset-y-0 start-0 z-[190] flex w-72 flex-col bg-white shadow-2xl transition-transform duration-300 md:hidden ${
              mobileOpen ? "translate-x-0" : (dir === "rtl" ? "translate-x-full" : "-translate-x-full")
            }`}
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-6 font-black text-gray-900">
              <span>BSD-YBM</span>
              <button onClick={() => setMobileOpen(false)} className="rounded-xl p-2 text-gray-400 hover:bg-gray-100"><X size={20} /></button>
            </div>
            <nav className="flex-1 overflow-y-auto px-4 py-2 thin-scrollbar"><NavContent onNav={() => setMobileOpen(false)} /></nav>
            <UserCard />
          </aside>
        </>
      )}

      {/* MAIN CONTENT */}
      <main className="relative flex min-w-0 flex-1 flex-col md:ms-64 pb-20 md:pb-0" style={{ WebkitOverflowScrolling: "touch" }}>
        
        {/* Header - Adaptive & Sleek */}
        <header className="sticky top-0 z-[150] flex h-16 shrink-0 items-center justify-between border-b border-gray-100 bg-white/80 px-4 backdrop-blur-xl md:px-8">
          <div className="flex items-center gap-3">
             <div className="md:hidden flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-[10px] font-black text-white shadow-lg shadow-indigo-200">B</div>
             <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
               <h2 
                 className="text-[13px] md:text-lg font-black text-gray-900 tracking-tight truncate max-w-[150px] md:max-w-none uppercase italic"
                 style={{ color: 'var(--heading-color, #111827)' }}
               >
                 {pageTitle}
               </h2>
               {isAdminUser && (
                 <div className="hidden lg:block">
                   <AdminSystemHealth />
                 </div>
               )}
             </div>
          </div>
          <div className="flex items-center gap-2">
            <DashboardNotificationBell />
            <button onClick={() => setMobileOpen(true)} className="md:hidden rounded-xl p-2 text-gray-400 hover:bg-gray-100">
               <Menu size={20} />
            </button>
          </div>
        </header>

        {/* Page content */}
        <div className="mx-auto flex w-full flex-1 flex-col px-4 py-4 md:px-8 md:py-7">
           <div key={pathname} className="min-h-0 min-w-0 max-w-full flex-1">
             {children}
           </div>
        </div>

        {/* MOBILE NAVIGATION DOCK (Touch Friendly) */}
        <div className="fixed bottom-0 left-0 right-0 z-[200] flex h-16 items-center justify-around border-t border-gray-100 bg-white/95 pb-safe backdrop-blur-xl md:hidden shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
           <Link href="/dashboard" className={`flex flex-col items-center gap-1 transition-colors ${pathname === "/dashboard" ? "text-indigo-600" : "text-gray-400"}`}>
             <LayoutDashboard size={20} />
             <span className="text-[8px] font-black uppercase tracking-wider">{t("dashboard.nav.home")}</span>
           </Link>
           <Link href="/dashboard/control-center" className={`flex flex-col items-center gap-1 transition-colors ${pathname.includes("/control-center") ? "text-indigo-600" : "text-gray-400"}`}>
             <ShieldCheck size={20} />
             <span className="text-[8px] font-black uppercase tracking-wider">Master</span>
           </Link>
           <div className="relative -top-5">
             <Link href="/dashboard/ai" className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-xl shadow-indigo-500/40 ring-4 ring-white active:scale-95 transition-transform">
               <Zap size={24} />
             </Link>
           </div>
           <Link href="/dashboard/settings" className={`flex flex-col items-center gap-1 transition-colors ${pathname.includes("/settings") ? "text-indigo-600" : "text-gray-400"}`}>
             <Settings size={20} />
             <span className="text-[8px] font-black uppercase tracking-wider">Settings</span>
           </Link>
           <button onClick={() => setMobileOpen(true)} className="flex flex-col items-center gap-1 text-gray-400">
             <Menu size={20} />
             <span className="text-[8px] font-black uppercase tracking-wider">{t("dashboard.nav.more")}</span>
           </button>
        </div>

        <PostRegisterWelcomeSheet />
        <DashboardBottomDock orgId={orgId} />
      </main>
    </div>
  );
}
