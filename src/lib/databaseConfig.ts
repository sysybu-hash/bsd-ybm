/**
 * Prisma / Postgres — used to skip DB calls when env is missing (local preview, misconfigured deploy).
 */
export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}
