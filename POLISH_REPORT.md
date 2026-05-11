# דוח Polish מלא — BSD-YBM

סיכום יישום תוכנית ה-polish על הענף `cursor/scan-wizard-master-plan-eecd` (ללא תלויות חדשות, ללא שינוי לוגיקה עסקית).

## קומיטים לפי אזורים (12 + RTL + דוח)

| # | Hash | הודעה |
|---|------|--------|
| 1 | `d672e96` | polish(ui): אזור 1 — אשף סריקה, Skeleton ומצבי מיקוד |
| 2 | `bc56780` | polish(ui): אזור 2 — מעטפת אפליקציה, דוק וכרטיס סריקה |
| 3 | `1910a88` | polish(ui): אזור 3 — דף הבית, כרטיסי KPI ומרכז עסקי |
| 4 | `b90d105` | polish(ui): אזור 4 — ERP, טבלת מסמכים ו-Notebook |
| 5 | `723b0dd` | polish(ui): אזור 5 — CRM, טבלת ארגונים וקישורי Bento |
| 6 | `9757b06` | polish(ui): אזור 6 — מרכז הגדרות וכרטיסי טופס |
| 7 | `24281ae` | polish(ui): אזור 7 — ניהול פלטפורמה וקישורי תמיכה |
| 8 | `6669f9e` | polish(ui): אזור 8 — מסך תפעול וקיצורי דרך |
| 9 | `a5735ad` | polish(ui): אזור 9 — כניסה, Skeleton fallback ומיקוד מקלדת |
| 10 | `e5fcb43` | polish(ui): אזור 10 — דף שיווק, CTA ו-fetchPriority ל-Hero |
| 11 | `66e4f56` | polish(ui): אזור 11 — תוקף ניסיון ודף הצלחת תשלום |
| 12 | `6f073a6` | polish(ui): אזור 12 — TableSkeleton, מעבר דף ושגיאות גלובליות |
| RTL | `5447021` | style(rtl): החלפת left/right ב-start/end במסכים נקודתיים |

## מדידת `left-` / `right-` ב־`className` (מחוץ ל־`components/scan/wizard/`)

ספירה עם `rg 'className=.*[\s"\`](left|right)-' app components --glob '*.tsx' --glob '!**/scan/wizard/**'`:

- **לפני מיפוי חלקי:** כ־33 מופעים
- **אחרי מיפוי חלקי:** כ־19 מופעים נותרים

המיפוי לא כיסה את כל האתר (ראו דילוגים למטה).

## צילומי לפני/אחרי (מסכים מובילים)

| מסך | הערה |
|-----|--------|
| סריקה (`/app/scan`) | מומלץ צילום ידני מהסביבה המקומית אחרי `npm run dev`. |
| ERP / מסמכים | מומלץ צילום מאזור טבלת המסמכים או לוח ה־ERP. |
| הגדרות | מומלץ צילום ממרכז ההגדרות המאוחד (`/app/settings/organization` וכו׳). |

ניתן לשמן צילומים תחת `/opt/cursor/artifacts/` אם רלוונטי בסביבת Cursor.

## מה דולג ולמה

- **מיפוי RTL מלא:** נותרו מופעי `left-`/`right-` בדפי דמו (`app/demo`), רקעים דקורטיביים ב־WizardHome / ExecutiveSuite, חלק מרכיבי intelligence ועוד — סיכון לשבור יישור ויזואלי מכוון או דורש בדיקה ויזואלית פר־מסך.
- **`components/scan/wizard/`:** לא נכלל בסריקת החלפה אוטומטית (לפי ההוראה המקורית); polish שם בוצע ידנית באזור 1 בלבד.
- **`lib/professions/bundle.ts`, `scan-wizard.ts`, `lib/meckano-access.ts`:** לא נגענו.
- **`npx tsc --noEmit`:** נכשל בסביבה זו בשל שגיאות Prisma/סכמה קיימות (למשל `expenseRecord`, `meckanoZoneId` בשדות שלא מסונכרנים ל־client שנוצר) — לא נגרמו משינויי ה-polish; נדרש עדכון סכמה/`prisma generate` במאגר אם רוצים TS נקי.
- **Playwright:** לאחר `npx playwright install chromium`, **`npx playwright test e2e/site-quality.spec.ts --project=chromium`** עבר (21 בדיקות). הרצת כל הפרויקטים כולל WebKit דורשת `playwright install-deps` / חבילות מערכת — לא הורצה עם sudo בסביבה זו.

## אימות שנסגר בפועל

- `npm test` — ירוק לאורך העבודה
- `npm run lint` — ירוק
- Playwright `site-quality` — ירוק עבור פרויקט `chromium` לאחר התקנת דפדפן Playwright
