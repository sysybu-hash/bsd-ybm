import type { Metadata } from "next";
import LegalLayout, { h2Class } from "@/components/LegalLayout";
import { legalSite } from "@/lib/legal-site";

export const metadata: Metadata = {
  title: "תנאי שימוש | BSD-YBM",
  description: "תנאי השימוש בשירות BSD-YBM Intelligence — טיוטה למילוי משפטי.",
};

export default function TermsPage() {
  return (
    <LegalLayout
      title="תנאי שימוש"
      subtitle="הסכם מסגרת לשימוש באתר ובמערכת — יש להשלים ולאמת מול יועץ משפטי."
    >
      <section>
        <h2 className={h2Class}>1. הצדדים והשירות</h2>
        <p>
          תנאים אלה חלים על השימוש באתר ובשירותי <strong>{legalSite.siteName}</strong> (להלן:
          &quot;השירות&quot;) המופעלים על ידי <strong>{legalSite.operatorDisplayName}</strong> (להלן:
          &quot;המפעיל&quot;), בכתובת {legalSite.publicUrl}. [להשלים: פרטי ישות משפטית מלאים — ח.פ. /
          ע.מ., כתובת רשומה.]
        </p>
      </section>

      <section>
        <h2 className={h2Class}>2. קבלה והרשמה</h2>
        <p>
          השימוש מותנה בהתחברות (למשל באמצעות Google) ובהסכמה לתנאים אלה ולמדיניות הפרטיות. המשתמש
          מתחייב לספק פרטים נכונים ולשמור על סודיות החשבון. [להשלים: מדיניות גיל מינימלי / ארגונים.]
        </p>
      </section>

      <section>
        <h2 className={h2Class}>3. רישיון שימוש</h2>
        <p>
          המפעיל מעניק למשתמש רישיון מוגבל, לא בלעדי, לשימוש אישי או עסקי פנימי בשירות, בכפוף
          לתנאים אלה. אין להעתיק, לפרק, לבצע הנngineering לאחור, או להסיר הודעות זכויות יוצרים.
        </p>
      </section>

      <section>
        <h2 className={h2Class}>4. תוכן ונתונים</h2>
        <p>
          המשתמש שומר על הבעלות בתוכן שהוא מעלה. המשתמש מעניק למפעיל רישיון להפעיל, לאחסן ולעבד את
          התוכן כנדרש לצורך מתן השירות, בהתאם ל{""}
          <a href="/privacy" className="text-[var(--primary-color)]">
            מדיניות הפרטיות
          </a>
          . [להשלים: מיקום שרתים והעברות בינלאומיות אם רלוונטי.]
        </p>
      </section>

      <section>
        <h2 className={h2Class}>5. תשלומים ומנויים</h2>
        <p>
          [להשלים: מחירים, חידוש, ביטול, החזרים, מע״מ — בהתאם ל-PayPal בממשק האתר ולחוק המקומי.]
        </p>
      </section>

      <section>
        <h2 className={h2Class}>6. השעיה וסיום</h2>
        <p>
          המפעיל רשאי להשעות או לסיים גישה במקרה של הפרת תנאים, חשש להתנהגות פוגעת או דרישות חוק.
          [להשלים: הודעה מוקדמת, שמירת נתונים לאחר סיום.]
        </p>
      </section>

      <section>
        <h2 className={h2Class}>7. הגבלת אחריות</h2>
        <p>
          לפרטים נוספים ראו{" "}
          <a href="/legal/disclaimer" className="text-[var(--primary-color)]">
            הצהרת הגבלה כללית
          </a>
          . [להשלים: סעיף אחריות מלא לפי יועץ.]
        </p>
      </section>

      <section>
        <h2 className={h2Class}>8. דין שיפוט וסמכות</h2>
        <p>
          [להשלים: בוררות / בתי משפט בישראל, שפה מוסכמת.]
        </p>
      </section>

      <section>
        <h2 className={h2Class}>9. יצירת קשר</h2>
        <p>
          לשאלות בנוגע לתנאים:{" "}
          <a href={`mailto:${legalSite.contactEmail}`} className="text-[var(--primary-color)] font-medium">
            {legalSite.contactEmail}
          </a>
        </p>
      </section>
    </LegalLayout>
  );
}
