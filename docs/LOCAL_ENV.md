# Local env (Windows / Mac)

| File | Role |
|------|------|
| `.env.local` | From `vercel env pull` — may be overwritten |
| `.env.development.local` | Machine-only; Next loads in dev; Vercel CLI does not overwrite |

1. `npx vercel env pull`
2. Keep `FIREBASE_SERVICE_ACCOUNT_PATH` in `.env.development.local`
3. Restart `npm run dev`

Production: use FIREBASE_SERVICE_ACCOUNT_JSON or BASE64 on Vercel, not C:\ paths.
