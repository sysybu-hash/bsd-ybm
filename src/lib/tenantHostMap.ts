/**
 * Maps custom hostnames → Firestore `companyId` (white-label tenants).
 * Set `TENANT_HOST_MAP` to JSON, e.g. {"app.jerusalambuilders.co.il":"abcCompanyId"}.
 * Edge-safe (used by `proxy.ts`).
 */

export function parseTenantHostMap(raw: string | undefined | null): Record<string, string> {
  if (!raw?.trim()) return {};
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(o)) {
      if (typeof k === 'string' && typeof v === 'string' && k.trim() && v.trim()) {
        out[k.split(':')[0]!.toLowerCase().trim()] = v.trim();
      }
    }
    return out;
  } catch {
    return {};
  }
}

export function normalizeHostHeader(host: string | null | undefined): string {
  if (!host) return '';
  return host.split(':')[0]!.toLowerCase().trim();
}
