import Link from "next/link";

/**
 * קישורים מהירים לנקודות קצה של ניהול — השירותים דורשים הרשאת Platform Admin.
 */
export default function AdminSupportLinks() {
  const api = [
    { href: "/api/admin/health", label: "בריאות מערכת (health)" },
    { href: "/api/admin/system-health", label: "system-health" },
    { href: "/api/admin/logs", label: "לוגים" },
    { href: "/api/admin/check-user", label: "בדיקת משתמש (POST)" },
    { href: "/api/admin/set-password", label: "איפוס סיסמה (POST)" },
    { href: "/api/admin/fix-roles", label: "תיקון תפקידים (POST)" },
    { href: "/api/admin/self-heal", label: "self-heal (POST)" },
    { href: "/api/admin/broadcast-notification", label: "שידור התראה (POST)" },
  ];

  return (
    <section className="rounded-[28px] border border-[color:var(--cd-line)] bg-white/92 p-5 shadow-[var(--cd-shadow)]" dir="rtl">
      <h2 className="text-lg font-black text-[color:var(--ink-900)]">כלי ניהול API</h2>
      <p className="mt-2 text-sm leading-6 text-[color:var(--ink-600)]">
        רוב הנקודות דורשות גוף JSON ואימות — השימוש הוא למפתחים מורשים בלבד.
      </p>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {api.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="inline-flex min-h-11 w-full items-center rounded-2xl border border-[color:var(--cd-line)] bg-[color:var(--cd-bg-sunken)] px-4 py-2 text-sm font-bold text-[color:var(--ink-800)] transition-all duration-200 hover:bg-[color:var(--ink-900)] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ops-indigo)] active:scale-[0.99]"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
