import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import UnifiedCommandCenter from "@/components/control-center/UnifiedCommandCenter";
import { redirect } from "next/navigation";

export default async function ControlCenterPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  const orgId = session.user.organizationId;
  if (!orgId) {
    redirect("/dashboard");
  }

  const [contacts, projects, org] = await Promise.all([
    prisma.contact.findMany({
      where: { organizationId: orgId },
      include: {
        issuedDocuments: {
          select: { total: true, status: true }
        }
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.project.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" }
    }),
    prisma.organization.findUnique({
      where: { id: orgId },
      select: {
        cheapScansRemaining: true,
        premiumScansRemaining: true,
      }
    })
  ]);

  // Generate mock stats for ERP if real data is shallow
  const erpStats = [
    { label: "חשבוניות פתוחות", value: "₪12,450", trend: "+3% מהחודש שעבר", valueClass: "text-slate-800" },
    { label: "הצעות מחיר בתהליכי חתימה", value: "₪48,900", trend: "5 הצעות פעילות", valueClass: "text-blue-600" },
    { label: "תקבולים החודש (PayPal)", value: "₪5,200", trend: "2 עסקאות שהושלמו", valueClass: "text-emerald-600" }
  ];

  const erpChartData = [
    { name: "ינואר", value: 45000 },
    { name: "פברואר", value: 52000 },
    { name: "מרץ", value: 48000 },
    { name: "אפריל", value: 61000 }
  ];

  // Safe data extraction to prevent crashes
  const safeContacts = Array.isArray(contacts) ? contacts : [];
  const safeProjects = Array.isArray(projects) ? projects : [];

  return (
    <div className="p-4 md:p-8">
      <UnifiedCommandCenter 
        initialData={{
          contacts: safeContacts,
          projects: safeProjects,
          orgId,
          erpData: {
            stats: erpStats,
            chartData: erpChartData,
            quota: `מכסה: ${org?.cheapScansRemaining || 0} (רגיל) / ${org?.premiumScansRemaining || 0} (פרימיום)`,
          }
        }} 
      />
    </div>
  );
}
