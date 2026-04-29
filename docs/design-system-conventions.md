# כללי מערכת עיצוב — Bento מול Claude UI

מסמך קצר ליישור צוות: איזה שכבה בשימוש ואיפה.

## שכבות קיימות

1. **`components/ui/bento`** — רשת Bento, `Tile`, `TileHeader`, צבעי ציר (finance, clients, ai, …). מתאים למסכי workspace שכבר נבנו בסגנון «כרטיסי מדד» לפני איחוד ה־ERP.
2. **`components/ui/claude`** — שפה ויזואלית שקטה (`cd-*`, `Surface`, `PageHeader`, …). **ברירת המחדל** ל־[`app/app/layout.tsx`](../app/app/layout.tsx) (`data-theme="claude"`) ולעמוד הבית [`app/app/page.tsx`](../app/app/page.tsx) דרך `WorkspaceHomeView`.
3. **טוקנים גלובליים** — [`app/globals.css`](../app/globals.css): משתני `--v2-*`, `--cd-*`, צבעי marketing. אל תוסיפו צבעי hex חדשים במסך בלי לאגד לטוקן.

## כללי שימוש מעשיים

- **מסך חדש תחת `/app`** שמרכז נתונים עסקיים (דשבורד, סיכום חודש): העדיפו **Claude UI** כדי לשמור על מראה אחיד עם הבית.
- **טפסים וטבלאות צפופות** בתוך מודול קיים שכבר ב־Bento: המשיכו ב־Bento באותו מסך; אל תערבבו באותו אזור קומפוננטות `cd-*` ו־`bento-*` אם אין הצדקה מוצרית.
- **קישורי ניווט פנימיים**: השתמשו ב־[`lib/workspace-canonical-routes.ts`](../lib/workspace-canonical-routes.ts) (`WORKSPACE_ROUTES`) כדי לא להצביע על נתיבים שמופנים ב־`next.config.js`.

## הפניות

רשימת היעדים הקנוניים מתעדכנת ב־`next.config.js` (`LEGACY_REDIRECTS`). שינוי מבנה נתיבים — עדכנו גם שם וגם את `WORKSPACE_ROUTES`.
