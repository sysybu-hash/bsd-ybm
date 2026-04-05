import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import {
  Bot,
  CreditCard,
  LayoutDashboard,
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
    {
      icon: Users,      label: "לקוחות CRM",   value: "—",  href: "/dashboard/business",
      chipBg: "bg-indigo-100", chipText: "text-indigo-700", iconBg: "bg-indigo-600",
    },
    {
      icon: ReceiptText, label: "חשבוניות ERP", value: "—",  href: "/dashboard/erp/invoice",
      chipBg: "bg-indigo-100",   chipText: "text-indigo-700",   iconBg: "bg-indigo-600",
    },
    {
      icon: FileStack,   label: "מסמכים",       value: "—",  href: "/dashboard/business",
      chipBg: "bg-emerald-100",chipText: "text-emerald-700",iconBg: "bg-emerald-600",
    },
    {
      icon: TrendingUp,  label: "הכנסות",       value: "₪—", href: "/dashboard/erp/invoice",
      chipBg: "bg-amber-100",  chipText: "text-amber-700",  iconBg: "bg-amber-500",
    },
  ];

  const quickActions = [
    {
      href: "/dashboard/business",
      icon: <Layers size={20} />,
      title: "מרכז עסקי",
      description: "ERP ו-CRM בחלון אחד — לקוחות, עסקאות וחשבוניות.",
      badge: "ERP + CRM",
      iconBg: "bg-emerald-600",
      badgeBg: "bg-emerald-100 text-emerald-700",
      hoverBorder: "hover:border-emerald-300",
    },
    {
      href: "/dashboard/erp/invoice",
      icon: <ReceiptText size={20} />,
      title: "הנפק חשבונית",
      description: "יצירה מהירה של חשבונית מס, קבלה או הצעת מחיר.",
      badge: "ERP",
      iconBg: "bg-indigo-600",
      badgeBg: "bg-indigo-100 text-indigo-700",
      hoverBorder: "hover:border-indigo-300",
    },
    {
      href: "/dashboard/control-center",
      icon: <Compass size={20} />,
      title: "מרכז עבודה",
      description: "ניהול כל המשימות, הלידים ותהליכי העבודה שלך.",
      badge: "מיקוד",
      iconBg: "bg-indigo-600",
      badgeBg: "bg-indigo-100 text-indigo-700",
      hoverBorder: "hover:border-indigo-300",
    },
    {
      href: "/dashboard/settings",
      icon: <Settings size={20} />,
      title: "הגדרות",
      description: "פרטי עסק, חיבורי תשלום, גיבויים ומשתמשים.",
      badge: "הגדרות",
      iconBg: "bg-gray-600",
      badgeBg: "bg-gray-100 text-gray-600",
      hoverBorder: "hover:border-gray-300",
    },
  ];

  const shortcuts = [
    { href: "/dashboard/operator",  icon: <Bot size={14} />,          label: "עוזר AI",         color: "text-indigo-600 bg-indigo-50" },
    { href: "/dashboard/billing",   icon: <CreditCard size={14} />,   label: "מנוי ותשלום",     color: "text-rose-600 bg-rose-50" },
    { href: "/dashboard/meckano",   icon: <Clock size={14} />,        label: "נוכחות",           color: "text-sky-600 bg-sky-50" },
    { href: "/dashboard/business",  icon: <BarChart3 size={14} />,    label: "דוחות",            color: "text-amber-600 bg-amber-50" },
  ];

  return (
    <div className="space-y-7" dir="rtl">

      {/* ══ WELCOME BANNER ══ */}
      <section className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-600 via-indigo-600 to-indigo-700 px-6 py-7 shadow-lg shadow-indigo-600/20 md:px-8 md:py-8">
        {/* Decorative elements */}
        <div className="absolute -end-8 -top-8 h-40 w-40 rounded-full bg-white/5" aria-hidden />
        <div className="absolute -start-4 bottom-0 h-24 w-24 rounded-full bg-white/5" aria-hidden />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold text-white border border-white/20">
              <Zap size={10} className="text-yellow-300" />
              BSD-YBM Platform
            </span>
            <h1 className="mt-3 text-2xl font-black text-white tracking-tight md:text-3xl">
              {greeting}, {userName} 👋
            </h1>
            <p className="mt-2 max-w-lg text-sm text-indigo-200 leading-relaxed">
              הכל מחובר ומסונכרן — ERP, CRM, סריקות ובינה מלאכותית.
            </p>
          </div>
          <Link
            href="/dashboard/business"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-indigo-700 shadow-sm transition-all hover:bg-indigo-50 hover:shadow-md"
          >
            פתח מרכז עסקי
            <ArrowLeft size={14} />
          </Link>
        </div>
      </section>

      {/* ══ STATS ROW ══ */}
      <section>
        <h2 className="mb-3 text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">סיכום</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map(({ icon: Icon, label, value, href, chipBg, chipText, iconBg }) => (
            <Link
              key={label}
              href={href}
              className="group flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg"
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${iconBg} text-white shadow-md`}>
                <Icon size={18} />
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900">{value}</p>
                <p className="mt-0.5 text-[11px] font-semibold text-gray-400">{label}</p>
              </div>
              <span className={`w-fit rounded-full px-3 py-0.5 text-[10px] font-black ${chipBg} ${chipText}`}>
                פתח →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ══ QUICK ACTIONS ══ */}
      <section>
        <h2 className="mb-3 text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">פעולות ראשיות</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map(({ href, icon, title, description, badge, iconBg, badgeBg, hoverBorder }) => (
            <Link
              key={href}
              href={href}
              className={`group flex flex-col gap-4 overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${hoverBorder}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconBg} text-white shadow-md`}>
                  {icon}
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${badgeBg}`}>
                  {badge}
                </span>
              </div>
              <div>
                <h3 className="text-[14px] font-black text-gray-900">{title}</h3>
                <p className="mt-1 text-[12px] leading-relaxed text-gray-500">{description}</p>
              </div>
              <span className="mt-auto flex items-center gap-1 text-[12px] font-black text-indigo-600 opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-[-2px]">
                פתח <ArrowLeft size={11} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ══ SHORTCUT CHIPS ══ */}
      <section>
        <h2 className="mb-3 text-xs font-black uppercase tracking-widest text-gray-400">קיצורי דרך</h2>
        <div className="flex flex-wrap gap-2">
          {shortcuts.map(({ href, icon, label, color }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 rounded-full border border-gray-100 bg-white px-4 py-2 text-[13px] font-bold shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${color.split(" ")[0]}`}
            >
              <span className={`flex h-6 w-6 items-center justify-center rounded-full ${color.split(" ")[1]}`}>
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