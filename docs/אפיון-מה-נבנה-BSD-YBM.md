# אפיון מוצר וטכני — מה נבנה (BSD-YBM)

מסמך זה מתאר את **מה שקיים בקוד** לאחר יישום תוכנית הניווט, המסכים והעיצוב, והרחבות נלוות (PDF, פריסה וכו׳). אינו מחליף את מסמכי התכנון המקוריים — הוא תמונת מצב **נוכחית**.

---

## 1. עקרונות מרכזיים

| עקרון | יישום |
|--------|--------|
| **הפרדת כספים ו־AI** | שני פריטי ניווט נפרדים: «כספים» (`/app/finance`) ו־«AI» (`/app/ai`). |
| **פרויקטים** | נתיב ראשי `/app/projects` + קישורים ממסך הלקוחות (`?projectId=`). |
| **תאימות לאחור** | נתיבים ישנים (`/app/insights`, `/app/intelligence`) מפנים ל־`/app/ai`; הפניות `next.config.js` מ־`/dashboard/*` לנתיבים החדשים. |
| **מנוי וחיוב פלטפורמה** | נשארים תחת **הגדרות** — `/app/settings/billing`; מסך הכספים מקשר אליהם. |

---

## 2. מפת נתיבים (Workspace)

| מזהה ניווט | נתיב | תפקיד קצר |
|-------------|------|------------|
| `home` | `/app` | דשבורד / בית workspace |
| `inbox` | `/app/inbox` | תיבת עבודה |
| `projects` | `/app/projects` | רשימת פרויקטים, קישור ללקוחות לפי פרויקט |
| `clients` | `/app/clients` | לקוחות (ללא מונח CRM בממשק) |
| `finance` | `/app/finance` | מרכז כספים — KPI, תחזית, ייצוא PDF/CSV |
| `ai` | `/app/ai` | תובנות + מודיעין (מיזוג מסכים קודמים) |
| `documents` | `/app/documents` | מסמכים + מחוללים לפי מקצוע |
| `operations` | `/app/operations` | תפעול |
| `settings` | `/app/settings` | הגדרות |

**Legacy שהוסר ממזהי `AppRouteId`:** `billing`, `insights` (לא כפריטי ניווט ראשיים; הגדרות חיוב נשארות תחת Settings).

---

## 3. מסכים עיקריים

### 3.1 כספים — `/app/finance`

- **נתונים:** אגרגציות מ־`IssuedDocument` (פתוח / משולם), תחזית CRM דרך `loadFinanceForecast` (`lib/finance-forecast.ts`) לפי סטטוסי קשר `LEAD` / `ACTIVE` / `PROPOSAL`.
- **UI:** כרטיסי KPI, פס תזרים (משולם / פתוח / תחזית), קישורים ל־ERP (`/app/documents/erp`), הפקה (`/app/documents/issue`), הגדרות מנוי (`/app/settings/billing`).
- **ייצוא:**
  - `GET /api/reports/finance-pdf` — PDF סיכום (`@react-pdf/renderer`, `lib/pdf/FinanceReportDocument.tsx`).
  - `GET /api/reports/finance-csv` — עד 500 מסמכים מונפקים (UTF‑8 עם BOM).

### 3.2 AI — `/app/ai`

- **תוכן:** `InsightsWorkspaceV2` עם props מ־`loadInsightsWorkspaceProps` + `IntelligenceDashboardContent` (`skipRedirect` כשאין הרשאה למודיעין).
- **הפניות:** `/app/insights`, `/app/intelligence` → `/app/ai`.
- **ניווט:** אייקון קטן ליד פריט AI (למשל Sparkles) ב־`AppShellV2` (לפי יישום בקוד).

### 3.3 פרויקטים — `/app/projects`

- רשימת `Project` מהארגון, מיון לפי פעילות ו־`createdAt`.
- קישור «ללקוחות בפרויקט» → `/app/clients?projectId=…`.

### 3.4 לקוחות — `/app/clients`

- פרמטר **`projectId`** — סינון התחלתי לפי פרויקט.
- בסרגל הצד: קישור «כל הפרויקטים», קישור ללקוחות מסוננים לכל פרויקט בולט.

### 3.5 מסמכים — `/app/documents`

- **`DocumentsWorkspaceV2`** + **`DocumentGeneratorsStrip`**:
  - תבניות מ־`IndustryProfile` (`lib/professions/runtime.ts`).
  - **רשמי (OFFICIAL):** מעבר להפקה `/app/documents/issue`.
  - **דוח / אישור / טופס:** טיוטה כ־`IssuedDocument` דרך `createDraftFromProfessionalTemplateAction`, או **הורדת PDF** ב־`GET /api/professional-template/pdf?templateId=…` (`lib/pdf/ProfessionalTemplatePdfDocument.tsx`).

---

## 4. שכבת API רלוונטית

| נתיב | שימוש |
|------|--------|
| `/api/reports/finance-pdf` | PDF תמונת מצב פיננסית (מחובר למשתמש / ארגון). |
| `/api/reports/finance-csv` | CSV מסמכים מונפקים. |
| `/api/professional-template/pdf` | PDF תבנית מקצועית לפי `templateId`. |

קבצי route של PDF: `route.tsx` (JSX + `renderToBuffer`).

---

## 5. הרשאות ותכונות (Workspace)

- **`lib/workspace-features.ts`:** מיפוי `finance` → `module_billing`, `ai` → `module_insights`; נתיבים כמו `/app/settings/billing` נספרים כ־active tab תחת «כספים» ב־`pathnameToWorkspacePrimaryRoute`.
- **`lib/workspace-access.ts`:** סקשני utility ללא `intelligence` נפרד (לפי יישום).

---

## 6. שיווק ודף מוצר

- **`LandingPage`:** יישור צבעים לטוקנים (`--marketing-hero-accent`, `--marketing-accent-soft`, `--v2-*`).
- **`/product` + `site-marketing.*.json`:** מודולים — לקוחות, מסמכים, כספים, AI, תפעול (במקום חיוב/תובנות ישנים כטקסט שיווקי).

---

## 7. בדיקות ואיכות

- **Jest:** יחידות (כולל `workspace-access`, `professional-template-draft`, `workspace-features`); תיקיית `e2e/` מוחרגת מ־Jest.
- **Playwright:** `e2e/smoke.spec.ts` — דף בית, התחברות, חסימת `/app` ללא סשן. פקודה: `npm run test:e2e`.
- **`tsc` / `next build`:** כחלק מזרימת CI מקומית.

---

## 8. פריסה (Neon + Vercel)

- **Neon:** `DATABASE_URL` (pooler); `prisma db push` מסנכרן סכימה; במקרה של טבלאות demo של Neon שלא ב־schema — נדרש `--accept-data-loss` (למשל הסרת `playing_with_neon`).
- **Vercel:** `npm run vercel:env:push:stack` דוחף משתני ליבה ל־Production; `npm run vercel:deploy:prod` מפריס.
- **בדיקה לפני פריסה:** `npm run check:deploy` (קורא `.env.local` בלי להדפיס סודות).

---

## 9. מה המסמך הזה *לא* כולל

- דרישות משפטיות/מס מלאות ל־PDF.
- E2E מלא אחרי התחברות (דורש אסטרטגיית משתמש בדיקה / `storageState`).
- רענון ויזואלי של **כל** דפי השיווק מחוץ למה שצוין לעיל.

---

*נוצר כתמונת מצב לאחר יישום בקוד; לעדכון — לעדכן את הקובץ או לקשר למסמכי מוצר רשמיים.*
