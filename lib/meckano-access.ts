/**
 * מקאנו — רק MECKANO_OPERATOR_EMAILS (מופרד בפסיקים) + MECKANO_MANAGED_ORG_ID.
 * אין רשימות מיילים בקוד; נרמול Gmail (הסרת נקודות ב-local) לתאימות ל-Google.
 */

let operatorEmailSetCache: Set<string> | null = null;

export function canonicalizeEmailForMeckano(email: string | null | undefined): string {
  const raw = email?.trim().toLowerCase() ?? "";
  if (!raw) return "";
  const at = raw.lastIndexOf("@");
  if (at < 0) return raw;
  let local = raw.slice(0, at);
  const domain = raw.slice(at + 1);
  if (domain === "gmail.com" || domain === "googlemail.com") {
    local = local.replace(/\./g, "");
  }
  return `${local}@${domain}`;
}

function getMeckanoOperatorEmailSet(): Set<string> {
  if (operatorEmailSetCache) return operatorEmailSetCache;
  const s = new Set<string>();
  const raw = process.env.MECKANO_OPERATOR_EMAILS?.trim();
  if (raw) {
    for (const part of raw.split(",")) {
      const c = canonicalizeEmailForMeckano(part.trim());
      if (c) s.add(c);
    }
  }
  operatorEmailSetCache = s;
  return s;
}

/** לאחר שינוי ENV בזמן ריצה (בדיקות) — איפוס מטמון */
export function clearMeckanoOperatorEmailCache(): void {
  operatorEmailSetCache = null;
}

export function meckanoManagedOrganizationId(): string | null {
  const v = process.env.MECKANO_MANAGED_ORG_ID?.trim();
  return v && v.length > 0 ? v : null;
}

export function isSpecialClientEmail(email: string | null | undefined): boolean {
  return hasMeckanoAccess(email);
}

export function hasMeckanoAccess(email: string | null | undefined): boolean {
  const c = canonicalizeEmailForMeckano(email);
  return c.length > 0 && getMeckanoOperatorEmailSet().has(c);
}

/** רשימת מפעילי מקאנו (למשל התראות מייל) — לפי ENV בלבד */
export function listMeckanoOperatorEmails(): string[] {
  return [...getMeckanoOperatorEmailSet()];
}
