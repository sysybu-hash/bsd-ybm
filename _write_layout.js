const fs = require('fs');

const content = `"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Compass, CreditCard, LayoutDashboard, Layers,
  LogOut, Menu, ReceiptText, Settings, Shield, X, Zap, Clock,
  ChevronRight, Bot,
} from "lucide-react";
import DashboardBottomDock from "@/components/DashboardBottomDock";
import PostRegisterWelcomeSheet from "@/components/PostRegisterWelcomeSheet";
import DashboardNotificationBell from "@/components/DashboardNotificationBell";
import { useI18n } from "@/components/I18nProvider";
import LanguageSwitcher from "@/components/LanguageSwitcher";

function routeActive(pathname: string, href: string): boolean {
  const p = pathname.replace(/\\/$/, "") || "/";
  const h = href.replace(/\\/$/, "") || "/";
  if (h === "/dashboard") return p === "/dashboard";
  if (h === "/dashboard/admin") return p === "/dashboard/admin";
  return p === h || p.startsWith(\`\${h}/\`);
}

const COLOR_MAP: Record<string, { active: string; dot: string }> = {
  indigo:  { active: "bg-indigo-50 text-indigo-700 border-indigo-200",   dot: "bg-indigo-500" },
  emerald: { active: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  rose:    { active: "bg-rose-50 text-rose-700 border-rose-200",          dot: "bg-rose-500" },
  sky:     { active: "bg-sky-50 text-sky-700 border-sky-200",             dot: "bg-sky-500" },
  amber:   { active: "bg-amber-50 text-amber-700 border-amber-200",       dot: "bg-amber-500" },
  violet:  { active: "bg-violet-50 text-violet-700 border-violet-200",    dot: "bg-violet-500" },
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
      className={\`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all duration-150 \${
        isActive
          ? \`\${c.active} border\`
          : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
      }\`}
    >
      <span className={\`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg \${
        isActive ? "text-current" : "text-gray-400 group-hover:text-gray-600"
      }\`}>
        {icon}
      </span>
      <span className="flex-1 truncate leading-none">{label}</span>
      {badge && (
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500">{badge}</span>
      )}
      {isActive && <span className={\`h-1.5 w-1.5 shrink-0 rounded-full \${c.dot}\`} />}
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
  const { t, dir } = useI18n();
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

  useEffect(() => {
    const fn = () => { if (window.matchMedia("(min-width: 768px)").matches) setMobileOpen(false); };
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  const navItems = [
    { href: "/dashboard",             icon: <LayoutDashboard size={15} />, label: t("dashboard.main"),     color: "indigo"  },
    { href: "/dashboard/ai",          icon: <Zap size={15} />,            label: "AI וסריקה",             color: "violet"  },
    { href: "/dashboard/business",   icon: <Layers size={15} />,         label: "מרכז עסקי",             color: "emerald" },
    { href: "/dashboard/erp/invoice",icon: <ReceiptText size={15} />,    label: t("dashboard.invoices"), color: "rose"    },
    { href: "/dashboard/meckano",    icon: <Clock size={15} />,          label: t("dashboard.meckano"),  color: "sky"     },
    { href: "/dashboard/billing",    icon: <CreditCard size={15} />,     label: t("dashboard.billing"),  color: "indigo"  },
    { href: "/dashboard/settings",   icon: <Settings size={15} />,       label: t("dashboard.settings"), color: "indigo"  },
  ];

  const toolItems = [
    { href: "/dashboard/control-center", icon: <Compass size={15} />,  label: t("dashboard.mission"),   color: "emerald" },
    { href: "/dashboard/operator",       icon: <Bot size={15} />,      label: t("dashboard.executive"), color: "indigo"  },
    { href: "/dashboard/help",           icon: <BookOpen size={15} />, label: t("nav.tutorial"),        color: "amber"   },
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
    <div className="mb-1 mt-5 px-3 first:mt-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">{label}</p>
    </div>
  );

  const NavContent = ({ onNav }: { onNav?: () => void }) => (
    <div className="space-y-0.5">
      <SectionLabel label="ניווט ראשי" />
      {navItems.map((item) => (
        <SidebarLink key={item.href} {...item} onClick={onNav} isActive={routeActive(pathname, item.href)} />
      ))}
      <SectionLabel label="כלים" />
      {toolItems.map((item) => (
        <SidebarLink key={item.href} {...item} onClick={onNav} isActive={routeActive(pathname, item.href)} />
      ))}
      {isAdminUser && (
        <>
          <SectionLabel label="מנהל" />
          <SidebarLink
            href="/dashboard/admin"
            icon={<Shield size={15} />}
            label="Admin"
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
          title="התנתקות"
        >
          <LogOut size={13} />
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5 px-1">
        <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold text-indigo-600">
          {userRole.replaceAll("_", " ")}
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
            BSD<span className="text-indigo-600">-YBM</span>
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
    <div className="flex min-h-screen max-w-[100vw] overflow-x-hidden bg-gray-50" dir={dir}>

      {/* SIDEBAR — Desktop */}
      <aside className="hidden w-64 shrink-0 flex-col border-e border-gray-200 bg-white md:fixed md:inset-y-0 md:start-0 md:flex">
        <SidebarShell />
      </aside>

      {/* MOBILE BACKDROP */}
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-[180] bg-black/20 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close"
        />
      )}

      {/* MOBILE DRAWER */}
      <aside
        className={\`fixed inset-y-0 start-0 z-[190] flex w-64 flex-col border-e border-gray-200 bg-white shadow-xl transition-transform duration-300 ease-out md:hidden \${
          mobileOpen ? "translate-x-0" : (dir === "rtl" ? "translate-x-full pointer-events-none" : "-translate-x-full pointer-events-none")
        }\`}
        aria-hidden={!mobileOpen}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4">
          <span className="text-sm font-black text-gray-900">BSD<span className="text-indigo-600">-YBM</span></span>
          <button
            type="button"
            className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            onClick={() => setMobileOpen(false)}
          >
            <X size={16} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 thin-scrollbar">
          <NavContent onNav={() => setMobileOpen(false)} />
        </nav>
        <div className="px-3 pb-2">
          <LanguageSwitcher showLabel className="flex w-full items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-[12px] font-semibold text-gray-500" />
        </div>
        <UserCard />
      </aside>

      {/* MAIN CONTENT */}
      <main className="relative flex min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden md:ms-64" style={{ WebkitOverflowScrolling: "touch" }}>

        {/* Mobile topbar */}
        <div className="sticky top-0 z-[120] flex items-center justify-between gap-3 border-b border-gray-200 bg-white/95 px-4 py-3 shadow-sm md:hidden" style={{ backdropFilter: "blur(8px)" }}>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white p-2 text-gray-500 shadow-sm"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={16} />
          </button>
          <p className="text-sm font-black text-gray-900">BSD<span className="text-indigo-600">-YBM</span></p>
          <div className="flex items-center gap-1">
            <DashboardNotificationBell />
            <LanguageSwitcher />
          </div>
        </div>

        {/* Desktop header */}
        <header className="sticky top-0 z-[110] hidden border-b border-gray-200 bg-white/95 px-8 py-3.5 shadow-sm md:block" style={{ backdropFilter: "blur(12px)" }}>
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">BSD-YBM</span>
              <span className="text-gray-300">/</span>
              <h1 className="text-[15px] font-black text-gray-900">{pageTitle}</h1>
              {isAdminUser && (
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

        {/* Page content */}
        <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-5 pb-[max(7rem,env(safe-area-inset-bottom,0px))] sm:px-5 md:px-8 md:py-7 md:pb-14">

          {/* Trial banner */}
          {trialBannerDaysLeft !== null && (
            <div className="flex items-center justify-between gap-3 overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-600 to-indigo-500 px-5 py-4 shadow-md shadow-indigo-200">
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
                className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-black text-indigo-600 shadow-sm transition-all hover:shadow-md"
              >
                {t("layout.trialUpgrade")}
                <ChevronRight size={12} />
              </Link>
            </div>
          )}

          {/* Page */}
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
`;

fs.writeFileSync('C:/Users/User/Desktop/BSD-YBM/components/DashboardLayoutClient.tsx', content, 'utf8');
console.log('Done. Lines:', content.split('\n').length);
