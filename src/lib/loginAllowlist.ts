/**
 * Login allowlist (whitelist): only these emails may keep a Firebase session.
 * Set `ALLOWED_LOGIN_EMAILS` (server) or `NEXT_PUBLIC_ALLOWED_LOGIN_EMAILS` (client + fallback)
 * as comma- or semicolon-separated addresses. If unset, defaults to the project owner email below.
 */

const DEFAULT_ALLOWED_EMAILS = ['sysybu@gmail.com'];

function parseRawList(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[,;]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/** Resolved list (lowercase). Server prefers ALLOWED_LOGIN_EMAILS; client uses NEXT_PUBLIC_*. */
export function getAllowedLoginEmails(): string[] {
  const isServer = typeof window === 'undefined';
  const primary = isServer
    ? process.env.ALLOWED_LOGIN_EMAILS
    : process.env.NEXT_PUBLIC_ALLOWED_LOGIN_EMAILS;
  const secondary = isServer
    ? process.env.NEXT_PUBLIC_ALLOWED_LOGIN_EMAILS
    : undefined;
  const merged = [...parseRawList(primary), ...parseRawList(secondary)];
  const unique = [...new Set(merged)];
  if (unique.length > 0) return unique;
  return [...DEFAULT_ALLOWED_EMAILS];
}

export function isEmailAllowedForLogin(email: string | null | undefined): boolean {
  if (!email?.trim()) return false;
  const normalized = email.trim().toLowerCase();
  return getAllowedLoginEmails().includes(normalized);
}
