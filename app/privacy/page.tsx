import type { Metadata } from "next";
import LegalLayout, { h2Class } from "@/components/LegalLayout";
import { legalSite } from "@/lib/legal-site";

export const metadata: Metadata = {
  title: "מדיניות פרטיות | BSD-YBM",
  description:
    "מדיניות פרטיות — מסגרת לשקיפות, עיבוד נתונים והתאמה למסגרת האירופית (GDPR) ככל שהחוק חל.",
};

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="מדיניות פרטיות"
      subtitle="שקיפות לגבי עיבוד מידע אישי — יש להתאים את הפרטים לפעילות בפועל ולאמת מול ייעוץ משפטי."
    >
      <section>
        <h2 className={h2Class}>1. מי אנחנו (בקרת מידע)</h2>
        <p>
          <strong>{legalSite.siteName}</strong> מופעלת על ידי <strong>{legalSite.operatorDisplayName}</strong>
          {legalSite.entityRegistrationId ? (
            <>
              {" "}
              (מזהה רישום: {legalSite.entityRegistrationId})
            </>
          ) : null}
          .
        </p>
        <p className="mt-3">
          <strong>כתובת:</strong> {legalSite.registeredAddress}
        </p>
        <p className="mt-3">
          <strong>יצירת קשר בנושא פרטיות וזכויות נושאי מידע:</strong>{" "}
          <a href={`mailto:${legalSite.contactEmail}`} className="text-[var(--primary-color)] font-medium">
            {legalSite.contactEmail}
          </a>
        </p>
        <p className="mt-3 text-sm text-gray-500">
          <strong>נציג באיחוד האירופי (מאמר 27 GDPR):</strong> {legalSite.euRepresentative}
        </p>
      </section>

      <section>
        <h2 className={h2Class}>2. אילו נתונים נאספים</h2>
        <ul className="list-disc list-inside space-y-2 mr-4">
          <li>
            <strong>זהות והתחברות:</strong> שם, כתובת אימייל, מזהה מספק OAuth (למשל Google), תמונת פרופיל
            אופציונלית.
          </li>
          <li>
            <strong>נתוני ארגון ותפעול:</strong> מזהי ארגון, הגדרות מנוי, מסמכים שהועלו לשירות, לוגים
            טכניים של פעולות במערכת, תוצאות עיבוד וכלים מבוססי AI לפי השימוש.
          </li>
          <li>
            <strong>תשלומים:</strong> עיבוד תשלומים דרך PayPal (לפי ההגדרות בארגון); לא נאסף מספר כרטיס
            אשראי מלא בשרתי האפליקציה — עיבוד נעשה אצל ספק התשלומים.
          </li>
          <li>
            <strong>טכניים:</strong> כתובת IP, סוג דפדפן, עוגיות — ראו{" "}
            <a href="/legal/cookies" className="text-[var(--primary-color)]">
              מדיניות עוגיות
            </a>
            . אנליטיקה (אם הופעלה) נטענת רק לאחר הסכמה דרך באנר העוגיות.
          </li>
        </ul>
      </section>

      <section>
        <h2 className={h2Class}>3. מטרות עיבוד ובסיסים משפטיים</h2>
        <p>
          עיבוד מידע נעשה למטרות: מתן השירות, ניהול חשבון וארגון, אבטחה ומניעת הונאה, תמיכה, עמידה בדרישות
          חוק, שיפור המערכת, ותקשורת הכרחית לגבי השירות. הבסיס המשפטי לכל קטגוריה נקבע לפי הדין החל
          (למשל ביצוע חוזה, הסכמה — כשמחויבת, חובה חוקית, או אינטרס לגיטימי לאחר בחינת איזון — לפי ניתוח
          משפטי).
        </p>
      </section>

      <section>
        <h2 className={h2Class}>4. שיתוף עם מעבדים וצדדים שלישיים</h2>
        <p>
          השירות עשוי להסתמך על ספקי תשתית (אירוח, מסד נתונים), ספקי דוא״ל, ספקי אימות (OAuth), ספקי תשלום
          (PayPal), וספקי AI (למשל Google Gemini) לצורך תכונות המערכת. עם ספקים אלה נכרות הסכמים או סעיפים
          שמחייבים רמת הגנה מתאימה. רשימת ספקים סופית ועדכנית — לתחזק בהתאם לשינויים תפעוליים.
        </p>
      </section>

      <section>
        <h2 className={h2Class}>5. העברות מחוץ לאירופה</h2>
        <p>
          כאשר מידע מועבר למדינות שאינן מוכרות כבעלות רמת הגנה הולמת, נסמך על מנגנונים שהדין מאפשר — למשל
          הסכמי העברת נתונים סטנדרטיים (SCC) של האיחוד, או החלטות התאמה — בהתאם למקרה ולעדכוני רגולציה.
        </p>
      </section>

      <section>
        <h2 className={h2Class}>6. שמירה ואבטחה</h2>
        <p>
          משך השמירה נקבע לפי צורך תפעולי, חובה חוקית והוראות הסכם. ננקטים אמצעים סבירים להגנה על מידע,
          לרבות בקרת גישה, הצפנה בתעבורה, גיבויים וניהול הרשאות — לפי מה שמיושם בסביבת האירוח והארגון.
        </p>
      </section>

      <section>
        <h2 className={h2Class}>7. זכויות נושאי מידע (כולל GDPR)</h2>
        <p>
          ככל שהחוק חל עליך, עשויות לעמוד לך זכויות לעיון, תיקון, מחיקה (&quot;הזכות להישכח&quot;), הגבלת עיבוד,
          התנגדות, ניידות נתונים, ומשיכת הסכמה כאשר העיבוד מבוסס הסכמה. ניתן לפנות אלינו בכתובת:{" "}
          <a href={`mailto:${legalSite.contactEmail}`} className="text-[var(--primary-color)] font-medium">
            {legalSite.contactEmail}
          </a>
          . נשתדל להשיב בזמן סביר (לרוב תוך 30 יום, אלא אם הדין קובע אחרת או נדרשת הארכה לפי מורכבות
          הבקשה). יש לך זכות להגיש תלונה לרשות הפיקוח במדינת מגוריך או בעניין העיבוד — באיחוד, לרשות
          המפוקחת הרלוונטית (למשל רשות הגנת הפרטיות בישראל, או רשות באיחוד לפי מגורים).
        </p>
      </section>

      <section>
        <h2 className={h2Class}>8. שינויים</h2>
        <p>
          מדיניות זו עשויה להתעדכן. נפרסם גרסה מעודכנת באתר; תאריך עדכון אחרון: {legalSite.documentsLastUpdated}.
        </p>
      </section>
    </LegalLayout>
  );
}
