"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import type { BillingWorkspaceV1, InsuranceExpenseLine } from "@/lib/billing-workspace";

function canEdit(role: string): boolean {
  return role === UserRole.ORG_ADMIN || role === UserRole.SUPER_ADMIN;
}

export async function saveBillingWorkspaceAction(
  workspace: BillingWorkspaceV1,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { ok: false, error: "נדרשת התחברות" };
  }
  const orgId = session.user.organizationId ?? null;
  const role = String(session.user.role ?? "");
  if (!orgId) {
    return { ok: false, error: "אין ארגון משויך" };
  }
  if (!canEdit(role)) {
    return { ok: false, error: "רק מנהל ארגון רשאי לשמור" };
  }

  const cleanLines: InsuranceExpenseLine[] = (workspace.insuranceLines ?? [])
    .slice(0, 40)
    .map((l) => ({
      label: String(l.label ?? "").trim().slice(0, 200),
      amountNis: Math.max(0, Math.round(Number(l.amountNis) * 100) / 100),
    }))
    .filter((l) => l.label.length > 0);

  const ref = String(workspace.referralLevel ?? "none");
  const referralLevel =
    ref === "1" || ref === "2" || ref === "3" || ref === "4" || ref === "5" || ref === "none"
      ? ref
      : "none";

  const payload: BillingWorkspaceV1 = {
    v: 1,
    insuranceLines: cleanLines,
    referralLevel,
    referralNotes: String(workspace.referralNotes ?? "").slice(0, 4000),
    onboardingFreePitch: String(workspace.onboardingFreePitch ?? "").slice(0, 4000),
  };

  try {
    await prisma.organization.update({
      where: { id: orgId },
      data: { billingWorkspaceJson: payload as object },
    });
    revalidatePath("/dashboard/billing");
    revalidatePath("/dashboard/settings");
    return { ok: true };
  } catch (e) {
    console.error("saveBillingWorkspaceAction", e);
    return { ok: false, error: "שמירה נכשלה" };
  }
}
