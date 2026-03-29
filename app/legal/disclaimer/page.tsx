import type { Metadata } from "next";
import LegalLayout, { h2Class } from "@/components/LegalLayout";
import { legalSite } from "@/lib/legal-site";

export const metadata: Metadata = {
  title: "הצהרת הגבלה כללית | BSD-YBM",
  description: "הגבלת אחריות לשירות, ל-AI ולתוצרים — מסגרת למילוי.",
};

export default function DisclaimerPage() {
  return (
    <LegalLayout
      title="הצהרת הגבלה כללית"
      subtitle="מסגרת כללית בלבד — לא ייעוץ משפטי."
    >
      <section>
        <h2 className={h2Class}>1. אופי השירות</h2>
        <p>
          {legalSite.siteName} מספקת כלי ניהול, תיעוד וסיוע מבוססי AI. השירות ניתן &quot;כמות שהוא&quot;
          (AS IS) ולפי הזמינות הטכנית, אלא אם הוסכם אחרת בכתב במסמך נפרד חתום.
        </p>
      </section>

      <section>
        <h2 className={h2Class}>2. AI ותוצאות אוטומטיות</h2>
        <p>
          פלטים ממודלי שפה, סריקות ופענוח מסמכים עשויים להיות שגויים ואינם מחליפים שיקול דעת
          מקצועי (חשבונאות, משפט, מס). המשתמש אחראי לבדיקה ולאימות לפני כל שימוש עסקי או הגשה
          רשמית.
        </p>
      </section>

      <section>
        <h2 className={h2Class}>3. נזקים עקיפים</h2>
        <p>
          [להשלים לפי מדיניות העסק והחוק החל — הגבלת סכום אחריות, סוגי נזקים שאינם מכוסים, וכו׳.]
        </p>
      </section>

      <section>
        <h2 className={h2Class}>4. קישורים חיצוניים</h2>
        <p>
          האתר עשוי לכלול קישורים לאתרים של צדדים שלישיים. אין אנו אחראים לתוכן או למדיניות
          הפרטיות שלהם.
        </p>
      </section>

      <section>
        <h2 className={h2Class}>5. קשר למסמכים נוספים</h2>
        <p>
          מסמך זה משלים את{" "}
          <a href="/terms" className="text-[var(--primary-color)]">
            תנאי השימוש
          </a>{" "}
          ואת{" "}
          <a href="/privacy" className="text-[var(--primary-color)]">
            מדיניות הפרטיות
          </a>
          . במקרה של סתירה, יש לפי המסמך המפורט יותר או לפי הסכם נפרד — כפי שייקבע בנוסח הסופי.
        </p>
      </section>
    </LegalLayout>
  );
}
