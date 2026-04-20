import { prisma } from "@/lib/prisma";
import { loadFinanceForecast, type FinanceForecast } from "@/lib/finance-forecast";

export type CommercialClientSnapshot = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  status: string;
  value: number | null;
  createdAt: string;
  project: { id: string; name: string } | null;
  invoiceCount: number;
  totalBilled: number;
  totalPending: number;
};

export type CommercialProjectSnapshot = {
  id: string;
  name: string;
  isActive: boolean;
  activeFrom: string | null;
  activeTo: string | null;
  contactCount: number;
  totalValue: number;
  activeDeals: number;
  pendingCollection: number;
  billedTotal: number;
};

export type CommercialIssuedDocumentSnapshot = {
  id: string;
  type: string;
  status: string;
  clientName: string;
  total: number;
  date: string;
  contactId: string | null;
};

export type CommercialHubSnapshot = {
  forecast: FinanceForecast;
  contacts: CommercialClientSnapshot[];
  projects: CommercialProjectSnapshot[];
  recentIssued: CommercialIssuedDocumentSnapshot[];
  totals: {
    clientsCount: number;
    activeProjects: number;
    pipelineValue: number;
    pendingCollection: number;
    pendingIssuedTotal: number;
    pendingIssuedCount: number;
    paidIssuedTotal: number;
    paidIssuedCount: number;
  };
};

export async function loadCommercialHubSnapshot(
  organizationId: string,
): Promise<CommercialHubSnapshot> {
  const [contactsRaw, projectsRaw, recentIssuedRaw, forecast] = await Promise.all([
    prisma.contact.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        notes: true,
        status: true,
        value: true,
        createdAt: true,
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        issuedDocuments: {
          select: {
            total: true,
            status: true,
          },
        },
      },
    }),
    prisma.project.findMany({
      where: { organizationId },
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        name: true,
        isActive: true,
        activeFrom: true,
        activeTo: true,
        _count: {
          select: {
            contacts: true,
          },
        },
      },
    }),
    prisma.issuedDocument.findMany({
      where: { organizationId },
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: {
        id: true,
        type: true,
        status: true,
        clientName: true,
        total: true,
        date: true,
        contactId: true,
      },
    }),
    loadFinanceForecast(organizationId),
  ]);

  const projectMetrics = new Map<
    string,
    { totalValue: number; activeDeals: number; pendingCollection: number; billedTotal: number }
  >();

  const contacts = contactsRaw.map((contact) => {
    const totalBilled = contact.issuedDocuments.reduce((sum, document) => sum + document.total, 0);
    const totalPending = contact.issuedDocuments
      .filter((document) => document.status === "PENDING")
      .reduce((sum, document) => sum + document.total, 0);

    if (contact.project?.id) {
      const current = projectMetrics.get(contact.project.id) ?? {
        totalValue: 0,
        activeDeals: 0,
        pendingCollection: 0,
        billedTotal: 0,
      };
      current.totalValue += contact.value ?? 0;
      current.pendingCollection += totalPending;
      current.billedTotal += totalBilled;
      if (contact.status !== "CLOSED_LOST") {
        current.activeDeals += 1;
      }
      projectMetrics.set(contact.project.id, current);
    }

    return {
      id: contact.id,
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      notes: contact.notes,
      status: contact.status,
      value: contact.value,
      createdAt: contact.createdAt.toISOString(),
      project: contact.project,
      invoiceCount: contact.issuedDocuments.length,
      totalBilled,
      totalPending,
    } satisfies CommercialClientSnapshot;
  });

  const projects = projectsRaw.map((project) => {
    const metrics = projectMetrics.get(project.id) ?? {
      totalValue: 0,
      activeDeals: 0,
      pendingCollection: 0,
      billedTotal: 0,
    };

    return {
      id: project.id,
      name: project.name,
      isActive: project.isActive,
      activeFrom: project.activeFrom?.toISOString() ?? null,
      activeTo: project.activeTo?.toISOString() ?? null,
      contactCount: project._count.contacts,
      totalValue: metrics.totalValue,
      activeDeals: metrics.activeDeals,
      pendingCollection: metrics.pendingCollection,
      billedTotal: metrics.billedTotal,
    } satisfies CommercialProjectSnapshot;
  });

  const recentIssued = recentIssuedRaw.map((document) => ({
    id: document.id,
    type: document.type,
    status: document.status,
    clientName: document.clientName,
    total: document.total,
    date: document.date.toISOString(),
    contactId: document.contactId,
  }));

  const pendingIssued = recentIssuedRaw.filter((document) => document.status === "PENDING");
  const paidIssued = recentIssuedRaw.filter((document) => document.status === "PAID");

  return {
    forecast,
    contacts,
    projects,
    recentIssued,
    totals: {
      clientsCount: contacts.length,
      activeProjects: projects.filter((project) => project.isActive).length,
      pipelineValue: contacts.reduce((sum, contact) => sum + (contact.value ?? 0), 0),
      pendingCollection: contacts.reduce((sum, contact) => sum + contact.totalPending, 0),
      pendingIssuedTotal: pendingIssued.reduce((sum, document) => sum + document.total, 0),
      pendingIssuedCount: pendingIssued.length,
      paidIssuedTotal: paidIssued.reduce((sum, document) => sum + document.total, 0),
      paidIssuedCount: paidIssued.length,
    },
  };
}
