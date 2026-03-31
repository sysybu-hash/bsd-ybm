"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import {
  createContactAction,
  createProjectAction,
  deleteContactAction,
  updateContactAction,
} from "@/app/actions/crm";
import QuoteGenerator from "@/components/QuoteGenerator";
import SignQuoteButton from "@/components/SignQuoteButton";
import {
  Plus,
  Trash2,
  FolderPlus,
  UserPlus,
  Filter,
  Edit3,
  LayoutGrid,
  Shield,
} from "lucide-react";
import CrmOrganizationsAdminTable, {
  type CrmAdminOrganizationRow,
} from "./CrmOrganizationsAdminTable";
import { useI18n } from "@/components/I18nProvider";

type ContactRow = {
  id: string;
  name: string;
  email: string | null;
  status: string;
  project: { id: string; name: string } | null;
  createdAt: string;
};

type ProjectRow = {
  id: string;
  name: string;
  isActive: boolean;
  activeFrom: string | null;
  activeTo: string | null;
};

const STATUS_OPTIONS = [
  { value: "LEAD", label: "ליד" },
  { value: "ACTIVE", label: "פעיל" },
  { value: "PROPOSAL", label: "הצעה" },
  { value: "CLOSED_WON", label: "נסגר בהצלחה" },
  { value: "CLOSED_LOST", label: "נסגר שלילי" },
];

function formatRange(from: string | null, to: string | null): string {
  if (!from && !to) return "ללא טווח תאריכים";
  const a = from ? new Date(from).toLocaleDateString("he-IL") : "…";
  const b = to ? new Date(to).toLocaleDateString("he-IL") : "פתוח";
  return `${a} → ${b}`;
}

export default function CrmClient({
  contacts,
  projects,
  hasOrganization,
  organizations = [],
  showUnifiedBillingLinks = false,
}: {
  contacts: ContactRow[];
  projects: ProjectRow[];
  hasOrganization: boolean;
  organizations?: CrmAdminOrganizationRow[];
  /** Steel Admin — קישור לניהול מנוי בבילינג מאוחד */
  showUnifiedBillingLinks?: boolean;
}) {
  const { dir } = useI18n();
  const [msg, setMsg] = useState<string | null>(null);
  const [msgDismissed, setMsgDismissed] = useState(false);
  const [pending, startTransition] = useTransition();
  const [contactMonthFilter, setContactMonthFilter] = useState("");
  const [hideInactiveProjects, setHideInactiveProjects] = useState(true);

  const projectsForSelect = useMemo(() => {
    let list = projects;
    if (hideInactiveProjects) list = list.filter((p) => p.isActive);
    return list;
  }, [projects, hideInactiveProjects]);

  const filteredContacts = useMemo(() => {
    if (!contactMonthFilter) return contacts;
    const [y, m] = contactMonthFilter.split("-").map(Number);
    if (!y || !m) return contacts;
    return contacts.filter((c) => {
      const d = new Date(c.createdAt);
      return d.getFullYear() === y && d.getMonth() + 1 === m;
    });
  }, [contacts, contactMonthFilter]);

  useEffect(() => {
    setMsgDismissed(false);
  }, [msg]);

  if (!hasOrganization) {
    return (
      <div className="space-y-8" dir={dir}>
        <div className="card-avenue border-blue-200/90 bg-gradient-to-br from-blue-50 to-blue-50/30 p-8 shadow-md">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-blue-100 p-3 text-blue-800 shrink-0">
              <Shield size={24} />
            </div>
            <div>
              <p className="font-black text-lg text-blue-900 mb-2">אין ארגון משויך</p>
              <p className="text-sm text-blue-900/80 leading-relaxed">
                עבור ל<strong className="font-bold">הגדרות</strong>, שייך משתמש לארגון או התחבר מחדש. לאחר מכן תוכל להוסיף לקוחות
                ופרויקטים.
              </p>
            </div>
          </div>
        </div>
        {organizations.length > 0 ? (
          <section className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-4 px-1">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-black italic tracking-tight text-slate-900">
                  <LayoutGrid className="text-blue-600" size={22} aria-hidden />
                  ארגונים במערכת (תצוגת בעלים)
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  ניהול מנויים, סיכום AI וחשבוניות — ללא צורך בארגון אישי לצפייה בלבד בטבלה זו
                </p>
              </div>
              <span className="text-xs font-black bg-blue-100 text-blue-800 px-4 py-2 rounded-full border border-blue-200/80">
                הרשאת בעלים
              </span>
            </div>
            <CrmOrganizationsAdminTable
              organizations={organizations}
              showUnifiedBillingLinks={showUnifiedBillingLinks}
            />
          </section>
        ) : null}
      </div>
    );
  }

  return (
    <>
      <div className="relative space-y-10" dir={dir}>
        <div className="flex flex-col gap-4 px-1 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-black italic tracking-tight text-slate-900">
              <span className="inline-flex rounded-2xl bg-blue-600 p-2.5 text-white shadow-lg shadow-blue-600/25">
                <LayoutGrid size={22} aria-hidden />
              </span>
              מרכז לידים ולקוחות
            </h1>
            <p className="mt-1 max-w-xl text-sm text-slate-500">
              פרויקטים, אנשי קשר והצעות מחיר — באותה שפה ויזואלית כמו שאר לוח הבקרה.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <label className="flex items-center gap-2 rounded-2xl border border-slate-200/90 bg-white px-4 py-2.5 font-bold text-slate-600 shadow-sm">
              <Filter size={16} className="text-slate-400" aria-hidden />
              לקוחות לפי חודש
              <input
                type="month"
                value={contactMonthFilter}
                onChange={(e) => setContactMonthFilter(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-1.5 bg-slate-50 text-slate-900 font-medium"
              />
            </label>
            {contactMonthFilter ? (
              <button type="button" onClick={() => setContactMonthFilter("")} className="btn-ghost py-2 text-sm text-blue-700">
                נקה מסנן
              </button>
            ) : null}
          </div>
        </div>

        {msg && !msgDismissed ? (
          <div
            className={`flex flex-wrap items-start gap-3 rounded-2xl px-5 py-3 text-sm font-medium ${
              msg.startsWith("✓")
                ? "border border-emerald-200/90 bg-emerald-50 text-emerald-900 shadow-sm"
                : "border border-rose-200/90 bg-rose-50 text-rose-900 shadow-sm"
            }`}
            role="status"
          >
            <p className="min-w-0 flex-1">{msg}</p>
            <button
              type="button"
              onClick={() => setMsgDismissed(true)}
              className="shrink-0 rounded-lg p-1 text-current opacity-70 hover:bg-black/5"
              aria-label="סגור הודעה"
            >
              ×
            </button>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <section className="card-avenue p-6 md:p-8">
            <h2 className="mb-5 flex items-center gap-2 text-lg font-black text-slate-900">
              <FolderPlus className="text-blue-600" size={22} aria-hidden />
              פרויקט חדש
            </h2>
            <form
              action={(fd) => {
                setMsg(null);
                startTransition(async () => {
                  const r = await createProjectAction(fd);
                  setMsg(r.ok ? "✓ הפרויקט נשמר" : r.error || "שגיאה");
                });
              }}
              className="space-y-4"
            >
              <input
                name="name"
                required
                placeholder="שם פרויקט / עסק"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition-shadow focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-1.5 uppercase tracking-wide">
                    תחילת תקופה (אופציונלי)
                  </label>
                  <input
                    type="date"
                    name="activeFrom"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-1.5 uppercase tracking-wide">
                    סיום מתוכנן (אופציונלי)
                  </label>
                  <input
                    type="date"
                    name="activeTo"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 bg-white"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
                <input type="checkbox" name="isActive" value="on" defaultChecked className="rounded border-slate-300" />
                פרויקט פעיל (ארכיון אם לא מסומן)
              </label>
              <button type="submit" disabled={pending} className="btn-primary disabled:opacity-50">
                {pending ? "…" : "הוסף פרויקט"}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <p className="text-xs font-black text-slate-500 uppercase tracking-wide mb-3">פרויקטים קיימים</p>
              <ul className="space-y-2 max-h-44 overflow-y-auto text-xs pr-1">
                {projects.map((p) => (
                  <li
                    key={p.id}
                    className={`flex flex-wrap justify-between gap-2 rounded-xl px-3 py-2 ${
                      p.isActive ? "bg-slate-50 border border-slate-100" : "bg-blue-50/90 border border-blue-100 text-slate-700"
                    }`}
                  >
                    <span className="font-bold">{p.name}</span>
                    <span className="text-slate-500">{formatRange(p.activeFrom, p.activeTo)}</span>
                    {!p.isActive ? <span className="text-blue-800 font-black">ארכיון</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section id="crm-new-contact" className="card-avenue scroll-mt-24 p-6 md:p-8">
            <h2 className="mb-5 flex items-center gap-2 text-lg font-black text-slate-900">
              <UserPlus className="text-blue-600" size={22} aria-hidden />
              לקוח חדש
            </h2>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-600 mb-4">
              <input
                type="checkbox"
                checked={hideInactiveProjects}
                onChange={(e) => setHideInactiveProjects(e.target.checked)}
                className="rounded border-slate-300"
              />
              הצג ברשימת פרויקטים רק פרויקטים פעילים
            </label>
            <form
              action={(fd) => {
                setMsg(null);
                startTransition(async () => {
                  const r = await createContactAction(fd);
                  setMsg(r.ok ? "✓ הלקוח נוסף" : r.error || "שגיאה");
                });
              }}
              className="space-y-4"
            >
              <input
                name="name"
                required
                placeholder="שם לקוח / חברה"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
              <input
                name="email"
                type="email"
                placeholder="אימייל (אופציונלי)"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  name="status"
                  defaultValue="LEAD"
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 bg-white font-medium"
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <select
                  name="projectId"
                  className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 bg-white font-medium"
                >
                  <option value="">— ללא פרויקט —</option>
                  {projectsForSelect.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({formatRange(p.activeFrom, p.activeTo)})
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" disabled={pending} className="btn-primary w-full justify-center sm:w-auto">
                <Plus size={18} aria-hidden />
                הוסף לקוח
              </button>
            </form>
          </section>
        </div>

        <div className="card-avenue overflow-hidden">
          <div className="border-b border-slate-100 bg-blue-50/50 px-6 py-4">
            <h2 className="text-sm font-black uppercase tracking-wider text-blue-900">אנשי קשר</h2>
            <p className="mt-0.5 text-xs text-slate-500">הצעות מחיר, חתימה ועריכה מהירה</p>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-start">
            <thead className="bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-500">
              <tr>
                <th className="p-4 font-semibold">שם</th>
                <th className="p-4 font-semibold">פרויקט + טווח</th>
                <th className="p-4 font-semibold">סטטוס</th>
                <th className="p-4 font-semibold">אימייל</th>
                <th className="p-4 font-semibold">נרשם</th>
                <th className="p-4 font-semibold">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.map((contact) => {
                const proj = projects.find((p) => p.id === contact.project?.id);
                return (
                  <tr
                    key={contact.id}
                    className="border-t border-slate-100 hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="p-4 font-bold text-slate-900">{contact.name}</td>
                    <td className="p-4 text-slate-600 text-sm">
                      {contact.project?.name ?? "—"}
                      {proj ? (
                        <span className="block text-[10px] text-slate-400 mt-0.5">
                          {formatRange(proj.activeFrom, proj.activeTo)}
                        </span>
                      ) : null}
                    </td>
                    <td className="p-4">
                      <span className="text-xs bg-blue-50 text-blue-800 px-2.5 py-1 rounded-xl font-bold border border-blue-100">
                        {contact.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600">{contact.email ?? "—"}</td>
                    <td className="p-4 text-slate-500 text-xs font-medium">
                      {new Date(contact.createdAt).toLocaleDateString("he-IL")}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col sm:flex-row gap-2 items-start">
                        <QuoteGenerator
                          quoteData={{ clientName: contact.name, amount: 5000 }}
                        />
                        <SignQuoteButton contactId={contact.id} amount={5000} />
                        <button
                          type="button"
                          onClick={() => {
                            const name = window.prompt("שם לקוח:", contact.name);
                            if (name === null) return;
                            const email = window.prompt("אימייל:", contact.email ?? "");
                            if (email === null) return;
                            const status = window.prompt(
                              "סטטוס (LEAD / ACTIVE / PROPOSAL / CLOSED_WON / CLOSED_LOST):",
                              contact.status,
                            );
                            if (status === null) return;
                            const projectRaw = window.prompt(
                              "מזהה פרויקט (הדבק מזהה מהמערכת, או השאר ריק להסרת שיוך):",
                              contact.project?.id ?? "",
                            );
                            if (projectRaw === null) return;
                            startTransition(async () => {
                              const r = await updateContactAction({
                                contactId: contact.id,
                                name,
                                email,
                                status,
                                projectId: projectRaw.trim(),
                              });
                              setMsg(r.ok ? "✓ עודכן" : r.error || "שגיאה");
                            });
                          }}
                          className="btn-ghost gap-1 py-1.5 text-xs text-blue-700"
                        >
                          <Edit3 size={14} aria-hidden />
                          ערוך
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!confirm("למחוק לקוח זה?")) return;
                            startTransition(async () => {
                              const r = await deleteContactAction(contact.id);
                              setMsg(r.ok ? "✓ נמחק" : r.error || "שגיאה");
                            });
                          }}
                          className="inline-flex items-center gap-1 rounded-xl py-1.5 ps-2 pe-2 text-xs font-bold text-rose-700 hover:bg-rose-50"
                        >
                          <Trash2 size={14} aria-hidden />
                          מחק
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
          {filteredContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 px-6 py-14 text-center">
              <UserPlus className="text-slate-200" size={40} strokeWidth={1.25} aria-hidden />
              <div>
                <p className="font-bold text-slate-700">
                  {contactMonthFilter
                    ? "אין לקוחות בחודש שנבחר"
                    : "אין לקוחות עדיין"}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {contactMonthFilter
                    ? "נסו מסנן אחר או נקו את המסנן."
                    : "השתמשו בטופס „לקוח חדש” למעלה."}
                </p>
              </div>
              {!contactMonthFilter ? (
                <a href="#crm-new-contact" className="btn-primary text-sm">
                  הוספת לקוח
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {organizations.length > 0 && (
        <section className="mt-12 space-y-4" dir={dir}>
          <div className="flex flex-wrap items-end justify-between gap-4 px-1">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-black italic tracking-tight text-slate-900">
                <LayoutGrid className="text-blue-600" size={22} aria-hidden />
                כל הארגונים במערכת
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-500">
                תוכנית, חשבוניות, סיכום AI (Gemini) וניהול ארגון — הרשאת בעלים
              </p>
            </div>
            <span className="text-xs font-black bg-blue-100 text-blue-800 px-4 py-2 rounded-full border border-blue-200/80">
              הרשאת בעלים
            </span>
          </div>
          <CrmOrganizationsAdminTable
            organizations={organizations}
            showUnifiedBillingLinks={showUnifiedBillingLinks}
          />
        </section>
      )}
    </>
  );
}
