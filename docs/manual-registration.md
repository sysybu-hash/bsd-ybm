# Manual registration & admin approval

## Flow

1. Guest submits **`/register`** → `POST /api/register/manual` creates `companies/{companyId}/registrationQueue/{autoId}` with `status: "pending"`, `provider: "manual"` (via **Firebase Admin**, not client rules).
2. **Blue LED** uses the same `where('status','==','pending')` listener — manual and Google requests behave the same.
3. Admin opens **`/dashboard/settings/users`** → **אשר** calls `POST /api/admin/approve-registration` with Firebase **ID token**.
4. For **`provider === 'manual'`** the API:
   - Creates **Firebase Auth** user (email + temporary password).
   - Writes `members`, `users/{uid}`, `users/{uid}/companies/{companyId}`.
   - Sends email via **Resend** when configured.

## Required configuration

### Firebase Console

- Enable **Email/Password** sign-in for manual users.
- Service account with permission to create users and write Firestore (Admin SDK).

### Environment variables

| Variable | Purpose |
|----------|---------|
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Full JSON of the Firebase service account (string). **Or** |
| `FIREBASE_SERVICE_ACCOUNT_BASE64` | Same JSON, Base64-encoded. |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to JSON file (local dev). |
| `FIREBASE_DATABASE_ID` | Optional; if Firestore is not `(default)`, set to the same value as `NEXT_PUBLIC_FIREBASE_DATABASE_ID`. |
| `NEXT_PUBLIC_REGISTRATION_COMPANY_ID` | Target company for public registrations (default: seed company id). |
| `NEXT_PUBLIC_SITE_URL` | Used in the welcome email login link. |
| `RESEND_API_KEY` | Send welcome email with temporary password. |
| `EMAIL_FROM` | e.g. `BSD-YBM AI Solutions <no-reply@bsd-ybm.co.il>` (domain must be verified in Resend). |

If **Resend** is not configured, the user is still created and the API returns **`temporaryPassword`** once — the admin UI shows a modal to copy it.

## Google self-registration queue

Existing flow: signed-in user creates a queue doc with `applicantUid === uid`. Approval for non-manual requests uses the same API and **does not** call `createUser`.
