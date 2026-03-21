# תיעוד הטמעות – BuildAI (Jerusalem Builders)

מסמך מאוחד: מצב הפרויקט הנוכחי + תיעוד ממקורות קודמים (worktrees, תיקיה חדשה).  
עדכון: כפתור הסריקה הוסר מדף הבית — סריקה זמינה רק מתוך הדשבורד (CRM-ERP).

---

## 1. סקירת הפרויקט והחזון

### חזון (מתוך `.cursorrules`)

האפליקציה מחולקת לשלוש זירות:

| זירה | תיאור |
|------|--------|
| **Showroom** | דף נחיתה ציבורי — יוקרתי, מיתוג כחול/שחור, אלגנטי. |
| **Workshop** | דשבורד ניהול פנימי — טכני, מונע־נתונים, יעילות. |
| **Client Lounge** | פורטל לקוחות — נקי, שקיפות, מעקב פרויקטים. |

### סטק נוכחי

- **Framework:** Next.js 16 (App Router)
- **UI:** Tailwind CSS 4, Framer Motion, פונט Heebo, תמיכה מלאה ב־RTL
- **שפה:** TypeScript (strict)
- **Auth:** Firebase Auth + Google OAuth
- **Persistence:** Firestore, Prisma (Neon), localStorage
- **צבע מיתוג:** `#004694` | **רקע:** `#FDFDFD`
- **עיצוב:** Rounded-4xl, RTL priority, Symmetrical UI

---

## 2. מה קיים בפרויקט הנוכחי (BSD-YBM web app)

### דף נחיתה — `src/app/page.tsx`

- **מיתוג:** Jerusalem Builders, BSD-YBM, רקע עדין עם אלמנטים ב־`#004694`.
- **ניווט (שמאל למעלה):** פורטל לקוחות (`/customer-portal`), כניסה לניהול (`/dashboard`), דף הבית (`/`).
- **תוכן:** כותרת מרכזית עם אנימציה, תיאור קצר, אינדיקטור תחתון, footer.
- **ללא כפתור סריקה:** הגישה לסריקה רק דרך "כניסה לניהול" → דשבורד.

### דשבורד (הסדנה)

- **Layout משותף:** `src/app/dashboard/layout.tsx` — סיידבר עם ניווט `Link` + `usePathname()` (דשבורד ראשי, פרויקטים, ניהול תקציב, צוות, לוח סריקה, חיבורים).
- **דשבורד ראשי** — `src/app/dashboard/page.tsx`: כרטיסי סטטיסטיקה (פרויקטים פעילים, תקציב חודשי, נוכחות צוות), הדר עם "שלום, {displayName}", כפתור **סנכרון מערכות מלא**, כפתור התחברות Firebase (AuthButton), אזור סריקה + לינק "סריקה חדשה", בלוק **שאלה ל-AI** (Groq / OpenRouter עם בחירת מנוע).
- **תת־דשבורד:** `dashboard/projects`, `dashboard/finance`, `dashboard/team` (טאבים: מפה, נוכחות, אזורים מורשים, עובדים, דוחות, הגדרות), `dashboard/integrations` (סטטוס כל המפתחות מ־.env).

### נתיבים

| נתיב | סטטוס |
|------|--------|
| `/` | קיים — דף נחיתה. |
| `/dashboard` | קיים — דשבורד ניהול (עם layout וסיידבר). |
| `/dashboard/projects` | קיים — placeholder פרויקטים. |
| `/dashboard/finance` | קיים — placeholder תקציב. |
| `/dashboard/team` | קיים — צוות מקאנו (טאבים, מפה, נוכחות, אזורים, useMeckanoData). |
| `/dashboard/integrations` | קיים — חיבורים (סטטוס Firebase, DB, OAuth, API, Gemini, Meckano, MindStudio, Maps, Groq, OpenRouter, Document AI). |
| `/customer-portal` | קיים — placeholder פורטל לקוחות. |
| `/scan` | קיים — העלאת קובץ, שרשרת: MindStudio → Google Document AI → Gemini. |

### שירותים

| קובץ | תפקיד |
|------|--------|
| `src/services/aiService.ts` | ניתוח מסמכים עם Gemini — פלט JSON. |
| `src/services/meckanoService.ts` | `getDailyAttendance()` — API מקאנו. |
| `src/services/mindStudioService.ts` | `runMindStudioWorkflow`, `isMindStudioConfigured()`. |
| `src/services/multiAIScanService.ts` | `getAiMetadataForDrive(merged)` — מטא־דאטה ל־Drive. |
| `src/services/documentAiService.ts` | Google Document AI + Azure Document AI. |
| `src/services/groqService.ts` | `groqChat(messages)` — מנוע Groq. |
| `src/services/openRouterService.ts` | `openRouterChat(messages)` — מנוע OpenRouter. |
| `src/lib/firebase.ts` | אתחול Firebase + Auth. |
| `src/lib/prisma.ts` | Prisma Client (Neon). |
| `src/lib/apiClient.ts` | `fetchApi(path, options)` עם JWT כש־USE_API_AUTH. |
| `src/context/AuthContext.tsx` | Firebase Auth — התחברות Google, משתמש נוכחי. |

### Layout ומטא־דאטה

- **`src/app/layout.tsx`:** פונט Heebo, `lang="he"`, `dir="rtl"`, מטא "Jerusalem Builders | BuildAI". עטיפה ב־`<Providers>` (AuthProvider).
- **API Routes:** `api/scan` (Gemini), `api/mindstudio/run`, `api/document-ai/google`, `api/ai/chat` (Groq/OpenRouter), `api/meckano/attendance`, `api/health` (בדיקת DB), `api/integrations/status`, `api/sync` (סנכרון מערכות: DB + מקאנו), `api/backup/drive`, `api/documents/upload`.

### משתני סביבה (`.env.local`)

- **DB:** Neon PostgreSQL (`DATABASE_URL`).
- **Firebase:** כל משתני `NEXT_PUBLIC_FIREBASE_*`.
- **Google OAuth:** `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
- **API:** `JWT_SECRET`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_USE_API_AUTH`, `NEXT_PUBLIC_SITE_URL`.
- **AI:** `GEMINI_API_KEY`, `NEXT_PUBLIC_GEMINI_API_KEY`; MindStudio; Groq, OpenRouter; Document AI (Google, Azure).
- **מקאנו:** `MECKANO_API_KEY`.
- **מפות:** `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.

---

## 3. תיעוד ממקורות קודמים (להטמעה עתידית)

התוכן להלן מגרסאות מבוססות Vite (worktrees: zgi, vje, rfx, thy, yvz; תיקיה חדשה). בפרויקט הנוכחי יש למפות ל־Next.js App Router ו־`NEXT_PUBLIC_*`.

### חיבורי פלטפורמה (Meta)

- **מיקום:** דף חיבורים — תפריט → חיבורים.
- **תצוגה:** כרטיסי Vercel, GitHub, MindStudio (מחובר / לא מוגדר) + קישורים חיצוניים.
- **קבצים בגרסאות Vite:** `src/pages/Integrations.tsx`, `src/pages/integrations/PlatformConnections.tsx`, `IntegrationCard.tsx`.
- **התאמה ל־Next.js:** `src/app/integrations/page.tsx` (או תת־נתיבים מתאימים).

### AI — MindStudio ו־Gemini

- **לוגיקה:** סריקת חשבוניות, BOQ ותוכניות — ניסיון ראשון ב־MindStudio (אם מפתח מוגדר), fallback ל־Gemini.
- **קבצים בגרסאות Vite:** `src/services/aiService.ts`, `src/services/mindStudioService.ts`, `src/components/DocumentScanner.tsx`, `api/mindstudio/run.ts`.
- **משתנים:** `VITE_MINDSTUDIO_*` → `NEXT_PUBLIC_MINDSTUDIO_*` (פרונט); `MINDSTUDIO_API_KEY`, `MINDSTUDIO_WORKFLOW_ID` (שרת).

### סינכריה מנועי AI — בודד ואצווה

- **מטרה:** מטא־דאטה אחידה ל־Drive (ספק, תאריך) מכל סריקה.
- **פונקציה משותפת:** `getAiMetadataForDrive(merged)` ב־`src/services/multiAIScanService.ts` — מחלצת `aiVendor`, `aiDate`.
- **שימוש:** MultiAIScanModal, DocumentScanner אצווה, ProjectDocuments אחרי סריקה.

### מקאנו — צוות ונוכחות

- **תכונות:** רשימת עובדים, נוכחות חיה, מפת מיקומים, אזורים מורשים, עורך אזורים (שם, כתובת, רדיוס) עם חיפוש Google Maps.
- **קבצים בגרסאות Vite:** `TeamMeckano.tsx`, `useMeckanoData.ts`, `TeamMeckanoZones.tsx`, `TeamMeckanoMapView.tsx`, `MeckanoMap.tsx`, `AuthorizedZoneEditor.tsx`.
- **משתנים:** `MECKANO_API_KEY`, `VITE_GOOGLE_MAPS_API_KEY` → `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.

### פיצול קוד ו־Lazy Loading

- **דשבורד:** MeckanoMap, GeminiChat — `React.lazy` + `Suspense`.
- **צוות מקאנו:** טעינה lazy לפי טאב/מודל.
- **ב־Next.js:** שימוש ב־`next/dynamic` עם `ssr: false` או טעינה לפי route.

### Google Drive — תיקיית שורש אחת

- **מטרה:** גיבוי + מסמכי פרויקטים באותו Drive, תחת תיקיית שורש אחת.
- **מבנה:**  
  - `{שורש}/Backups/YYYY-MM/` — גיבויים (xlsx + JSON).  
  - `{שורש}/Documents/[פרויקט]/[סוג]/[ספק – מ-AI]/[תאריך – מ-AI]/` — מסמכים, שמירת `mimeType` מקורי.
- **טכני בגרסאות Vite:** `api/backup/drive.ts`, `api/documents/upload.ts` (אופציונלי `aiVendor`, `aiDate`).
- **ב־Next.js:** Route Handlers ב־`src/app/api/backup/`, `src/app/api/documents/`.

### משתני סביבה — טבלה מאוחדת (התאמה לפרויקט הנוכחי)

| משתנה | שימוש |
|--------|--------|
| `NEXT_PUBLIC_FIREBASE_*` | חיבור Firebase (פרונט). |
| `NEXT_PUBLIC_GEMINI_API_KEY` | Gemini AI (פרונט/fallback). |
| `NEXT_PUBLIC_MINDSTUDIO_*`, `MINDSTUDIO_*` | MindStudio. |
| `MECKANO_API_KEY` | API מקאנו (שרת). |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | מפת נוכחות ואזורים מורשים. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | OAuth ל־Google Drive. |

### סקריפטים שימושיים

- **Prisma:** `npx prisma generate` (ב־postinstall ו־build). מיגרציה ראשונה: `prisma/migrations/20250319000000_init/migration.sql` (טבלת Project). הרצה: `npx prisma migrate deploy` (אחרי הגדרת DATABASE_URL).
- **בדיקת חיבור DB:** GET `/api/health` מחזיר `{ ok, db: 'connected' }` אם Prisma מתחבר.
- **מחיקת דפלוי ישנים ב־Vercel:** `node scripts/vercel-delete-old-deployments.mjs` (דורש `VERCEL_TOKEN`).

---

## 4. התאמה לפרויקט הנוכחי (Next.js)

- **נתיבים:** בגרסאות הקודמות `src/pages/` — בפרויקט הנוכחי `src/app/` (App Router). דפים עתידיים: `src/app/[route]/page.tsx`.
- **משתני סביבה:** הפרויקט כבר משתמש ב־`NEXT_PUBLIC_*` ומשתני שרת; לשמור על כך.
- **API:** פונקציות Vercel ב־`api/` — למפות ל־Route Handlers ב־`src/app/api/[...]/route.ts` בהתאם למבנה הקיים.

---

## 5. החלטות ועדכונים אחרונים

- **סריקה:** כפתור "התחל סריקה" הוסר מדף הבית. סריקה זמינה **רק** מתוך הדשבורד (הסדנה / CRM-ERP) — "לוח סריקה" / "סריקה חדשה".
- **נכסים ויזואליים:** אייקונים איזומטריים (קוביות, סימון הצלחה) מתאימים לדשבורד, ל־Global Sync ולדפי סריקה/פרויקטים; ניתן לשקול שילוב ב־`public/` או כ־assets.
