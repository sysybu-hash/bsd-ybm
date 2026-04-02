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
  TrendingUp,
  ChevronRight,
  ChevronLeft,
  Zap,
  LogOut,
  Bell,
} from "lucide-react";
import DashboardBottomDock from "@/components/DashboardBottomDock";
import PostRegisterWelcomeSheet from "@/components/PostRegisterWelcomeSheet";
import DashboardNotificationBell from "@/components/DashboardNotificationBell";
import { useI18n } from "@/components/I18nProvider";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { canAccessIntelligenceDashboard } from "@/lib/intelligence-access";
import { isAdmin } from "@/lib/is-admin";
import { signOut } from "next-auth/react";

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
  sublabel?: string;
  onClick?: () => void;
  badge?: ReactNode;
  variant?: "default" | "admin";
  accent?: string;
};

function NavItem({ href, icon, label, sublabel, onClick, badge, variant = "default", accent }: NavItemProps) {
  const pathname = usePathname() ?? "";
  const active = routeActive(pathname, href);
  const { dir } = useI18n();

  if (variant === "admin") {
    return (
      <Link
        href={href}
        onClick={onClick}
        className={`group relative flex w-full min-w-0 items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-bold transition-all duration-200 ${
          active
            ? "bg-gradient-to-l from-amber-500/20 to-orange-500/10 text-amber-300 shadow-inner"
            : "text-amber-500/70 hover:bg-amber-500/10 hover:text-amber-400"
        }`}
      >
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all ${
          active ? "bg-amber-500/20 text-amber-400" : "bg-amber-500/10 text-amber-500/60 group-hover:bg-amber-500/20 group-hover:text-amber-400"
        }`}>
          {icon}
        </span>
        <span className="min-w-0 flex-1 truncate">{label}</span>
        {badge}
        {active && (
          <span className="flex h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
        )}
      </Link>
    );
  }

  const accentColor = accent ?? "blue";
  const accentMap: Record<string, { bg: string; text: string; dot: string; iconBg: string }> = {
    blue:    { bg: "bg-blue-500/15",    text: "text-blue-300",    dot: "bg-blue-400",    iconBg: "bg-blue-500/20 text-blue-400" },
    violet:  { bg: "bg-violet-500/15",  text: "text-violet-300",  dot: "bg-violet-400",  iconBg: "bg-violet-500/20 text-violet-400" },
    emerald: { bg: "bg-emerald-500/15", text: "text-emerald-300", dot: "bg-emerald-400", iconBg: "bg-emerald-500/20 text-emerald-400" },
    sky:     { bg: "bg-sky-500/15",     text: "text-sky-300",     dot: "bg-sky-400",     iconBg: "bg-sky-500/20 text-sky-400" },
    indigo:  { bg: "bg-indigo-500/15",  text: "text-indigo-300",  dot: "bg-indigo-400",  iconBg: "bg-indigo-500/20 text-indigo-400" },
    rose:    { bg: "bg-rose-500/15",    text: "text-rose-300",    dot: "bg-rose-400",    iconBg: "bg-rose-500/20 text-rose-400" },
  };
  const c = accentMap[accentColor] ?? accentMap.blue;

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`group relative flex w-full min-w-0 items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${
        active
          ? `${c.bg} ${c.text} shadow-inner`
          : "text-slate-400 hover:bg-white/6 hover:text-slate-200"
      }`}
    >
      {/* Animated active pill indicator */}
      {active && (
        <motion.span
          layoutId="active-pill"
          className={`absolute inset-y-2 start-0 w-1 rounded-e-full ${c.dot}`}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}

      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all duration-200 ${
        active ? c.iconBg : "bg-white/6 text-slate-500 group-hover:bg-white/10 group-hover:text-slate-300"
      }`}>
        {icon}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate leading-tight">{label}</span>
        {sublabel && (
          <span className={`block truncate text-[10px] font-normal leading-tight ${active ? "opacity-70" : "text-slate-600"}`}>
            {sublabel}
          </span>
        )}
      </span>

      {badge}

      {active && (
        <span className={`flex h-1.5 w-1.5 shrink-0 rounded-full ${c.dot}`} />
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

  // שם מקוצר למשתמש
  const userName = serverUser.name ?? serverEmail.split("@")[0] ?? "משתמש";
  const userInitials = userName
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w[0])
    .join("")
    .toUpperCase();

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="flex w-full min-w-0 flex-col gap-0.5">

      {/* ── ניהול ── */}
      <p className="mb-1.5 mt-1 px-3.5 text-[9px] font-black uppercase tracking-[0.15em] text-slate-600">
        ניהול
      </p>
      <NavItem
        href="/dashboard"
        icon={<LayoutDashboard size={15} />}
        label={t("dashboard.main")}
        sublabel="סיכום ולוח בקרה"
        onClick={onNavigate}
        accent="blue"
      />
      <NavItem
        href="/dashboard/crm"
        icon={<Users size={15} />}
        label={t("dashboard.crm")}
        sublabel="לקוחות ולידים"
        onClick={onNavigate}
        accent="violet"
      />
      <NavItem
        href="/dashboard/erp"
        icon={<FileText size={15} />}
        label={t("dashboard.erp")}
        sublabel="מסמכים וחשבוניות"
        onClick={onNavigate}
        accent="emerald"
      />
      <NavItem
        href="/dashboard/ai"
        icon={<Sparkles size={15} />}
        label={t("dashboard.aiHub")}
        sublabel="מרכז בינה מלאכותית"
        onClick={onNavigate}
        accent="indigo"
      />
      {canAccessIntelligenceDashboard(userRole) && (
        <NavItem
          href="/dashboard/intelligence"
          icon={<TrendingUp size={15} />}
          label={t("dashboard.intelligence")}
          sublabel="ניתוח וחיזוי"
          onClick={onNavigate}
          accent="sky"
        />
      )}

      {/* ── חשבון ── */}
      <div className="my-3 border-t border-white/8" />
      <p className="mb-1.5 px-3.5 text-[9px] font-black uppercase tracking-[0.15em] text-slate-600">
        חשבון
      </p>
      <NavItem
        href="/dashboard/billing"
        icon={<CreditCard size={15} />}
        label={t("dashboard.billing")}
        sublabel="מנויים ותשלומים"
        onClick={onNavigate}
        accent="rose"
      />
      <NavItem
        href="/dashboard/settings"
        icon={<Settings size={15} />}
        label={t("dashboard.settings")}
        sublabel="הגדרות מערכת"
        onClick={onNavigate}
        accent="blue"
      />

      {/* ── Admin ── */}
      {showAdminLink && (
        <>
          <div className="my-3 border-t border-white/8" />
          <p className="mb-1.5 px-3.5 text-[9px] font-black uppercase tracking-[0.15em] text-amber-600/80">
            פלטפורמה
          </p>
          <NavItem
            href="/dashboard/admin"
            icon={<Shield size={15} />}
            label={t("dashboard.admin")}
            sublabel="ניהול מנויים ומערכת"
            onClick={onNavigate}
            variant="admin"
          />
        </>
      )}
    </nav>
  );

  const SidebarBottom = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div
      className="border-t border-white/8 pt-3 space-y-1"
      style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
    >
      <LanguageSwitcher showLabel className="text-slate-400 hover:text-slate-200 px-3.5 py-2 rounded-2xl hover:bg-white/6 transition-colors text-sm font-semibold w-full" />

      {/* User card */}
      <div className="flex items-center gap-3 rounded-2xl px-3.5 py-2.5 hover:bg-white/6 transition-colors group">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs font-black shadow-lg shadow-blue-900/30">
          {serverUser.image ? (
            <img src={serverUser.image} alt="" className="h-9 w-9 rounded-xl object-cover" />
          ) : (
            userInitials
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-slate-200 leading-tight">{userName}</p>
          <p className="truncate text-[10px] text-slate-500 leading-tight">{serverEmail}</p>
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="shrink-0 rounded-lg p-1.5 text-slate-600 hover:bg-rose-500/20 hover:text-rose-400 transition-colors"
          title="התנתקות"
        >
          <LogOut size={13} />
        </button>
      </div>
    </div>
  );

  return (
    <div
      className="flex min-h-app max-w-[100vw] overflow-x-hidden bg-[#f0f4f9] text-slate-900"
      dir={dir}
    >
      {/* ═══ SIDEBAR — Desktop ═══ */}
      <aside
        className="hidden w-[15.5rem] shrink-0 flex-col md:fixed md:inset-y-0 md:start-0 md:flex"
        style={{
          background: "linear-gradient(180deg, #0f1623 0%, #111827 100%)",
          borderInlineEnd: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/8">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-900/50 text-white font-black text-sm">
            B
          </div>
          <Link
            href="/"
            className="flex flex-col hover:opacity-80 transition-opacity"
          >
            <span className="text-[15px] font-black tracking-tight text-white leading-tight">
              BSD<span className="text-blue-400">-YBM</span>
            </span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 leading-tight">
              Business Platform
            </span>
          </Link>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto px-3 py-4 thin-scrollbar">
          <NavLinks />
        </div>

        {/* Bottom */}
        <div className="px-3">
          <SidebarBottom />
        </div>
      </aside>

      {/* ═══ BACKDROP — Mobile ═══ */}
      {mobileNavOpen && (
        <button
          type="button"
          className="fixed inset-0 z-[180] bg-black/60 backdrop-blur-sm md:hidden"
          aria-label={t("nav.close")}
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* ═══ DRAWER — Mobile ═══ */}
      <aside
        className={`fixed inset-y-0 start-0 z-[190] flex w-[min(17rem,90vw)] flex-col shadow-2xl transition-transform duration-250 ease-out md:hidden ${
          mobileNavOpen ? "translate-x-0" : drawerClosedTransform
        }`}
        style={{
          background: "linear-gradient(180deg, #0f1623 0%, #111827 100%)",
          borderInlineEnd: "1px solid rgba(255,255,255,0.06)",
          paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
        }}
        aria-hidden={!mobileNavOpen}
      >
        <div className="flex items-center justify-between gap-2 px-4 py-4 border-b border-white/8">
          <Link
            href="/"
            className="flex flex-col hover:opacity-80 transition-opacity"
            onClick={() => setMobileNavOpen(false)}
          >
            <span className="text-[15px] font-black tracking-tight text-white leading-tight">
              BSD<span className="text-blue-400">-YBM</span>
            </span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Business Platform</span>
          </Link>
          <button
            type="button"
            className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
            onClick={() => setMobileNavOpen(false)}
            aria-label={t("nav.close")}
          >
            <X size={17} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <NavLinks onNavigate={() => setMobileNavOpen(false)} />
        </div>

        <div className="px-3">
          <SidebarBottom />
        </div>
      </aside>

      {/* ═══ MAIN ═══ */}
      <main
        className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden md:ms-[15.5rem]"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {/* ── Mobile top bar ── */}
        <div
          className="sticky top-0 z-[120] flex items-center justify-between gap-3 border-b border-slate-200/80 bg-white/95 px-4 py-3 shadow-sm backdrop-blur-md md:hidden"
        >
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
            onClick={() => setMobileNavOpen(true)}
            aria-expanded={mobileNavOpen}
            aria-label={t("nav.open")}
          >
            <Menu size={17} className="text-blue-600" />
          </button>
          <Link href="/" className="text-base font-black tracking-tight text-slate-900">
            BSD<span className="text-blue-600">-YBM</span>
          </Link>
          <div className="flex items-center gap-1">
            <DashboardNotificationBell />
            <LanguageSwitcher />
          </div>
        </div>

        {/* ── Desktop top header ── */}
        <header className="sticky top-0 z-[110] hidden items-center justify-between gap-4 border-b border-slate-200/70 bg-white/96 px-6 py-3 backdrop-blur-md shadow-sm md:flex">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="font-semibold text-slate-800">{pageTitle}</span>
          </div>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <DashboardNotificationBell />
            <Link
              href="/"
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50 transition-colors"
            >
              ← לאתר
            </Link>
          </div>
        </header>

        {/* ── Page content ── */}
        <div className="flex flex-1 flex-col gap-5 p-4 pb-[max(7rem,env(safe-area-inset-bottom,0px))] sm:p-6 md:p-7 md:pb-14">

          {/* Trial banner */}
          {trialBannerDaysLeft !== null && (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-3.5 shadow-sm">
              <div className="flex items-center gap-2.5">
                <Zap size={16} className="text-blue-600 shrink-0" />
                <p className="text-sm font-bold text-blue-900">
                  {trialBannerDaysLeft === 1
                    ? t("layout.trialBannerOne")
                    : t("layout.trialBannerMany", { days: String(trialBannerDaysLeft) })}
                </p>
              </div>
              <Link
                href="/dashboard/billing"
                className="shrink-0 rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-black text-white shadow hover:bg-blue-700 transition-colors"
              >
                {t("layout.trialUpgrade")}
              </Link>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
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
