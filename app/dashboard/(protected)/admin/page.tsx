import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/is-admin";
import Link from "next/link";
import { Users, Building, CreditCard, ArrowUpRight, Clock, ShieldCheck } from "lucide-react";
import AdminBroadcastNotifications from "@/components/admin/AdminBroadcastNotifications";
import PlatformPayPalOwnerCard from "@/components/admin/PlatformPayPalOwnerCard";

type AdminPageProps = {
  searchParams?: Promise<{ section?: string }>;
};

export default async function AdminDashboard({ searchParams }: AdminPageProps) {
  const session = await getServerSession(authOptions);

  // אבטחה: רק Steel Admin — לא מספיק SUPER_ADMIN ב-DB בלבד
  const allowed = isAdmin(session?.user?.email);
  if (!session || !allowed) {
    redirect("/dashboard");
  }

  // משיכת נתונים חיים ממסד הנתונים
  const totalOrganizations = await prisma.organization.count();
  const totalUsers = await prisma.user.count();
  
  // חישוב הכנסות (חשבוניות ששולמו דרך פייפלוס)
  const paidInvoices = await prisma.invoice.aggregate({
    where: { status: 'PAID' },
    _sum: { amount: true }
  });
  const totalRevenue = paidInvoices._sum.amount || 0;

  // חישוב כסף שממתין לגבייה (חשבוניות פתוחות)
  const pendingInvoices = await prisma.invoice.aggregate({
    where: { status: 'PENDING' },
    _sum: { amount: true }
  });
  const pendingRevenue = pendingInvoices._sum.amount || 0;

  // רשימת 5 הלקוחות (הארגונים) האחרונים שהצטרפו
  const recentClients = await prisma.organization.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { users: { take: 1, select: { email: true, role: true } } }
  });

  const sp = (await searchParams) ?? {};
  const activeSection = sp.section === "subscriptions" ? "subscriptions" : sp.section === "broadcast" ? "broadcast" : "overview";

  return (
    <div
      className="min-h-app bg-[#f8fafc] p-8 md:p-12 font-sans text-slate-900"
      dir="rtl"
    >
      
      {/* כותרת מנהל */}
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter text-slate-900 mb-2">
            חדר מצב <span className="text-blue-600">BSD-YBM</span>
          </h1>
          <p className="text-slate-500 font-medium flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-500" />
            מבט על: ניהול לקוחות, מנויים והכנסות (הרשאת בעלים)
          </p>
        </div>
        <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white/90 p-1.5 shadow-sm">
          <Link
            href="/dashboard/admin"
            className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
              activeSection === "overview"
                ? "bg-blue-600 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            סקירה כללית
          </Link>
          <Link
            href="/dashboard/admin?section=subscriptions"
            className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
              activeSection === "subscriptions"
                ? "bg-violet-700 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            MASTER ADMIN - מנויים
          </Link>
          <Link
            href="/dashboard/admin?section=broadcast"
            className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
              activeSection === "broadcast"
                ? "bg-blue-700 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            שידור והתראות
          </Link>
          <Link
            href="/dashboard/control-center"
            className="rounded-xl px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100"
          >
            מרכז תפעול פשוט
          </Link>
        </div>
      </header>

      {activeSection === "overview" ? <PlatformPayPalOwnerCard /> : null}

      {/* שורת כרטיסיות נתונים (KPIs) */}
      {activeSection === "overview" ? (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        
        {/* הכנסות */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full -z-10 group-hover:scale-110 transition-transform" />
          <div className="flex justify-between items-start mb-4">
            <div className="bg-emerald-50 text-emerald-600 p-3 rounded-2xl">
              <CreditCard size={24} />
            </div>
          </div>
          <p className="text-slate-500 font-medium text-sm mb-1">סה&quot;כ הכנסות (שולם)</p>
          <h2 className="text-3xl font-black text-slate-900">₪{totalRevenue.toLocaleString()}</h2>
        </div>

        {/* צפי הכנסות (ממתין) */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full -z-10 group-hover:scale-110 transition-transform" />
          <div className="flex justify-between items-start mb-4">
            <div className="bg-blue-50 text-blue-500 p-3 rounded-2xl">
              <Clock size={24} />
            </div>
          </div>
          <p className="text-slate-500 font-medium text-sm mb-1">ממתין לתשלום / גבייה</p>
          <h2 className="text-3xl font-black text-slate-900">₪{pendingRevenue.toLocaleString()}</h2>
        </div>

        {/* לקוחות פעילים */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full -z-10 group-hover:scale-110 transition-transform" />
          <div className="flex justify-between items-start mb-4">
            <div className="bg-blue-50 text-blue-600 p-3 rounded-2xl">
              <Building size={24} />
            </div>
          </div>
          <p className="text-slate-500 font-medium text-sm mb-1">חברות / לקוחות פעילים</p>
          <h2 className="text-3xl font-black text-slate-900">{totalOrganizations}</h2>
        </div>

        {/* משתמשי קצה */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-full -z-10 group-hover:scale-110 transition-transform" />
          <div className="flex justify-between items-start mb-4">
            <div className="bg-indigo-50 text-indigo-600 p-3 rounded-2xl">
              <Users size={24} />
            </div>
          </div>
          <p className="text-slate-500 font-medium text-sm mb-1">משתמשי קצה רשומים</p>
          <h2 className="text-3xl font-black text-slate-900">{totalUsers}</h2>
        </div>

      </div>
      ) : null}

      {/* רשימת לקוחות אחרונים (Mini CRM) */}
      {activeSection === "overview" ? (
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-8">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-black flex items-center gap-3">
            <Building className="text-blue-500" /> לקוחות ומנויים אחרונים
          </h3>
          <Link
            href="/dashboard/billing?tab=control"
            className="text-sm font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-colors inline-block"
          >
            הצג את כל הלקוחות
          </Link>
        </div>

        <div className="overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
          <table className="w-full min-w-[640px] text-right">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-sm">
                <th className="pb-4 font-medium">שם הלקוח / חברה</th>
                <th className="pb-4 font-medium">אימייל איש קשר</th>
                <th className="pb-4 font-medium">תאריך הצטרפות</th>
                <th className="pb-4 font-medium">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {recentClients.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500 font-medium">
                    אין עדיין לקוחות במערכת.
                  </td>
                </tr>
              ) : (
                recentClients.map((client) => (
                  <tr key={client.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-5 font-bold text-slate-900">
                      {client.name || 'ארגון ללא שם'}
                    </td>
                    <td className="py-5 text-slate-500">
                      {client.users[0]?.email || 'אין אימייל'}
                    </td>
                    <td className="py-5 text-slate-500 text-sm">
                      {client.createdAt.toLocaleDateString('he-IL')}
                    </td>
                    <td className="py-5">
                      <Link
                        href={`/dashboard/billing?tab=control&orgId=${encodeURIComponent(client.id)}`}
                        className="text-blue-600 hover:text-blue-800 font-bold text-sm inline-flex items-center gap-1 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm"
                      >
                        ניהול מנוי <ArrowUpRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      ) : null}

      {activeSection === "subscriptions" ? (
      <section id="subscriptions" className="mt-2 space-y-6">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/30">
          <p className="text-xs font-black uppercase tracking-wider text-violet-600 mb-1">MASTER ADMIN</p>
          <h2 className="text-2xl font-black text-slate-900">ניהול מנויים מרוכז</h2>
          <p className="text-sm text-slate-600 mt-1">
            ניהול המנויים עבר למסך ייעודי מאוחד.
          </p>
          <p className="text-xs text-slate-500 mt-2">
            כדי למנוע כפילויות וחלונות חופפים, כל פעולות עריכה/מחיקה זמינות ב־
            <Link href="/dashboard/billing?tab=control" className="font-bold text-blue-600 underline ms-1">
              /dashboard/billing
            </Link>
            .
          </p>
        </div>
        <div className="rounded-[2rem] border border-violet-200 bg-violet-50/50 p-6">
          <Link
            href="/dashboard/billing?tab=control"
            className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-5 py-3 text-sm font-bold text-white hover:bg-violet-600"
          >
            מעבר לניהול מנויים מאוחד
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </section>
      ) : null}

      {activeSection === "broadcast" ? <AdminBroadcastNotifications /> : null}

    </div>
  );
}