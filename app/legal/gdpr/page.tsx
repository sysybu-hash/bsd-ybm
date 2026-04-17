import type { Metadata } from "next";
import LegalLayout, { h2Class, noteClass } from "@/components/LegalLayout";
import { legalSite } from "@/lib/legal-site";

export const metadata: Metadata = {
  title: "הצהרת GDPR | BSD-YBM",
  description: "מסגרת להתאמה לתקנות הגנת המידע באיחוד האירופי (GDPR) — יש להשלים מול יועץ משפטי.",
};

export default function GdprLegalPage() {
  return (
    <LegalLayout
      title="הצהרת GDPR והגנת מידע (EU)"
      subtitle="מסגרת לתאימות לתקנות האיחוד האירופי (EU) 2016/679 — יש להתאים ולאמת מול ייעוץ משפטי."
    >
      <section>
        <h2 className={h2Class}>1. מטרה ותחולה</h2>
        <p>
          מסמך זה מתאר את העקרונות שעל פיהם <strong>{legalSite.siteName}</strong> (&quot;השירות&quot;)
          נועד לתמוך בציות לתקנות הגנת המידע הכלליות של האיחוד האירופי (GDPR), ובדרישות הנלוות
          (לרבות ePrivacy לגבי עוגיות והתקשורת האלקטרונית), ככל שהן חלות על פעילותכם בפועל.
        </p>
        <p className={`mt-4 ${noteClass}`} role="note">
          <strong>חשוב:</strong> אין מסמך זה תחליף לייעוץ משפטי. האחריות המלאה לציות לדין חלה על
          מפעיל העסק ועל בוחרי השירות.
        </p>
      </section>

      <section>
        <h2 className={h2Class}>2. עקרונות ליבה (סיכום)</h2>
        <ul className="list-disc list-inside space-y-2 mr-4">
          <li>
            <strong>חוקיות ושקיפות:</strong> עיבוד מידע על בסיס חוקי מתאים (למשל הסכמה, ביצוע חוזה
            או אינטרס לגיטימי — לפי ניתוח משפטי), ומתן מידע ברור לנושאי המידע.
          </li>
          <li>
            <strong>מינימיזציה ומטרה:</strong> איסוף נתונים בהיקף הנדרש לשירות בלבד, ושימוש בהתאם
            למטרות שנמסרו.
          </li>
          <li>
            <strong>אבטחה:</strong> יישום אמצעים טכניים וארגוניים סבירים להגנה על מידע (הצפנה,
            בקרת גישה, גיבויים — לפי מה שמיושם בפועל אצלכם ובספקי הענן).
          </li>
          <li>
            <strong>זכויות נושאי מידע:</strong> גישה, תיקון, מחיקה, הגבלה, ניידות, התנגדות — ככל
            שהחוק חל; יש לתעד פניות ולהעביר לספקי משנה כשהדבר נדרש.
          </li>
        </ul>
      </section>

      <section>
        <h2 className={h2Class}>3. בסיסים משפטיים לעיבוד (למילוי)</h2>
        <p>
          יש למפות כל קטגוריית נתונים (למשל פרטי משתמש, מסמכים פיננסיים, לוגים טכניים) לבסיס משפטי
          מתאים — למשל: ביצוע הסכם, הסכמה מפורשת, חובה חוקית, אינטרס לגיטימי לאחר איזון מול פרטיות
          הנושא.
        </p>
      </section>

      <section>
        <h2 className={h2Class}>4. העברות מחוץ לאירופה</h2>
        <p>
          אם נעשה שימוש בספקי ענן או שירותים בינלאומיים (למשל תשתית אירוח, דוא״ל, בינה מלאכותית),
          יש לוודא הסכמי העברת נתונים מתאימים (למשל SCC) או החלטות התאמה, בהתאם לדין החל ולמיקום
          הספקים.
        </p>
      </section>

      <section>
        <h2 className={h2Class}>5. עוגיות והסכמה</h2>
        <p>
          באתר קיים באנר הסכמה לעוגיות עם אפשרות לבחור עוגיות הכרחיות, אנליטיקה ושיווק. פרטים נוספים
          במדיניות העוגיות.
        </p>
      </section>

      <section>
        <h2 className={h2Class}>6. קשר ופניות</h2>
        <p>
          פניות בנושא פרטיות ו-GDPR:{" "}
          <a href={`mailto:${legalSite.contactEmail}`} className="text-[var(--primary-color)] font-medium hover:underline">
            {legalSite.contactEmail}
          </a>
          . אם ממונים על הגנת מידע (DPO) — יש לציין כאן פרטי קשר מעודכנים.
        </p>
        <p className="mt-4">
          <strong>כתובת מפעיל (שקיפות):</strong> {legalSite.registeredAddress}
        </p>
      </section>

      <section>
        <h2 className={h2Class}>7. רשויות פיקוח ותלונות</h2>
        <p>
          לנושאי מידע באיחוד האירופי יש זכות להגיש תלונה לרשות הפיקוח במדינת מגוריהם הרגילה, במקום עבודתם
          הראשי, או במקום בו נטען כי הייתה הפרה — לפי מאמר 77 GDPR. ברשות להגיש תלונה גם בישראל מול רשות
          הגנת הפרטיות, ככל שהדין והסמכות חלים על המקרה.
        </p>
      </section>
    </LegalLayout>
  );
}
