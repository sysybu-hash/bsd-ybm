import type { Metadata } from "next";
import LegalLayout, { h2Class } from "@/components/LegalLayout";
import { legalSite } from "@/lib/legal-site";

export const metadata: Metadata = {
  title: "מדיניות עוגיות | BSD-YBM",
  description: "מידע על שימוש בעוגיות ובטכנולוגיות דומות באתר ובמערכת.",
};

export default function CookiesLegalPage() {
  return (
    <LegalLayout
      title="מדיניות עוגיות (Cookies)"
      subtitle="שקיפות לגבי טכנולוגיות בדפדפן — יש להתאים לפי ביקורת משפטית ופעילות בפועל."
    >
      <section>
        <h2 className={h2Class}>1. מה הן עוגיות</h2>
        <p>
          עוגיות הן קבצים קטנים שנשמרים במכשירך בעת גלישה. הן משמשות לעיתים לזכור העדפות, לשמור על
          התחברות בטוחה, או לנתח תנועה בצורה אנונימית.
        </p>
      </section>

      <section>
        <h2 className={h2Class}>2. סוגי עוגיות בשימוש</h2>
        <ul className="list-disc list-inside space-y-2 mr-4">
          <li>
            <strong>הכרחיות / פונקציונליות:</strong> לדוגמה שמירת סשן התחברות (OAuth) אבטחת מערכת.
          </li>
          <li>
            <strong>העדפות:</strong> [להשלים אם קיימות — למשל שפה, נגישות.]
          </li>
          <li>
            <strong>אנליטיקה ושיווק:</strong> [להשלים אם משתמשים ב-Google Analytics, Meta Pixel וכו׳ —
            שם השירות ומדיניות הספק.]
          </li>
        </ul>
      </section>

      <section>
        <h2 className={h2Class}>3. ניהול הסכמה</h2>
        <p>
          בעת הכניסה הראשונה לאתר מוצג באנר הסכמה (חומת עוגיות) המאפשר לבחור בין עוגיות הכרחיות
          בלבד, קבלת כל העוגיות, או התאמה אישית (אנליטיקה ושיווק). ההעדפה נשמרת בדפדפן (למשל
          באמצעות localStorage) וניתן לעדכן אותה בכל עת דרך קישור &quot;הגדרות עוגיות&quot; בדף הבית,
          בפוטר או באמצעות אירוע הממשק. יש לעדכן כאן רשימת ספקים בפועל (אנליטיקה/שיווק) כשמוסיפים
          כאלה.
        </p>
      </section>

      <section>
        <h2 className={h2Class}>4. שינויים</h2>
        <p>
          מדיניות זו עשויה להתעדכן. תאריך עדכון מוצג בראש המסמך. שימוש מתמשך באתר לאחר עדכון
          מהווה הסכמה לגרסה המעודכנת — כפי שייקבע בנוסח הסופי מול יועץ.
        </p>
      </section>

      <section>
        <h2 className={h2Class}>5. פניות</h2>
        <p>
          {legalSite.siteName} —{" "}
          <a href={`mailto:${legalSite.contactEmail}`} className="text-[var(--primary-color)] font-medium">
            {legalSite.contactEmail}
          </a>
        </p>
      </section>
    </LegalLayout>
  );
}
