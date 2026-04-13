"use client";

import { useState, useTransition, useMemo, useEffect, useCallback } from "react";
import {
  createContactAction,
  createProjectAction,
  deleteContactAction,
  updateContactAction,
  updateContactStatusAction,
  deleteProjectAction,
} from "@/app/actions/crm";
import Link from "next/link";
import {
  Plus,
  Trash2,
  FolderPlus,
  UserPlus,
  Edit3,
  LayoutGrid,
  Shield,
  X,
  ChevronDown,
  Search,
  Phone,
  Mail,
  StickyNote,
  DollarSign,
  TrendingUp,
  Users,
  CheckCircle2,
  Briefcase,
  Calendar,
  MoreVertical,
  BarChart2,
  List,
  Loader2,
  ReceiptText,
  Zap,
  Sparkles,
  Settings,
  GripHorizontal
} from "lucide-react";
import SemanticSearchBar from "@/components/ai/SemanticSearchBar";
import CrmOrganizationsAdminTable, {
  type CrmAdminOrganizationRow,
} from "./CrmOrganizationsAdminTable";
import { useI18n } from "@/components/I18nProvider";
import ProjectDocumentBox from "@/components/billing/ProjectDocumentBox";
import EditIssuedDocumentModal from "@/components/billing/EditIssuedDocumentModal";
import DocumentPreviewModal from "@/components/billing/DocumentPreviewModal";
import type { IssuedDocRow } from "@/components/billing/GlobalBillingPageClient";

/* ── ERP invoice type labels ── */
const DOC_TYPE_LABEL: Record<string, string> = {
  INVOICE: "חשבונית מס",
  RECEIPT: "קבלה",
  INVOICE_RECEIPT: "חשבונית מס/קבלה",
  CREDIT_NOTE: "זיכוי",
};

const DOC_STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "ממתין לתשלום", cls: "bg-amber-100 text-amber-800" },
  PAID:    { label: "שולם",         cls: "bg-emerald-100 text-emerald-800" },
  CANCELLED: { label: "מבוטל",      cls: "bg-slate-100 text-slate-500" },
};

/* ── Types ── */
export type InvoiceRow = {
  id: string;
  type: string;
  number: number;
  clientName: string;
  amount: number;
  vat: number;
  total: number;
  status: string;
  date: string;
  dueDate: string | null;
  items: { desc: string; qty: number; price: number }[];
  createdAt: string;
};

export type ErpSummary = {
  totalBilled: number;
  totalPaid: number;
  totalPending: number;
  invoiceCount: number;
};

export type OrgBillingInfo = {
  name: string;
  address: string | null;
  taxId: string | null;
  companyType: import("@prisma/client").CompanyType;
  isReportable: boolean;
};

type ContactRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  value: number | null;
  status: string;
  project: { id: string; name: string } | null;
  createdAt: string;
  issuedDocuments?: InvoiceRow[];
  erp?: ErpSummary;
};

type ProjectRow = {
  id: string;
  name: string;
  isActive: boolean;
  activeFrom: string | null;
  activeTo: string | null;
};

type View = "pipeline" | "list" | "projects" | "automations";

/* ── Constants: Monday.com Style Statuses ── */
const STATUS_COLUMNS = [
  { key: "LEAD",        label: "ליד חדש",    bg: "bg-sky-500", text: "text-white", border: "border-sky-600", dot: "bg-sky-200" },
  { key: "ACTIVE",      label: "בתהליך",    bg: "bg-blue-600", text: "text-white", border: "border-blue-700", dot: "bg-blue-200" },
  { key: "PROPOSAL",    label: "הצעת מחיר", bg: "bg-violet-500", text: "text-white", border: "border-violet-600", dot: "bg-violet-200" },
  { key: "CLOSED_WON",  label: "נסגר בהצלחה", bg: "bg-emerald-500", text: "text-white", border: "border-emerald-600", dot: "bg-emerald-200" },
  { key: "CLOSED_LOST", label: "לא רלוונטי",  bg: "bg-rose-500", text: "text-white", border: "border-rose-600", dot: "bg-rose-200" },
] as const;

type StatusKey = (typeof STATUS_COLUMNS)[number]["key"];

const inputCls =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-400 transition-all";

function statusMeta(s: string) {
  return STATUS_COLUMNS.find((c) => c.key === s) ?? STATUS_COLUMNS[0];
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

function fmtMoney(v: number) {
  return `₪${v.toLocaleString("he-IL", { maximumFractionDigits: 0 })}`;
}

function formatRange(from: string | null, to: string | null): string {
  if (!from && !to) return "";
  const a = from
    ? new Date(from).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "2-digit" })
    : "—";
  const b = to
    ? new Date(to).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "2-digit" })
    : "עתיד";
  return `${a} – ${b}`;
}

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

const AVATAR_COLORS = ["#2563EB","#0ea5e9","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899","#14b8a6"];
function avatarColor(id: string) {
  let h = 5381;
  for (let i = 0; i < id.length; i++) h = ((h << 5) + h) + id.charCodeAt(i);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

/* ── Modals & Quick Add ── */
type ModalMode = "add" | "edit";
type ModalState = { mode: ModalMode; contact?: ContactRow; defaultStatus?: StatusKey };

function ContactModal({
  state,
  projects,
  onClose,
  onSaved,
}: {
  state: ModalState;
  projects: ProjectRow[];
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const isEdit = state.mode === "edit";
  const c = state.contact;

  const [name, setName] = useState(c?.name ?? "");
  const [email, setEmail] = useState(c?.email ?? "");
  const [phone, setPhone] = useState(c?.phone ?? "");
  const [status, setStatus] = useState<StatusKey>((c?.status as StatusKey) ?? state.defaultStatus ?? "LEAD");
  const [projectId, setProjectId] = useState(c?.project?.id ?? "");
  const [value, setValue] = useState(c?.value != null ? String(c.value) : "");
  const [notes, setNotes] = useState(c?.notes ?? "");
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [erpLoading, setErpLoading] = useState(false);
  const [invoices, setInvoices] = useState<InvoiceRow[]>(c?.issuedDocuments ?? []);
  const [erpMsg, setErpMsg] = useState<string | null>(null);

  const loadErpInvoices = useCallback(async () => {
    if (!c?.id) return;
    setErpLoading(true);
    try {
      const res = await fetch(`/api/crm/contacts/${c.id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.contact?.issuedDocuments) setInvoices(data.contact.issuedDocuments);
    } catch { /* silent */ } finally { setErpLoading(false); }
  }, [c?.id]);

  useEffect(() => { loadErpInvoices(); }, [loadErpInvoices]);

  const markInvoice = async (invId: string, status: string) => {
    setErpMsg(null);
    try {
      const res = await fetch(`/api/erp/issued-documents/${invId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      setInvoices(prev => prev.map(i => i.id === invId ? { ...i, status } : i));
      setErpMsg(`✔ חשבונית עודכנה`);
    } catch { setErpMsg("שגיאת עדכון"); }
  };

  const submit = () => {
    if (!name.trim()) { setErr("שם הלקוח שדה חובה"); return; }
    setErr(null);
    startTransition(async () => {
      if (isEdit && c) {
        const r = await updateContactAction({ contactId: c.id, name, email, phone, status, projectId, value, notes });
        if (r.ok) { onSaved("✔ הרשומה עודכנה"); onClose(); }
        else setErr(r.error ?? "שגיאה");
      } else {
        const fd = new FormData();
        fd.set("name", name); fd.set("email", email); fd.set("phone", phone);
        fd.set("status", status);
        if (projectId) fd.set("projectId", projectId);
        if (value) fd.set("value", value);
        fd.set("notes", notes);
        const r = await createContactAction(fd);
        if (r.ok) { onSaved("✔ הרשומה נוצרה"); onClose(); }
        else setErr(r.error ?? "שגיאה");
      }
    });
  };

  const deleteContact = () => {
    if (!c) return;
    if (!confirm(`למחוק את "${c.name}"?`)) return;
    startTransition(async () => {
      const r = await deleteContactAction(c.id);
      if (r.ok) { onSaved("✔ נמחק"); onClose(); }
      else setErr(r.error ?? "שגיאה");
    });
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-blue-900/10">
        <div className="flex items-center justify-between border-b border-slate-100 px-8 py-6">
          <div className="flex items-center gap-4">
            {isEdit ? (
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl text-white text-base font-black shadow-sm"
                style={{ backgroundColor: avatarColor(c?.id ?? "") }}
              >
                {initials(c?.name ?? "ללק")}
              </div>
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm border border-blue-700">
                <UserPlus size={20} />
              </div>
            )}
            <div>
              <p className="text-xl font-black italic text-slate-900">{isEdit ? "עריכת לקוח / שותף" : "יצירת כרטיס חדש"}</p>
              {isEdit && c && <p className="text-xs text-slate-400 font-medium">נוצר ב- {fmtDate(c.createdAt)}</p>}
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition">
            <X size={20} />
          </button>
        </div>

        <div className="px-8 py-6 space-y-4 max-h-[65vh] overflow-y-auto">
          {err && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 shadow-sm">{err}</div>
          )}
          
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1.5">השם המלא *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="שם חברה / פרטי" className={inputCls} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1.5">דואר אלקטרוני</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="mail@example.com" className={inputCls} dir="ltr" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1.5">טלפון נייד</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="050-0000000" className={inputCls} dir="ltr" />
            </div>
          </div>
          
          {/* Custom Fields concept */}
          <div className="rounded-2xl border border-dashed border-slate-200 p-4 bg-slate-50/50">
             <div className="flex items-center gap-2 mb-3">
                <Settings size={14} className="text-slate-400" />
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">שדות מערכת מותאמים</p>
             </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1.5">סטטוס תהליך</label>
                <div className="relative">
                  <select value={status} onChange={e => setStatus(e.target.value as StatusKey)} className={inputCls + " appearance-none"}>
                    {STATUS_COLUMNS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                  <ChevronDown size={14} className="pointer-events-none absolute end-4 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1.5">פוטנציאל עסקי (₪)</label>
                <input type="number" min="0" step="100" value={value} onChange={e => setValue(e.target.value)} placeholder="0" className={inputCls + " font-bold text-blue-700"} />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1.5">שיוך לתיק פרויקט</label>
            <div className="relative">
              <select value={projectId} onChange={e => setProjectId(e.target.value)} className={inputCls + " appearance-none bg-white"}>
                <option value="">— ללא שיוך —</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}{!p.isActive ? " (בארכיון)" : ""}</option>)}
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute end-4 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1.5">הערות ותקציר לקוח (AI יסכם)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="הערות אישיות..." rows={3} className={inputCls + " resize-none"} />
          </div>

          {/* ERP Integration details */}
          {isEdit && (
            <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-blue-100 pb-2">
                <p className="text-xs font-black uppercase text-blue-700 flex items-center gap-2">
                  <ReceiptText size={15} /> היסטוריית חשבוניות ERP
                  {erpLoading && <Loader2 size={13} className="animate-spin text-blue-500" />}
                </p>
                <Link
                  href={`/dashboard/erp/invoice?client=${encodeURIComponent(c?.name ?? "")}&contactId=${c?.id ?? ""}`}
                  className="font-bold text-blue-600 hover:text-blue-800 transition flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-blue-200 shadow-sm text-[11px]"
                >
                  <Plus size={12}/> הפק חשבונית חדשה
                </Link>
              </div>
              {erpMsg && <p className="text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded">{erpMsg}</p>}
              
              {invoices.length === 0 ? (
                <p className="text-sm font-medium text-slate-500 text-center py-4">אין חשבוניות כרגע המשויכות ללקוח זה באמצעות ה-ERP שלנו.</p>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center bg-white rounded-xl p-3 border border-slate-200 shadow-sm">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">סה״כ לתשלום</p>
                      <p className="text-base font-black text-slate-900 mt-1">{fmtMoney(invoices.reduce((s, i) => s + i.total, 0))}</p>
                    </div>
                    <div className="text-center bg-white rounded-xl p-3 border border-slate-200 shadow-sm">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">סך ששולם</p>
                      <p className="text-base font-black text-emerald-600 mt-1">{fmtMoney(invoices.filter(i => i.status === "PAID").reduce((s, i) => s + i.total, 0))}</p>
                    </div>
                    <div className="text-center bg-white rounded-xl p-3 border border-slate-200 shadow-sm">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">יתרת חוב</p>
                      <p className="text-base font-black text-rose-600 mt-1">{fmtMoney(invoices.filter(i => i.status === "PENDING").reduce((s, i) => s + i.total, 0))}</p>
                    </div>
                  </div>
                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                    {invoices.map(inv => {
                      const stMeta = DOC_STATUS_LABEL[inv.status] ?? DOC_STATUS_LABEL.PENDING;
                      return (
                        <div key={inv.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[11px] font-black text-slate-700">{DOC_TYPE_LABEL[inv.type] ?? inv.type} #{inv.number}</span>
                              <span className={`text-[10px] font-bold rounded-md px-2 py-0.5 ${stMeta.cls}`}>{stMeta.label}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm font-black text-slate-900">{fmtMoney(inv.total)}</span>
                              <span className="text-[11px] text-slate-500 font-medium">{fmtDate(inv.date ?? inv.createdAt)}</span>
                            </div>
                          </div>
                          {inv.status === "PENDING" && (
                            <div className="flex flex-col gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => markInvoice(inv.id, "PAID")}
                                className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1 text-[10px] font-black text-emerald-700 hover:bg-emerald-100 transition shadow-sm"
                              >
                                דווח כשולם
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-8 py-5">
          <div className="flex items-center gap-2">
            {isEdit && (
              <button type="button" onClick={deleteContact} disabled={pending} className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-xs font-bold text-rose-600 shadow-sm hover:bg-rose-50 transition disabled:opacity-50">
                <Trash2 size={15} /> מחק רשומה
              </button>
            )}
            {isEdit && c?.status === "CLOSED_WON" && (
              <Link
                href={`/dashboard/erp/invoice?client=${encodeURIComponent(c.name)}`}
                className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition shadow-sm"
              >
                <ReceiptText size={15} /> הפקת מסמך
              </Link>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition shadow-sm">
              ביטול
            </button>
            <button type="button" onClick={submit} disabled={pending} className="btn-primary flex items-center gap-2 py-2.5 shadow-lg shadow-blue-500/20">
              {pending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              {isEdit ? "שמור שינויים" : "צור רשומה"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Contact Card (Monday-style pipeline) ── */
function ContactCard({
  contact,
  onEdit,
  onStatusChange,
}: {
  contact: ContactRow;
  onEdit: (c: ContactRow) => void;
  onStatusChange: (id: string, status: StatusKey) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const meta = statusMeta(contact.status);

  return (
    <div
      className="group relative rounded-xl border border-slate-200 bg-white p-4 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer shadow-sm"
      onClick={() => onEdit(contact)}
    >
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white text-xs font-black shadow-sm"
            style={{ backgroundColor: avatarColor(contact.id) }}
          >
            {initials(contact.name)}
          </div>
          <div>
            <p className="text-sm font-black text-slate-900 leading-tight group-hover:text-blue-700 transition">{contact.name}</p>
            {contact.project && <p className="text-[11px] text-slate-400 font-medium mt-0.5">{contact.project.name}</p>}
          </div>
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v); }}
          className="opacity-0 group-hover:opacity-100 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition"
        >
          <MoreVertical size={16} />
        </button>
      </div>

      <div className="flex items-center justify-between gap-3 mb-2">
        {/* Monday style solid status badge */}
        <div 
          className={`flex-1 flex justify-center text-[11px] font-black tracking-wide py-1.5 rounded-md ${meta.bg} ${meta.text}`}
          onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v); }}
        >
          {meta.label}
        </div>
        
        {contact.value != null ? (
          <span className="text-xs font-black text-slate-800 bg-slate-100 border border-slate-200 rounded-md px-2.5 py-1.5 tabular-nums">
            {fmtMoney(contact.value)}
          </span>
        ) : (
           <span className="text-xs font-black text-slate-400 border border-dashed border-slate-200 rounded-md px-2.5 py-1.5 text-center w-14">—</span>
        )}
      </div>

      {(contact.email || contact.phone) && (
        <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
          {contact.phone && (
            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium" dir="ltr">
              <div className="bg-slate-100 p-1 rounded"><Phone size={10} className="text-slate-600"/></div> {contact.phone}
            </div>
          )}
          {contact.email && (
            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium truncate" dir="ltr">
              <div className="bg-slate-100 p-1 rounded"><Mail size={10} className="text-slate-600"/></div> {contact.email}
            </div>
          )}
        </div>
      )}

      {/* ERP badge */}
      {(contact.erp?.invoiceCount ?? 0) > 0 && (
        <div className="mt-4 flex items-center justify-between bg-blue-50/50 border border-blue-100 rounded-lg p-2">
           <div className="flex items-center gap-1.5 text-[10px] font-black text-blue-700">
             <ReceiptText size={12} />
             <span>{contact.erp!.invoiceCount} ח-ניות</span>
           </div>
          {contact.erp!.totalPending > 0 ? (
            <span className="rounded bg-amber-500 text-white px-1.5 py-0.5 text-[9px] font-bold">חוב {fmtMoney(contact.erp!.totalPending)}</span>
          ) : (
             <span className="rounded bg-emerald-500 text-white px-1.5 py-0.5 text-[9px] font-bold">הכל שולם</span>
          )}
        </div>
      )}

      {menuOpen && (
        <div
          className="absolute left-2 text-start top-12 z-20 min-w-[180px] rounded-xl border border-slate-200 bg-white shadow-xl shadow-black/10 py-2"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="px-3 py-1 mb-1 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">שינוי סטטוס</p>
          {STATUS_COLUMNS.map(s => (
            <button
              key={s.key}
              type="button"
              onClick={() => { onStatusChange(contact.id, s.key); setMenuOpen(false); }}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-xs font-bold hover:bg-slate-50 transition border-s-2 ${contact.status === s.key ? "border-blue-600 bg-blue-50 text-blue-800" : "border-transparent text-slate-700"}`}
            >
              <div className={`h-2.5 w-2.5 rounded-sm shadow-sm ${s.bg}`} /> {s.label}
            </button>
          ))}
          <div className="border-t border-slate-100 mt-2 pt-2">
            <button
              type="button"
              onClick={() => { onEdit(contact); setMenuOpen(false); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            >
              <Edit3 size={14} /> פתיחת כרטיס מלא
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main Component ── */
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
  const [view, setView] = useState<View>("pipeline");
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
    } catch { /* silent */ }
  }, []);

  // Filters
  const [search, setSearch] = useState("");
  const [matchedIds, setMatchedIds] = useState<string[] | null>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterProject, setFilterProject] = useState("");

  // Projects
  const [addProjOpen, setAddProjOpen] = useState(false);
  const [projName, setProjName] = useState("");
  const [projFrom, setProjFrom] = useState("");
  const [projTo, setProjTo] = useState("");
  const [projActive, setProjActive] = useState(true);
  const [savingProj, setSavingProj] = useState(false);
  const [projErr, setProjErr] = useState<string | null>(null);

  /* ── KPIs ── */
  const totalPipeline = contacts
    .filter(c => c.status !== "CLOSED_LOST")
    .reduce((s, c) => s + (c.value ?? 0), 0);
  const wonTotal = contacts
    .filter(c => c.status === "CLOSED_WON")
    .reduce((s, c) => s + (c.value ?? 0), 0);
  const closedAll = contacts.filter(c => c.status === "CLOSED_WON" || c.status === "CLOSED_LOST").length;
  const wonCount = contacts.filter(c => c.status === "CLOSED_WON").length;
  const winRate = closedAll > 0 ? Math.round((wonCount / closedAll) * 100) : null;
  const activeCount = contacts.filter(c => c.status === "ACTIVE" || c.status === "PROPOSAL").length;

  /* ── Filtered contacts ── */
  const filteredContacts = useMemo(() => {
    let list = contacts;
    if (matchedIds !== null) {
      list = list.filter(c => matchedIds.includes(c.id));
    }
    if (filterStatus) list = list.filter(c => c.status === filterStatus);
    if (filterProject) list = list.filter(c => c.project?.id === filterProject);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q) ||
        (c.phone ?? "").toLowerCase().includes(q) ||
        (c.project?.name ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [contacts, filterStatus, filterProject, search, matchedIds]);

  const handleStatusChange = (id: string, status: StatusKey) => {
    setContacts(prev => prev.map(c => c.id === id ? { ...c, status } : c));
    startTransition(async () => {
      const r = await updateContactStatusAction(id, status);
      if (!r.ok) {
        setMsg(r.error ?? "שגיאה בעדכון");
        setContacts(prev => prev.map(c => c.id === id ? { ...c, status: c.status } : c));
      } else {
        refreshContacts();
      }
    });
  };

  const saveProject = async () => {
    if (!projName.trim()) { setProjErr("שם התיק חובה"); return; }
    setSavingProj(true); setProjErr(null);
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
      setProjName(""); setProjFrom(""); setProjTo(""); setProjActive(true);
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
      <div className="p-6 md:p-10 space-y-8" dir={dir}>
        <div className="card-avenue rounded-3xl p-8">
          <div className="flex items-start gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/30">
              <Shield size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black italic text-slate-900">לא הוגדרה ישות לחיוב</h2>
              <p className="mt-2 text-sm text-slate-500 font-medium max-w-lg leading-relaxed">
                מערכת הלקוחות משולבת יד ביד עם כלי מיסוי וחשבוניות. לפני
                שתוכלו לנהל תיקים, יש להקים ארגון או עסק באזור ההנהלה תחת
                ההגדרות.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 min-h-screen pb-20" dir="rtl">

      {/* ── Header Area (2060 Enterprise Bento) ── */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-surface-white px-6 py-6 md:px-8 shadow-sm">
        <div className="absolute inset-y-0 start-0 w-2 bg-gradient-to-b from-blue-500 to-sky-400" />
        <div className="max-w-[1500px] mx-auto flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-1 text-[11px] font-black text-blue-700 tracking-widest border border-blue-100 shadow-sm uppercase">
              <Zap size={13} className="text-amber-500 fill-amber-500"/> Work OS + CRM
            </span>
            <h1 className="mt-3 text-3xl font-black italic text-slate-900 drop-shadow-sm">מרחב עבודה וניהול לקוחות</h1>
            <p className="text-sm text-slate-500 font-medium mt-1">פאנלים, פרויקטים, תקציבים ואוטומציות במקום אחד.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 shadow-inner">
              <button type="button" onClick={() => setView("pipeline")} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all ${view === "pipeline" ? "bg-white text-blue-700 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-800"}`}>
                <LayoutGrid size={16} className={view === "pipeline" ? "text-blue-500" : ""} /> לוח אינטראקטיבי
              </button>
              <button type="button" onClick={() => setView("list")} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all ${view === "list" ? "bg-white text-blue-700 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-800"}`}>
                <List size={16} className={view === "list" ? "text-blue-500" : ""} /> תצוגת טבלה
              </button>
              <button type="button" onClick={() => setView("projects")} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all ${view === "projects" ? "bg-white text-blue-700 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-800"}`}>
                <Briefcase size={16} className={view === "projects" ? "text-blue-500" : ""} /> תיקי מאסטר
              </button>
              <button type="button" onClick={() => setView("automations")} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all ${view === "automations" ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
                <Sparkles size={16} className={view === "automations" ? "text-amber-300" : ""} /> אוטומציות
              </button>
            </div>
            
            <button
              type="button"
              onClick={() => setModal({ mode: "add" })}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={18} /> כניסה חדשה ללוח
            </button>
          </div>
        </div>
      </section>

      <div className="flex-1 overflow-visible px-0 py-0">
        <div className="max-w-[1500px] mx-auto space-y-6">

          {msg && (
            <div className={`flex items-center gap-3 rounded-2xl px-5 py-4 text-sm font-bold shadow-sm ${msg.includes("✔") ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"}`}>
              <p className="flex-1">{msg}</p>
              <button type="button" onClick={() => setMsg(null)} className="opacity-70 hover:opacity-100"><X size={18} /></button>
            </div>
          )}

          {/* ── KPI Bento ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card-avenue rounded-2xl p-5">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="p-1.5 rounded-lg bg-slate-100"><Users size={16} className="text-slate-600" /></div>
                <p className="text-[11px] uppercase font-black text-slate-500 tracking-widest">סה״כ אובייקטים</p>
              </div>
              <p className="text-3xl font-black text-slate-900 leading-none">{contacts.length}</p>
              <p className="text-xs font-bold text-slate-400 mt-2">{contacts.filter(c => c.status === "LEAD").length} ממתינים לטיפול ראשוני</p>
            </div>
            <div className="card-avenue rounded-2xl p-5">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="p-1.5 rounded-lg bg-blue-100"><TrendingUp size={16} className="text-blue-600" /></div>
                <p className="text-[11px] uppercase font-black text-blue-700 tracking-widest">פייפליין פעיל</p>
              </div>
              <p className="text-3xl font-black text-blue-700 leading-none">{activeCount}</p>
              <div className="mt-2 inline-flex items-center bg-blue-50 px-2 py-0.5 rounded text-xs font-black text-blue-600 border border-blue-100">
                צפי {totalPipeline > 0 ? fmtMoney(totalPipeline) : "₪0"}
              </div>
            </div>
            <div className="card-avenue rounded-2xl p-5">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="p-1.5 rounded-lg bg-emerald-100"><CheckCircle2 size={16} className="text-emerald-600" /></div>
                <p className="text-[11px] uppercase font-black text-emerald-700 tracking-widest">חשבונות שנסגרו</p>
              </div>
              <p className="text-3xl font-black text-emerald-700 leading-none">{wonCount}</p>
              <div className="mt-2 inline-flex items-center bg-emerald-50 px-2 py-0.5 rounded text-xs font-black text-emerald-600 border border-emerald-100">
                 שורת רווח {wonTotal > 0 ? fmtMoney(wonTotal) : "₪0"}
              </div>
            </div>
            <div className="card-avenue rounded-2xl p-5">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="p-1.5 rounded-lg bg-sky-100"><BarChart2 size={16} className="text-sky-600" /></div>
                <p className="text-[11px] uppercase font-black text-sky-700 tracking-widest">אחוז המרה סופי</p>
              </div>
              <p className="text-3xl font-black text-sky-700 leading-none">{winRate != null ? `${winRate}%` : "—"}</p>
              <p className="text-xs font-bold text-slate-400 mt-2">מתוך {closedAll} תהליכים שהוקפאו או נסגרו</p>
            </div>
          </div>

          {/* ── AUTOMATIONS (FUTURE) ── */}
          {view === "automations" && (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center relative overflow-hidden">
               <div className="absolute inset-0 bg-blue-500/5 blur-3xl rounded-full translate-y-10 scale-150" />
               <div className="relative z-10 flex flex-col items-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-xl shadow-blue-900/10 border border-slate-200 mb-6">
                    <Sparkles size={36} className="text-blue-500" />
                  </div>
                  <h2 className="text-3xl font-black italic text-slate-900 mb-2">אוטומציות עבודה Workflow Builders</h2>
                  <p className="max-w-xl text-base font-medium text-slate-500 leading-relaxed mb-8">
                     כאן תוכלו לבנות חוקים עסקיים חכמים ללא קוד (No Code). לדוגמה:
                     &quot;כאשר לקוח עובר לסטטוס בקשת הצעת מחיר, שלח לו מייל אוטומטי, והוסף תזכורת למנהל תיק הלקוח בעוד יומיים.&quot;
                  </p>
                  <button className="btn-secondary pointer-events-none opacity-50 border-slate-200 px-6 py-3 text-sm">
                     סביבת האוטומציות נמצאת בפיתוח עבור גרסת BSD-YBM.
                  </button>
               </div>
            </div>
          )}

          {/* ── PIPELINE VIEW ── */}
          {view === "pipeline" && (
            <div className="flex gap-4 overflow-x-auto pb-6 snap-x" style={{ minHeight: 450 }}>
              {STATUS_COLUMNS.map((col) => {
                const colContacts = contacts.filter(c => c.status === col.key);
                const colValue = colContacts.reduce((s, c) => s + (c.value ?? 0), 0);
                return (
                  <div key={col.key} className="flex flex-col min-w-[280px] w-[280px] shrink-0 snap-start">
                    {/* Column Header */}
                    <div className="sticky top-0 z-10 rounded-t-2xl bg-slate-100/50 backdrop-blur-xl border border-slate-200 px-4 py-3 mb-3 border-b-4" style={{ borderBottomColor: col.bg.replace("bg-", "").split("-")[0] }}> 
                      {/* Fake border hack for styling, real Tailwind colors apply above */}
                      <div className="flex items-center justify-between mb-1">
                        <span className={`inline-flex items-center gap-2 text-sm font-black`}>
                           {/* Color pill instead of dot */}
                          <span className={`h-4 w-4 rounded shadow-sm flex items-center justify-center ${col.bg}`}>
                             <GripHorizontal size={10} className="text-white opacity-50" />
                          </span>
                          <span className="text-slate-800">{col.label}</span>
                        </span>
                        <span className="text-xs font-black text-slate-500 bg-white rounded-md px-2 py-0.5 shadow-sm border border-slate-200">
                          {colContacts.length}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        {colValue > 0 ? <p className="text-[11px] font-bold text-slate-500">{fmtMoney(colValue)} מחושב</p> : <p className="text-[10px] text-transparent hover:text-slate-300">₪0</p>}
                        <button onClick={() => setModal({ mode: "add", defaultStatus: col.key })} className="text-slate-400 hover:text-blue-600"><Plus size={14} /></button>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-3 flex-1 rounded-b-2xl bg-slate-50/50 p-2 min-h-[100px] border border-transparent hover:border-slate-200 transition-colors">
                      {colContacts.map(c => (
                        <ContactCard
                          key={c.id}
                          contact={c}
                          onEdit={c => setModal({ mode: "edit", contact: c })}
                          onStatusChange={handleStatusChange}
                        />
                      ))}
                      {!colContacts.length && (
                         <div className="text-center py-6 text-slate-400 text-xs font-medium border border-dashed border-slate-300 rounded-xl bg-white/50">
                           ריק כרגע
                         </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── LIST VIEW (Table with Custom Fields concept) ── */}
          {view === "list" && (
            <div className="card-avenue rounded-3xl overflow-hidden">
              <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-6 py-4 bg-slate-50/50">
                <div className="relative flex-1 min-w-[300px]">
                  <SemanticSearchBar 
                    onResults={(ids) => {
                       setMatchedIds(ids);
                    }} 
                    placeholder="חיפוש חכם (למשל: לקוחות שחייבים כסף)..."
                  />
                </div>
                <div className="relative">
                  <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="rounded-xl border border-slate-200 bg-white text-slate-600 py-2.5 ps-4 pe-8 text-sm font-bold appearance-none outline-none focus:ring-4 focus:ring-blue-500/10 shadow-sm cursor-pointer shadow-sm">
                    <option value="">כל הסטטוסים</option>
                    {STATUS_COLUMNS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                  <ChevronDown size={14} className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
                <div className="relative">
                  <select value={filterProject} onChange={e => setFilterProject(e.target.value)} className="rounded-xl border border-slate-200 bg-white text-slate-600 py-2.5 ps-4 pe-8 text-sm font-bold appearance-none outline-none focus:ring-4 focus:ring-blue-500/10 shadow-sm cursor-pointer shadow-sm">
                    <option value="">סינון לפי פרויקט אב</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <ChevronDown size={14} className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
                <button
                  type="button"
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 shadow-sm flex items-center gap-2 cursor-not-allowed opacity-60"
                  title="יוסף באוטומציות הבאות"
                >
                   <Plus size={14}/> עמודה חדשה
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-sm text-start">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      {["שם מלא או ארגון", "סטטוס התקדמות", "שיוך פרויקט", "צפי כספי", "טלפון נייד", "דוא״ל / חשבון", "תאריך הצטרפות", "פעולות"].map(h => (
                        <th key={h} className="px-5 py-4 text-start text-[11px] font-black uppercase tracking-widest text-slate-500 border-e border-slate-200/50 w-auto">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredContacts.map(c => {
                      const meta = statusMeta(c.status);
                      return (
                        <tr key={c.id} className="hover:bg-blue-50/50 transition-colors group">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white text-xs font-black shadow-sm"
                                style={{ backgroundColor: avatarColor(c.id) }}
                              >
                                {initials(c.name)}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900">{c.name}</p>
                                {c.notes && <p className="text-[10px] text-slate-400 truncate max-w-[150px]">{c.notes}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <div className={`inline-flex items-center justify-center text-[10px] font-black uppercase tracking-wide py-1.5 px-3 rounded-md w-full ${meta.bg} ${meta.text} shadow-sm cursor-pointer`}>
                               {meta.label}
                            </div>
                          </td>
                          <td className="px-5 py-3 text-xs font-medium text-slate-600">{c.project?.name ?? "—"}</td>
                          <td className="px-5 py-3 text-xs font-black text-slate-900 tabular-nums bg-slate-50/50">{c.value != null ? fmtMoney(c.value) : "—"}</td>
                          <td className="px-5 py-3 text-xs font-medium text-slate-600 font-mono" dir="ltr">{c.phone ?? "—"}</td>
                          <td className="px-5 py-3 text-xs font-medium text-slate-600 truncate max-w-[150px]" dir="ltr">{c.email ?? "—"}</td>
                          <td className="px-5 py-3 text-[11px] text-slate-400 font-bold">{fmtDate(c.createdAt)}</td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setModal({ mode: "edit", contact: c })}
                                className="btn-secondary py-1 text-xs border-slate-200"
                              >
                                מאפיינים / כרטיס
                              </button>
                              {c.status === "CLOSED_WON" && (
                                <Link
                                  href={`/dashboard/erp/invoice?client=${encodeURIComponent(c.name)}&contactId=${c.id}`}
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm hover:bg-blue-700 transition"
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
                    <p className="font-bold text-base">{search || filterStatus || filterProject ? "אין תוצאות בסינון המבוקש" : "עדיין אין נתונים בטבלה זו"}</p>
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

          {/* ── PROJECTS VIEW ── */}
          {view === "projects" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-black text-slate-500 uppercase tracking-widest">{projects.length} תיקי מאסטר פתוחים</p>
                <button
                  type="button"
                  onClick={() => setAddProjOpen(v => !v)}
                  className="btn-secondary flex items-center gap-2 shadow-sm border-slate-200 bg-white"
                >
                  <FolderPlus size={16} /> יצירת פרויקט אב
                </button>
              </div>

              {addProjOpen && (
                <div className="card-avenue rounded-3xl p-6 md:p-8 space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 end-0 h-40 w-40 bg-blue-500/5 blur-3xl rounded-full" />
                  <p className="text-lg font-black italic text-slate-900 border-b border-slate-100 pb-3">הקמת פרויקט אב חדש</p>
                  {projErr && <p className="text-xs font-bold text-rose-700 bg-rose-50 p-2 rounded">{projErr}</p>}
                  
                  <div>
                     <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1.5">הגדרת שם פנים-ארגוני</label>
                     <input value={projName} onChange={e => setProjName(e.target.value)} placeholder="שם מזוהה (למשל: סניף תל אביב Q3)" className={inputCls} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">לוח זמנים לתחילת ביצוע (Gantt)</label>
                      <input type="date" value={projFrom} onChange={e => setProjFrom(e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">צפי סיום</label>
                      <input type="date" value={projTo} onChange={e => setProjTo(e.target.value)} className={inputCls} />
                    </div>
                  </div>
                  
                  <label className="flex items-center gap-3 text-sm font-bold text-slate-700 cursor-pointer pt-2 w-fit">
                    <input type="checkbox" checked={projActive} onChange={e => setProjActive(e.target.checked)} className="h-5 w-5 rounded border-slate-300 accent-blue-600" />
                    סמן את פרויקט האב כפעיל מידית ופתח שעון זמן
                  </label>
                  
                  <div className="flex gap-3 pt-4 border-t border-slate-100">
                    <button type="button" onClick={saveProject} disabled={savingProj} className="btn-primary shadow-lg shadow-blue-500/20 py-2.5 px-6">
                      {savingProj ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} יצירה ושמירה למסד נתונים
                    </button>
                    <button type="button" onClick={() => setAddProjOpen(false)} className="rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition shadow-sm">
                      ביטול
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {projects.map(p => {
                  const pContacts = contacts.filter(c => c.project?.id === p.id);
                  const pValue = pContacts.reduce((s, c) => s + (c.value ?? 0), 0);
                  return (
                    <div key={p.id} className={`card-avenue rounded-3xl p-6 ${p.isActive ? "" : "opacity-75 bg-slate-50 border-dashed"}`}>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 shadow-sm">
                            <Briefcase size={20} />
                          </div>
                          <div>
                            <p className="font-black italic text-slate-900 text-lg">{p.name}</p>
                            <span className={`mt-1 inline-block text-[10px] font-black uppercase tracking-widest rounded px-2 py-0.5 border ${p.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-200 text-slate-600 border-slate-300"}`}>
                              {p.isActive ? "סטטוס רץ" : "מוקפא ע״י הנהלה"}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteProject(p.id, p.name)}
                          className="rounded-lg p-2 text-slate-300 border border-transparent hover:border-rose-200 hover:text-rose-600 hover:bg-rose-50 transition shadow-sm"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      
                      {(p.activeFrom || p.activeTo) ? (
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-4 bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <Calendar size={14} className="text-blue-500" /> {formatRange(p.activeFrom, p.activeTo)}
                        </div>
                      ) : (
                         <div className="h-6 mb-4"></div>
                      )}
                      
                      <div className="flex items-center justify-between border-t border-slate-100 pt-4 mb-2">
                        <p className="text-xs text-slate-500 uppercase font-black tracking-wide">
                          <strong className="text-slate-800 text-base">{pContacts.length}</strong> לקוחות מקושרים
                        </p>
                        {pValue > 0 && <p className="text-lg font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">{fmtMoney(pValue)}</p>}
                      </div>
                      
                      {pContacts.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5 pb-4">
                          {STATUS_COLUMNS.map(s => {
                            const n = pContacts.filter(c => c.status === s.key).length;
                            if (!n) return null;
                            return (
                              <span key={s.key} className={`text-[10px] font-black tracking-wide rounded-md px-2 py-1 ${s.bg} ${s.text} shadow-sm opacity-90`}>
                                {s.label}: {n}
                              </span>
                            );
                          })}
                        </div>
                      )}
                      
                      {orgBilling && (
                        <div className="mt-auto border-t border-slate-100 pt-4">
                          <ProjectDocumentBox
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
                  <div className="col-span-full flex flex-col items-center py-20 text-slate-400 bg-slate-50 rounded-3xl border border-dashed border-slate-300">
                    <Briefcase size={48} className="mb-4 opacity-20 text-blue-500" />
                    <p className="font-bold text-lg text-slate-600">אין פרויקטים להצגה</p>
                    <p className="text-sm font-medium mt-1">צרו פרויקט ראשון כדי להתחיל לעבוד בצורה היררכית כמו בארגוני ענק.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Admin table ── */}
          {organizations.length > 0 && (
            <section className="mt-12 space-y-5 border-t border-slate-200 pt-8 relative">
              <div className="absolute top-0 start-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface-white px-4">
                 <Shield className="text-slate-300" size={24}/>
              </div>
              <div className="flex items-center gap-3">
                <h2 className="flex items-center gap-2 text-2xl font-black italic text-slate-900">
                  <LayoutGrid className="text-blue-600" size={24} /> סביבת אדמיניסטרציה לארגונים
                </h2>
                <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-rose-700 shadow-sm">צומת ניהול חברה</span>
              </div>
              <CrmOrganizationsAdminTable
                organizations={organizations}
                showUnifiedBillingLinks={showUnifiedBillingLinks}
              />
            </section>
          )}
        </div>
      </div>

      {modal && (
        <ContactModal
          state={modal}
          projects={projects}
          onClose={() => setModal(null)}
          onSaved={(m) => { setMsg(m); refreshContacts(); }}
        />
      )}

      {editDocRow && orgBilling && (
        <EditIssuedDocumentModal
          doc={editDocRow}
          companyType={orgBilling.companyType}
          isReportable={orgBilling.isReportable}
          onClose={() => setEditDocRow(null)}
          onSaved={() => setEditDocRow(null)}
        />
      )}

      {previewDocRow && orgBilling && (
        <DocumentPreviewModal
          doc={previewDocRow}
          org={orgBilling}
          onClose={() => setPreviewDocRow(null)}
        />
      )}
    </div>
  );
}
