"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { type CompanyType, type CustomerType, Prisma, UserRole } from "@prisma/client";

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

  const orgId = session.user.organizationId ?? null;
  const role = String(session.user.role ?? "");

  if (!orgId) {
    return { ok: false as const, error: "אין ארגון משויך" };
  }

  const name = String(formData.get("name") || "").trim();
  if (!name) {
    return { ok: false as const, error: "יש להזין שם חברה / ארגון" };
  }

  const typeRaw = String(formData.get("type") || "HOME").trim();
  const type = TYPES.includes(typeRaw as CustomerType) ? (typeRaw as CustomerType) : "HOME";

  const taxOk = canEditTaxProfile(role);

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
    isReportable?: boolean;
  } = { name, type };

  if (taxOk) {
    const ct: CompanyType = COMPANY_TYPES.includes(companyTypeRaw as CompanyType)
      ? (companyTypeRaw as CompanyType)
      : "LICENSED_DEALER";
    data.companyType = ct;
    data.taxId = taxId.length > 0 ? taxId : null;
    data.address = address.length > 0 ? address : null;
    data.isReportable = formData.get("isReportable") === "on";
  }

  await prisma.organization.update({
    where: { id: orgId },
    data,
  });

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/billing");
  return { ok: true as const };
}

/** פורטל המנוי: דומיין, מיתוג JSON, לוח שנה + סנכרון Google (מתג בלבד — OAuth בשלב הבא) */
export async function updateTenantPortalAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { ok: false as const, error: "נדרשת התחברות" };
  }
  const orgId = session.user.organizationId ?? null;
  const role = String(session.user.role ?? "");
  if (!orgId) {
    return { ok: false as const, error: "אין ארגון משויך" };
  }
  if (role !== UserRole.ORG_ADMIN && role !== UserRole.SUPER_ADMIN) {
    return { ok: false as const, error: "רק מנהל ארגון רשאי לעדכן הגדרות פורטל" };
  }

  const domain = String(formData.get("tenantPublicDomain") ?? "").trim() || null;
  const calendarGoogleEnabled = formData.get("calendarGoogleEnabled") === "on";
  const brandingRaw = String(formData.get("tenantSiteBrandingJson") ?? "").trim();

  let brandingValue: Prisma.InputJsonValue | typeof Prisma.DbNull = Prisma.DbNull;
  if (brandingRaw.length > 0) {
    try {
      brandingValue = JSON.parse(brandingRaw) as Prisma.InputJsonValue;
    } catch {
      return { ok: false as const, error: "JSON מיתוג לא תקין" };
    }
  }

  await prisma.organization.update({
    where: { id: orgId },
    data: {
      tenantPublicDomain: domain,
      calendarGoogleEnabled,
      tenantSiteBrandingJson: brandingValue,
    },
  });

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  return { ok: true as const };
}

const LIVE_TIERS = new Set(["basic", "standard", "premium"]);

/** PayPal + רמת נתונים חיים — מנהל ארגון */
export async function updateBillingConnectionsAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { ok: false as const, error: "נדרשת התחברות" };
  }
  const orgId = session.user.organizationId ?? null;
  const role = String(session.user.role ?? "");
  if (!orgId) {
    return { ok: false as const, error: "אין ארגון משויך" };
  }
  if (role !== UserRole.ORG_ADMIN && role !== UserRole.SUPER_ADMIN) {
    return { ok: false as const, error: "רק מנהל ארגון רשאי לעדכן" };
  }

  const paypalEmail = String(formData.get("paypalMerchantEmail") ?? "").trim() || null;
  const slugRaw = String(formData.get("paypalMeSlug") ?? "").trim();
  const paypalMeSlug =
    slugRaw.length > 0 ? slugRaw.replace(/^https?:\/\/(www\.)?paypal\.me\//i, "").replace(/\/$/, "") : null;
  const tierRaw = String(formData.get("liveDataTier") ?? "basic").trim();
  const liveDataTier = LIVE_TIERS.has(tierRaw) ? tierRaw : "basic";

  await prisma.organization.update({
    where: { id: orgId },
    data: {
      paypalMerchantEmail: paypalEmail,
      paypalMeSlug: paypalMeSlug,
      liveDataTier,
    },
  });

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/billing");
  return { ok: true as const };
}
