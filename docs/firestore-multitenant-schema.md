# Firestore Multi-Tenant Schema (Phase 1)

## Root collections

```text
users/{uid}
users/{uid}/companies/{companyId}
companies/{companyId}
companies/{companyId}/members/{uid}
companies/{companyId}/projects/{projectId}
companies/{companyId}/team/{employeeId}
companies/{companyId}/finances/{entryId}
companies/{companyId}/attendance/{attendanceId}
companies/{companyId}/scans/{scanId}
companies/{companyId}/clients/{clientId}
companies/{companyId}/registrationQueue/{applicantUid}
companies/{companyId}/presence/{uid}
companies/{companyId}/runtimeErrors/{errorId}
```

## users/{uid}/companies/{companyId}

```json
{
  "companyId": "jerusalem-builders",
  "displayName": "Jerusalem Builders",
  "role": "admin", // admin | manager | member | client
  "active": true
}
```

## companies/{companyId}

```json
{
  "name": "Jerusalem Builders",
  "brandColor": "#004694",
  "primaryActionColor": "#FF8C00",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

## companies/{companyId}/members/{uid}

```json
{
  "uid": "auth uid",
  "role": "admin",
  "displayName": "User Name",
  "email": "user@example.com",
  "active": true,
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

## Tenant-scoped domain collections

All data is tenant-bound and must include `companyId` (or be physically nested under `companies/{companyId}`):

- `projects`
- `team`
- `finances`
- `attendance`
- `scans`
- `clients`

## Guardrail Rule (Mandatory)

All application Firestore services must call a `requireCompanyId(companyId)` guard before any read/write.
Any operation without `companyId` is invalid.

## Company Switcher Behavior

- Admin users: can switch between companies they belong to.
- Non-admin users: read-only current company display.
- Selected company persisted in local storage key: `buildai:selectedCompanyId`.

## registrationQueue (admin approval)

- **Google / signed-in:** doc id is often `applicantUid` (same as Firebase `uid`). Created from the client when rules allow.
- **Manual (public form):** doc id is **auto-generated**; fields include `provider: "manual"`, `email`, `phone`, `companyRole` (`client` | `employee`), `applicantUid: null` until approved.
- **Server writes** for manual requests use Firebase Admin (`POST /api/register/manual`) and bypass client rules.
- Admins approve via `POST /api/admin/approve-registration` (ID token + admin role). Manual approvals call `createUser` and optional Resend email.

## presence (“Who is online”)

- Each connected dashboard client updates `lastSeen` every 30s.
- “Online” = `lastSeen` within the last ~2 minutes.

## runtimeErrors (orange status LED / logs)

- Members may append docs with `createdByUid`, `at` (number ms), `source`, `message`.
- Admins may delete entries.
