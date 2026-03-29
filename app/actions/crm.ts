"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getOrgContext() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "נדרשת התחברות" as const };
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { organizationId: true },
  });
  if (!user?.organizationId) {
    return { error: "אין ארגון משויך. עבור להגדרות או התחבר מחדש." as const };
  }
  return { orgId: user.organizationId, userId: session.user.id };
}

export async function createContactAction(formData: FormData) {
  const ctx = await getOrgContext();
  if ("error" in ctx) return { ok: false as const, error: ctx.error };

  const name = String(formData.get("name") || "").trim();
  const emailRaw = String(formData.get("email") || "").trim();
  const status = String(formData.get("status") || "LEAD").trim();
  const projectRaw = String(formData.get("projectId") || "").trim();

  if (!name) {
    return { ok: false as const, error: "יש להזין שם לקוח" };
  }

  let projectId: string | undefined;
  if (projectRaw) {
    const p = await prisma.project.findFirst({
      where: { id: projectRaw, organizationId: ctx.orgId },
      select: { id: true },
    });
    projectId = p?.id;
  }

  await prisma.contact.create({
    data: {
      name,
      email: emailRaw || null,
      status: status || "LEAD",
      organizationId: ctx.orgId,
      projectId: projectId ?? null,
    },
  });

  revalidatePath("/dashboard/crm");
  return { ok: true as const };
}

export async function createProjectAction(formData: FormData) {
  const ctx = await getOrgContext();
  if ("error" in ctx) return { ok: false as const, error: ctx.error };

  const name = String(formData.get("name") || "").trim();
  if (!name) {
    return { ok: false as const, error: "יש להזין שם פרויקט" };
  }

  const activeFromRaw = String(formData.get("activeFrom") || "").trim();
  const activeToRaw = String(formData.get("activeTo") || "").trim();
  const isActive = formData.get("isActive") !== "off" && formData.get("isActive") !== "false";

  await prisma.project.create({
    data: {
      name,
      organizationId: ctx.orgId,
      isActive,
      activeFrom: activeFromRaw ? new Date(`${activeFromRaw}T12:00:00`) : null,
      activeTo: activeToRaw ? new Date(`${activeToRaw}T12:00:00`) : null,
    },
  });

  revalidatePath("/dashboard/crm");
  return { ok: true as const };
}

export async function deleteContactAction(contactId: string) {
  const ctx = await getOrgContext();
  if ("error" in ctx) return { ok: false as const, error: ctx.error };

  const row = await prisma.contact.findFirst({
    where: { id: contactId, organizationId: ctx.orgId },
  });
  if (!row) {
    return { ok: false as const, error: "לקוח לא נמצא" };
  }

  await prisma.quote.deleteMany({ where: { contactId } });
  await prisma.contact.delete({ where: { id: contactId } });
  revalidatePath("/dashboard/crm");
  return { ok: true as const };
}

export async function updateContactAction(input: {
  contactId: string;
  name: string;
  email: string;
  status: string;
  projectId: string;
}) {
  const ctx = await getOrgContext();
  if ("error" in ctx) return { ok: false as const, error: ctx.error };

  const name = input.name.trim();
  if (!name) {
    return { ok: false as const, error: "יש להזין שם לקוח" };
  }

  const row = await prisma.contact.findFirst({
    where: { id: input.contactId, organizationId: ctx.orgId },
  });
  if (!row) {
    return { ok: false as const, error: "לקוח לא נמצא" };
  }

  let projectId: string | null = input.projectId.trim() || null;
  if (projectId) {
    const p = await prisma.project.findFirst({
      where: { id: projectId, organizationId: ctx.orgId },
      select: { id: true },
    });
    projectId = p?.id ?? null;
  }

  await prisma.contact.update({
    where: { id: input.contactId },
    data: {
      name,
      email: input.email.trim() || null,
      status: input.status.trim() || "LEAD",
      projectId,
    },
  });

  revalidatePath("/dashboard/crm");
  return { ok: true as const };
}
