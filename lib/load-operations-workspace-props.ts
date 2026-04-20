import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { ComponentProps } from "react";
import OperationsWorkspaceV2 from "@/components/operations/OperationsWorkspaceV2";
import { authOptions } from "@/lib/auth";
import { canAccessMeckano } from "@/lib/meckano-access";
import { prisma } from "@/lib/prisma";
import { readRequestMessages } from "@/lib/i18n/server-messages";
import { getIndustryProfile } from "@/lib/professions/runtime";
import { formatCurrencyILS } from "@/lib/ui-formatters";

export type OperationsWorkspaceV2Props = ComponentProps<typeof OperationsWorkspaceV2>;

export async function loadOperationsWorkspaceProps(): Promise<OperationsWorkspaceV2Props> {
  const session = await getServerSession(authOptions);
  const organizationId = session?.user?.organizationId;
  const meckanoEnabled = await canAccessMeckano(session);

  if (!organizationId) {
    redirect("/login");
  }

  const [organization, usersTotal, activeUsers, activeProjects, zonesRaw, documentsRaw, pendingDocsRaw, cloudIntegrationsRaw, recentActivityRaw] =
    await Promise.all([
      prisma.organization.findUnique({
        where: { id: organizationId },
        select: {
          name: true,
          industry: true,
          constructionTrade: true,
          industryConfigJson: true,
          calendarGoogleEnabled: true,
          paypalMerchantEmail: true,
          paypalMeSlug: true,
          liveDataTier: true,
          meckanoApiKey: true,
        },
      }),
      prisma.user.count({
        where: { organizationId },
      }),
      prisma.user.count({
        where: { organizationId, accountStatus: "ACTIVE" },
      }),
      prisma.project.count({
        where: { organizationId, isActive: true },
      }),
      meckanoEnabled
        ? prisma.meckanoZone.findMany({
            where: { organizationId },
            orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
            take: 6,
            select: {
              id: true,
              name: true,
              isActive: true,
              syncedToCrm: true,
              managerName: true,
              assignedEmployeeIds: true,
            },
          })
        : Promise.resolve([]),
      prisma.document.findMany({
        where: { organizationId },
        orderBy: { createdAt: "desc" },
        take: 30,
        select: {
          id: true,
          status: true,
          _count: {
            select: {
              lineItems: true,
            },
          },
        },
      }),
      prisma.issuedDocument.findMany({
        where: { organizationId, status: "PENDING" },
        orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
        take: 30,
        select: {
          id: true,
          total: true,
          dueDate: true,
        },
      }),
      prisma.cloudIntegration.findMany({
        where: { organizationId },
        orderBy: [{ autoScan: "desc" }, { createdAt: "desc" }],
        select: {
          provider: true,
          autoScan: true,
          lastSyncAt: true,
        },
      }),
      prisma.activityLog.findMany({
        where: { organizationId },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          action: true,
          details: true,
          createdAt: true,
        },
      }),
    ]);

  if (!organization) {
    redirect("/login");
  }

  const messages = await readRequestMessages();
  const industryProfile = getIndustryProfile(
    organization.industry ?? "CONSTRUCTION",
    organization.industryConfigJson,
    organization.constructionTrade,
    messages,
  );
  const operationsContextLabel =
    industryProfile.constructionTradeLabel ?? industryProfile.industryLabel;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const reviewCount = documentsRaw.filter(
    (document) => document.status !== "PROCESSED" || document._count.lineItems === 0,
  ).length;
  const pendingAmount = pendingDocsRaw.reduce((sum, document) => sum + document.total, 0);
  const overdueCount = pendingDocsRaw.filter((document) => {
    if (!document.dueDate) return false;
    const dueDate = new Date(document.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  }).length;

  const activeZones = zonesRaw.filter((zone) => zone.isActive);
  const syncedActiveZones = activeZones.filter((zone) => zone.syncedToCrm).length;
  const autoScanCount = cloudIntegrationsRaw.filter((integration) => integration.autoScan).length;

  const workflows = [
    ...(meckanoEnabled
      ? [
          {
            id: "field-sync",
            title: "תפעול שטח ו-Meckano",
            summary: !organization.meckanoApiKey
              ? "אין כרגע מפתח API ל-Meckano, ולכן זרימות שטח וסנכרון אתרים עדיין חסומות."
              : activeZones.length === 0
                ? "החיבור קיים אבל עדיין אין אזורי עבודה פעילים, כך שאין workflow שטח מסודר למשתמשים."
                : syncedActiveZones < activeZones.length
                  ? "יש אזורים פעילים שעדיין לא מסונכרנים ל-CRM, ולכן כדאי לסגור פערי שיוך."
                  : "תפעול השטח מחובר היטב ונראה מסונכרן עם סביבת העבודה.",
            status: !organization.meckanoApiKey
              ? ("blocked" as const)
              : activeZones.length === 0 || syncedActiveZones < activeZones.length
                ? ("attention" as const)
                : ("healthy" as const),
            href: "/app/operations/meckano",
            cta: "ל-Meckano",
            metrics: [
              `${activeZones.length} אזורים פעילים`,
              `${syncedActiveZones} מסונכרנים`,
              `${activeProjects} פרויקטים פעילים`,
            ],
          },
        ]
      : []),
    {
      id: "documents-intake",
      title: "קליטת מסמכים ובדיקות",
      summary:
        reviewCount > 8
          ? "עומס הבדיקה גבוה כרגע, ויש מסמכים שמחכים לשיוך או לעיבוד לפני שאפשר להתקדם."
          : reviewCount > 0
            ? "יש backlog קטן של מסמכים לבדיקה, אבל הוא עדיין בשליטה."
            : "זרימת הקליטה נראית נקייה כרגע בלי מסמכים פתוחים לבדיקה.",
      status: reviewCount > 8 ? ("blocked" as const) : reviewCount > 0 ? ("attention" as const) : ("healthy" as const),
      href: "/app/documents",
      cta: "לחלון המסמכים",
      metrics: [`${reviewCount} לבדיקה`, `${documentsRaw.length} מסמכים אחרונים`, `${autoScanCount} חיבורים עם Auto Scan`],
    },
    {
      id: "collections",
      title: "גבייה ומעקב תשלום",
      summary:
        overdueCount > 0
          ? "יש כרגע מסמכי גבייה באיחור, ולכן זה workflow שדורש טיפול ישיר לפני שהוא הופך לעומס תזרימי."
          : pendingDocsRaw.length > 0
            ? "אין איחורים חריגים, אבל יש מסמכים פתוחים שמצריכים מעקב בימים הקרובים."
            : "תמונת הגבייה רגועה כרגע, בלי מסמכים פתוחים משמעותיים.",
      status: overdueCount > 0 ? ("blocked" as const) : pendingDocsRaw.length > 0 ? ("attention" as const) : ("healthy" as const),
      href: "/app/settings/billing",
      cta: "לחלון החיוב",
      metrics: [`${pendingDocsRaw.length} פתוחים`, `${overdueCount} באיחור`, formatCurrencyILS(pendingAmount)],
    },
    {
      id: "team-readiness",
      title: "כשירות צוות וחיבורים",
      summary:
        activeUsers === 0
          ? "אין כרגע משתמשים פעילים בארגון, ולכן סביבת העבודה לא באמת מוכנה לעבודה שוטפת."
          : cloudIntegrationsRaw.length === 0
            ? "הצוות פעיל, אבל עדיין אין חיבורי ענן שמזינים Auto Scan או גיבויים."
            : "הצוות והחיבורים המרכזיים נראים זמינים, כך שאפשר להתמקד בזרימות העבודה עצמן.",
      status:
        activeUsers === 0
          ? ("blocked" as const)
          : cloudIntegrationsRaw.length === 0 || activeUsers < usersTotal
            ? ("attention" as const)
            : ("healthy" as const),
      href: "/app/settings/stack",
      cta: "להגדרות וחיבורים",
      metrics: [`${activeUsers}/${usersTotal} פעילים`, `${cloudIntegrationsRaw.length} אינטגרציות`, `${recentActivityRaw.length} אירועים אחרונים`],
    },
  ];

  const integrations = [
    {
      label: "Google Calendar",
      connected: organization.calendarGoogleEnabled,
      details: organization.calendarGoogleEnabled ? "סנכרון יומן פעיל" : "סנכרון יומן עדיין לא הופעל",
    },
    {
      label: "PayPal",
      connected: Boolean(organization.paypalMerchantEmail || organization.paypalMeSlug),
      details:
        organization.paypalMerchantEmail || organization.paypalMeSlug
          ? "קיימת תצורת תשלום מחוברת"
          : "אין עדיין תצורת PayPal בארגון",
    },
    ...(meckanoEnabled
      ? [
          {
            label: "Meckano",
            connected: Boolean(organization.meckanoApiKey),
            details: organization.meckanoApiKey ? "מפתח API שמור בארגון" : "טרם הוגדר מפתח API",
          },
        ]
      : []),
    {
      label: "Cloud Integrations",
      connected: cloudIntegrationsRaw.length > 0,
      details:
        cloudIntegrationsRaw.length > 0
          ? `${cloudIntegrationsRaw.length} חיבורים פעילים, ${autoScanCount} מהם עם Auto Scan`
          : "אין עדיין חיבורי ענן מוגדרים",
    },
  ];

  const zones = activeZones.map((zone) => ({
    id: zone.id,
    name: zone.name,
    synced: zone.syncedToCrm,
    managerName: zone.managerName,
    assigneeCount: zone.assignedEmployeeIds.length,
  }));

  const recentActivity = recentActivityRaw.map((activity) => ({
    action: activity.action,
    details: activity.details ? String(activity.details) : "",
    createdAt: activity.createdAt.toISOString(),
  }));

  return {
    organizationName: organization.name,
    operationsContextLabel,
    meckanoEnabled,
    stats: {
      activeUsers: `${activeUsers}/${usersTotal}`,
      openQueues: pendingDocsRaw.length.toString(),
      fieldCoverage: meckanoEnabled ? `${activeZones.length} אזורים` : "לא פעיל",
      reviewLoad: reviewCount.toString(),
    },
    workflows,
    integrations,
    zones,
    recentActivity,
  };
}
