# דוח בדיקה חיה - BSD YBM

תאריך בדיקה: 22/04/2026  
סביבה: Production build מקומי על `http://127.0.0.1:3000`  
משתמש בדיקה: `owner@bsd-demo.test`

## סיכום מנהלים

- האתר עלה ב-production ועבר בדיקת מסכים מלאה: 39 נתיבים כפול Desktop/Mobile, סה"כ 78 בדיקות תצוגה.
- לא נמצאו מסכים ריקים, שגיאות Console, שגיאות Runtime, או גלישות רוחב חריגות.
- בדיקות יחידה עברו: 15 suites, 50 tests.
- בדיקות E2E מחוברות עברו: 3/3.
- מנועי הסריקה מזוהים במערכת ומוצגים בממשק, אך בדיקה חיה אמיתית מול הספקים החיצוניים לא יכולה להשלים פענוח עד תיקון מפתחות/מכסה.

## נתוני בדיקה שהוטענו

נוצר seed בדיקה עם ארגון, משתמשים, אנשי קשר, פרויקטים, מסמכי ERP, חשבוניות, שורות מסמך, תצפיות מחיר, עבודות סריקה ונתוני Meckano.

משתמשים:

- `owner@bsd-demo.test` / `Demo!2026` - מנהל ארגון
- `pm@bsd-demo.test` / `Demo!2026` - מנהל פרויקטים
- `finance@bsd-demo.test` / `Demo!2026` - כספים
- `client@bsd-demo.test` / `Demo!2026` - לקוח

## בדיקת מסכים וכפתורים

הסקריפט `scripts/live-site-audit.mjs` נכנס למערכת כמשתמש מחובר, עבר על כל נתיבי `/app`, בדק Desktop ו-Mobile, ספר כפתורים וקישורים, צילם screenshots ושמר דוח.

תוצאה:

- 39 מסכים נבדקו.
- 78 שילובי מסך/תצוגה נבדקו.
- כל הנתיבים החזירו `200`.
- לא נמצאו overflow רוחבי, מסכים ריקים או שגיאות console.
- דוח מלא: `docs/qa/live-site-audit/report.md`
- screenshots: `docs/qa/live-site-audit/`

הערה תפעולית: לא בוצעו קליקים עיוורים על פעולות הרסניות כמו מחיקה/שליחה/חיוב. הכפתורים נספרו ונבדקה טעינת המסכים, וזרימות מחוברות מרכזיות נבדקו ב-E2E.

## תיקונים שבוצעו

- תיקון טופס התחברות: נוסף `method="post"` כדי למנוע מצב שבו סיסמה נשלחת בטעות ב-URL לפני hydration.
- תיקון E2E: הסרת חסימת cookie banner, המתנה ל-hydration, ודיוק locator בדף ההגדרות.
- תיקון Middleware: משתמש מחובר עם cookie תקין כבר לא נזרק חזרה ל-login במסלולי `/app` ו-API מוגנים.
- תיקון hydration: רכיבי `ProgressRing` ו-`Sparkline` עברו מ-`Math.random()` ל-`useId()` כדי למנוע mismatch בין server/client.
- תיקון מנוע סריקה: במסלול חשבונית, כאשר OpenAI נכשל ואין תוצאה שימושית מ-Document AI, המערכת מנסה Gemini fallback.
- שיפור שקיפות שגיאות: אם כל המנועים נכשלים, ההודעה כוללת פירוט Document AI / OpenAI / Gemini fallback.
- שיפור UI סריקה: שלב `gemini_fallback` מקבל תווית ברורה בממשק.

## מצב מנועי הסריקה בבדיקה חיה

Endpoint `GET /api/scan/engine-meta` החזיר שכל שלושת המנועים מוגדרים ברמת env:

- Document AI: מוגדר
- Gemini: מוגדר
- OpenAI: מוגדר

בדיקה חיה עם קובץ חשבונית טקסטואלי גילתה:

- Document AI: מחזיר `404 / UNIMPLEMENTED` עבור המעבד הנוכחי.
- OpenAI: מחזיר `429 insufficient_quota`.
- Gemini: המפתח פג תוקף, `API key expired`.

מסקנה: קוד המערכת וה-fallback קיימים, אבל כדי שפענוח חי יעבוד בפועל צריך לתקן את הספקים החיצוניים:

1. לחדש/להחליף `GOOGLE_GENERATIVE_AI_API_KEY` או `GEMINI_API_KEY`.
2. לעדכן הגדרות Document AI: project/location/processor תקינים.
3. להסדיר Billing/Quota עבור OpenAI או להחליף מפתח.

## פקודות אימות שעברו

- `npm run lint`
- `npx tsc --noEmit`
- `npm test -- --runInBand`
- `npm run build`
- `npx playwright test e2e/authenticated.spec.ts --workers=1`
- `node scripts/live-site-audit.mjs`

## מה נשאר לתקן

- חסימת ספקים חיצוניים של מנועי AI: זה הפריט היחיד שמונע סריקה חיה מלאה מקצה לקצה.
- `DIRECT_URL` חסר: לא חוסם build/runtime, אבל מומלץ להוסיף כדי ש-`prisma migrate` ו-`db push` יעבדו נכון מול Neon/Postgres עם pooler.
- ב-Windows Prisma generate עלול להיתקל בקובץ engine נעול. יש fallback בטוח שמאפשר build, אבל עדיף לסגור תהליכי Node לפני generate בסביבת פיתוח.

