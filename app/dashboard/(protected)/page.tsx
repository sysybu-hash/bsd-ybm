import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import {
  Bot,
  CreditCard,
  Layers,
  ReceiptText,
  Settings,
  Users,
  Clock,
  TrendingUp,
  FileStack,
  ArrowLeft,
  Zap,
  BarChart3,
  Compass,
} from "lucide-react";

export default async function DashboardHomePage() {
  const session = await getServerSession(authOptions);
  const userName = session?.user?.name?.split(" ")[0]?.trim() || "הצוות";
  const hour = new Date().getHours();
  const greeting =
    hour < 5  ? "לילה טוב"  :
    hour < 12 ? "בוקר טוב" :
    hour < 17 ? "צהריים טובים" :
    hour < 21 ? "ערב טוב"  : "לילה טוב";

  const stats = [
    { icon: Users,       label: "לקוחות CRM",   value: "—",  href: "/dashboard/business",    iconBg: "bg-indigo-500" },
    { icon: ReceiptText, label: "חשבוניות ERP", value: "—",  href: "/dashboard/erp/invoice", iconBg: "bg-indigo-500" },
    { icon: FileStack,   label: "מסמכים",       value: "—",  href: "/dashboard/business",    iconBg: "bg-emerald-500" },
    { icon: TrendingUp,  label: "הכנסות",       value: "₪—", href: "/dashboard/erp/invoice", iconBg: "bg-amber-500" },
  ];

  const quickActions = [
    {
      href: "/dashboard/business",
      icon: <Layers size={20} />,
      title: "מרכז עסקי",
      description: "ERP ו-CRM בחלון אחד — לקוחות, עסקאות וחשבוניות.",
      badge: "ERP + CRM",
      iconBg: "bg-emerald-500",
      badgeCls: "border-emerald-500/20 bg-emerald-500/[0.12] text-emerald-300",
      glowCls: "hover:shadow-emerald-500/[0.08]",
    },
    {
      href: "/dashboard/erp/invoice",
      icon: <ReceiptText size={20} />,
      title: "הנפק חשבונית",
      description: "יצירה מהירה של חשבונית מס, קבלה או הצעת מחיר.",
      badge: "ERP",
      iconBg: "bg-indigo-500",
      badgeCls: "border-indigo-500/20 bg-indigo-500/[0.12] text-indigo-300",
      glowCls: "hover:shadow-indigo-500/[0.08]",
    },
    {
      href: "/dashboard/control-center",
      icon: <Compass size={20} />,
      title: "מרכז עבודה",
      description: "ניהול כל המשימות, הלידים ותהליכי העבודה שלך.",
      badge: "מיקוד",
      iconBg: "bg-violet-500",
      badgeCls: "border-violet-500/20 bg-violet-500/[0.12] text-violet-300",
      glowCls: "hover:shadow-violet-500/[0.08]",
    },
    {
      href: "/dashboard/settings",
      icon: <Settings size={20} />,
      title: "הגדרות",
      description: "פרטי עסק, חיבורי תשלום, גיבויים ומשתמשים.",
      badge: "הגדרות",
      iconBg: "bg-white/[0.10]",
      badgeCls: "border-white/[0.08] bg-white/[0.06] text-white/45",
      glowCls: "hover:shadow-white/[0.04]",
    },
  ];

  const shortcuts = [
    { href: "/dashboard/operator",  icon: <Bot size={14} />,        label: "עוזר AI",     iconCls: "bg-indigo-500/[0.15] text-indigo-300" },
    { href: "/dashboard/billing",   icon: <CreditCard size={14} />, label: "מנוי ותשלום", iconCls: "bg-rose-500/[0.15] text-rose-300" },
    { href: "/dashboard/meckano",   icon: <Clock size={14} />,      label: "נוכחות",       iconCls: "bg-sky-500/[0.15] text-sky-300" },
    { href: "/dashboard/business",  icon: <BarChart3 size={14} />,  label: "דוחות",        iconCls: "bg-amber-500/[0.15] text-amber-300" },
  ];

  return (
    <div className="space-y-7" dir="rtl">

      {/* ══ WELCOME BANNER ══ */}
      <section className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-[#0d0e1c] px-6 py-7 shadow-lg shadow-indigo-500/[0.10] md:px-8 md:py-8">
        <div className="pointer-events-none absolute -end-12 -top-12 h-48 w-48 rounded-full bg-indigo-500/[0.07]" aria-hidden />
        <div className="pointer-events-none absolute -start-8 bottom-0 h-32 w-32 rounded-full bg-violet-500/[0.05]" aria-hidden />
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 50% 70% at 80% 50%, rgba(99,102,241,0.08) 0%, transparent 70%)" }} aria-hidden />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.10] bg-white/[0.06] px-3 py-1 text-[11px] font-bold text-white/70">
              <Zap size={10} className="text-yellow-400" />
              BSD-YBM Platform
            </span>
            <h1 className="mt-3 text-2xl font-black text-white tracking-tight md:text-3xl">
              {greeting}, {userName} 👋
            </h1>
            <p className="mt-2 max-w-lg text-sm text-white/50 leading-relaxed">
              הכל מחובר ומסונכרן — ERP, CRM, סריקות ובינה מלאכותית.
            </p>
          </div>
          <Link
            href="/dashboard/business"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/[0.12] bg-white/[0.08] px-5 py-3 text-sm font-black text-white shadow-sm transition-all hover:bg-white/[0.13] hover:shadow-md"
          >
            פתח מרכז עסקי
            <ArrowLeft size={14} />
          </Link>
        </div>
      </section>

      {/* ══ STATS ROW ══ */}
      <section>
        <h2 className="mb-3 text-[10px] font-black uppercase tracking-[0.15em] text-white/25">סיכום</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map(({ icon: Icon, label, value, href, iconBg }) => (
            <Link
              key={label}
              href={href}
              className="group flex flex-col gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 transition-all duration-200 hover:-translate-y-1 hover:border-white/[0.12] hover:bg-white/[0.05]"
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${iconBg} text-white shadow-md`}>
                <Icon size={18} />
              </div>
              <div>
                <p className="text-2xl font-black text-white">{value}</p>
                <p className="mt-0.5 text-[11px] font-semibold text-white/40">{label}</p>
              </div>
              <span className="w-fit rounded-full border border-white/[0.08] bg-white/[0.05] px-3 py-0.5 text-[10px] font-black text-white/50">
                פתח →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ══ QUICK ACTIONS ══ */}
      <section>
        <h2 className="mb-3 text-[10px] font-black uppercase tracking-[0.15em] text-white/25">פעולות ראשיות</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map(({ href, icon, title, description, badge, iconBg, badgeCls, glowCls }) => (
            <Link
              key={href}
              href={href}
              className={`group flex flex-col gap-4 overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 transition-all duration-200 hover:-translate-y-1 hover:border-white/[0.12] hover:bg-white/[0.05] hover:shadow-xl ${glowCls}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconBg} text-white shadow-md`}>
                  {icon}
                </div>
                <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${badgeCls}`}>
                  {badge}
                </span>
              </div>
              <div>
                <h3 className="text-[14px] font-black text-white">{title}</h3>
                <p className="mt-1 text-[12px] leading-relaxed text-white/45">{description}</p>
              </div>
              <span className="mt-auto flex items-center gap-1 text-[12px] font-black text-indigo-400 opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:-translate-x-0.5">
                פתח <ArrowLeft size={11} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ══ SHORTCUT CHIPS ══ */}
      <section>
        <h2 className="mb-3 text-xs font-black uppercase tracking-widest text-white/25">קיצורי דרך</h2>
        <div className="flex flex-wrap gap-2">
          {shortcuts.map(({ href, icon, label, iconCls }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-[13px] font-bold text-white/65 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-white/[0.07] hover:text-white"
            >
              <span className={`flex h-6 w-6 items-center justify-center rounded-full ${iconCls}`}>
                {icon}
              </span>
              {label}
            </Link>
          ))}
        </div>
      </section>

    </div>
  );
}