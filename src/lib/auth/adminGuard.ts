/**
 * Phase 23 — Platform admin gateway (Vercel / env sync).
 * `NEXT_PUBLIC_ADMIN_EMAILS` — comma/semicolon/space-separated list (case-insensitive).
 */

const FALLBACK_MASTER_EMAILS = ['sysybu@gmail.com', 'jbuildgca@gmail.com', 'chaimad@gmail.com'] as const;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Parses env + fallbacks into a Set (call once per request on server; hooks memoize on client). */
export function getPlatformAdminEmailSet(): Set<string> {
  const raw = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').trim();
  const fromEnv = raw
    .split(/[,;\s]+/)
    .map((s) => normalizeEmail(s))
    .filter(Boolean);
  const merged = new Set<string>([...FALLBACK_MASTER_EMAILS.map(normalizeEmail), ...fromEnv]);
  return merged;
}

/** True if this email is a master / env-listed platform admin. */
export function isPlatformAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getPlatformAdminEmailSet().has(normalizeEmail(email));
}

/** For AI / diagnostics UIs: only admins should see detailed key presence. */
export function shouldExposeAiIntegrationDetails(isAdmin: boolean): boolean {
  return isAdmin;
}
