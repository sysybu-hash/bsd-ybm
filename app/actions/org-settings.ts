"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { type CompanyType, type CustomerType, UserRole } from "@prisma/client";

const TYPES: CustomerType[] = ["HOME", "FREELANCER", "COMPANY", "ENTERPRISE"];
const COMPANY_TYPES: CompanyType[] = ["EXEMPT_DEALER", "LICENSED_DEALER", "LTD_COMPANY"];

function canEditTaxProfile(role: string): boolean {
  return role === UserRole.ORG_ADMIN || role === UserRole.SUPER_ADMIN;
}

export async function updateOrganizationAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { ok: false as const, error: "נדרשת התחברות" };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { organizationId: true, role: true },
  });

  if (!user?.organizationId) {
    return { ok: false as const, error: "אין ארגון משויך" };
  }

  const name = String(formData.get("name") || "").trim();
  if (!name) {
    return { ok: false as const, error: "יש להזין שם חברה / ארגון" };
  }

  const typeRaw = String(formData.get("type") || "HOME").trim();
  const type = TYPES.includes(typeRaw as CustomerType) ? (typeRaw as CustomerType) : "HOME";

  const taxOk = canEditTaxProfile(user.role);

  const companyTypeRaw = String(formData.get("companyType") || "").trim();
  const taxId = String(formData.get("taxId") || "").trim();
  const address = String(formData.get("address") || "").trim();

  if (!taxOk && (companyTypeRaw || taxId || address)) {
    return {
      ok: false as const,
      error: "רק מנהל ארגון או מנהל מערכת יכולים לעדכן פרטי מס וכתובת.",
    };
  }

  const data: {
    name: string;
    type: CustomerType;
    companyType?: CompanyType;
    taxId?: string | null;
    address?: string | null;
  } = { name, type };

  if (taxOk) {
    const ct: CompanyType = COMPANY_TYPES.includes(companyTypeRaw as CompanyType)
      ? (companyTypeRaw as CompanyType)
      : "LICENSED_DEALER";
    data.companyType = ct;
    data.taxId = taxId.length > 0 ? taxId : null;
    data.address = address.length > 0 ? address : null;
  }

  await prisma.organization.update({
    where: { id: user.organizationId },
    data,
  });

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/billing");
  return { ok: true as const };
}
