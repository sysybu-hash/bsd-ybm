import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import {
  Bot, CreditCard, Layers, ReceiptText, Settings, Users,
  Clock, TrendingUp, FileStack, Zap, BarChart3, Compass,
  ArrowRight, Plus, ChevronRight,
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
    { icon: Users,       label: "לקוחות",     value: "—",  href: "/dashboard/business",    bg: "bg-indigo-50",  icon2: "text-indigo-600",  border: "border-indigo-100" },
    { icon: ReceiptText, label: "חשבוניות",   value: "—",  href: "/dashboard/erp/invoice", bg: "bg-rose-50",    icon2: "text-rose-600",    border: "border-rose-100"   },
    { icon: FileStack,   label: "מסמכים",     value: "—",  href: "/dashboard/business",    bg: "bg-emerald-50", icon2: "text-emerald-600", border: "border-emerald-100"},
    { icon: TrendingUp,  label: "הכנסות",     value: "₪—", href: "/dashboard/erp/invoice", bg: "bg-amber-50",   icon2: "text-amber-600",   border: "border-amber-100"  },
  ];

  const quickActions = [
    {
      href: "/dashboard/business",
      icon: <Layers size={20} />,
      title: "מרכז עסקי",
      desc: "ERP + CRM — לקוחות, עסקאות, חשבוניות",
      badge: "ERP + CRM",
      iconBg: "bg-emerald-500",
      badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-100",
      ring: "hover:ring-emerald-200",
    },
    {
      href: "/dashboard/erp/invoice",
      icon: <ReceiptText size={20} />,
      title: "הנפק חשבונית",
      desc: "חשבונית מס, קבלה או הצעת מחיר",
      badge: "ERP",
      iconBg: "bg-rose-500",
      badgeBg: "bg-rose-50 text-rose-700 border-rose-100",
      ring: "hover:ring-rose-200",
    },
    {
      href: "/dashboard/ai",
      icon: <Zap size={20} />,
      title: "AI וסריקה",
      desc: "סריקת מסמכים וחילוץ נתונים בינה מלאכותית",
      badge: "AI",
      iconBg: "bg-violet-500",
      badgeBg: "bg-violet-50 text-violet-700 border-violet-100",
      ring: "hover:ring-violet-200",
    },
    {
      href: "/dashboard/control-center",
      icon: <Compass size={20} />,
      title: "מרכז בקרה",
      desc: "צ'קליסט, ניתוחי משפך ותהליכי עבודה",
      badge: "בקרה",
      iconBg: "bg-indigo-500",
      badgeBg: "bg-indigo-50 text-indigo-700 border-indigo-100",
      ring: "hover:ring-indigo-200",
    },
  ];

  const shortcuts = [
    { href: "/dashboard/operator",  icon: <Bot size={13} />,        label: "עוזר AI"  },
    { href: "/dashboard/billing",   icon: <CreditCard size={13} />, label: "מנוי"     },
    { href: "/dashboard/meckano",   icon: <Clock size={13} />,      label: "נוכחות"   },
    { href: "/dashboard/settings",  icon: <Settings size={13} />,   label: "הגדרות"   },
  ];

  return (
    <div className="space-y-6" dir="rtl">

      {/* ── WELCOME ── */}
      <section className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 px-7 py-8 shadow-lg shadow-indigo-200">
        <div className="pointer-events-none absolute -start-10 -top-10 h-40 w-40 rounded-full bg-gray-50" />
        <div className="pointer-events-none absolute -end-8 bottom-0 h-28 w-28 rounded-full bg-gray-50" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/20 px-3 py-1 text-[11px] font-bold text-white">
              <Zap size={10} className="text-yellow-300" />
              BSD-YBM Platform — אפריל 2026
            </span>
            <h1 className="mt-3 text-2xl font-black tracking-tight text-gray-900 md:text-3xl">
              {greeting}, {userName} 👋
            </h1>
            <p className="mt-2 max-w-md text-sm text-gray-600 leading-relaxed">
              ERP + CRM מסונכרנים, בינה מלאכותית, וסריקת מסמכים — הכל במקום אחד.
            </p>
          </div>
          <Link
            href="/dashboard/business"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-indigo-700 shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5"
          >
            פתח מרכז עסקי
            <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* ── STATS ── */}
      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">סיכום</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map(({ icon: Icon, label, value, href, bg, icon2, border }) => (
            <Link
              key={label}
              href={href}
              className="group flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-200 hover:shadow-md"
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg} ${icon2} border ${border}`}>
                <Icon size={18} />
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900">{value}</p>
                <p className="mt-0.5 text-[11px] font-semibold text-gray-400">{label}</p>
              </div>
              <span className="w-fit flex items-center gap-1 text-[11px] font-semibold text-gray-400 group-hover:text-indigo-600 transition-colors">
                צפה <ChevronRight size={10} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── QUICK ACTIONS ── */}
      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">פעולות ראשיות</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map(({ href, icon, title, desc, badge, iconBg, badgeBg, ring }) => (
            <Link
              key={href}
              href={href}
              className={`group flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ring-2 ring-transparent transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-200 hover:shadow-md ${ring}`}
            >
              <div className="flex items-center justify-between">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg} text-white shadow-sm`}>
                  {icon}
                </span>
                <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${badgeBg}`}>{badge}</span>
              </div>
              <div>
                <p className="text-[15px] font-black text-gray-900">{title}</p>
                <p className="mt-1 text-[12px] text-gray-500 leading-relaxed">{desc}</p>
              </div>
              <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 opacity-0 transition-opacity group-hover:opacity-100">
                פתח <ArrowRight size={10} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── SHORTCUTS + NEW INVOICE ── */}
      <section className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">קיצורי דרך:</span>
        {shortcuts.map(({ href, icon, label }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-[12px] font-semibold text-gray-600 shadow-sm transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
          >
            <span className="text-gray-400">{icon}</span>
            {label}
          </Link>
        ))}
        <Link
          href="/dashboard/erp/invoice"
          className="ms-auto flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-[12px] font-bold text-white shadow-sm transition-all hover:bg-indigo-700"
        >
          <Plus size={13} />
          חשבונית חדשה
        </Link>
      </section>

    </div>
  );
}
