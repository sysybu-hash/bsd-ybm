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

  // Fetch all necessary data for the unified dashboard in one go
  const [contacts, projects] = await Promise.all([
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
    })
  ]);

  return (
    <div className="p-4 md:p-8">
      <UnifiedCommandCenter 
        initialData={{
          contacts,
          projects,
          orgId
        }} 
      />
    </div>
  );
}
