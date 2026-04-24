import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import InboxWorkspaceV2 from "@/components/inbox/InboxWorkspaceV2";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrencyILS } from "@/lib/ui-formatters";

export const dynamic = "force-dynamic";

type AiPayload = {
  vendor?: unknown;
};

function readAi(value: Prisma.JsonValue | null): AiPayload {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as AiPayload) : {};
}

function severityRank(severity: "high" | "medium" | "low") {
  if (severity === "high") return 0;
  if (severity === "medium") return 1;
  return 2;
}

export default async function AppInboxPage() {
  const session = await getServerSession(authOptions);
  const organizationId = session?.user?.organizationId;
  const userId = session?.user?.id;

  if (!organizationId || !userId) {
    redirect("/login");
  }

  const [notificationsRaw, pendingDocsRaw, recentDocumentsRaw, missingContactsRaw] = await Promise.all([
    prisma.inAppNotification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        title: true,
        body: true,
        read: true,
        createdAt: true,
      },
    }),
    prisma.issuedDocument.findMany({
      where: {
        organizationId,
        status: "PENDING",
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      take: 12,
      select: {
        id: true,
        clientName: true,
        total: true,
        dueDate: true,
        number: true,
      },
    }),
    prisma.document.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        fileName: true,
        status: true,
        aiData: true,
        _count: {
          select: {
            lineItems: true,
          },
        },
      },
    }),
    prisma.contact.findMany({
      where: {
        organizationId,
        OR: [{ email: null }, { phone: null }],
      },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    }),
  ]);

  const notifications = notificationsRaw.map((notification) => ({
    ...notification,
    createdAt: notification.createdAt.toISOString(),
  }));

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const overdueDocs = pendingDocsRaw.filter((document) => {
    if (!document.dueDate) return false;
    const due = new Date(document.dueDate);
    due.setHours(0, 0, 0, 0);
    return due < now;
  });

  const dueSoon = pendingDocsRaw
    .filter((document) => {
      if (!document.dueDate) return false;
      const due = new Date(document.dueDate);
      due.setHours(0, 0, 0, 0);
      const diff = Math.round((due.getTime() - now.getTime()) / 86400000);
      return diff >= 0 && diff <= 7;
    })
    .map((document) => ({
      id: document.id,
      clientName: document.clientName,
      total: document.total,
      dueDate: document.dueDate?.toISOString() ?? null,
      href: "/app/settings/billing",
    }));

  const reviewDocs = recentDocumentsRaw.filter((document) => {
    const ai = readAi(document.aiData);
    const vendor = typeof ai.vendor === "string" ? ai.vendor.trim() : "";
    return document.status !== "PROCESSED" || document._count.lineItems === 0 || vendor.length === 0;
  });

  const priorityItems = [
    ...overdueDocs.map((document) => ({
      id: `overdue-${document.id}`,
      category: "גבייה",
      title: `מסמך #${document.number} של ${document.clientName} נמצא באיחור`,
      body: `ממתין לתשלום בסך ${formatCurrencyILS(document.total)} ודורש מעקב מיידי.`,
      href: "/app/settings/billing",
      cta: "לחלון החיוב",
      severity: "high" as const,
    })),
    ...reviewDocs.slice(0, 4).map((document) => ({
      id: `review-${document.id}`,
      category: "מסמכים",
      title: `${document.fileName} דורש בדיקה`,
      body:
        document.status !== "PROCESSED"
          ? "סטטוס העיבוד עדיין לא הושלם."
          : document._count.lineItems === 0
            ? "לא זוהו שורות פריט למסמך הזה."
            : "חסר זיהוי ספק או הקשר מלא למסמך.",
      href: "/app/documents",
      cta: "לחלון המסמכים",
      severity: "medium" as const,
    })),
    ...missingContactsRaw.slice(0, 4).map((contact) => ({
      id: `contact-${contact.id}`,
      category: "לקוחות",
      title: `${contact.name} עם פרטים חסרים`,
      body:
        !contact.email && !contact.phone
          ? "חסרים גם אימייל וגם טלפון, מה שמקשה על המשך טיפול."
          : !contact.email
            ? "חסר אימייל ללקוח הזה."
            : "חסר טלפון ללקוח הזה.",
      href: "/app/clients",
      cta: "לחלון הלקוחות",
      severity: "low" as const,
    })),
  ].sort((left, right) => severityRank(left.severity) - severityRank(right.severity));

  return (
    <InboxWorkspaceV2
      notifications={notifications}
      priorityItems={priorityItems}
      dueSoon={dueSoon}
      unreadCount={notifications.filter((notification) => !notification.read).length}
      overdueCount={overdueDocs.length}
      reviewCount={reviewDocs.length}
      missingInfoCount={missingContactsRaw.length}
    />
  );
}
