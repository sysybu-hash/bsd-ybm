"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { createProjectAction, deleteProjectAction, updateContactStatusAction } from "@/app/actions/crm";
import Link from "next/link";
import {
  BarChart2,
  Briefcase,
  Calendar,
  CheckCircle2,
  FolderPlus,
  GripHorizontal,
  LayoutGrid,
  List,
  Loader2,
  Plus,
  ReceiptText,
  Shield,
  Sparkles,
  Trash2,
  TrendingUp,
  UserPlus,
  Users,
  X,
  Zap,
} from "lucide-react";
import SemanticSearchBar from "@/components/ai/SemanticSearchBar";
import CrmOrganizationsAdminTable, { type CrmAdminOrganizationRow } from "./CrmOrganizationsAdminTable";
import { useI18n } from "@/components/I18nProvider";
import type { IssuedDocRow } from "@/components/billing/GlobalBillingPageClient";
import CrmContactCard from "./CrmContactCard";
import CrmContactModal from "./CrmContactModal";
import { STATUS_COLUMNS, crmInputCls } from "./crm-client-constants";
import type {
  ContactRow,
  CrmView,
  ModalState,
  OrgBillingInfo,
  ProjectRow,
  StatusKey,
} from "./crm-client-types";
import { LazyDocumentPreviewModal, LazyEditIssuedDocumentModal, LazyProjectDocumentBox } from "./CrmLazyBilling";
import { avatarColor, fmtDate, fmtMoney, formatRange, initials, statusMeta } from "./crm-client-utils";

export type { ErpSummary, InvoiceRow, OrgBillingInfo } from "./crm-client-types";

export default function CrmClient({
  contacts: initialContacts,
  projects,
  hasOrganization,
  organizations = [],
  showUnifiedBillingLinks = false,
  orgBilling = null,
}: {
  contacts: ContactRow[];
  projects: ProjectRow[];
  hasOrganization: boolean;
  organizations?: CrmAdminOrganizationRow[];
  showUnifiedBillingLinks?: boolean;
  orgBilling?: OrgBillingInfo | null;
}) {
  const { dir } = useI18n();
  const [view, setView] = useState<CrmView>("pipeline");
  const [contacts, setContacts] = useState<ContactRow[]>(initialContacts);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [editDocRow, setEditDocRow] = useState<IssuedDocRow | null>(null);
  const [previewDocRow, setPreviewDocRow] = useState<IssuedDocRow | null>(null);

  const refreshContacts = useCallback(async () => {
    try {
      const res = await fetch("/api/crm/contacts");
      if (!res.ok) return;
      const data = await res.json();
      if (data.contacts) setContacts(data.contacts);
    } catch {
      /* silent */
    }
  }, []);

  const [search, setSearch] = useState("");
  const [matchedIds, setMatchedIds] = useState<string[] | null>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterProject, setFilterProject] = useState("");

  const [addProjOpen, setAddProjOpen] = useState(false);
  const [projName, setProjName] = useState("");
  const [projFrom, setProjFrom] = useState("");
  const [projTo, setProjTo] = useState("");
  const [projActive, setProjActive] = useState(true);
  const [savingProj, setSavingProj] = useState(false);
  const [projErr, setProjErr] = useState<string | null>(null);

  const totalPipeline = contacts
    .filter((c) => c.status !== "CLOSED_LOST")
    .reduce((s, c) => s + (c.value ?? 0), 0);
  const wonTotal = contacts.filter((c) => c.status === "CLOSED_WON").reduce((s, c) => s + (c.value ?? 0), 0);
  const closedAll = contacts.filter((c) => c.status === "CLOSED_WON" || c.status === "CLOSED_LOST").length;
  const wonCount = contacts.filter((c) => c.status === "CLOSED_WON").length;
  const winRate = closedAll > 0 ? Math.round((wonCount / closedAll) * 100) : null;
  const activeCount = contacts.filter((c) => c.status === "ACTIVE" || c.status === "PROPOSAL").length;

  const filteredContacts = useMemo(() => {
    let list = contacts;
    if (matchedIds !== null) {
      list = list.filter((c) => matchedIds.includes(c.id));
    }
    if (filterStatus) list = list.filter((c) => c.status === filterStatus);
    if (filterProject) list = list.filter((c) => c.project?.id === filterProject);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.email ?? "").toLowerCase().includes(q) ||
          (c.phone ?? "").toLowerCase().includes(q) ||
          (c.project?.name ?? "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [contacts, filterStatus, filterProject, search, matchedIds]);

  const handleStatusChange = (id: string, status: StatusKey) => {
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    startTransition(async () => {
      const r = await updateContactStatusAction(id, status);
      if (!r.ok) {
        setMsg(r.error ?? "שגיאה בעדכון");
        setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, status: c.status } : c)));
      } else {
        void refreshContacts();
      }
    });
  };

  const saveProject = async () => {
    if (!projName.trim()) {
      setProjErr("שם התיק חובה");
      return;
    }
    setSavingProj(true);
    setProjErr(null);
    const fd = new FormData();
    fd.set("name", projName);
    if (projFrom) fd.set("activeFrom", projFrom);
    if (projTo) fd.set("activeTo", projTo);
    if (projActive) fd.set("isActive", "on");
    const r = await createProjectAction(fd);
    setSavingProj(false);
    if (r.ok) {
      setMsg("✔ פרויקט נפתח");
      setAddProjOpen(false);
      setProjName("");
      setProjFrom("");
      setProjTo("");
      setProjActive(true);
    } else {
      setProjErr(r.error ?? "שגיאה");
    }
  };

  const handleDeleteProject = (pid: string, name: string) => {
    if (!confirm(`למחוק את "${name}" לגמרי?`)) return;
    startTransition(async () => {
      const r = await deleteProjectAction(pid);
      setMsg(r.ok ? "✔ נמחק בהצלחה" : (r.error ?? "שגיאה"));
    });
  };

  if (!hasOrganization) {
    return (
      <div className="space-y-8 p-6 md:p-10" dir={dir}>
        <div className="card-avenue rounded-3xl p-8">
          <div className="flex items-start gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/30">
              <Shield size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black italic text-slate-900">לא הוגדרה ישות לחיוב</h2>
              <p className="mt-2 max-w-lg text-sm font-medium leading-relaxed text-slate-500">
                מערכת הלקוחות משולבת יד ביד עם כלי מיסוי וחשבוניות. לפני שתוכלו לנהל תיקים, יש להקים ארגון או עסק באזור ההנהלה תחת
                ההגדרות.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col gap-6 pb-20" dir="rtl">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-surface-white px-6 py-6 shadow-sm md:px-8">
        <div className="absolute inset-y-0 start-0 w-2 bg-gradient-to-b from-blue-500 to-sky-400" />
        <div className="mx-auto flex max-w-[1500px] flex-col justify-between gap-6 xl:flex-row xl:items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-widest text-blue-700 shadow-sm">
              <Zap size={13} className="fill-amber-500 text-amber-500" /> Work OS + CRM
            </span>
            <h1 className="mt-3 text-3xl font-black italic text-slate-900 drop-shadow-sm">מרחב עבודה וניהול לקוחות</h1>
            <p className="mt-1 text-sm font-medium text-slate-500">פאנלים, פרויקטים, תקציבים ואוטומציות במקום אחד.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1 shadow-inner">
              <button
                type="button"
                onClick={() => setView("pipeline")}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all ${
                  view === "pipeline" ? "border border-slate-200 bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <LayoutGrid size={16} className={view === "pipeline" ? "text-blue-500" : ""} /> לוח אינטראקטיבי
              </button>
              <button
                type="button"
                onClick={() => setView("list")}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all ${
                  view === "list" ? "border border-slate-200 bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <List size={16} className={view === "list" ? "text-blue-500" : ""} /> תצוגת טבלה
              </button>
              <button
                type="button"
                onClick={() => setView("projects")}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all ${
                  view === "projects" ? "border border-slate-200 bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Briefcase size={16} className={view === "projects" ? "text-blue-500" : ""} /> תיקי מאסטר
              </button>
              <button
                type="button"
                onClick={() => setView("automations")}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all ${
                  view === "automations" ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Sparkles size={16} className={view === "automations" ? "text-amber-300" : ""} /> אוטומציות
              </button>
            </div>

            <button type="button" onClick={() => setModal({ mode: "add" })} className="btn-primary flex items-center gap-2">
              <Plus size={18} /> כניסה חדשה ללוח
            </button>
          </div>
        </div>
      </section>

      <div className="flex-1 overflow-visible px-0 py-0">
        <div className="mx-auto max-w-[1500px] space-y-6">
          {msg && (
            <div
              className={`flex items-center gap-3 rounded-2xl px-5 py-4 text-sm font-bold shadow-sm ${
                msg.includes("✔")
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border border-rose-200 bg-rose-50 text-rose-800"
              }`}
            >
              <p className="flex-1">{msg}</p>
              <button type="button" onClick={() => setMsg(null)} className="opacity-70 hover:opacity-100">
                <X size={18} />
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="card-avenue rounded-2xl p-5">
              <div className="mb-2 flex items-center gap-2.5">
                <div className="rounded-lg bg-slate-100 p-1.5">
                  <Users size={16} className="text-slate-600" />
                </div>
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">סה״כ אובייקטים</p>
              </div>
              <p className="text-3xl font-black leading-none text-slate-900">{contacts.length}</p>
              <p className="mt-2 text-xs font-bold text-slate-400">
                {contacts.filter((c) => c.status === "LEAD").length} ממתינים לטיפול ראשוני
              </p>
            </div>
            <div className="card-avenue rounded-2xl p-5">
              <div className="mb-2 flex items-center gap-2.5">
                <div className="rounded-lg bg-blue-100 p-1.5">
                  <TrendingUp size={16} className="text-blue-600" />
                </div>
                <p className="text-[11px] font-black uppercase tracking-widest text-blue-700">פייפליין פעיל</p>
              </div>
              <p className="text-3xl font-black leading-none text-blue-700">{activeCount}</p>
              <div className="mt-2 inline-flex items-center rounded border border-blue-100 bg-blue-50 px-2 py-0.5 text-xs font-black text-blue-600">
                צפי {totalPipeline > 0 ? fmtMoney(totalPipeline) : "₪0"}
              </div>
            </div>
            <div className="card-avenue rounded-2xl p-5">
              <div className="mb-2 flex items-center gap-2.5">
                <div className="rounded-lg bg-emerald-100 p-1.5">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                </div>
                <p className="text-[11px] font-black uppercase tracking-widest text-emerald-700">חשבונות שנסגרו</p>
              </div>
              <p className="text-3xl font-black leading-none text-emerald-700">{wonCount}</p>
              <div className="mt-2 inline-flex items-center rounded border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-xs font-black text-emerald-600">
                שורת רווח {wonTotal > 0 ? fmtMoney(wonTotal) : "₪0"}
              </div>
            </div>
            <div className="card-avenue rounded-2xl p-5">
              <div className="mb-2 flex items-center gap-2.5">
                <div className="rounded-lg bg-sky-100 p-1.5">
                  <BarChart2 size={16} className="text-sky-600" />
                </div>
                <p className="text-[11px] font-black uppercase tracking-widest text-sky-700">אחוז המרה סופי</p>
              </div>
              <p className="text-3xl font-black leading-none text-sky-700">{winRate != null ? `${winRate}%` : "—"}</p>
              <p className="mt-2 text-xs font-bold text-slate-400">מתוך {closedAll} תהליכים שהוקפאו או נסגרו</p>
            </div>
          </div>

          {view === "automations" && (
            <div className="relative overflow-hidden rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
              <div className="absolute inset-0 translate-y-10 scale-150 rounded-full bg-blue-500/5 blur-3xl" />
              <div className="relative z-10 flex flex-col items-center">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-xl shadow-blue-900/10">
                  <Sparkles size={36} className="text-blue-500" />
                </div>
                <h2 className="mb-2 text-3xl font-black italic text-slate-900">אוטומציות עבודה Workflow Builders</h2>
                <p className="mb-8 max-w-xl text-base font-medium leading-relaxed text-slate-500">
                  כאן תוכלו לבנות חוקים עסקיים חכמים ללא קוד (No Code). לדוגמה: &quot;כאשר לקוח עובר לסטטוס בקשת הצעת מחיר, שלח לו
                  מייל אוטומטי, והוסף תזכורת למנהל תיק הלקוח בעוד יומיים.&quot;
                </p>
                <button className="btn-secondary pointer-events-none border-slate-200 px-6 py-3 text-sm opacity-50">
                  סביבת האוטומציות נמצאת בפיתוח עבור גרסת BSD-YBM.
                </button>
              </div>
            </div>
          )}

          {view === "pipeline" && (
            <div className="flex snap-x gap-4 overflow-x-auto pb-6" style={{ minHeight: 450 }}>
              {STATUS_COLUMNS.map((col) => {
                const colContacts = contacts.filter((c) => c.status === col.key);
                const colValue = colContacts.reduce((s, c) => s + (c.value ?? 0), 0);
                return (
                  <div key={col.key} className="flex w-[280px] min-w-[280px] shrink-0 snap-start flex-col">
                    <div className="sticky top-0 z-10 mb-3 rounded-t-2xl border border-b-4 border-slate-200 bg-slate-100/50 px-4 py-3 backdrop-blur-xl">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="inline-flex items-center gap-2 text-sm font-black">
                          <span className={`flex h-4 w-4 items-center justify-center rounded shadow-sm ${col.bg}`}>
                            <GripHorizontal size={10} className="text-white opacity-50" />
                          </span>
                          <span className="text-slate-800">{col.label}</span>
                        </span>
                        <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-black text-slate-500 shadow-sm">
                          {colContacts.length}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        {colValue > 0 ? (
                          <p className="text-[11px] font-bold text-slate-500">{fmtMoney(colValue)} מחושב</p>
                        ) : (
                          <p className="text-[10px] text-transparent hover:text-slate-300">₪0</p>
                        )}
                        <button
                          type="button"
                          onClick={() => setModal({ mode: "add", defaultStatus: col.key })}
                          className="text-slate-400 hover:text-blue-600"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="flex min-h-[100px] flex-1 flex-col gap-3 rounded-b-2xl border border-transparent bg-slate-50/50 p-2 transition-colors hover:border-slate-200">
                      {colContacts.map((c) => (
                        <CrmContactCard
                          key={c.id}
                          contact={c}
                          onEdit={(row) => setModal({ mode: "edit", contact: row })}
                          onStatusChange={handleStatusChange}
                        />
                      ))}
                      {!colContacts.length && (
                        <div className="rounded-xl border border-dashed border-slate-300 bg-white/50 py-6 text-center text-xs font-medium text-slate-400">
                          ריק כרגע
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {view === "list" && (
            <div className="card-avenue overflow-hidden rounded-3xl">
              <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                <div className="relative min-w-[300px] flex-1">
                  <SemanticSearchBar
                    onResults={(ids) => {
                      setMatchedIds(ids);
                    }}
                    placeholder="חיפוש חכם (למשל: לקוחות שחייבים כסף)..."
                  />
                </div>
                <div className="relative">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white py-2.5 ps-4 pe-8 text-sm font-bold text-slate-600 shadow-sm outline-none focus:ring-4 focus:ring-blue-500/10"
                  >
                    <option value="">כל הסטטוסים</option>
                    {STATUS_COLUMNS.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="relative">
                  <select
                    value={filterProject}
                    onChange={(e) => setFilterProject(e.target.value)}
                    className="cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white py-2.5 ps-4 pe-8 text-sm font-bold text-slate-600 shadow-sm outline-none focus:ring-4 focus:ring-blue-500/10"
                  >
                    <option value="">סינון לפי פרויקט אב</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  className="flex cursor-not-allowed items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 opacity-60 shadow-sm"
                  title="יוסף באוטומציות הבאות"
                >
                  <Plus size={14} /> עמודה חדשה
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-start text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      {[
                        "שם מלא או ארגון",
                        "סטטוס התקדמות",
                        "שיוך פרויקט",
                        "צפי כספי",
                        "טלפון נייד",
                        "דוא״ל / חשבון",
                        "תאריך הצטרפות",
                        "פעולות",
                      ].map((h) => (
                        <th
                          key={h}
                          className="w-auto border-e border-slate-200/50 px-5 py-4 text-start text-[11px] font-black uppercase tracking-widest text-slate-500"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredContacts.map((c) => {
                      const meta = statusMeta(c.status);
                      return (
                        <tr key={c.id} className="group transition-colors hover:bg-blue-50/50">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black text-white shadow-sm"
                                style={{ backgroundColor: avatarColor(c.id) }}
                              >
                                {initials(c.name)}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900">{c.name}</p>
                                {c.notes && <p className="max-w-[150px] truncate text-[10px] text-slate-400">{c.notes}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <div
                              className={`inline-flex w-full cursor-pointer items-center justify-center rounded-md py-1.5 text-[10px] font-black uppercase tracking-wide shadow-sm ${meta.bg} ${meta.text}`}
                            >
                              {meta.label}
                            </div>
                          </td>
                          <td className="px-5 py-3 text-xs font-medium text-slate-600">{c.project?.name ?? "—"}</td>
                          <td className="bg-slate-50/50 px-5 py-3 text-xs font-black text-slate-900 tabular-nums">
                            {c.value != null ? fmtMoney(c.value) : "—"}
                          </td>
                          <td className="px-5 py-3 font-mono text-xs font-medium text-slate-600" dir="ltr">
                            {c.phone ?? "—"}
                          </td>
                          <td className="max-w-[150px] truncate px-5 py-3 text-xs font-medium text-slate-600" dir="ltr">
                            {c.email ?? "—"}
                          </td>
                          <td className="px-5 py-3 text-[11px] font-bold text-slate-400">{fmtDate(c.createdAt)}</td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setModal({ mode: "edit", contact: c })}
                                className="btn-secondary border-slate-200 py-1 text-xs"
                              >
                                מאפיינים / כרטיס
                              </button>
                              {c.status === "CLOSED_WON" && (
                                <Link
                                  href={`/app/documents/issue?client=${encodeURIComponent(c.name)}&contactId=${c.id}`}
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm transition hover:bg-blue-700"
                                >
                                  <ReceiptText size={12} /> חשבונית
                                </Link>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filteredContacts.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <Users size={48} className="mb-4 opacity-20" />
                    <p className="text-base font-bold">
                      {search || filterStatus || filterProject ? "אין תוצאות בסינון המבוקש" : "עדיין אין נתונים בטבלה זו"}
                    </p>
                    <button
                      type="button"
                      onClick={() => setModal({ mode: "add" })}
                      className="mt-4 flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm"
                    >
                      <UserPlus size={16} /> הוספת רשומה ראשונה
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {view === "projects" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-black uppercase tracking-widest text-slate-500">{projects.length} תיקי מאסטר פתוחים</p>
                <button
                  type="button"
                  onClick={() => setAddProjOpen((v) => !v)}
                  className="btn-secondary flex items-center gap-2 border-slate-200 bg-white shadow-sm"
                >
                  <FolderPlus size={16} /> יצירת פרויקט אב
                </button>
              </div>

              {addProjOpen && (
                <div className="card-avenue relative space-y-4 overflow-hidden rounded-3xl p-6 md:p-8">
                  <div className="absolute end-0 top-0 h-40 w-40 rounded-full bg-blue-500/5 blur-3xl" />
                  <p className="border-b border-slate-100 pb-3 text-lg font-black italic text-slate-900">הקמת פרויקט אב חדש</p>
                  {projErr && <p className="rounded bg-rose-50 p-2 text-xs font-bold text-rose-700">{projErr}</p>}

                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">הגדרת שם פנים-ארגוני</label>
                    <input
                      value={projName}
                      onChange={(e) => setProjName(e.target.value)}
                      placeholder="שם מזוהה (למשל: סניף תל אביב Q3)"
                      className={crmInputCls}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-[10px] font-black uppercase text-slate-400">לוח זמנים לתחילת ביצוע (Gantt)</label>
                      <input type="date" value={projFrom} onChange={(e) => setProjFrom(e.target.value)} className={crmInputCls} />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-black uppercase text-slate-400">צפי סיום</label>
                      <input type="date" value={projTo} onChange={(e) => setProjTo(e.target.value)} className={crmInputCls} />
                    </div>
                  </div>

                  <label className="flex w-fit cursor-pointer items-center gap-3 pt-2 text-sm font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={projActive}
                      onChange={(e) => setProjActive(e.target.checked)}
                      className="h-5 w-5 rounded border-slate-300 accent-blue-600"
                    />
                    סמן את פרויקט האב כפעיל מידית ופתח שעון זמן
                  </label>

                  <div className="flex gap-3 border-t border-slate-100 pt-4">
                    <button type="button" onClick={() => void saveProject()} disabled={savingProj} className="btn-primary px-6 py-2.5 shadow-lg shadow-blue-500/20">
                      {savingProj ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} יצירה ושמירה למסד נתונים
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddProjOpen(false)}
                      className="rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-slate-50"
                    >
                      ביטול
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {projects.map((p) => {
                  const pContacts = contacts.filter((c) => c.project?.id === p.id);
                  const pValue = pContacts.reduce((s, c) => s + (c.value ?? 0), 0);
                  return (
                    <div key={p.id} className={`card-avenue rounded-3xl p-6 ${p.isActive ? "" : "border-dashed bg-slate-50 opacity-75"}`}>
                      <div className="mb-4 flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 shadow-sm">
                            <Briefcase size={20} />
                          </div>
                          <div>
                            <p className="text-lg font-black italic text-slate-900">{p.name}</p>
                            <span
                              className={`mt-1 inline-block rounded px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${
                                p.isActive
                                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : "border border-slate-300 bg-slate-200 text-slate-600"
                              }`}
                            >
                              {p.isActive ? "סטטוס רץ" : "מוקפא ע״י הנהלה"}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteProject(p.id, p.name)}
                          className="rounded-lg border border-transparent p-2 text-slate-300 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {p.activeFrom || p.activeTo ? (
                        <div className="mb-4 flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 p-2 text-xs font-medium text-slate-500">
                          <Calendar size={14} className="text-blue-500" /> {formatRange(p.activeFrom, p.activeTo)}
                        </div>
                      ) : (
                        <div className="mb-4 h-6" />
                      )}

                      <div className="mb-2 flex items-center justify-between border-t border-slate-100 pt-4">
                        <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                          <strong className="text-base text-slate-800">{pContacts.length}</strong> לקוחות מקושרים
                        </p>
                        {pValue > 0 && (
                          <p className="rounded-lg border border-blue-100 bg-blue-50 px-2 py-0.5 text-lg font-black text-blue-700">
                            {fmtMoney(pValue)}
                          </p>
                        )}
                      </div>

                      {pContacts.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5 pb-4">
                          {STATUS_COLUMNS.map((s) => {
                            const n = pContacts.filter((c) => c.status === s.key).length;
                            if (!n) return null;
                            return (
                              <span
                                key={s.key}
                                className={`rounded-md px-2 py-1 text-[10px] font-black tracking-wide shadow-sm opacity-90 ${s.bg} ${s.text}`}
                              >
                                {s.label}: {n}
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {orgBilling && (
                        <div className="mt-auto border-t border-slate-100 pt-4">
                          <LazyProjectDocumentBox
                            projectId={p.id}
                            org={orgBilling}
                            companyType={orgBilling.companyType}
                            isReportable={orgBilling.isReportable}
                            onEditDoc={setEditDocRow}
                            onPreviewDoc={setPreviewDocRow}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
                {projects.length === 0 && (
                  <div className="col-span-full flex flex-col items-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 py-20 text-slate-400">
                    <Briefcase size={48} className="mb-4 text-blue-500 opacity-20" />
                    <p className="text-lg font-bold text-slate-600">אין פרויקטים להצגה</p>
                    <p className="mt-1 text-sm font-medium">צרו פרויקט ראשון כדי להתחיל לעבוד בצורה היררכית כמו בארגוני ענק.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {organizations.length > 0 && (
            <section className="relative mt-12 space-y-5 border-t border-slate-200 pt-8">
              <div className="absolute start-1/2 top-0 -translate-x-1/2 -translate-y-1/2 bg-surface-white px-4">
                <Shield className="text-slate-300" size={24} />
              </div>
              <div className="flex items-center gap-3">
                <h2 className="flex items-center gap-2 text-2xl font-black italic text-slate-900">
                  <LayoutGrid className="text-blue-600" size={24} /> סביבת אדמיניסטרציה לארגונים
                </h2>
                <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-rose-700 shadow-sm">
                  צומת ניהול חברה
                </span>
              </div>
              <CrmOrganizationsAdminTable organizations={organizations} showUnifiedBillingLinks={showUnifiedBillingLinks} />
            </section>
          )}
        </div>
      </div>

      {modal && (
        <CrmContactModal
          state={modal}
          projects={projects}
          onClose={() => setModal(null)}
          onSaved={(m) => {
            setMsg(m);
            void refreshContacts();
          }}
        />
      )}

      {editDocRow && orgBilling && (
        <LazyEditIssuedDocumentModal
          doc={editDocRow}
          companyType={orgBilling.companyType}
          isReportable={orgBilling.isReportable}
          onClose={() => setEditDocRow(null)}
          onSaved={() => setEditDocRow(null)}
        />
      )}

      {previewDocRow && orgBilling && (
        <LazyDocumentPreviewModal doc={previewDocRow} org={orgBilling} onClose={() => setPreviewDocRow(null)} />
      )}
    </div>
  );
}
