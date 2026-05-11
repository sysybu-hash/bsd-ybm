# Handoff — Scan Wizard v2 + Master Plan
**מיועד ל-Cursor / מפתח הבא. נוצר ב-2026-05-10.**

## איפה אנחנו עכשיו

**Branch פעיל:** `feat/scan-wizard-v2` (גם דחוף ל-origin)
**PR:** עוד לא נפתח. URL ליצירה: https://github.com/sysybu-hash/bsd-ybm/pull/new/feat/scan-wizard-v2

**קומיטים על הענף (מעבר ל-master):**
1. `6cfac78` chore: cleanup stale junk files and scripts
2. `01c1171` feat(scan): new scan wizard skeleton (industry-aware) — Phase 0 (skeleton)
3. `5dde169` feat(scan): Phase 1 — full industry profiles + credits + deprecation

**עבודה לא-מקומיטת (Phase 2 בעיצומה):**
- `lib/professions/bundle.ts` — חדש, מכיל `getIndustryBundle()` ו-`bundleToIndustryProfile()`
- `lib/professions/runtime.ts` — שונה: `getIndustryProfile()` הפך ל-shim מעל bundle. הקוד הישן (`INDUSTRY_PROFILES`, פונקציות עזר) **נמחק** והוחלף.
- `lib/__tests__/industry-bundle.test.ts` — חדש. **לא רץ** כי jest config מתעלם מנתיבים שמכילים `.claude/` והוורקטרי שלנו תחת `.claude/worktrees/`.

**TS check:** נקי על קבצי ה-Wizard. שגיאות Prisma/`@prisma/client` קיימות גם ב-master — לא קשורות.

---

## משימה 1: לסיים את Phase 2 (~30 דקות)

### א. וידוא שהריפקטור לא שבר call-sites
```powershell
# 14 callers של getIndustryProfile + 6 של getMergedIndustryConfig
node node_modules/typescript/bin/tsc --noEmit 2>&1 | Select-String "professions|runtime|bundle"
```
אם נקי — ממשיכים.

### ב. הרצת הטסט
הוורקטרי של Claude Code יושב תחת `.claude/worktrees/...` ו-`jest.config.js` מתעלם מ-`/.claude/`. שתי אופציות:

**אופציה 1 (מומלץ):** להעביר את העבודה ל-checkout רגיל של הענף:
```powershell
cd C:\Users\User\Desktop\BSD-YBM
git fetch origin
git checkout feat/scan-wizard-v2
# העתק את 3 הקבצים הלא-מקומיטים (אם הם כבר לא הגיעו):
#   lib/professions/bundle.ts
#   lib/professions/runtime.ts (החלפה מלאה)
#   lib/__tests__/industry-bundle.test.ts
npm test -- industry-bundle
```

**אופציה 2:** לשנות את `jest.config.js` להוציא את `.claude/` מה-ignore (לא מומלץ — ישבור על worktrees אחרים).

### ג. קומיט Phase 2
```powershell
git add lib/professions/bundle.ts lib/professions/runtime.ts lib/__tests__/industry-bundle.test.ts
git commit -m "refactor(professions): unify industry config under IndustryBundle

Single source of truth for everything industry-dependent. New
lib/professions/bundle.ts builds an IndustryBundle in one pass that
contains vocabulary, labels, templates, features, scanner config,
AI instructions, and the scan wizard profile.

lib/professions/runtime.ts is now a thin selector: getIndustryProfile()
is a shim over getIndustryBundle() + bundleToIndustryProfile() so the
14 existing call-sites keep working without churn.

lib/__tests__/industry-bundle.test.ts asserts each of the 7 industries
returns a complete bundle, and that the legacy getIndustryProfile shim
agrees with the bundle on every shared field.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
git push
```

### ד. DoD
- [ ] `npm test` ירוק (לפחות `industry-bundle.test.ts` ו-`construction-trade-profile.test.ts`)
- [ ] `tsc --noEmit` נקי על קבצי `lib/professions/`
- [ ] PR נפתח ו-Vercel preview עולה

---

## משימה 2: לפתוח את ה-PR (~5 דקות)

```powershell
gh auth login   # אם gh לא מחובר
gh pr create --title "feat(scan): scan wizard v2 — phases 1-2" --body @"
## Summary
- אשף סריקה חדש ב-/app/scan עם פרופיל ייעודי לכל אחד מ-7 הענפים
- IndustryBundle כמקור אמת אחד לכל קונפיגורציה תלויית-תעשייה
- legacy זמין ב-?legacy=1 לרילז הבא
- credits chip חי (GET /api/scan/credits)
- E2E עשן + unit tests לכל ענף

## Test plan
- [ ] npm test ירוק
- [ ] Vercel preview: /app/scan עולה לכל 7 הענפים (לבדוק עם ארגון מכל ענף)
- [ ] /app/scan?legacy=1 מציג את הגרסה הישנה
- [ ] העלאת PDF → פענוח → שמירה
"@
```

---

## משימה 3: Phase 3 — ניקוי חוב + IA של settings (4 ימים)

לפני שמתחילים: לוודא ש-Phase 1+2 רצים ב-prod לפחות שבוע.

### א. מחיקת `MultiEngineScanner.tsx` והפרמטר legacy
1. **לוודא אין importers** מלבד `app/app/scan/page.tsx`:
   ```powershell
   grep -rln "MultiEngineScanner" app components lib
   ```
   אם יש עוד — להעביר אותם ל-`ScanWizardShell` קודם.
2. למחוק `components/MultiEngineScanner.tsx` (1,990 שורות אחרי הוספת ההערה ב-Phase 1).
3. למחוק `components/ScanWizardWorkspace.tsx`.
4. ב-`app/app/scan/page.tsx`: להסיר את ההסתעפות `isLegacy ? ... : ...`. להישאר רק עם `<ScanWizardShell />`.
5. למחוק `components/erp/ErpMultiEngineScannerLazy.tsx` (אם לא בשימוש בעוד מקום — בדוק `grep`).

### ב. איחוד `app/app/settings/`
מצב נוכחי: 9 דפים. יעד: 4.
```
overview         → keep
billing          → keep
organization     → keep (מאחד: profession + profile + presence + automations)
platform         → keep (מאחד: stack + advanced)
profession       → DELETE, redirect → /app/settings/organization?tab=profession
profile          → DELETE, redirect → /app/settings/organization?tab=profile
presence         → DELETE, redirect → /app/settings/organization?tab=presence
automations      → DELETE, redirect → /app/settings/organization?tab=automations
stack            → DELETE, redirect → /app/settings/platform?tab=stack
advanced         → DELETE, redirect → /app/settings/platform?tab=advanced
operations       → DELETE, redirect → /app/settings/organization?tab=operations
```
- ב-`next.config.js` להוסיף redirects (ראה הדפוס הקיים ב-`LEGACY_REDIRECTS`).
- ב-`SettingsPageClient.tsx` להוסיף תמיכה ב-`?tab=...`.

### ג. Bundle analysis
```powershell
npm i -D @next/bundle-analyzer
```
לעדכן `next.config.js` עם wrap. להריץ `ANALYZE=true npm run build`. לתעד את המספר ב-PR description.

### ד. DoD
- [ ] `MultiEngineScanner.tsx` לא קיים
- [ ] `app/app/settings/` מכיל ≤5 entries
- [ ] גודל bundle של `/app/scan` קטן ב-≥30%
- [ ] `?legacy=1` מחזיר 404 או מפנה ל-`/app/scan`

---

## משימה 4: Phase 4 — אכיפת מנוי וחיוב (6 ימים)

### א. quota בכל endpoint AI (לא רק scan)
מצב נוכחי: `lib/quota-check.ts:checkAndDeductScanCredit` נקרא רק ב-`/api/scan/tri-engine`. צריך להוסיף לכל אחד מאלה (להגדיר `ScanCreditKind` חדש לכל אחד אם נדרש):

```
app/api/ai/chat/route.ts                       → CHEAP
app/api/ai/doc-draft/route.ts                  → CHEAP
app/api/ai/operator/route.ts                   → CHEAP (כבר משתמש?)
app/api/ai/omni-voice/route.ts                 → PREMIUM
app/api/ai/gemini-live/session/route.ts        → PREMIUM
app/api/erp/project-notebook/chat/route.ts     → CHEAP
app/api/erp/project-notebook/chat-stream/...   → CHEAP
app/api/erp/price-compare/route.ts             → CHEAP
app/api/crm/semantic-search/route.ts           → CHEAP
```

לכל אחד:
```ts
import { checkAndDeductScanCredit } from "@/lib/quota-check";

const credit = await checkAndDeductScanCredit({
  organizationId,
  kind: "CHEAP", // או PREMIUM
  idempotencyKey: `${endpoint}-${requestId}`,
});
if (!credit.ok) {
  return NextResponse.json({ ok: false, error: credit.error }, { status: 402 });
}
```

### ב. middleware ל-trial-expired
ב-`app/app/layout.tsx`: לבדוק אם `org.subscriptionStatus === "TRIAL_EXPIRED"` → redirect ל-`/app/trial-expired`. כרגע יש דף אבל ה-gate חלקי.

### ג. PayPal webhook אטומיות
- לקרוא `app/api/webhooks/paypal/route.ts`.
- לוודא שה-decrement נעשה בתוך `prisma.$transaction`.
- להוסיף שורה ל-`AuditLog` בכל קנייה (כבר יש `app/actions/audit-log.ts`?).

### ד. Widget קרדיטים בעמוד billing
`app/app/settings/billing/page.tsx`: להוסיף widget "הקרדיטים שלי" — סוגי קרדיטים, יתרה, היסטוריית 30 יום אחרונים. כבר יש את ה-API ב-`/api/scan/credits` — להרחיב להחזיר היסטוריה.

### ה. DoD
- [ ] משתמש בלי קרדיט מקבל 402 + UI נחמד
- [ ] טסט אינטגרציה: `app/api/webhooks/paypal/route.test.ts` עם mock + בדיקת `AuditLog`
- [ ] `?legacy=1` כבר לא קיים (מחיקה של Phase 3)
- [ ] ארגון ב-trial expired לא יכול להגיע ל-/app/scan

---

## משימה 5: Phase 5 — Polish: a11y, mobile, performance, RTL (8 ימים)

### א. Playwright project לעברית RTL
ב-`playwright.config.ts`:
```ts
projects: [
  ...(existing),
  {
    name: 'mobile-chrome-rtl-he',
    use: { ...devices['Pixel 7'], locale: 'he-IL' },
  },
  {
    name: 'mobile-safari-rtl-he',
    use: { ...devices['iPhone 14'], locale: 'he-IL' },
  },
]
```

### ב. הרחבת `e2e/site-quality.spec.ts`
לכלול את כל המסלולים המוגנים. להוסיף a11y checks (לדוגמה `axe-playwright`).

### ג. Lighthouse CI
```powershell
npm i -D @lhci/cli
```
ליצור `.lighthouserc.json` עם תקרות:
- Performance ≥85
- A11y ≥95
- Best Practices ≥90

הוספה ל-CI ב-`.github/workflows/`.

### ד. RTL guards
ESLint rule נגד `left-` / `right-` ב-Tailwind classes. דפוס:
```js
// .eslintrc.json
"no-restricted-syntax": [
  "error",
  {
    "selector": "Literal[value=/\\b(left-|right-)/]",
    "message": "Use start-/end- instead of left-/right- for RTL safety"
  }
]
```

### ה. DoD
- [ ] mobile-chrome-rtl-he project ירוק
- [ ] Lighthouse על `/`, `/login`, `/app`, `/app/scan`: Performance ≥85, A11y ≥95
- [ ] grep `dir="ltr"` מחזיר 0 (חוץ מ-i18n explicit)

---

## משימה 6: Phase 6 — i18n + admin (9 ימים)

### א. messages/app.{he,en,ru,ar}.json
להוסיף את הקבצים. לעבור על:
- `components/finance/**/*.tsx`
- `components/crm/**/*.tsx`
- `components/scan/wizard/**/*.tsx`
- `components/settings/**/*.tsx`

לכל מחרוזת עברית קשיחה: להעביר ל-key. דפוס:
```ts
// לפני
<span>שלח חשבונית</span>

// אחרי
const t = useTranslations("app.invoices");
<span>{t("send")}</span>
```

### ב. lib/i18n/keys.ts
להוסיף את ה-namespace `app` עם המפתחות שהוגדרו.

### ג. אדמין UI אמיתי
`app/app/admin/page.tsx`: היום כמעט ריק. להוסיף:
- רשימת ארגונים (סort/filter/search)
- פעולות: השעה, איפוס סיסמה, מתן credits
- צפייה ב-AuditLog

API endpoints קיימים ב-`app/api/admin/*` — חסר UI. רק לחבר.

### ד. DoD
- [ ] `?lang=en` מתרגם 100% מ-`/app/scan` ו-`/app/erp`
- [ ] עברית עדיין ברירת מחדל
- [ ] ערבית RTL עובד נכון
- [ ] אדמין יכול לתת credits לארגון מ-UI ולראות את זה ב-AuditLog
- [ ] **לא לשבור** את הגישה הבלעדית של Meckano ל-`jbuildgca@gmail.com`

---

## Cross-cutting: כללים שתקפים בכל Phase

1. **בדיקות:** כל Phase מוסיף לפחות test אחד. CI לא יורד מ-baseline.
2. **i18n discipline:** מ-Phase 3 והלאה — אסור להוסיף עברית קשיחה חדשה בקוד.
3. **Bundle budgets:** `@next/bundle-analyzer` עם תקרה ב-CI.
4. **A11y/RTL:** ESLint rule נגד `left-`/`right-`.
5. **Audit log:** כל פעולה כספית/אדמיניסטרטיבית כותבת.
6. **DB migrations:** תמיד backfill scripts.
7. **Meckano:** הגישה ל-`jbuildgca@gmail.com` היא immutable. לא לגעת.
8. **`@deprecated` annotations:** אסור להוסיף קוד חדש שמייבא מקבצים מסומנים `@deprecated`.

---

## הקשר טכני שכדאי לדעת

- **Next.js 15.5.14** — ה-package.json אומר `^15.5.14`. אם מישהו מנסה Next 16 — `pages/_document.tsx` הפנימי של Next יקרוס. להישאר ב-15.
- **Prisma client** — אם רואים `Cannot find module '.prisma/client/default'`, להריץ `npx prisma generate`. קבצי `.tmp` תקועים = לסגור את כל ה-Node processes ולהריץ שוב.
- **node_modules בוורקטרי** — מומלץ לעבוד מהמאגר הראשי `C:\Users\User\Desktop\BSD-YBM`, לא מ-`.claude/worktrees/`.
- **`.env`** הוא הקובץ עם הסודות (NEXTAUTH_SECRET, GROQ_API_KEY וכו') — לא `.env.local`.
- **gitignored:** `.env*`, `node_modules/`, `.next/`, `.tmp`, `.tsbuildinfo`.
- **Hebrew RTL:** העדפה ל-`start`/`end` על-פני `left`/`right` ב-Tailwind.

---

## מצב משאבים ב-master שכדאי לזכור

- `MultiEngineScanner.tsx`: 1,990 שורות, סומן `@deprecated`. למחוק ב-Phase 3.
- `lib/professions/scan-wizard.ts`: 462 שורות, 7 פרופילים מלאים.
- `lib/professions/bundle.ts`: ~300 שורות (Phase 2 work).
- `app/app/settings/`: 9 דפים, יעד 4 אחרי Phase 3.
- ענפים stale שאפשר למחוק אם תרצה: `cursor/i18n-marketing-public-pages`, `cursor/rebrand-construction-trade-app-merge`, `copilot/analyze-code-status` (origin only).
- backup tags: `backup/temp-recovery-2026-05-10`, `backup/phase2-meckano-removal-2026-05-10`, `backup/jovial-antonelli-2026-05-10`, `backup/naughty-jemison-2026-05-10` — לא למחוק עד שמוודאים שלא צריך.

---

## לוחות זמנים מציאותיים לדב סניור יחיד

| Phase | ימים בפועל | שבועות מצטברים |
|---|---|---|
| 2 (סיום) | 1 (יום) | 0.2 |
| 3 — ניקוי + settings | 5 | 1.2 |
| 4 — אכיפת חיוב | 8 | 2.8 |
| 5 — Polish | 10 | 4.8 |
| 6 — i18n + admin | 12 | 7.2 |
| **סה״כ** | **36 ימי עבודה** | **~7-8 שבועות** |

---

## אם משהו נשבר

1. `git log --oneline -10` — לראות איפה היינו
2. `git stash list` — אם יש עבודה בצד
3. `git tag -l "backup/*"` — לראות גיבויים
4. `git diff master..HEAD --stat` — מה השתנה
5. תמיד: `git checkout -b fix/something` לפני שמנסים לתקן

---

## המשך לאחר Phases 1–5 (2026)

**בוצע:** אכיפת `requireAiScanCredit`, נעילת `debug-session` לפיתוח, אידמפוטנטיות PayPal, אשף Express, פיצול CRM חלקי, ניקוי `multi-engine-scanner`, `middleware` עם `import()` ל־workspace-features, סנכרון `AUDIT_REPORT.md`, יישור 402 ל־`/api/ai` במכסה, טסטים ל־`ai-upload-error-map` ו־`paypal-capture-apply` (זרימות מוקדמות), פיצול ראשון של Meckano (`meckano-hub-constants`, `MeckanoHubTabNav`, `MeckanoEmployeesPanel`), `verify` + CI עם `prisma generate` לפני `tsc`.

**נשאר לפי עדיפות מוצר/טכנולוגיה:**

1. **Meckano** — להמשיך לחלץ פאנלים (מחלקות, נוכחות, אזורים, דוחות, הגדרות) ו־hooks לטעינה; לשקול `dynamic` לפאנלים כבדים אחרי מדידת bundle.
2. **Prisma/TS** — אם `tsc` נכשל בסביבה נקייה: לוודא `prisma generate` ב־CI (מוגדר ב־Quality Gate) וליישר ייבואי `@prisma/client` לפי הצורך.
3. **i18n ל־`/app/*`** — מפתחות ב־`messages`, החלפת מחרוזות קשיחות ב־CRM/ERP/Settings (פרויקט נפרד).
4. **IA** — `/app/insights` כבר מפנה ל־`/app/ai`; לבחון איחוד hubs ב־CRM ודפי Billing כפולים.
5. **תלויות** — `npx depcheck` + `npm audit` מבוקדים (לא מחיקה אגרסיבית בלי אימות import דינמי).
   - **depcheck (סיכום):** unused deps כוללים בין השאר `@ai-sdk/openai`, `@tanstack/react-query`, `firebase-admin`, `react-hook-form`, `tailwind-merge`; unused dev כולל `@testing-library/react`, `jest-environment-jsdom`, `postcss`, `autoprefixer`, `eslint-config-next`. **Missing (false positives אפשריים):** `@eslint/eslintrc` (eslint.config), `chrome-launcher` (סקריפט lighthouse), `playwright` (סקריפטים) — לוודא בשימוש לפני הוספה ל־`package.json`.
   - **npm audit:** יש ממצאים בתלויות עקיפות של `firebase-admin` ו־`@lhci/cli`; תיקון עם `npm audit fix --force` מציע גרסאות שבורות — להעריך ידנית או overrides ממוקדים, לא fix כפוי בלי בדיקות.
6. **בדיקות** — הרחבת Playwright לזרימות עסקיות; טסטים נוספים ל־PayPal happy path עם mock מלא של `$transaction`.
