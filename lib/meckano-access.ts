import { prisma } from "@/lib/prisma";

export const MECKANO_SUBSCRIBER_EMAIL = "jbuildgca@gmail.com";
export const MECKANO_ACCESS_ERROR = `Meckano זמין רק למנוי ${MECKANO_SUBSCRIBER_EMAIL}.`;

type SessionLike = {
  user?: {
    email?: string | null;
    organizationId?: string | null;
  } | null;
} | null | undefined;

export function normalizeMeckanoEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() ?? "";
}

export function isMeckanoSubscriberEmail(email: string | null | undefined) {
  return normalizeMeckanoEmail(email) === MECKANO_SUBSCRIBER_EMAIL;
}

export async function isMeckanoEnabledForOrganization(organizationId: string | null | undefined) {
  if (!organizationId) {
    return false;
  }

  const subscriber = await prisma.user.findFirst({
    where: {
      organizationId,
      email: {
        equals: MECKANO_SUBSCRIBER_EMAIL,
        mode: "insensitive",
      },
    },
    select: { id: true },
  });

  return Boolean(subscriber);
}

export async function canAccessMeckano(session: SessionLike) {
  const organizationId = session?.user?.organizationId ?? null;
  if (!organizationId) {
    return false;
  }

  if (isMeckanoSubscriberEmail(session?.user?.email)) {
    return true;
  }

  return isMeckanoEnabledForOrganization(organizationId);
}

export async function getAuthorizedMeckanoOrganizationId(session: SessionLike) {
  const organizationId = session?.user?.organizationId ?? null;
  if (!organizationId) {
    return null;
  }

  return (await canAccessMeckano(session)) ? organizationId : null;
}
