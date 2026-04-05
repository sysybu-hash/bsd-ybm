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
  ArrowLeft,
  Zap,
  TrendingUp,
  Clock,
  FileStack,
} from "lucide-react";

export default async function DashboardHomePage() {
  const session = await getServerSession(authOptions);
  const userName = session?.user?.name?.split(" ")[0]?.trim() || "הצוות";
  const hour = new Date().getHours();
  const greeting =
    hour < 5 ? "לילה טוב" :
    hour < 12 ? "בוקר טוב" :
    hour < 17 ? "שלום" :
    hour < 21 ? "ערב טוב" : "לילה טוב";

  const stats = [
    { icon: Users,       label: "לקוחות CRM",   value: "—",  trend: "פתח CRM",    href: "/dashboard/business",    color: "from-violet-500 to-purple-600", glow: "shadow-violet-500/20" },
    { icon: ReceiptText, label: "חשבוניות ERP",  value: "—",  trend: "פתח ERP",    href: "/dashboard/erp/invoice", color: "from-blue-500 to-indigo-600",   glow: "shadow-blue-500/20" },
    { icon: FileStack,   label: "מסמכים סרוקים",value: "—",  trend: "פתח סורק",   href: "/dashboard/business",    color: "from-emerald-500 to-teal-600",  glow: "shadow-emerald-500/20" },
    { icon: TrendingUp,  label: "הכנסות החודש", value: "₪—", trend: "ניתוח מלא",  href: "/dashboard/erp/invoice", color: "from-amber-400 to-orange-500",  glow: "shadow-amber-400/20" },
  ];

  const quickActions = [
    {
      href: "/dashboard/business",
      icon: <Layers size={22} />,
      title: "מרכז עסקי",
      description: "ERP ו-CRM בחלון אחד — לקוחות, עסקאות וחשבוניות.",
      grad: "from-emerald-500 to-teal-600",
      glow: "shadow-emerald-500/25",
      badge: "ERP + CRM",
    },
    {
      href: "/dashboard/erp/invoice",
      icon: <ReceiptText size={22} />,
      title: "הנפק חשבונית",
      description: "יצירה מהירה של חשבונית מס, קבלה או הצעת מחיר.",
      grad: "from-blue-500 to-indigo-600",
      glow: "shadow-blue-500/25",
      badge: "ERP",
    },
    {
      href: "/dashboard/settings",
      icon: <Settings size={22} />,
      title: "הגדרות",
      description: "פרטי עסק, חיבורי תשלום, גיבויים ומשתמשים.",
      grad: "from-slate-600 to-slate-700",
      glow: "shadow-slate-500/25",
      badge: "הגדרות",
    },
  ];

  const utilityLinks = [
    { href: "/dashboard/control-center", icon: <LayoutDashboard size={15} />, label: "מרכז עבודה",      color: "text-emerald-600" },
    { href: "/dashboard/operator",       icon: <Bot size={15} />,             label: "עוזר AI תפעולי", color: "text-indigo-600" },
    { href: "/dashboard/billing",        icon: <CreditCard size={15} />,      label: "מנוי ותשלום",    color: "text-rose-600" },
    { href: "/dashboard/meckano",        icon: <Clock size={15} />,           label: "נוכחות",          color: "text-sky-600" },
  ];

  return (
    <div className="space-y-6" dir="rtl">

      {/* ══ HERO STRIP ══ */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-950 px-6 py-7 md:px-8 md:py-9">
        {/* Background glows */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 right-10 h-64 w-64 rounded-full bg-blue-600/15 blur-[80px]" />
          <div className="absolute bottom-0 left-20 h-40 w-40 rounded-full bg-violet-600/10 blur-[60px]" />
        </div>
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-600/10 px-3 py-1 text-[11px] font-bold text-blue-400">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
            BSD-YBM Platform
          </span>
          <h1 className="mt-3 text-2xl font-black text-white md:text-3xl">
            {greeting}, {userName} 👋
          </h1>
          <p className="mt-2 max-w-lg text-sm text-slate-400 leading-relaxed">
            הכל מחובר ומסונכרן — ERP, CRM, סריקות ובינה מלאכותית. בחר פעולה להתחיל.
          </p>
        </div>
      </section>

      {/* ══ STATS ROW ══ */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(({ icon: Icon, label, value, trend, href, color, glow }) => (
          <Link
            key={label}
            href={href}
            className="group flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white shadow-md ${glow}`}>
              <Icon size={17} />
            </div>
            <div>
              <p className="text-xl font-black text-slate-900">{value}</p>
              <p className="text-[11px] font-medium text-slate-500">{label}</p>
            </div>
            <p className="mt-auto flex items-center gap-1 text-[11px] font-bold text-blue-600 group-hover:gap-2 transition-all">
              {trend} <ArrowLeft size={10} />
            </p>
          </Link>
        ))}
      </section>

      {/* ══ QUICK ACTIONS ══ */}
      <section>
        <h2 className="mb-3 text-sm font-black uppercase tracking-widest text-slate-400">פעולות ראשיות</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {quickActions.map(({ href, icon, title, description, grad, glow, badge }) => (
            <Link
              key={href}
              href={href}
              className="group relative flex flex-col gap-4 overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              {/* Gradient icon */}
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${grad} text-white shadow-lg ${glow}`}>
                {icon}
              </div>
              {/* Badge */}
              <span className="absolute end-4 top-4 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-500">
                {badge}
              </span>
              <div>
                <h3 className="text-base font-black text-slate-900">{title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">{description}</p>
              </div>
              <span className="flex items-center gap-1 text-[12px] font-bold text-blue-600 opacity-0 transition-all group-hover:opacity-100">
                פתח <ArrowLeft size={11} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ══ UTILITY LINKS ══ */}
      <section>
        <h2 className="mb-3 text-sm font-black uppercase tracking-widest text-slate-400">פעולות נוספות</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {utilityLinks.map(({ href, icon, label, color }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-bold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow-md"
            >
              <span className={color}>{icon}</span>
              <span className="truncate">{label}</span>
              <ArrowLeft size={11} className="ms-auto opacity-0 text-slate-400 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))}
        </div>
      </section>

    </div>
  );
}
