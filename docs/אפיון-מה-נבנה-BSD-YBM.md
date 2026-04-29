# אפיון מוצר וטכני — מה נבנה (BSD-YBM)

מסמך זה מתאר את **מה שקיים בקוד** לאחר יישום תוכנית הניווט, המסכים והעיצוב, והרחבות נלוות (PDF, פריסה וכו׳). אינו מחליף את מסמכי התכנון המקוריים — הוא תמונת מצב **נוכחית**.

---

## 1. עקרונות מרכזיים

| עקרון | יישום |
|--------|--------|
| **בית אחד מרכזי** | סקירה, KPI ותובנות AI קצרות ב־`/app` (`WorkspaceHomeView` + `loadWorkspaceHomeData`). |
| **CRM ו־ERP כנתיבים קנוניים** | לקוחות: `/app/crm`; מסמכים/הפקות/זרימות כספיות עיקריות: `/app/erp`. |
| **סריקה נפרדת** | `/app/scan`. |
| **תאימות לאחור** | `next.config.js` מפנה נתיבים ישנים (`/app/clients`, `/app/documents`, `/app/finance`, `/app/ai`, `/app/inbox`, `/dashboard/*`, …) ליעדים הקנוניים; רשימה ב־`LEGACY_REDIRECTS`. |
| **מנוי וחיוב פלטפורמה** | `/app/settings/billing` (וגם הפניה מ־`/app/billing`). |
| **ניווט בקוד** | מומלץ `WORKSPACE_ROUTES` מ־`lib/workspace-canonical-routes.ts`. |

---

## 2. מפת נתיבים (Workspace)

מזהי primary מ־`components/app-shell/app-nav.ts` (`AppRouteId`):

| מזהה | נתיב | תפקיד קצר |
|--------|------|------------|
| `home` | `/app` | בית — סקירה, הכנסות חודש, מסמכים ולקוחות אחרונים |
| — | `/app/business` | מרכז עסקי משולב (CRM×ERP), לא מזהה primary נפרד בתפריט הצד |
| `scan` | `/app/scan` | סריקת מסמכים |
| `crm` | `/app/crm` | לקוחות (מיפוי legacy: `/app/clients`, `/app/projects` → כאן) |
| `erp` | `/app/erp` | ERP / מסמכים / זרימות כספיות (מיפוי: `/app/documents`, `/app/finance`, `/app/insights` → כאן) |
| `operations` | `/app/operations` | תפעול |
| `settings` | `/app/settings/overview` (כניסה) | הגדרות |
| `admin` | `/app/admin` | ניהול פלטפורמה (לפי הרשאה) |
| `success` | `/app/success` | מסך הצלחה (לא בתפריט ראשי) |

תאימות `/dashboard/*`: הפניות ב־`next.config.js` וב־`middleware`; אין עוד עמודים תחת `app/dashboard`.

---

## 3. מסכים עיקריים

### 3.1 בית — `/app`

- **נתונים:** `loadWorkspaceHomeData` (`lib/load-workspace-home.ts`) — אגרגציות `IssuedDocument`, `Contact`, `Project`, `Document`.
- **UI:** `WorkspaceHomeView` (`components/workspace/WorkspaceHomeView.tsx`) בשפה `components/ui/claude`; קישור «מרכז עסקי» ל־`/app/business`.

### 3.2 מרכז עסקי — `/app/business`

- **שרת:** `BusinessPageContent` (`app/workspace-content/business/BusinessPageContent.tsx`) — אגרגציית ERP/CRM לארגון.
- **לקוח:** `BusinessHubClient` (`components/business/BusinessHubClient.tsx`).

### 3.3 ERP — `/app/erp`

- **UI:** `FinanceHubContent` (Bento) + `MultiEngineScanner` בתחתית העמוד (עוגן `#erp-multi-scanner`, גלילה דרך `ErpScrollToHash`); עוגן `#erp-wizard` לקישורי onboarding.
- תוכן מסמכים מוזג לכאת ממבנה ישן של «מסמכים/כספים»; רכיבים נוספים כמו `DocumentsWorkspaceV2` עשויים להופיע בהקשרים אחרים.
- **ייצוא דוחות (API ללא שינוי נתיב):**
  - `GET /api/reports/finance-pdf`, `GET /api/reports/finance-csv`
  - `GET /api/professional-template/pdf?templateId=…`

### 3.4 CRM — `/app/crm`

- לקוחות ופרויקטים; פרמטרי שאילתה (`projectId`, `clientId`) נשמרים בקישורים פנימיים.

### 3.5 תובנות / מודיעין (מסכים נלווים)

- עמודים כמו `app/app/insights/page.tsx` עשויים להמשיך להיטען בהקשר ERP; קישורים מומלצים ל־`/app/erp` או `/app` לפי המוצר.

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

- **`lib/workspace-features.ts`:** מודולים גסים `module_crm`, `module_erp`, `module_operations`; `pathnameToWorkspacePrimaryRoute` ממפה מקטעי URL (כולל legacy כמו `/app/clients` → `crm`, `/app/ai` → `home`).
- **`lib/workspace-access.ts`:** הקשר הרשאות ותפקידים ל־shell.
- **`lib/dashboard-to-app-redirect.ts`:** מיפוי נתיבי `/dashboard` ליעדי `/app` מעודכנים (מקביל ל־`next.config`).

---

## 6. שיווק ודף מוצר

- **`LandingPage`:** יישור צבעים לטוקנים (`--marketing-hero-accent`, `--marketing-accent-soft`, `--v2-*`).
- **`/product` + `site-marketing.*.json`:** מודולים — לקוחות, מסמכים, כספים, AI, תפעול (במקום חיוב/תובנות ישנים כטקסט שיווקי).

---

## 7. בדיקות ואיכות

- **Jest:** יחידות (כולל `workspace-access`, `professional-template-draft`, `workspace-features`); תיקיית `e2e/` מוחרגת מ־Jest.
- **Playwright:** `e2e/smoke.spec.ts` — דף בית, התחברות, חסימת `/app` ללא סשן; `e2e/redirects.spec.ts` — בדיקות הפניות legacy. פקודה: `npm run test:e2e`.
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
