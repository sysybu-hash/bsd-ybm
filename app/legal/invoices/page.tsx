import type { Metadata } from "next";
import LegalLayout, { h2Class } from "@/components/LegalLayout";
import { legalSite } from "@/lib/legal-site";

export const metadata: Metadata = {
  title: "מסמכים כספיים, חשבוניות ומס | BSD-YBM",
  description: "הבהרות בנושא הנפקת מסמכים, מע״מ ואחריות — מסגרת למילוי על ידי בעל העסק.",
};

export default function LegalInvoicesPage() {
  return (
    <LegalLayout
      title="מסמכים כספיים, חשבוניות ומס"
      subtitle="מסגרת הבהרות בלבד — אינה מהווה ייעוץ מס או משפטי."
    >
      <section>
        <h2 className={h2Class}>1. מטרת המסמך</h2>
        <p>
          מסמך זה מסביר את <strong>מסגרת האחריות והגבולות</strong> בנוגע ליכולות המערכת (
          {legalSite.siteName}) בנושא מסמכים כספיים (למשל הצעות מחיר, תיעוד פנימי, ייצוא PDF).{" "}
          <strong>יש להשלים</strong> סעיפים ספציפיים לפי סוג העסק, אישור רואה חשבון ודרישות רשות
          המסים המעודכנות.
        </p>
      </section>

      <section>
        <h2 className={h2Class}>2. חשבונית מס, חשבונית עסקה וקבלה</h2>
        <p>
          הפרדה בין סוגי מסמכים (חשבונית מס / חשבונית מס קבלה / חשבונית עסקה / קבלה) והתאמתם לחוק
          מע״מ ולרשות המסים היא <strong>אחריות המשתמש העסקי</strong> בלבד. המערכת עשויה לספק כלים
          טכניים (למשל תבניות, מספור פנימי, ייצוא) — אך לא מחליפה ייעוץ מקצועי ולא מבטיחה עמידה
          בדרישות דיווח או אישור תוכנה מול הרשות.
        </p>
      </section>

      <section>
        <h2 className={h2Class}>3. אינטגרציות לספקי חשבוניות מורשים</h2>
        <p>
          [להשלים: האם מתוכננת חיבור לספק חיצוני (למשל מערכת חשבוניות מאושרת) — שם הספק, תנאי
          השירות שלו, ומי אחראי לנתונים בין המערכות.]
        </p>
      </section>

      <section>
        <h2 className={h2Class}>4. AI ופענוח מסמכים</h2>
        <p>
          תוצאות סריקה, פענוח וסיכומים מבוססי AI עשויים להכיל שגיאות. אין להסתמך עליהן כעדות יחידה
          לפני הגשת דוחות או מסמכים רשמיים. יש לבצע בקרה אנושית ולוודא מול נתוני מקור.
        </p>
      </section>

      <section>
        <h2 className={h2Class}>5. שמירת רשומות</h2>
        <p>
          [להשלים: משך שמירת מסמכים, גיבויים, ומיקום אחסון — בהתאם לנהלים ולחוק.]
        </p>
      </section>

      <section>
        <h2 className={h2Class}>6. יצירת קשר</h2>
        <p>
          לשאלות בנושא מסמכים אלו:{" "}
          <a href={`mailto:${legalSite.contactEmail}`} className="text-[var(--primary-color)] font-medium">
            {legalSite.contactEmail}
          </a>
          .
        </p>
      </section>
    </LegalLayout>
  );
}
