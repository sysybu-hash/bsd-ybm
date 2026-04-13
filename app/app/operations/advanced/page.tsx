import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import OperationsCommandCenter from "@/components/operations/OperationsCommandCenter";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/is-admin";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function OperationsAdvancedPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.organizationId) {
    redirect("/login");
  }

  const orgId = session.user.organizationId;
  const ownerMode = isAdmin(session.user.email);
  const now = new Date();
  const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const last7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [org, usersTotal, usersActive, contactsCount, projectsCount, paidRevenue, pendingRevenue, wizardEvents, activityRecent] =
    await Promise.all([
      prisma.organization.findUnique({
        where: { id: orgId },
        select: {
          name: true,
          type: true,
          subscriptionTier: true,
          subscriptionStatus: true,
          trialEndsAt: true,
          calendarGoogleEnabled: true,
          paypalMerchantEmail: true,
          paypalMeSlug: true,
          liveDataTier: true,
        },
      }),
      prisma.user.count({ where: { organizationId: orgId } }),
      prisma.user.count({ where: { organizationId: orgId, accountStatus: "ACTIVE" } }),
      prisma.contact.count({ where: { organizationId: orgId } }),
      prisma.project.count({ where: { organizationId: orgId } }),
      prisma.invoice.aggregate({
        where: { organizationId: orgId, status: "PAID", createdAt: { gte: last30 } },
        _sum: { amount: true },
      }),
      prisma.invoice.aggregate({
        where: { organizationId: orgId, status: "PENDING", createdAt: { gte: last30 } },
        _sum: { amount: true },
      }),
      prisma.activityLog.count({
        where: { organizationId: orgId, action: { startsWith: "WIZARD:" }, createdAt: { gte: last30 } },
      }),
      prisma.activityLog.findMany({
        where: { organizationId: orgId, createdAt: { gte: last7 } },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: { action: true, details: true, createdAt: true },
      }),
    ]);

  const aiConfigured = Boolean(
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.OPENAI_API_KEY ||
      process.env.ANTHROPIC_API_KEY,
  );

  const paid = paidRevenue._sum.amount ?? 0;
  const pending = pendingRevenue._sum.amount ?? 0;
  const revenueHealth = paid + pending > 0 ? Math.round((paid / (paid + pending)) * 100) : 100;
  const customerHealth = Math.max(
    10,
    Math.min(
      99,
      Math.round(
        (usersActive > 0 ? 35 : 10) +
          Math.min(30, contactsCount * 2) +
          Math.min(20, projectsCount * 3) +
          Math.min(14, Math.round(wizardEvents / 10)),
      ),
    ),
  );

  return (
    <OperationsCommandCenter
      ownerMode={ownerMode}
      data={{
        organizationName: org?.name ?? "הארגון",
        organizationType: org?.type ?? "-",
        subscriptionTier: org?.subscriptionTier ?? "-",
        subscriptionStatus: org?.subscriptionStatus ?? "-",
        trialEndsAtIso: org?.trialEndsAt?.toISOString() ?? null,
        usersTotal,
        usersActive,
        contactsCount,
        projectsCount,
        revenuePaid30d: paid,
        revenuePending30d: pending,
        revenueHealth,
        wizardEvents30d: wizardEvents,
        customerHealth,
        integrations: {
          calendar: Boolean(org?.calendarGoogleEnabled),
          paypal: Boolean(org?.paypalMerchantEmail || org?.paypalMeSlug),
          ai: aiConfigured,
          liveDataTier: org?.liveDataTier ?? "basic",
        },
        recentActivity: activityRecent.map((activity) => ({
          action: activity.action,
          details: activity.details ?? "",
          createdAtIso: activity.createdAt.toISOString(),
        })),
      }}
    />
  );
}
