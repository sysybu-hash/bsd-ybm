import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isPlatformDeveloperEmail } from "@/lib/platform-developers";
import { hasMeckanoAccess } from "@/lib/meckano-access";
import { Users, Building, CreditCard, ArrowUpRight, Clock, ShieldCheck } from "lucide-react";
import AdminBroadcastNotifications from "@/components/admin/AdminBroadcastNotifications";
import PlatformPayPalOwnerCard from "@/components/admin/PlatformPayPalOwnerCard";

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);

  if (hasMeckanoAccess(session?.user?.email)) {
    redirect("/dashboard");
  }

  // אבטחה: רק PLATFORM_DEVELOPER_EMAILS (לא SUPER_ADMIN ב-DB בלבד)
  const allowed = isPlatformDeveloperEmail(session?.user?.email);
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

  return (
    <div className="min-h-screen bg-[#f8fafc] p-8 md:p-12 font-sans text-slate-900" dir="rtl">
      
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
      </header>

      <PlatformPayPalOwnerCard />

      {/* שורת כרטיסיות נתונים (KPIs) */}
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
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-bl-full -z-10 group-hover:scale-110 transition-transform" />
          <div className="flex justify-between items-start mb-4">
            <div className="bg-amber-50 text-amber-600 p-3 rounded-2xl">
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

      {/* רשימת לקוחות אחרונים (Mini CRM) */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-8">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-black flex items-center gap-3">
            <Building className="text-blue-500" /> לקוחות ומנויים אחרונים
          </h3>
          <button className="text-sm font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-colors">
            הצג את כל הלקוחות
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
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
                      <button className="text-blue-600 hover:text-blue-800 font-bold text-sm flex items-center gap-1 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
                        ניהול מנוי <ArrowUpRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AdminBroadcastNotifications />

    </div>
  );
}