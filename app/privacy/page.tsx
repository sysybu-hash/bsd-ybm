import type { Metadata } from "next";
import LegalLayout, { h2Class } from "@/components/LegalLayout";
import { legalSite } from "@/lib/legal-site";

export const metadata: Metadata = {
  title: "מדיניות פרטיות | BSD-YBM",
  description: "מדיניות פרטיות — מסגרת למילוי בהתאם לחוק הגנת הפרטיות, תקנות וענין.",
};

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="מדיניות פרטיות"
      subtitle="מסגרת שקיפות — יש להתאים לחוק ולפעילות בפועל, כולל DPO אם נדרש."
    >
      <section>
        <h2 className={h2Class}>1. מי אנחנו</h2>
        <p>
          <strong>{legalSite.siteName}</strong> מופעלת על ידי <strong>{legalSite.operatorDisplayName}</strong>
          . [להשלים: פרטי מזהה מלאים, כתובת, אמצעי קשר של בקרת מידע / DPO.]
        </p>
      </section>

      <section>
        <h2 className={h2Class}>2. אילו נתונים נאספים</h2>
        <ul className="list-disc list-inside space-y-2 mr-4">
          <li>
            <strong>זהות והתחברות:</strong> שם, כתובת אימייל, מזהה מספק OAuth (למשל Google), תמונת
            פרופיל אופציונלית.
          </li>
          <li>
            <strong>נתוני שימוש:</strong> מסמכים שהועלו, פעולות במערכת (לוגים), תוצאות AI.
          </li>
          <li>
            <strong>תשלומים:</strong> PayPal בממשק האתר (לפי פרטי החשבון שמוגדרים בארגון); ללא Stripe.
          </li>
          <li>
            <strong>טכניים:</strong> כתובת IP, סוג דפדפן, עוגיות — ראו גם{" "}
            <a href="/legal/cookies" className="text-[var(--primary-color)]">
              מדיניות עוגיות
            </a>
            .
          </li>
        </ul>
      </section>

      <section>
        <h2 className={h2Class}>3. מטרות עיבוד</h2>
        <p>
          מתן השירות, אימות משתמשים, שיפור המערכת, אבטחה, עמידה בדרישות חוק, תמיכה, ושליחת עדכונים
          חיוניים — לפי בסיס חוקי מתאים (הסכמה / חוזה / חובה חוקית / אינטרס לגיטימי — כפי שיפורט
          בנוסח הסופי).
        </p>
      </section>

      <section>
        <h2 className={h2Class}>4. שיתוף עם צדדים שלישיים</h2>
        <p>
          [להשלים: ספקי ענן, מסדי נתונים, מייל, AI (Google Gemini וכו׳), ניתוח — רשימה ומטרה.]
        </p>
      </section>

      <section>
        <h2 className={h2Class}>5. שמירה וביטחון</h2>
        <p>
          [להשלים: משך שמירה, אמצעי אבטחה, גיבויים.]
        </p>
      </section>

      <section>
        <h2 className={h2Class}>6. זכויות נושאי מידע</h2>
        <p>
          בהתאם לחוק, עשויות לעמוד לך זכויות לעיון, תיקון, מחיקה, הגבלה, התנגדות וניידות. ניתן לפנות
          אלינו בכתובת:{" "}
          <a href={`mailto:${legalSite.contactEmail}`} className="text-[var(--primary-color)] font-medium">
            {legalSite.contactEmail}
          </a>
          . [להשלים: זמני טיפול, זכות לערעור אצל רשות.]
        </p>
      </section>

      <section>
        <h2 className={h2Class}>7. שינויים</h2>
        <p>
          מדיניות זו עשויה להתעדכן. נפרסם גרסה מעודכנת באתר ונעדכן את תאריך העדכון בראש המסמך.
        </p>
      </section>
    </LegalLayout>
  );
}
