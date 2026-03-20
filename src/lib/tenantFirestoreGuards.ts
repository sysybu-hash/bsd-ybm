/**
 * Phase 20 — Multi-tenancy contract for Firestore client paths.
 *
 * All tenant data MUST live under `companies/{companyId}/...` (aligned with
 * `bsd-ybm:selectedCompanyId` / CompanyContext `companyId`).
 *
 * **Invoices / OCR / scans:** `companies/{companyId}/scans`, finances under
 * `companies/{companyId}/finances` — never query a global `scans` root.
 *
 * **Contracts & quotes:** `templates/contract`, `projects/.../contracts/*` (storage),
 * `quotes` subcollection — always prefixed by `companies/{companyId}`.
 *
 * **Meckano:** API routes resolve `companyId` then read
 * `settings/integrations` or company doc; no cross-tenant Meckano logs.
 *
 * `where('companyId', '==', x)` on collectionGroup requires a denormalized
 * `companyId` on every doc in that group (e.g. heatmap milestones) — prefer
 * path scoping when possible.
 */

export function assertTenantPathStartsWithCompany(companyId: string, pathSegments: string[]): boolean {
  return pathSegments[0] === 'companies' && pathSegments[1] === companyId;
}
