import type { Session } from "next-auth";
import { NextResponse } from "next/server";
import { checkAndDeductScanCredit, resolveOrganizationForUser } from "@/lib/quota-check";
import type { ScanCreditKind } from "@/lib/scan-credit-kind";

/**
 * ניכוי נקודת זיכוי AI לארגון. כשאין ארגון ב-session (מסלול ציבורי) — לא מנכים.
 * מחזיר NextResponse בשגיאה או null כשממשיכים.
 */
export async function requireAiScanCredit(
  session: Session | null,
  kind: ScanCreditKind,
): Promise<NextResponse | null> {
  const userId = session?.user?.id;
  const orgId = session?.user?.organizationId;
  if (!userId || !orgId) {
    return null;
  }

  const resolved = await resolveOrganizationForUser(orgId, userId);
  if (!resolved) {
    return NextResponse.json({ ok: false, error: "ארגון לא תקין" }, { status: 400 });
  }

  const quota = await checkAndDeductScanCredit(resolved.id, userId, kind);
  if (!quota.allowed) {
    return NextResponse.json(
      { ok: false, error: quota.error, code: quota.code ?? "QUOTA_EXCEEDED" },
      { status: 402 },
    );
  }

  return null;
}
