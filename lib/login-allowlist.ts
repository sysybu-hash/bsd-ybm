import { canonicalizeEmailForMeckano } from "@/lib/meckano-access";

let cache: { key: string; set: Set<string> } | null = null;

/** LOGIN_ALLOWLIST_EMAILS דורס; אחרת ALLOWED_LOGIN_EMAILS (תאימות ל-.env קיים) */
function rawAllowlist(): string {
  const primary = process.env.LOGIN_ALLOWLIST_EMAILS?.trim();
  if (primary) return primary;
  return process.env.ALLOWED_LOGIN_EMAILS?.trim() ?? "";
}

function allowlistSet(): Set<string> | null {
  const raw = rawAllowlist();
  if (!raw) return null;
  if (cache?.key === raw) return cache.set;
  const s = new Set<string>();
  for (const part of raw.split(",")) {
    const c = canonicalizeEmailForMeckano(part.trim());
    if (c) s.add(c);
  }
  cache = { key: raw, set: s };
  return s;
}

export function clearLoginAllowlistCache(): void {
  cache = null;
}

/** כאשר מוגדר — רק מיילים ברשימה יכולים להתחבר */
export function isLoginAllowlistEnforced(): boolean {
  const s = allowlistSet();
  return s !== null && s.size > 0;
}

export function isLoginAllowedByAllowlist(email: string | null | undefined): boolean {
  const s = allowlistSet();
  if (!s || s.size === 0) return true;
  const c = canonicalizeEmailForMeckano(email);
  return c.length > 0 && s.has(c);
}
