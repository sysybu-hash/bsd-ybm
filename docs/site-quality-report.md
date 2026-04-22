# BSD-YBM - דוח תקינות, מבנה ומוכנות אתר

תאריך בדיקה: 2026-04-22  
סביבת בדיקה: Windows / Next.js 15 / Node 24 / Playwright Chromium  
סטטוס כללי: תקין לבנייה והרצה מקומית, עם הערת תשתית אחת לגבי `DIRECT_URL`.

## תקציר מנהלים

האתר עבר ייצוב טכני מלא ברמת build, lint, TypeScript, unit tests, e2e smoke ובדיקה ויזואלית בסיסית בדסקטופ ובמובייל. המערכת כוללת CRM, ERP, סריקת מסמכים רב-מנועית, אזור כספים, מסמכים, הגדרות, תפעול, Meckano, מנויים, AI, פורטל, אזור לקוחות וניהול פלטפורמה.

המצב הנוכחי טוב משמעותית מנקודת ההתחלה: build עובר, אין אזהרות lint, אין שגיאות TypeScript, ואין שגיאות דפדפן בבדיקת smoke. עדיין מומלץ להשלים בדיקות משתמש מחובר אמיתי מול בסיס נתונים staging כדי לאמת את כל הכפתורים שמבצעים פעולות עסקיות אמיתיות.

## תיקונים שבוצעו

- סקריפט `scripts/check-env-essential.mjs` תוקן כך שיטען `.env`, `.env.local`, ו-`.env.vercel.pull` לפני בדיקת משתני סביבה.
- `package.json` תוקן כך ש-build יריץ `prisma generate` ישירות דרך CLI מקומי ועובד.
- תוקנה אזהרת ARIA ב-ERP: כפתור התראת מחיר כבר לא משתמש ב-role לא מתאים.
- תצוגת תמונה בסורק הרב-מנועי עברה מ-`img` ל-`next/image` עם `unoptimized`, מתאים ל-preview מקומי.
- תמונת משתמש בתפריט צד עברה ל-`next/image`.
- הוסר `as any` מנקודות מרכזיות ב-auth, debug-session, ERP/business price comparison.
- `FinancialCharts` חוזק לקבלת JSON לא ודאי בצורה בטוחה בלי הנחות שוברות.
- נוסף סקריפט `scripts/visual-smoke.mjs` לבדיקת מסכים, console errors, overflow אופקי ומסכים ריקים.

## תוצאות בדיקות

- `npm run lint` - עבר, 0 אזהרות.
- `npx tsc --noEmit` - עבר.
- `npm test -- --runInBand` - עבר: 15 suites, 50 tests.
- `npm run build` - עבר בהצלחה.
- `npx playwright test` - עבר: 6 passed, 3 skipped. הדילוגים הם בדיקות משתמש מחובר שתלויות בפרטי התחברות.
- `node scripts/visual-smoke.mjs` - עבר: 22 בדיקות מסלול/מסך, ללא שגיאות console, ללא overflow אופקי, ללא מסכים ריקים.

## מפת האתר הפנימי

מספר עמודי workspace תחת `/app`: 39.

- `/app` - דשבורד ראשי.
- `/app/admin` - ניהול פלטפורמה.
- `/app/advanced` - הפניה/גישה מתקדמת.
- `/app/ai` - מרכז AI.
- `/app/automations` - הפניה/אוטומציות.
- `/app/billing` - הפניה/חיוב.
- `/app/business` - מרכז עסקי מאוחד CRM + ERP.
- `/app/clients` - לקוחות CRM.
- `/app/clients/advanced` - מסלול מתקדם/legacy.
- `/app/documents` - מסמכים וסריקות.
- `/app/documents/erp` - ERP מסמכים.
- `/app/documents/issue` - הפקת מסמך.
- `/app/documents/issued` - מסמכים שהופקו.
- `/app/finance` - כספים.
- `/app/help` - עזרה.
- `/app/inbox` - תיבת עבודה.
- `/app/inbox/advanced` - מסלול מתקדם/legacy.
- `/app/insights` - תובנות.
- `/app/insights/advanced` - תובנות מתקדמות.
- `/app/intelligence` - מודיעין עסקי.
- `/app/onboarding` - קליטת משתמש/ארגון.
- `/app/operations` - תפעול.
- `/app/operations/advanced` - תפעול מתקדם.
- `/app/operations/meckano` - אינטגרציית Meckano.
- `/app/portal` - פורטל.
- `/app/projects` - פרויקטים.
- `/app/settings` - הפניה למרכז הגדרות.
- `/app/settings/advanced` - הפנית legacy להגדרות.
- `/app/settings/automations` - הגדרות אוטומציה.
- `/app/settings/billing` - מנוי וחיוב.
- `/app/settings/operations` - הגדרות תפעול.
- `/app/settings/organization` - ארגון ומס.
- `/app/settings/overview` - סקירת הגדרות.
- `/app/settings/platform` - בקרת פלטפורמה.
- `/app/settings/presence` - נוכחות דיגיטלית.
- `/app/settings/profession` - מקצוע ושפה.
- `/app/settings/stack` - מנועים וחיבורים.
- `/app/success` - הצלחת תשלום/פעולה.
- `/app/trial-expired` - מנוי/ניסיון הסתיים.

## API ותשתית

מספר נתיבי API: 54.

אזורים עיקריים:

- Admin: בריאות מערכת, לוגים, שידור התראות, ניהול תפקידים וסיסמאות.
- AI: צ'אט, עוזר, operator, providers.
- Analyze queue: תור עיבוד סריקות.
- CRM: אנשי קשר וחיפוש סמנטי.
- ERP: מסמכים, מסמכים שהופקו, השוואת מחירים, מחברת פרויקט.
- Integrations: ענן ו-Google Calendar.
- Meckano: אזורים, סנכרון אנשי קשר וסנכרון אזורים ל-CRM.
- PayPal: יצירת הזמנה וסגירת הזמנה.
- Reports: PDF/CSV פיננסיים.
- Scan: metadata, tri-engine ו-stream.
- User: התראות.
- Public/controlled: auth, register, locale, sign token, invite preview.

## מצב UI וחוויית משתמש

הבדיקה הוויזואלית כיסתה דסקטופ ומובייל למסלולים ציבוריים ולמסלולי workspace מוגנים. לא נמצאו:

- מסכים לבנים.
- overflow אופקי.
- שגיאות console.
- שגיאות runtime בדפדפן.
- הפניות שבורות במסלולים שנבדקו.

המסכים המוגנים מפנים להתחברות כנדרש כאשר אין session.

## כפילויות ומסלולי legacy

קיימים עדיין מסלולי `/dashboard/*` רבים לצד `/app/*`. בפועל הם נבנים כנתיבי redirect/legacy קטנים, ולכן אינם שוברים build. מומלץ להשאיר אותם זמנית כדי לא לשבור קישורים קיימים, אבל להגדיר מדיניות ניקוי:

- `/app/*` הוא המקור החדש.
- `/dashboard/*` צריך להישאר redirect בלבד.
- אין להוסיף פיצ'רים חדשים למסלולי dashboard legacy.

מרכז ההגדרות כבר מאורגן לפי nested routes, עם הפניות מ-legacy query tabs.

## הערות שנותרו לפני Production מלא

- חסר `DIRECT_URL` מקומי. build עובר, אבל `prisma migrate` ו-`db push` עלולים להיכשל אם `DATABASE_URL` הוא pooler. יש להוסיף `DIRECT_URL` לסביבת staging/production/local לפי Neon direct connection.
- בדיקות e2e של משתמש מחובר דולגו כי אין בפרויקט כרגע fixture התחברות מלא. מומלץ להוסיף user seed + storage state.
- קיימות שתי החרגות hooks ב-Meckano. הן לא שוברות lint/build, אבל מומלץ להחליף בהדרגה ל-`useCallback` כדי להוריד חוב טכני.
- חלק מהתגובות/טקסטים בקבצים קיימים מוצגים עם סימני קידוד ישנים בכלי shell. הקוד נבנה, אך כדאי לבצע ניקוי encoding הדרגתי למסמכי עבר והערות.

## המלצת המשך

האתר עומד כרגע בסטנדרט טכני טוב: build/test/lint/type/e2e smoke עוברים. כדי להגיע לאימות "10/10" עסקי מלא, השלב הבא צריך להיות staging עם משתמש בדיקה, ארגון, מנוי, לקוחות, מסמכים וסריקות דמו, ואז Playwright מחובר שיעבור חלון-חלון וילחץ בפועל על פעולות CRUD, סריקה, הפקת מסמך, חיוב והגדרות.
