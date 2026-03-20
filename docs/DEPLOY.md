# דיפלוי — BSD-YBM (Next.js + Vercel)

## 1. מקדימה

- ריפו ב-GitHub/GitLab (Vercel מתחבר לריפו).
- העתקת משתני סביבה מ־`template.env` → **Vercel → Project → Settings → Environment Variables** (וגם `.env.local` לפיתוח).

## 2. חיבור Vercel

1. [vercel.com](https://vercel.com) → **Add New** → **Project** → בחרו את הריפו.
2. **Framework Preset:** Next.js (זוהה אוטומטית).
3. **Build Command:** `npm run build` (ברירת מחדל; כולל `prisma generate`).
4. **Root Directory:** שורש הפרויקט (אם האפליקציה לא בתת־תיקייה).
5. Deploy.

## 3. משתני סביבה חשובים

| משתנה | הערות |
|--------|--------|
| `DATABASE_URL` | Postgres (Neon / Supabase וכו') — **חובה** לפיצ'רים שמשתמשים ב-Prisma. בלי זה: האתר עולה, `/api/health` מחזיר `db: not_configured`, `/api/sync` יחזיר 503. |
| `NEXT_PUBLIC_*` | Firebase, כתובת האתר, וכו' — לפי `template.env`. |
| סודות שרת | `JWT_SECRET`, מפתחות AI, OAuth — **ללא** קידומת `NEXT_PUBLIC_`. |
| **Phase 36 — Sentinel** | `CRON_SECRET` (חובה ל־`/api/cron/sentinel`), `ANTHROPIC_API_KEY` או `OPENAI_API_KEY`, אופציונלי `GITHUB_TOKEN` + `GITHUB_REPO` + `SENTINEL_AUTO_PUSH`. |

לאחר שינוי env ב-Vercel: **Redeploy** (או push חדש לענף המחובר).

### Phase 36 — Vercel Cron (Sentinel)

ב־`vercel.json` מוגדר Cron **פעם ביום** (05:00 UTC) ל־`/api/cron/sentinel` — תואם **Vercel Hobby** (לא תומך ב־every-30-min). ב־**Pro** אפשר לשנות ל־`*/30 * * * *`. ב-Vercel יש להגדיר **`CRON_SECRET`**.

לאחר דיפלוי: פרוס מחדש את **Firestore rules** (כולל `sentinelTimeline`).

## 4. מסד נתונים (Prisma)

אם יש מיגרציות:

```bash
npx prisma migrate deploy
```

הרצה חד־פעמית מול ה-DB של הפרודקשן (מכונת פיתוח עם `DATABASE_URL` של פרודקשן, או דרך Neon console / CI).

## 5. בדיקה אחרי דיפלוי

- דף הבית: `/`
- בריאות: `GET /api/health` — `ok: true`; אם אין DB: `db: "not_configured"`.
- Firebase / התחברות — ודאו שדומיין הפרודקשן מורשה בקונסולת Firebase (Authorized domains).

## 6. בעיות נפוצות

- **EPERM ב-Windows ב-`prisma generate`:** עצרו `node`, מחקו `node_modules/.prisma`, הריצו שוב.
- **תמונת לוגו:** ברירת המחדל היא `public/image_8.svg`; אם משתמשים ב-PNG — שימו `public/image_8.png`.

## 7. קבצים בפרויקט

- `vercel.json` — אזור ברירת מחדל (למשל `fra1`), פקודות build.
- `template.env` — רשימת משתנים לדוגמה (לא מכיל סודות אמיתיים).
