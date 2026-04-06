import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative z-10 border-t border-gray-200 bg-gray-50 py-12" dir="rtl">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-right">
        <div className="space-y-4">
          <h3 className="text-xl font-black italic text-gray-900 tracking-tighter">
            BSD-YBM. <span className="text-[var(--primary-color)]">Intelligence.</span>
          </h3>
          <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto md:mx-0">
            מערכת ניהול חכמה מבוססת AI לשיפור פריון העבודה וניהול פיננסי מתקדם.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-3">
            <h4 className="text-gray-900 font-bold mb-4">מערכת</h4>
            <Link
              href="/dashboard/erp"
              className="block text-gray-500 hover:text-[var(--primary-color)] transition-colors"
            >
              ניהול ERP
            </Link>
            <Link
              href="/dashboard/crm"
              className="block text-gray-500 hover:text-[var(--primary-color)] transition-colors"
            >
              ניהול CRM
            </Link>
          </div>
          <div className="space-y-3">
            <h4 className="text-gray-900 font-bold mb-4">מידע</h4>
            <Link
              href="/legal"
              className="block text-gray-500 hover:text-[var(--primary-color)] transition-colors"
            >
              מסמכים משפטיים
            </Link>
            <Link
              href="/terms"
              className="block text-gray-500 hover:text-[var(--primary-color)] transition-colors"
            >
              תנאי שימוש
            </Link>
            <Link
              href="/privacy"
              className="block text-gray-500 hover:text-[var(--primary-color)] transition-colors"
            >
              פרטיות
            </Link>
            <Link
              href="/legal/gdpr"
              className="block text-gray-500 hover:text-[var(--primary-color)] transition-colors"
            >
              GDPR / הגנת מידע
            </Link>
            <Link
              href="/tutorial"
              className="block text-gray-500 hover:text-[var(--primary-color)] transition-colors"
            >
              הדרכה מונפשת
            </Link>
          </div>
        </div>

        <div className="flex flex-col justify-center items-center md:items-end text-gray-500 text-xs italic">
          <div>© {currentYear} כל הזכויות שמורות</div>
          <div className="text-gray-700 font-medium not-italic">יוחנן בוקשפן - BSD-YBM</div>
        </div>
      </div>
    </footer>
  );
}
