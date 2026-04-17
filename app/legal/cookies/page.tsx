import type { Metadata } from "next";
import LegalLayout, { h2Class } from "@/components/LegalLayout";
import { legalSite } from "@/lib/legal-site";

export const metadata: Metadata = {
  title: "מדיניות עוגיות | BSD-YBM",
  description: "מידע על שימוש בעוגיות ובטכנולוגיות דומות — התאמה למסגרת ePrivacy והסכמת משתמשים.",
};

export default function CookiesLegalPage() {
  return (
    <LegalLayout
      title="מדיניות עוגיות (Cookies)"
      subtitle="שקיפות לגבי טכנולוגיות בדפדפן — יש לעדכן רשימת ספקים חיצוניים כשמוסיפים אנליטיקה או שיווק."
    >
      <section>
        <h2 className={h2Class}>1. מה הן עוגיות</h2>
        <p>
          עוגיות וטכנולוגיות דומות (כגון אחסון מקומי בדפדפן) משמשות לתפקוד האתר, לשמירת העדפות (למשל שפה),
          ולעיתים לניתוח שימוש — רק לאחר הסכמתך דרך באנר העוגיות, למעט עוגיות הכרחיות לתפקוד.
        </p>
      </section>

      <section>
        <h2 className={h2Class}>2. סוגי עוגיות / אחסון</h2>
        <ul className="list-disc list-inside space-y-2 mr-4">
          <li>
            <strong>הכרחיות:</strong> סשן התחברות (NextAuth), אבטחה, ניתוב בקשות — נדרשות לתפקוד השירות.
          </li>
          <li>
            <strong>העדפות:</strong> שפה (מזהה locale בקוקי), העדפות נגישות וממשק — לשיפור חוויית משתמש.
          </li>
          <li>
            <strong>הסכמה:</strong> שמירת בחירת עוגיות (למשל ב-localStorage) — מתעדת את בחירתך בעוגיות אנליטיקה
            ושיווק.
          </li>
          <li>
            <strong>אנליטיקה:</strong> אם הוגדר{" "}
            <code className="rounded bg-gray-100 px-1">NEXT_PUBLIC_GA_MEASUREMENT_ID</code> — Google Analytics 4
            נטען רק לאחר שאישרת &quot;אנליטיקה&quot; בבאנר. נתונים מעובדים לפי מדיניות Google.
          </li>
          <li>
            <strong>שיווק:</strong> [למלא אם מוטמעים פיקסלים/רימרקטינג — רק אחרי אישור שיווק בבאנר.]
          </li>
        </ul>
      </section>

      <section>
        <h2 className={h2Class}>3. טבלת דוגמה (לעדכון שמות מדויקים)</h2>
        <div className="overflow-x-auto rounded-2xl border border-gray-200">
          <table className="min-w-full text-right text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="px-3 py-2 font-bold">שם / מקור</th>
                <th className="px-3 py-2 font-bold">מטרה</th>
                <th className="px-3 py-2 font-bold">סוג</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="px-3 py-2">session / next-auth.*</td>
                <td className="px-3 py-2">התחברות מאובטחת</td>
                <td className="px-3 py-2">הכרחי</td>
              </tr>
              <tr>
                <td className="px-3 py-2">bsd-locale</td>
                <td className="px-3 py-2">שפת ממשק</td>
                <td className="px-3 py-2">העדפה</td>
              </tr>
              <tr>
                <td className="px-3 py-2">bsd-ybm-cookie-consent-v1 (localStorage)</td>
                <td className="px-3 py-2">שמירת הסכמת עוגיות</td>
                <td className="px-3 py-2">הכרחי לתיעוד הסכמה</td>
              </tr>
              <tr>
                <td className="px-3 py-2">_ga / _ga_* (אם GA4 פעיל והוסכם)</td>
                <td className="px-3 py-2">סטטיסטיקת שימוש</td>
                <td className="px-3 py-2">אנליטיקה (בהסכמה)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className={h2Class}>4. ניהול הסכמה</h2>
        <p>
          בעת הכניסה הראשונה מוצג באנר המאפשר: עוגיות הכרחיות בלבד, קבלת הכל, או התאמה אישית. ניתן לפתוח
          מחדש את ההגדרות דרך כפתור &quot;הגדרות עוגיות&quot; בממשק (אירוע מערכת). שימוש באנליטיקה/שיווק ללא
          הסכמה — אינו מופעל בקוד ברירת המחדל.
        </p>
      </section>

      <section>
        <h2 className={h2Class}>5. שינויים ופניות</h2>
        <p>
          מדיניות זו עשויה להתעדכן. תאריך מוצג במסמכים המשפטיים. פניות:{" "}
          <a href={`mailto:${legalSite.contactEmail}`} className="text-[var(--primary-color)] font-medium">
            {legalSite.contactEmail}
          </a>
          .
        </p>
      </section>
    </LegalLayout>
  );
}
