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
  ListChecks,
  Filter,
  Edit3,
  LayoutGrid,
  Shield,
  X,
  ChevronDown,
  Search,
} from "lucide-react";
import CrmOrganizationsAdminTable, {
  type CrmAdminOrganizationRow,
} from "./CrmOrganizationsAdminTable";
import { useI18n } from "@/components/I18nProvider";
import { trackWizardEvent } from "@/lib/client-telemetry";

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

const STATUS_STYLE: Record<string, string> = {
  LEAD: "bg-violet-100 text-violet-700 border-violet-200",
  ACTIVE: "bg-sky-100 text-sky-700 border-sky-200",
  PROPOSAL: "bg-blue-100 text-blue-700 border-blue-200",
  CLOSED_WON: "bg-emerald-100 text-emerald-700 border-emerald-200",
  CLOSED_LOST: "bg-slate-100 text-slate-600 border-slate-200",
};

const STATUS_LABEL: Record<string, string> = {
  LEAD: "ליד",
  ACTIVE: "פעיל",
  PROPOSAL: "הצעה",
  CLOSED_WON: "נסגר ✓",
  CLOSED_LOST: "נסגר ✗",
};

function formatRange(from: string | null, to: string | null): string {
  if (!from && !to) return "ללא טווח תאריכים";
  const a = from ? new Date(from).toLocaleDateString("he-IL") : "…";
  const b = to ? new Date(to).toLocaleDateString("he-IL") : "פתוח";
  return `${a} → ${b}`;
}

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15 placeholder:text-slate-400";

const CRM_WIZARD_STORAGE_KEY = "bsd-crm:wizard-step";
const CRM_DRAFT_STORAGE_KEY = "bsd-crm:wizard-draft";

type CrmDraft = {
  projectName: string;
  projectFrom: string;
  projectTo: string;
  projectActive: boolean;
  contactName: string;
  contactEmail: string;
  contactStatus: string;
  contactProjectId: string;
};

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
  showUnifiedBillingLinks?: boolean;
}) {
  const { dir } = useI18n();
  const [msg, setMsg] = useState<string | null>(null);
  const [msgDismissed, setMsgDismissed] = useState(false);
  const [pending, startTransition] = useTransition();
  const [contactMonthFilter, setContactMonthFilter] = useState("");
  const [hideInactiveProjects, setHideInactiveProjects] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [draft, setDraft] = useState<CrmDraft>({
    projectName: "",
    projectFrom: "",
    projectTo: "",
    projectActive: true,
    contactName: "",
    contactEmail: "",
    contactStatus: "LEAD",
    contactProjectId: "",
  });

  const projectsForSelect = useMemo(() => {
    let list = projects;
    if (hideInactiveProjects) list = list.filter((p) => p.isActive);
    return list;
  }, [projects, hideInactiveProjects]);

  const filteredContacts = useMemo(() => {
    let list = contacts;
    if (contactMonthFilter) {
      const [y, m] = contactMonthFilter.split("-").map(Number);
      if (y && m) {
        list = list.filter((c) => {
          const d = new Date(c.createdAt);
          return d.getFullYear() === y && d.getMonth() + 1 === m;
        });
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.email ?? "").toLowerCase().includes(q) ||
          (c.project?.name ?? "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [contacts, contactMonthFilter, searchQuery]);

  useEffect(() => {
    setMsgDismissed(false);
  }, [msg]);

  useEffect(() => {
    try {
      const rawStep = window.localStorage.getItem(CRM_WIZARD_STORAGE_KEY);
      if (rawStep === "1" || rawStep === "2" || rawStep === "3") {
        setWizardStep(Number(rawStep) as 1 | 2 | 3);
      }
      const rawDraft = window.localStorage.getItem(CRM_DRAFT_STORAGE_KEY);
      if (!rawDraft) return;
      const parsed = JSON.parse(rawDraft) as Partial<CrmDraft>;
      setDraft((prev) => ({
        ...prev,
        projectName: typeof parsed.projectName === "string" ? parsed.projectName : prev.projectName,
        projectFrom: typeof parsed.projectFrom === "string" ? parsed.projectFrom : prev.projectFrom,
        projectTo: typeof parsed.projectTo === "string" ? parsed.projectTo : prev.projectTo,
        projectActive: typeof parsed.projectActive === "boolean" ? parsed.projectActive : prev.projectActive,
        contactName: typeof parsed.contactName === "string" ? parsed.contactName : prev.contactName,
        contactEmail: typeof parsed.contactEmail === "string" ? parsed.contactEmail : prev.contactEmail,
        contactStatus: typeof parsed.contactStatus === "string" ? parsed.contactStatus : prev.contactStatus,
        contactProjectId:
          typeof parsed.contactProjectId === "string" ? parsed.contactProjectId : prev.contactProjectId,
      }));
    } catch {
      // Ignore malformed local draft.
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(CRM_WIZARD_STORAGE_KEY, String(wizardStep));
  }, [wizardStep]);

  useEffect(() => {
    void trackWizardEvent("crm_step_view", `step=${wizardStep}`);
  }, [wizardStep]);

  useEffect(() => {
    window.localStorage.setItem(CRM_DRAFT_STORAGE_KEY, JSON.stringify(draft));
  }, [draft]);

  /* ── No org state ── */
  if (!hasOrganization) {
    return (
      <div className="space-y-8" dir={dir}>
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <Shield size={20} />
            </div>
            <div>
              <p className="font-bold text-blue-900">אין ארגון משויך</p>
              <p className="mt-1 text-sm text-blue-800/80 leading-relaxed">
                עבור ל<strong>הגדרות</strong>, שייך משתמש לארגון או התחבר מחדש. לאחר מכן תוכל להוסיף לקוחות ופרויקטים.
              </p>
            </div>
          </div>
        </div>
        {organizations.length > 0 ? (
          <section className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-black tracking-tight text-slate-900">
                  <LayoutGrid className="text-blue-600" size={20} aria-hidden />
                  ארגונים במערכת
                </h2>
                <p className="mt-0.5 text-sm text-slate-500">הרשאת בעלים</p>
              </div>
              <span className="rounded-full border border-blue-200 bg-blue-100 px-4 py-1.5 text-xs font-bold text-blue-800">
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
    <div className="space-y-6" dir={dir}>

      {/* ── Page header ── */}
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
        <div className="bg-[linear-gradient(135deg,_#f8fbff_0%,_#eef6ff_55%,_#ffffff_100%)] px-6 py-7 md:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-white px-3 py-1 text-xs font-black text-blue-700">
                <ListChecks size={12} />
                CRM workspace
              </p>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">מרכז לידים ולקוחות</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">ניהול פרויקטים, לקוחות והצעות במסך שקט יותר, עם פוקוס ברור על השלב הבא.</p>
            </div>
            <a
              href="#crm-new-contact"
              className="inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
              style={{ backgroundColor: "var(--primary-color, #2563eb)" }}
            >
              <UserPlus size={16} aria-hidden />
              לקוח חדש
            </a>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <div className="rounded-3xl border border-blue-100 bg-white px-4 py-4">
              <p className="text-xs font-bold text-slate-500">פרויקטים</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{projects.length}</p>
            </div>
            <div className="rounded-3xl border border-emerald-100 bg-white px-4 py-4">
              <p className="text-xs font-bold text-slate-500">לקוחות</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{contacts.length}</p>
            </div>
            <div className="rounded-3xl border border-violet-100 bg-white px-4 py-4">
              <p className="text-xs font-bold text-slate-500">שלב פעיל</p>
              <p className="mt-1 text-lg font-black text-slate-900">{wizardStep === 1 ? "יצירת פרויקט" : wizardStep === 2 ? "הוספת לקוח" : "ניהול ומעקב"}</p>
            </div>
          </div>
        </div>

        <div id="crm-wizard" className="scroll-mt-24 border-t border-slate-100 px-6 py-5 md:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900">תהליך עבודה ב-3 צעדים</h2>
              <p className="mt-1 text-sm text-slate-500">במקום להעמיס הכול בבת אחת, מתקדמים שלב אחד ברור בכל פעם.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3].map((step) => (
                <button
                  key={step}
                  type="button"
                  onClick={() => setWizardStep(step as 1 | 2 | 3)}
                  className={`rounded-2xl px-4 py-2.5 text-sm font-bold transition ${
                    wizardStep === step
                      ? "bg-slate-900 text-white"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {step === 1 ? "1. פרויקט" : step === 2 ? "2. לקוח" : "3. ניהול"}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold text-slate-500">
            <a href="#crm-new-project" className="rounded-full bg-slate-100 px-3 py-1.5 hover:bg-slate-200">קפיצה לשלב 1</a>
            <a href="#crm-new-contact" className="rounded-full bg-slate-100 px-3 py-1.5 hover:bg-slate-200">קפיצה לשלב 2</a>
            <a href="#crm-contacts-table" className="rounded-full bg-slate-100 px-3 py-1.5 hover:bg-slate-200">קפיצה לשלב 3</a>
          </div>
        </div>
      </section>

      {/* ── Toast ── */}
      {msg && !msgDismissed ? (
        <div
          className={`flex items-start gap-3 rounded-[24px] px-4 py-4 text-sm shadow-sm ${
            msg.startsWith("✓")
              ? "border border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border border-rose-200 bg-rose-50 text-rose-900"
          }`}
          role="status"
        >
          <p className="flex-1">{msg}</p>
          <button
            type="button"
            onClick={() => setMsgDismissed(true)}
            className="shrink-0 rounded-lg p-1 opacity-60 hover:opacity-100"
            aria-label="סגור"
          >
            <X size={14} />
          </button>
        </div>
      ) : null}

      {/* ── Forms row ── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[0.95fr_1.05fr]">

        {/* New project */}
        <section
          id="crm-new-project"
          className={`scroll-mt-24 rounded-[28px] border bg-white p-6 shadow-sm ${
            wizardStep === 1 ? "border-blue-200 ring-2 ring-blue-100" : "border-slate-200"
          }`}
        >
          <h2 className="mb-2 flex items-center gap-2 text-base font-black text-slate-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <FolderPlus size={17} aria-hidden />
            </span>
            פרויקט חדש
          </h2>
          <p className="mb-5 text-sm leading-6 text-slate-500">יוצרים קודם מעטפת עבודה מסודרת, ואז מתקדמים ללקוח עצמו.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setMsg(null);
              const fd = new FormData();
              fd.set("name", draft.projectName);
              if (draft.projectFrom) fd.set("activeFrom", draft.projectFrom);
              if (draft.projectTo) fd.set("activeTo", draft.projectTo);
              if (draft.projectActive) fd.set("isActive", "on");
              startTransition(async () => {
                const r = await createProjectAction(fd);
                setMsg(r.ok ? "✓ הפרויקט נשמר" : r.error || "שגיאה");
                if (r.ok) {
                  setDraft((prev) => ({
                    ...prev,
                    projectName: "",
                    projectFrom: "",
                    projectTo: "",
                    projectActive: true,
                  }));
                  setWizardStep(2);
                }
              });
            }}
            className="space-y-3"
          >
            <input
              name="name"
              required
              placeholder="שם פרויקט / עסק"
              className={inputCls}
              value={draft.projectName}
              onChange={(e) => setDraft((prev) => ({ ...prev, projectName: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  תחילת תקופה
                </label>
                <input
                  type="date"
                  name="activeFrom"
                  className={inputCls}
                  value={draft.projectFrom}
                  onChange={(e) => setDraft((prev) => ({ ...prev, projectFrom: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  סיום מתוכנן
                </label>
                <input
                  type="date"
                  name="activeTo"
                  className={inputCls}
                  value={draft.projectTo}
                  onChange={(e) => setDraft((prev) => ({ ...prev, projectTo: e.target.value }))}
                />
              </div>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-600">
              <input
                type="checkbox"
                name="isActive"
                value="on"
                checked={draft.projectActive}
                onChange={(e) => setDraft((prev) => ({ ...prev, projectActive: e.target.checked }))}
                className="rounded border-slate-300 accent-blue-600"
              />
              פרויקט פעיל
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={pending}
                className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: "var(--primary-color, #2563eb)" }}
              >
                <Plus size={15} />
                הוסף פרויקט
              </button>
              <button
                type="button"
                onClick={() => setWizardStep(2)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                המשך לשלב הבא
              </button>
            </div>
          </form>

          {/* Existing projects mini-list */}
          {projects.length > 0 && (
            <div className="mt-6 border-t border-slate-100 pt-5">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">פרויקטים קיימים</p>
              <ul className="max-h-44 space-y-2 overflow-y-auto rounded-2xl bg-slate-50 p-2 pr-2">
                {projects.map((p) => (
                  <li
                    key={p.id}
                    className={`flex flex-wrap justify-between gap-2 rounded-2xl px-3 py-3 text-xs ${
                      p.isActive
                        ? "border border-slate-200 bg-white"
                        : "border border-blue-100 bg-blue-50/60 text-slate-600"
                    }`}
                  >
                    <span className="font-bold">{p.name}</span>
                    <span className="text-slate-500">{formatRange(p.activeFrom, p.activeTo)}</span>
                    {!p.isActive ? <span className="text-blue-700 font-bold">ארכיון</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* New contact */}
        <section
          id="crm-new-contact"
          className={`scroll-mt-24 rounded-[28px] border bg-white p-6 shadow-sm ${
            wizardStep === 2 ? "border-blue-200 ring-2 ring-blue-100" : "border-slate-200"
          }`}
        >
          <h2 className="mb-5 flex items-center gap-2 text-base font-black text-slate-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <UserPlus size={17} aria-hidden />
            </span>
            לקוח חדש
          </h2>
          <p className="mb-5 text-sm leading-6 text-slate-500">מוסיפים לקוח חדש רק עם השדות החשובים, בלי עומס שדות מיותר.</p>
          <label className="mb-4 flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-500">
            <input
              type="checkbox"
              checked={hideInactiveProjects}
              onChange={(e) => setHideInactiveProjects(e.target.checked)}
              className="rounded border-slate-300 accent-blue-600"
            />
            הצג רק פרויקטים פעילים
          </label>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setMsg(null);
              const fd = new FormData();
              fd.set("name", draft.contactName);
              if (draft.contactEmail) fd.set("email", draft.contactEmail);
              fd.set("status", draft.contactStatus || "LEAD");
              if (draft.contactProjectId) fd.set("projectId", draft.contactProjectId);
              startTransition(async () => {
                const r = await createContactAction(fd);
                setMsg(r.ok ? "✓ הלקוח נוסף" : r.error || "שגיאה");
                if (r.ok) {
                  setDraft((prev) => ({
                    ...prev,
                    contactName: "",
                    contactEmail: "",
                    contactStatus: "LEAD",
                    contactProjectId: "",
                  }));
                  setWizardStep(3);
                }
              });
            }}
            className="space-y-3"
          >
            <input
              name="name"
              required
              placeholder="שם לקוח / חברה"
              className={inputCls}
              value={draft.contactName}
              onChange={(e) => setDraft((prev) => ({ ...prev, contactName: e.target.value }))}
            />
            <input
              name="email"
              type="email"
              placeholder="אימייל (אופציונלי)"
              className={inputCls}
              value={draft.contactEmail}
              onChange={(e) => setDraft((prev) => ({ ...prev, contactEmail: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <select
                  name="status"
                  value={draft.contactStatus}
                  onChange={(e) => setDraft((prev) => ({ ...prev, contactStatus: e.target.value }))}
                  className={`${inputCls} appearance-none`}
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
              <div className="relative">
                <select
                  name="projectId"
                  className={`${inputCls} appearance-none`}
                  value={draft.contactProjectId}
                  onChange={(e) => setDraft((prev) => ({ ...prev, contactProjectId: e.target.value }))}
                >
                  <option value="">— ללא פרויקט —</option>
                  {projectsForSelect.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={pending}
                className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: "var(--primary-color, #2563eb)" }}
              >
                <Plus size={15} />
                הוסף לקוח
              </button>
              <button
                type="button"
                onClick={() => setWizardStep(3)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                המשך לטבלת ניהול
              </button>
            </div>
          </form>
        </section>
      </div>

      {/* ── Contacts table ── */}
      <div
        id="crm-contacts-table"
        className={`scroll-mt-24 overflow-hidden rounded-[28px] border bg-white shadow-sm ${
          wizardStep === 3 ? "border-blue-200 ring-2 ring-blue-100" : "border-slate-200"
        }`}
      >
        {/* Table header */}
        <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/70 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900">אנשי קשר</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {filteredContacts.length} מתוך {contacts.length} לקוחות
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search size={14} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder="חיפוש לקוח..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 py-2 ps-8 pe-3 text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15"
              />
            </div>
            {/* Month filter */}
            <label className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
              <Filter size={12} aria-hidden />
              <input
                type="month"
                value={contactMonthFilter}
                onChange={(e) => setContactMonthFilter(e.target.value)}
                className="bg-transparent outline-none"
              />
            </label>
            {contactMonthFilter || searchQuery ? (
              <button
                type="button"
                onClick={() => { setContactMonthFilter(""); setSearchQuery(""); }}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50"
              >
                נקה מסנן
              </button>
            ) : null}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-start">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                <th className="px-4 py-3 text-start text-[10px] font-bold uppercase tracking-wider text-slate-400">שם</th>
                <th className="px-4 py-3 text-start text-[10px] font-bold uppercase tracking-wider text-slate-400">פרויקט</th>
                <th className="px-4 py-3 text-start text-[10px] font-bold uppercase tracking-wider text-slate-400">סטטוס</th>
                <th className="px-4 py-3 text-start text-[10px] font-bold uppercase tracking-wider text-slate-400">אימייל</th>
                <th className="px-4 py-3 text-start text-[10px] font-bold uppercase tracking-wider text-slate-400">נרשם</th>
                <th className="px-4 py-3 text-start text-[10px] font-bold uppercase tracking-wider text-slate-400">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredContacts.map((contact) => {
                const proj = projects.find((p) => p.id === contact.project?.id);
                return (
                  <tr key={contact.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black text-white"
                          style={{ backgroundColor: "var(--primary-color, #2563eb)" }}
                        >
                          {contact.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-bold text-slate-900">{contact.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-600">{contact.project?.name ?? "—"}</span>
                      {proj ? (
                        <span className="mt-0.5 block text-[10px] text-slate-400">
                          {formatRange(proj.activeFrom, proj.activeTo)}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-lg border px-2.5 py-1 text-[10px] font-bold ${STATUS_STYLE[contact.status] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}
                      >
                        {STATUS_LABEL[contact.status] ?? contact.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500" dir="ltr">
                      {contact.email ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {new Date(contact.createdAt).toLocaleDateString("he-IL")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <QuoteGenerator quoteData={{ clientName: contact.name, amount: 5000 }} />
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
                              "מזהה פרויקט (השאר ריק להסרה):",
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
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Edit3 size={13} />
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
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 size={13} />
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

        {/* Empty state */}
        {filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
            <UserPlus className="text-slate-200" size={36} strokeWidth={1.25} />
            <div>
              <p className="font-bold text-slate-700">
                {contactMonthFilter || searchQuery ? "אין תוצאות למסנן זה" : "אין לקוחות עדיין"}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {contactMonthFilter || searchQuery
                  ? "נסו מסנן אחר או נקו את החיפוש."
                  : 'השתמשו בטופס "לקוח חדש" למעלה.'}
              </p>
            </div>
            {!contactMonthFilter && !searchQuery ? (
              <a
                href="#crm-new-contact"
                className="inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:opacity-90"
                style={{ backgroundColor: "var(--primary-color, #2563eb)" }}
              >
                <UserPlus size={15} />
                הוספת לקוח
              </a>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* ── Admin orgs table ── */}
      {organizations.length > 0 && (
        <section className="mt-4 space-y-4" dir={dir}>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-black tracking-tight text-slate-900">
                <LayoutGrid className="text-blue-600" size={20} aria-hidden />
                כל הארגונים במערכת
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">תוכנית, חשבוניות וניהול — הרשאת בעלים</p>
            </div>
            <span className="rounded-full border border-blue-200 bg-blue-100 px-4 py-1.5 text-xs font-bold text-blue-800">
              הרשאת בעלים
            </span>
          </div>
          <CrmOrganizationsAdminTable
            organizations={organizations}
            showUnifiedBillingLinks={showUnifiedBillingLinks}
          />
        </section>
      )}
    </div>
  );
}
