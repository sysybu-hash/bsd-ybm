import type { UserRole } from "@prisma/client";

export const DEFAULT_STEEL_ADMIN_EMAIL = "sysybu@gmail.com";

export function steelPlatformOwnerEmail(): string {
  const raw = process.env.STEEL_ADMIN_EMAIL?.trim().toLowerCase();
  if (raw && raw.includes("@")) return raw;
  return DEFAULT_STEEL_ADMIN_EMAIL;
}

/** @deprecated Use steelPlatformOwnerEmail() so env overrides are respected. */
export const STEEL_ADMIN_EMAIL = DEFAULT_STEEL_ADMIN_EMAIL;

/** @deprecated Use steelPlatformOwnerEmail() so env overrides are respected. */
export const PLATFORM_SUPER_ADMIN_EMAIL = DEFAULT_STEEL_ADMIN_EMAIL;

export function isAdmin(email: string | null | undefined): boolean {
  return (email ?? "").trim().toLowerCase() === steelPlatformOwnerEmail();
}

export function jwtRoleForSession(
  email: string | null | undefined,
  dbRole: UserRole | string,
): string {
  const e = (email ?? "").trim().toLowerCase();
  if (!e) return String(dbRole);
  if (isAdmin(e)) return "SUPER_ADMIN";
  if (String(dbRole) === "SUPER_ADMIN") return "ORG_ADMIN";
  return String(dbRole);
}
