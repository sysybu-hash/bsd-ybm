import { prisma } from "@/lib/prisma";

export type WorkspaceHomeRecentIssued = {
  id: string;
  type: string;
  number: string | number;
  clientName: string;
  total: number;
  status: string;
  date: Date;
};

export type WorkspaceHomeRecentClient = {
  id: string;
  name: string;
  status: string;
  createdAt: Date;
  value: number | null;
};

export type WorkspaceHomeData = {
  monthRevenue: number;
  monthIssuedCount: number;
  pendingAmount: number;
  pendingCount: number;
  paidAmount: number;
  collectionRate: number;
  trendLabel: string | undefined;
  trendDirection: "up" | "down" | "flat";
  activeClients: number;
  activeProjects: number;
  scannedDocsCount: number;
  recentIssued: WorkspaceHomeRecentIssued[];
  recentClients: WorkspaceHomeRecentClient[];
};

export async function loadWorkspaceHomeData(organizationId: string): Promise<WorkspaceHomeData> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const [
    activeClients,
    activeProjects,
    monthIssued,
    prevMonthIssued,
    pendingAgg,
    paidAgg,
    scannedDocsCount,
    recentIssued,
    recentClients,
  ] = await Promise.all([
    prisma.contact.count({ where: { organizationId } }),
    prisma.project.count({ where: { organizationId, isActive: true } }),
    prisma.issuedDocument.aggregate({
      where: { organizationId, type: "INVOICE", date: { gte: startOfMonth } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.issuedDocument.aggregate({
      where: {
        organizationId,
        type: "INVOICE",
        date: { gte: startOfPrevMonth, lte: endOfPrevMonth },
      },
      _sum: { total: true },
    }),
    prisma.issuedDocument.aggregate({
      where: { organizationId, status: "PENDING" },
      _sum: { total: true },
      _count: true,
    }),
    prisma.issuedDocument.aggregate({
      where: { organizationId, status: "PAID", date: { gte: startOfMonth } },
      _sum: { total: true },
    }),
    prisma.document.count({ where: { organizationId, createdAt: { gte: startOfMonth } } }),
    prisma.issuedDocument.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        type: true,
        number: true,
        clientName: true,
        total: true,
        status: true,
        date: true,
      },
    }),
    prisma.contact.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, status: true, createdAt: true, value: true },
    }),
  ]);

  const monthRevenue = monthIssued._sum.total ?? 0;
  const prevRevenue = prevMonthIssued._sum.total ?? 0;
  const pendingAmount = pendingAgg._sum.total ?? 0;
  const pendingCount = pendingAgg._count ?? 0;
  const paidAmount = paidAgg._sum.total ?? 0;
  const totalBilled = monthRevenue;
  const collectionRate = totalBilled > 0 ? Math.round((paidAmount / totalBilled) * 100) : 0;

  const trend = prevRevenue > 0 ? ((monthRevenue - prevRevenue) / prevRevenue) * 100 : null;
  const trendLabel =
    trend === null
      ? undefined
      : trend === 0
        ? "ללא שינוי"
        : `${trend > 0 ? "+" : ""}${trend.toFixed(1)}%`;
  const trendDirection: "up" | "down" | "flat" =
    trend === null || trend === 0 ? "flat" : trend > 0 ? "up" : "down";

  return {
    monthRevenue,
    monthIssuedCount: monthIssued._count,
    pendingAmount,
    pendingCount,
    paidAmount,
    collectionRate,
    trendLabel,
    trendDirection,
    activeClients,
    activeProjects,
    scannedDocsCount,
    recentIssued,
    recentClients,
  };
}
