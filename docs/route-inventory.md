# מפת נתיבים — Workspace (בסיס אמת)

מסמך עזר: נתיבי `app/app` העיקריים מול הפניות ב־`next.config.js`.

## דפים (App Router)

| נתיב קובץ | URL |
|-----------|-----|
| `app/app/page.tsx` | `/app` |
| `app/app/business/page.tsx` | `/app/business` |
| `app/app/scan/page.tsx` | `/app/scan` — מרכז AI (סריקה, מחברת מקורות, פענוח מסמכים, מחוללי הפקה) |
| `app/app/crm/page.tsx` | `/app/crm` |
| `app/app/erp/page.tsx` | `/app/erp` |
| `app/app/operations/page.tsx` | `/app/operations` |
| `app/app/settings/**` | `/app/settings/...` |

## הפניות נפוצות (דוגמאות)

מפורטות במלואן ב־`LEGACY_REDIRECTS` בתוך `next.config.js`. בדיקות smoke: `e2e/redirects.spec.ts`.

## קנוני בקוד

`lib/workspace-canonical-routes.ts` — `WORKSPACE_ROUTES`.

## רוחב תוכן אחיד

`lib/workspace-layout.ts` — `WORKSPACE_CONTENT_MAX_CLASS` (מוזן ל־`MainContainer`) כדי שכל מסכי `/app` ישבו על אותו רוחב מרכזי כמו דף הבית.
