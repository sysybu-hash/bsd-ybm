import type { Session } from "next-auth";
import { NextResponse } from "next/server";
import { jsonForbidden, jsonUnauthorized } from "@/lib/api-json";
import { checkAndDeductScanCredit, resolveOrganizationForUser } from "@/lib/quota-check";
import type { ScanCreditKind } from "@/lib/scan-credit-kind";

/**
 * ניכוי נקודת זיכוי AI לארגון.
 * דורש משתמש מחובר עם ארגון — אחרת 401 / 403 (לא ממשיכים בשקט).
 * מחזיר NextResponse בשגיאה או null כשממשיכים.
 */
export async function requireAiScanCredit(
  session: Session | null,
  kind: ScanCreditKind,
): Promise<NextResponse | null> {
  if (!session?.user?.id) {
    return jsonUnauthorized();
  }
  if (!session.user.organizationId) {
    return jsonForbidden("נדרש שיוך לארגון לשימוש ב-AI.");
  }

  const userId = session.user.id;
  const orgId = session.user.organizationId;

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
