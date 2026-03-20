# Phase 2 — Unified Brain / Event Pipeline (Architecture)

## Goals

- **Single orchestration layer** so domain events (Meckano attendance, invoice scans, manual adjustments) fan out to all related Firestore documents without partial updates.
- **Multi-tenant safety**: every write is scoped to `companies/{companyId}/…` (and `users/{uid}/…` when appropriate).

## Core components

### 1. `EventPipeline` (`src/services/events/EventPipeline.ts`)

- **Ingress**: normalised events, e.g. `MeckanoSyncCompleted`, `InvoiceScanned` (Phase 3).
- **Projectors** (pure-ish functions + Firestore I/O):
  - **Team / attendance**: map external IDs (Meckano user ↔ `team` doc).
  - **Finance**: append `finances/{entryId}` lines (labor, materials, AP/AR).
  - **Projects**: update `plSummary.laborCosts` / `plSummary.materialCosts` via `FieldValue.increment`.
  - **CRM / clients**: update balances on linked `clients/{clientId}` (Phase 3).
- **Atomicity**:
  - Prefer **`writeBatch`** for multiple writes in one commit (≤ 500 ops).
  - Use **`runTransaction`** when reads + conditional writes must be consistent (e.g. balance caps, idempotency tokens).
- **Idempotency** (recommended next step): each sync run carries `syncRunId`; finance lines store `idempotencyKey` to skip duplicates.

### 2. Integration A — Meckano → Team → Finance → Projects (MVP implemented)

1. `/api/sync` loads Meckano payload (existing `getDailyAttendance()`).
2. `processMeckanoAttendanceForCompany(companyId, raw)`:
   - Loads `companies/{companyId}/team` into memory maps (`externalIds.meckanoUserId`, `email`).
   - Normalises rows from heterogeneous JSON (hours, user id, email, optional `projectId`).
   - For each row: `laborCost = hours * (hourlyRate ?? 0)`; if `projectId` present, **`FieldValue.increment`** on project `plSummary.laborCosts` and create matching **`finances`** line under **Labor Costs**.
3. **Team doc shape** (convention):

```json
{
  "displayName": "…",
  "email": "user@corp.com",
  "hourlyRate": 85,
  "defaultProjectId": "optional-project-doc-id",
  "externalIds": { "meckanoUserId": "123" }
}
```

### 3. Integration B — Scan → Finance → CRM (Phase 3)

- Invoice scan produces structured `{ vendor, amount, projectId, clientId? }`.
- Single **batch or transaction**:
  - `finances/{entryId}` (type `invoice` / `material`).
  - `projects/{projectId}.plSummary.materialCosts` increment.
  - `clients/{clientId}.balance` update (AP/AR rules).

### 4. UI real-time

- Dashboard tiles subscribe with **`onSnapshot`** to `projects` and `finances` collection sizes (or lightweight aggregate docs later).

## Manual registration (parallel track)

- **Public** `POST /api/register/manual` writes `registrationQueue` via **Admin SDK** (no anonymous Firestore client).
- **Admin** `POST /api/admin/approve-registration` verifies **ID token** + `members/{uid}.role === admin`, then:
  - **Manual**: `createUser` + Firestore membership + optional **Resend** email with temp password.
  - **Google**: existing user → Firestore membership only.

## Environment (Admin + email)

- `FIREBASE_SERVICE_ACCOUNT_JSON` — JSON string of service account (or `FIREBASE_SERVICE_ACCOUNT_BASE64`).
- `FIREBASE_DATABASE_ID` — optional; defaults to `NEXT_PUBLIC_FIREBASE_DATABASE_ID` if Firestore is not `(default)`.
- `RESEND_API_KEY`, `EMAIL_FROM` — welcome email. If missing, API still creates the user but returns `emailSent: false` and `temporaryPassword` once for admin handoff.
