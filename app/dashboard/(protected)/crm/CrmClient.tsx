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
} from "lucide-react";
import CrmOrganizationsAdminTable, {
  type CrmAdminOrganizationRow,
} from "./CrmOrganizationsAdminTable";
import { useI18n } from "@/components/I18nProvider";
import ProjectDocumentBox from "@/components/billing/ProjectDocumentBox";
import EditIssuedDocumentModal from "@/components/billing/EditIssuedDocumentModal";
import DocumentPreviewModal from "@/components/billing/DocumentPreviewModal";
import type { IssuedDocRow } from "@/components/billing/GlobalBillingPageClient";

/* ─── ERP invoice type labels ── */
const DOC_TYPE_LABEL: Record<string, string> = {
  INVOICE: "חשבונית מס",
  RECEIPT: "קבלה",
  INVOICE_RECEIPT: "חשבונית מס/קבלה",
  CREDIT_NOTE: "זיכוי",
};

const DOC_STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "ממתין לתשלום", cls: "bg-amber-500/[0.15] text-amber-300" },
  PAID:    { label: "שולם",         cls: "bg-emerald-500/[0.12] text-emerald-300" },
  CANCELLED: { label: "מבוטל",      cls: "bg-white/[0.05] text-white/45" },
};

/* ─── Types ─────────────────────────────────────────────────────────────── */
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

type View = "pipeline" | "list" | "projects";

/* ─── Constants ──────────────────────────────────────────────────────────── */
const STATUS_COLUMNS = [
  { key: "LEAD",        label: "ליד",     bg: "bg-indigo-500/[0.08]",  border: "border-indigo-500/20",  badge: "bg-indigo-500/[0.12] text-indigo-300",  dot: "bg-indigo-400" },
  { key: "ACTIVE",      label: "פעיל",    bg: "bg-sky-500/[0.08]",     border: "border-sky-500/20",     badge: "bg-sky-500/[0.12] text-sky-300",        dot: "bg-sky-400"    },
  { key: "PROPOSAL",    label: "הצעה",    bg: "bg-violet-500/[0.08]",  border: "border-violet-500/20",  badge: "bg-violet-500/[0.12] text-violet-300",  dot: "bg-violet-500" },
  { key: "CLOSED_WON",  label: "נסגר ✓",  bg: "bg-emerald-500/[0.08]", border: "border-emerald-500/20", badge: "bg-emerald-500/[0.12] text-emerald-300", dot: "bg-emerald-500" },
  { key: "CLOSED_LOST", label: "נסגר ✗",  bg: "bg-rose-500/[0.08]",    border: "border-rose-500/20",    badge: "bg-rose-500/[0.12] text-rose-300",      dot: "bg-rose-400"   },
] as const;

type StatusKey = (typeof STATUS_COLUMNS)[number]["key"];

const inputCls =
  "w-full rounded-xl border border-white/[0.10] bg-white/[0.05] px-3 py-2.5 text-sm text-white outline-none transition focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/[0.15] placeholder:text-white/30";

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
    : "…";
  const b = to
    ? new Date(to).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "2-digit" })
    : "פתוח";
  return `${a} – ${b}`;
}

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

const AVATAR_COLORS = ["#6366f1","#0ea5e9","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899","#14b8a6"];
function avatarColor(id: string) {
  let h = 5381;
  for (let i = 0; i < id.length; i++) h = ((h << 5) + h) + id.charCodeAt(i);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

/* ─── Edit/Add Modal ─────────────────────────────────────────────────────── */
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

  /* טען ERP live בפתיחת עריכה — משתמש ב-endpoint ייעודי לפי ID */
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
      setErpMsg(`✓ סטאטוס עודכן`);
    } catch { setErpMsg("שגיאה בעדכון"); }
  };

  const submit = () => {
    if (!name.trim()) { setErr("יש להזין שם"); return; }
    setErr(null);
    startTransition(async () => {
      if (isEdit && c) {
        const r = await updateContactAction({ contactId: c.id, name, email, phone, status, projectId, value, notes });
        if (r.ok) { onSaved("✓ הלקוח עודכן"); onClose(); }
        else setErr(r.error ?? "שגיאה");
      } else {
        const fd = new FormData();
        fd.set("name", name); fd.set("email", email); fd.set("phone", phone);
        fd.set("status", status);
        if (projectId) fd.set("projectId", projectId);
        if (value) fd.set("value", value);
        fd.set("notes", notes);
        const r = await createContactAction(fd);
        if (r.ok) { onSaved("✓ הלקוח נוסף"); onClose(); }
        else setErr(r.error ?? "שגיאה");
      }
    });
  };

  const deleteContact = () => {
    if (!c) return;
    if (!confirm(`למחוק את "${c.name}"?`)) return;
    startTransition(async () => {
      const r = await deleteContactAction(c.id);
      if (r.ok) { onSaved("✓ נמחק"); onClose(); }
      else setErr(r.error ?? "שגיאה");
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d0e1c] shadow-xl shadow-black/50">
        <div className="flex items-center justify-between border-b border-white/[0.07] px-6 py-5">
          <div className="flex items-center gap-3">
            {isEdit ? (
              <div
                className="flex h-10 w-10 items-center justify-center rounded-2xl text-white text-sm font-black"
                style={{ backgroundColor: avatarColor(c?.id ?? "") }}
              >
                {initials(c?.name ?? "?")}
              </div>
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500 text-white">
                <UserPlus size={18} />
              </div>
            )}
            <div>
              <p className="font-black text-white">{isEdit ? "עריכת לקוח" : "לקוח חדש"}</p>
              {isEdit && c && <p className="text-xs text-white/35">נוצר {fmtDate(c.createdAt)}</p>}
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-white/35 hover:bg-white/[0.07] hover:text-white/70 transition">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {err && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.08] px-3 py-2.5 text-sm text-rose-300">{err}</div>
          )}
          <div>
            <label className="block text-xs font-bold text-white/45 mb-1">שם *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="שם לקוח / חברה" className={inputCls} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-white/45 mb-1">אימייל</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="mail@example.com" className={inputCls} dir="ltr" />
            </div>
            <div>
              <label className="block text-xs font-bold text-white/45 mb-1">טלפון</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="050-0000000" className={inputCls} dir="ltr" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-white/45 mb-1">סטטוס</label>
              <div className="relative">
                <select value={status} onChange={e => setStatus(e.target.value as StatusKey)} className={inputCls + " appearance-none bg-[#0f1020]"}>
                  {STATUS_COLUMNS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
                <ChevronDown size={13} className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-white/35" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-white/45 mb-1">שווי עסקה (₪)</label>
              <input type="number" min="0" step="100" value={value} onChange={e => setValue(e.target.value)} placeholder="0" className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-white/45 mb-1">פרויקט</label>
            <div className="relative">
              <select value={projectId} onChange={e => setProjectId(e.target.value)} className={inputCls + " appearance-none bg-[#0f1020]"}>
                <option value="">— ללא פרויקט —</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}{!p.isActive ? " (ארכיון)" : ""}</option>)}
              </select>
              <ChevronDown size={13} className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-white/35" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-white/45 mb-1">הערות</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="הערות חופשיות..." rows={3} className={inputCls + " resize-none"} />
          </div>

          {/* ── ERP סנכרון: חשבוניות משויכות ────────────────────────────── */}
          {isEdit && (
            <div className="rounded-2xl border border-indigo-500/15 bg-indigo-500/[0.06] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black text-indigo-300 flex items-center gap-1.5">
                  <ReceiptText size={13} /> חשבוניות ERP משויכות
                  {erpLoading && <Loader2 size={11} className="animate-spin text-indigo-400" />}
                </p>
                <Link
                  href={`/dashboard/erp/invoice?client=${encodeURIComponent(c?.name ?? "")}&contactId=${c?.id ?? ""}`}
                  className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  + הנפק חדשה
                </Link>
              </div>
              {erpMsg && <p className="text-[10px] text-emerald-400 font-bold">{erpMsg}</p>}
              {invoices.length === 0 ? (
                <p className="text-xs text-white/30">אין חשבוניות עדיין</p>
              ) : (
                <>
                  {/* סיכום */}
                  <div className="grid grid-cols-3 gap-2 border-b border-white/[0.07] pb-3">
                    <div className="text-center">
                      <p className="text-[10px] text-white/40 mb-0.5">סך חוייב</p>
                      <p className="text-sm font-black text-white">{fmtMoney(invoices.reduce((s, i) => s + i.total, 0))}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-white/40 mb-0.5">שולם</p>
                      <p className="text-sm font-black text-emerald-300">{fmtMoney(invoices.filter(i => i.status === "PAID").reduce((s, i) => s + i.total, 0))}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-white/40 mb-0.5">פתוח</p>
                      <p className="text-sm font-black text-amber-300">{fmtMoney(invoices.filter(i => i.status === "PENDING").reduce((s, i) => s + i.total, 0))}</p>
                    </div>
                  </div>
                  {/* רשימת חשבוניות */}
                  <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                    {invoices.map(inv => {
                      const stMeta = DOC_STATUS_LABEL[inv.status] ?? DOC_STATUS_LABEL.PENDING;
                      return (
                        <div key={inv.id} className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.04] px-3 py-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-black text-white/65">{DOC_TYPE_LABEL[inv.type] ?? inv.type} #{inv.number}</span>
                              <span className={`text-[9px] font-black rounded-full px-1.5 py-0.5 ${stMeta.cls}`}>{stMeta.label}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs font-black text-white">{fmtMoney(inv.total)}</span>
                              <span className="text-[10px] text-white/35">{fmtDate(inv.date ?? inv.createdAt)}</span>
                            </div>
                          </div>
                          {inv.status === "PENDING" && (
                            <div className="flex gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => markInvoice(inv.id, "PAID")}
                                className="rounded-lg bg-emerald-500/[0.12] px-2 py-1 text-[9px] font-black text-emerald-300 hover:bg-emerald-500/20 transition"
                              >
                                שולם
                              </button>
                              <button
                                type="button"
                                onClick={() => markInvoice(inv.id, "CANCELLED")}
                                className="rounded-lg bg-white/[0.05] px-2 py-1 text-[9px] font-black text-white/45 hover:bg-white/[0.09] transition"
                              >
                                בטל
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

        <div className="flex items-center justify-between border-t border-white/[0.07] px-6 py-4 bg-black/20">
          <div className="flex items-center gap-2">
            {isEdit && (
              <button type="button" onClick={deleteContact} disabled={pending} className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/[0.10] transition disabled:opacity-50">
                <Trash2 size={13} /> מחק
              </button>
            )}
            {isEdit && c?.status === "CLOSED_WON" && (
              <Link
                href={`/dashboard/erp/invoice?client=${encodeURIComponent(c.name)}`}
                className="flex items-center gap-1.5 rounded-xl border border-indigo-500/20 bg-indigo-500/[0.08] px-3 py-2 text-xs font-bold text-indigo-300 hover:bg-indigo-500/15 transition"
              >
                <ReceiptText size={13} /> הנפק חשבונית
              </Link>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className="rounded-xl border border-white/[0.09] bg-white/[0.05] px-4 py-2 text-sm font-bold text-white/65 hover:bg-white/[0.09] transition">
              ביטול
            </button>
            <button type="button" onClick={submit} disabled={pending} className="flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-2 text-sm font-bold text-white hover:bg-indigo-400 transition disabled:opacity-50 shadow-sm shadow-indigo-500/25">
              {pending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              {isEdit ? "שמור" : "הוסף"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Contact Card (pipeline) ────────────────────────────────────────────── */
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
      className="group relative rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 hover:border-white/[0.12] hover:bg-white/[0.05] transition-all cursor-pointer"
      onClick={() => onEdit(contact)}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white text-xs font-black"
            style={{ backgroundColor: avatarColor(contact.id) }}
          >
            {initials(contact.name)}
          </div>
          <div>
            <p className="text-sm font-black text-white leading-tight">{contact.name}</p>
            {contact.project && <p className="text-[10px] text-white/35 mt-0.5">{contact.project.name}</p>}
          </div>
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v); }}
          className="opacity-0 group-hover:opacity-100 rounded-lg p-1 text-white/35 hover:bg-white/[0.08] transition"
        >
          <MoreVertical size={14} />
        </button>
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold ${meta.badge}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
          {meta.label}
        </span>
        {contact.value != null && (
          <span className="text-xs font-black text-emerald-300 bg-emerald-500/[0.10] rounded-lg px-2 py-0.5">
            {fmtMoney(contact.value)}
          </span>
        )}
      </div>

      {/* ERP badge */}
      {(contact.erp?.invoiceCount ?? 0) > 0 && (
        <div className="mt-2 flex items-center gap-1.5 text-[10px] font-black text-indigo-300">
          <ReceiptText size={10} />
          <span>{contact.erp!.invoiceCount} חשבוניות</span>
          {contact.erp!.totalPending > 0 && (
            <span className="rounded-full bg-amber-500/[0.12] text-amber-300 px-1.5 py-0.5">פתוח: {fmtMoney(contact.erp!.totalPending)}</span>
          )}
          {contact.erp!.totalPending === 0 && contact.erp!.totalPaid > 0 && (
            <span className="rounded-full bg-emerald-500/[0.10] text-emerald-300 px-1.5 py-0.5">שולם ✓</span>
          )}
        </div>
      )}

      {(contact.email || contact.phone) && (
        <div className="mt-2.5 space-y-1">
          {contact.phone && (
            <div className="flex items-center gap-1.5 text-[10px] text-white/40" dir="ltr">
              <Phone size={10} className="shrink-0" /> {contact.phone}
            </div>
          )}
          {contact.email && (
            <div className="flex items-center gap-1.5 text-[10px] text-white/40 truncate" dir="ltr">
              <Mail size={10} className="shrink-0" /> {contact.email}
            </div>
          )}
        </div>
      )}

      <p className="mt-2.5 text-[10px] text-white/20">{fmtDate(contact.createdAt)}</p>

      {contact.status === "CLOSED_WON" && (
        <Link
          href={`/dashboard/erp/invoice?client=${encodeURIComponent(contact.name)}`}
          onClick={(e) => e.stopPropagation()}
          className="mt-2 flex items-center gap-1 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition"
        >
          <ReceiptText size={10} /> הנפק חשבונית
        </Link>
      )}

      {menuOpen && (
        <div
          className="absolute left-0 top-full z-20 mt-1 min-w-[140px] rounded-2xl border border-white/[0.09] bg-[#0d0e1c] shadow-lg shadow-black/40 py-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="px-3 py-1 text-[10px] font-bold text-white/30 uppercase tracking-wider">שנה סטטוס</p>
          {STATUS_COLUMNS.map(s => (
            <button
              key={s.key}
              type="button"
              onClick={() => { onStatusChange(contact.id, s.key); setMenuOpen(false); }}
              className={`flex w-full items-center gap-2 px-3 py-1.5 text-xs font-bold hover:bg-white/[0.06] transition ${contact.status === s.key ? "text-indigo-300 bg-indigo-500/[0.08]" : "text-white/65"}`}
            >
              <span className={`h-2 w-2 rounded-full ${s.dot}`} /> {s.label}
            </button>
          ))}
          <div className="border-t border-white/[0.07] mt-1 pt-1">
            <button
              type="button"
              onClick={() => { onEdit(contact); setMenuOpen(false); }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-bold text-white/65 hover:bg-white/[0.06]"
            >
              <Edit3 size={12} /> ערוך
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
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

  /* ── Refresh contacts from server after any mutation ── */
  const refreshContacts = useCallback(async () => {
    try {
      const res = await fetch("/api/crm/contacts");
      if (!res.ok) return;
      const data = await res.json();
      if (data.contacts) setContacts(data.contacts);
    } catch { /* silent */ }
  }, []);

  // List view filters
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterProject, setFilterProject] = useState("");

  // Add project form
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
  }, [contacts, filterStatus, filterProject, search]);

  /* ── Status change (optimistic + refresh on success) ── */
  const handleStatusChange = (id: string, status: StatusKey) => {
    setContacts(prev => prev.map(c => c.id === id ? { ...c, status } : c));
    startTransition(async () => {
      const r = await updateContactStatusAction(id, status);
      if (!r.ok) {
        setMsg(r.error ?? "שגיאה");
        // revert optimistic update
        setContacts(prev => prev.map(c => c.id === id ? { ...c, status: c.status } : c));
      } else {
        // refresh to pick up auto-created invoice on CLOSED_WON
        refreshContacts();
      }
    });
  };

  /* ── Save project ── */
  const saveProject = async () => {
    if (!projName.trim()) { setProjErr("יש להזין שם"); return; }
    setSavingProj(true); setProjErr(null);
    const fd = new FormData();
    fd.set("name", projName);
    if (projFrom) fd.set("activeFrom", projFrom);
    if (projTo) fd.set("activeTo", projTo);
    if (projActive) fd.set("isActive", "on");
    const r = await createProjectAction(fd);
    setSavingProj(false);
    if (r.ok) {
      setMsg("✓ הפרויקט נוסף");
      setAddProjOpen(false);
      setProjName(""); setProjFrom(""); setProjTo(""); setProjActive(true);
    } else {
      setProjErr(r.error ?? "שגיאה");
    }
  };

  /* ── Delete project ── */
  const handleDeleteProject = (pid: string, name: string) => {
    if (!confirm(`למחוק פרויקט "${name}"?`)) return;
    startTransition(async () => {
      const r = await deleteProjectAction(pid);
      setMsg(r.ok ? "✓ הפרויקט נמחק" : (r.error ?? "שגיאה"));
    });
  };

  /* ── No org ── */
  if (!hasOrganization) {
    return (
      <div className="p-6 space-y-8" dir={dir}>
        <div className="rounded-2xl border border-indigo-500/15 bg-indigo-500/[0.06] p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500 text-white">
              <Shield size={20} />
            </div>
            <div>
              <p className="font-bold text-white">אין ארגון משויך</p>
              <p className="mt-1 text-sm text-white/55 leading-relaxed">
                עבור ל<strong className="text-white/80">הגדרות</strong>, שייך משתמש לארגון או התחבר מחדש.
              </p>
            </div>
          </div>
        </div>
        {organizations.length > 0 && (
          <section className="space-y-4">
            <h2 className="flex items-center gap-2 text-xl font-black text-white">
              <LayoutGrid className="text-indigo-400" size={20} /> ארגונים במערכת
            </h2>
            <CrmOrganizationsAdminTable
              organizations={organizations}
              showUnifiedBillingLinks={showUnifiedBillingLinks}
            />
          </section>
        )}
      </div>
    );
  }
  /* ─────────────────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col gap-5 min-h-screen" dir="rtl">

      {/* ── Top bar ── */}
      <section className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-[#0d0e1c] px-6 py-5 md:px-8">
        <div className="absolute inset-y-0 start-0 w-1.5 bg-indigo-500" />
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/[0.10] px-3 py-1 text-[11px] font-bold text-indigo-300">
              <Users size={11} /> ניהול לקוחות
            </span>
            <h1 className="mt-2 text-xl font-black text-white">CRM — מרכז לקוחות</h1>
            <p className="text-xs text-white/35 mt-0.5">לקוחות, לידים, פרויקטים והצעות מחיר</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-xl border border-white/[0.09] bg-white/[0.04] p-0.5">
              <button type="button" onClick={() => setView("pipeline")} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${view === "pipeline" ? "bg-white/[0.10] text-white shadow-sm" : "text-white/45 hover:text-white/70"}`}>
                <BarChart2 size={13} /> פייפליין
              </button>
              <button type="button" onClick={() => setView("list")} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${view === "list" ? "bg-white/[0.10] text-white shadow-sm" : "text-white/45 hover:text-white/70"}`}>
                <List size={13} /> רשימה
              </button>
              <button type="button" onClick={() => setView("projects")} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${view === "projects" ? "bg-white/[0.10] text-white shadow-sm" : "text-white/45 hover:text-white/70"}`}>
                <Briefcase size={13} /> פרויקטים
              </button>
            </div>
            <button
              type="button"
              onClick={() => setModal({ mode: "add" })}
              className="flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-400 transition shadow-sm shadow-indigo-500/25"
            >
              <UserPlus size={15} /> לקוח חדש
            </button>
          </div>
        </div>
      </section>

      <div className="flex-1 overflow-auto px-0 py-0">
        <div className="max-w-[1400px] mx-auto space-y-5">

          {/* ── Toast ── */}
          {msg && (
            <div className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm ${msg.startsWith("✓") ? "border border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-300" : "border border-rose-500/20 bg-rose-500/[0.08] text-rose-300"}`}>
              <p className="flex-1">{msg}</p>
              <button type="button" onClick={() => setMsg(null)}><X size={14} /></button>
            </div>
          )}

          {/* ── KPI row ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
              <div className="flex items-center gap-2 mb-1">
                <Users size={14} className="text-white/35" />
                <p className="text-xs text-white/45 font-bold">{'סה"כ לקוחות'}</p>
              </div>
              <p className="text-2xl font-black text-white">{contacts.length}</p>
              <p className="text-[10px] text-white/30 mt-0.5">{contacts.filter(c => c.status === "LEAD").length} לידים</p>
            </div>
            <div className="rounded-2xl border border-indigo-500/15 bg-indigo-500/[0.06] p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={14} className="text-indigo-400" />
                <p className="text-xs text-indigo-300 font-bold">פייפליין פעיל</p>
              </div>
              <p className="text-2xl font-black text-indigo-200">{activeCount}</p>
              <p className="text-[10px] text-indigo-400 mt-0.5">{totalPipeline > 0 ? fmtMoney(totalPipeline) : "—"}</p>
            </div>
            <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.06] p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 size={14} className="text-emerald-400" />
                <p className="text-xs text-emerald-300 font-bold">נסגרו בהצלחה</p>
              </div>
              <p className="text-2xl font-black text-emerald-200">{wonCount}</p>
              <p className="text-[10px] text-emerald-400 mt-0.5">{wonTotal > 0 ? fmtMoney(wonTotal) : "—"}</p>
            </div>
            <div className="rounded-2xl border border-sky-500/15 bg-sky-500/[0.06] p-4">
              <div className="flex items-center gap-2 mb-1">
                <BarChart2 size={14} className="text-sky-400" />
                <p className="text-xs text-sky-300 font-bold">אחוז הצלחה</p>
              </div>
              <p className="text-2xl font-black text-sky-200">{winRate != null ? `${winRate}%` : "—"}</p>
              <p className="text-[10px] text-sky-400 mt-0.5">{closedAll} עסקאות סגורות</p>
            </div>
          </div>

          {/* ══════════ PIPELINE VIEW ══════════ */}
          {view === "pipeline" && (
            <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 400 }}>
              {STATUS_COLUMNS.map((col) => {
                const colContacts = contacts.filter(c => c.status === col.key);
                const colValue = colContacts.reduce((s, c) => s + (c.value ?? 0), 0);
                return (
                  <div key={col.key} className="flex flex-col min-w-[220px] w-[220px] shrink-0">
                    <div className={`rounded-2xl ${col.bg} border ${col.border} px-3 py-3 mb-3`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`inline-flex items-center gap-1 text-xs font-black`}>
                          <span className={`h-2 w-2 rounded-full ${col.dot}`} />
                          <span className="text-white/70">{col.label}</span>
                        </span>
                        <span className="text-xs font-black text-white/50 bg-white/[0.07] rounded-full px-2 py-0.5 border border-white/[0.08]">
                          {colContacts.length}
                        </span>
                      </div>
                      {colValue > 0 && <p className="text-[10px] text-white/35 mt-1">{fmtMoney(colValue)}</p>}
                    </div>
                    <div className="flex flex-col gap-2 flex-1">
                      {colContacts.map(c => (
                        <ContactCard
                          key={c.id}
                          contact={c}
                          onEdit={c => setModal({ mode: "edit", contact: c })}
                          onStatusChange={handleStatusChange}
                        />
                      ))}
                      <button
                        type="button"
                        onClick={() => setModal({ mode: "add", defaultStatus: col.key })}
                        className="flex items-center gap-1.5 rounded-2xl border border-dashed border-white/[0.12] px-3 py-2.5 text-xs font-bold text-white/35 hover:border-indigo-400/40 hover:text-indigo-400 transition"
                      >
                        <Plus size={12} /> הוסף
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ══════════ LIST VIEW ══════════ */}
          {view === "list" && (
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] overflow-hidden">
              <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.07] px-5 py-4">
                <div className="relative flex-1 min-w-[160px]">
                  <Search size={13} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="חיפוש שם, אימייל, טלפון..."
                    className="w-full rounded-xl border border-white/[0.09] bg-white/[0.05] py-2 ps-8 pe-3 text-xs text-white placeholder:text-white/30 outline-none focus:border-indigo-500/50"
                  />
                </div>
                <div className="relative">
                  <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="rounded-xl border border-white/[0.09] bg-[#0f1020] text-white/65 py-2 ps-3 pe-7 text-xs appearance-none outline-none focus:border-indigo-500/50">
                    <option value="">כל הסטטוסים</option>
                    {STATUS_COLUMNS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                  <ChevronDown size={12} className="pointer-events-none absolute end-2 top-1/2 -translate-y-1/2 text-white/30" />
                </div>
                <div className="relative">
                  <select value={filterProject} onChange={e => setFilterProject(e.target.value)} className="rounded-xl border border-white/[0.09] bg-[#0f1020] text-white/65 py-2 ps-3 pe-7 text-xs appearance-none outline-none focus:border-indigo-500/50">
                    <option value="">כל הפרויקטים</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <ChevronDown size={12} className="pointer-events-none absolute end-2 top-1/2 -translate-y-1/2 text-white/30" />
                </div>
                {(search || filterStatus || filterProject) && (
                  <button type="button" onClick={() => { setSearch(""); setFilterStatus(""); setFilterProject(""); }} className="rounded-xl border border-white/[0.09] bg-white/[0.05] px-3 py-2 text-xs font-bold text-indigo-400 hover:bg-white/[0.09]">
                    נקה
                  </button>
                )}
                <p className="text-xs text-white/30 ms-auto">{filteredContacts.length} / {contacts.length}</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.07] bg-white/[0.02]">
                      {["שם", "סטטוס", "פרויקט", "טלפון", "אימייל", "שווי", "תאריך", ""].map(h => (
                        <th key={h} className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-wider text-white/30">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {filteredContacts.map(c => {
                      const meta = statusMeta(c.status);
                      return (
                        <tr key={c.id} className="hover:bg-white/[0.03] transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white text-xs font-black"
                                style={{ backgroundColor: avatarColor(c.id) }}
                              >
                                {initials(c.name)}
                              </div>
                              <div>
                                <p className="font-bold text-white">{c.name}</p>
                                {c.notes && <p className="text-[10px] text-white/30 truncate max-w-[120px]">{c.notes}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold ${meta.badge}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />{meta.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-white/45">{c.project?.name ?? "—"}</td>
                          <td className="px-4 py-3 text-xs text-white/40 font-mono" dir="ltr">{c.phone ?? "—"}</td>
                          <td className="px-4 py-3 text-xs text-white/40 truncate max-w-[140px]" dir="ltr">{c.email ?? "—"}</td>
                          <td className="px-4 py-3 text-xs font-bold text-emerald-300">{c.value != null ? fmtMoney(c.value) : "—"}</td>
                          <td className="px-4 py-3 text-xs text-white/30">{fmtDate(c.createdAt)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setModal({ mode: "edit", contact: c })}
                                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-indigo-400 hover:bg-indigo-500/[0.10] transition"
                              >
                                <Edit3 size={12} /> ערוך
                              </button>
                              {c.status === "CLOSED_WON" && (
                                <Link
                                  href={`/dashboard/erp/invoice?client=${encodeURIComponent(c.name)}&contactId=${c.id}`}
                                  className="inline-flex items-center gap-1 rounded-lg border border-indigo-500/20 bg-indigo-500/[0.08] px-2.5 py-1.5 text-xs font-bold text-indigo-300 hover:bg-indigo-500/15 transition"
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
                  <div className="flex flex-col items-center justify-center py-16 text-white/30">
                    <Users size={36} className="mb-3 opacity-20" />
                    <p className="font-bold">{search || filterStatus || filterProject ? "אין תוצאות" : "אין לקוחות עדיין"}</p>
                    <button
                      type="button"
                      onClick={() => setModal({ mode: "add" })}
                      className="mt-3 flex items-center gap-1.5 rounded-xl bg-indigo-500 px-4 py-2 text-xs font-bold text-white"
                    >
                      <UserPlus size={12} /> הוסף לקוח
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════ PROJECTS VIEW ══════════ */}
          {view === "projects" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-white/55">{projects.length} פרויקטים</p>
                <button
                  type="button"
                  onClick={() => setAddProjOpen(v => !v)}
                  className="flex items-center gap-2 rounded-xl border border-indigo-500/20 bg-indigo-500/[0.08] px-4 py-2 text-xs font-bold text-indigo-300 hover:bg-indigo-500/15 transition"
                >
                  <FolderPlus size={13} /> פרויקט חדש
                </button>
              </div>

              {addProjOpen && (
                <div className="rounded-2xl border border-white/[0.09] bg-white/[0.03] p-5 space-y-3">
                  <p className="text-sm font-black text-white">פרויקט חדש</p>
                  {projErr && <p className="text-xs text-rose-300">{projErr}</p>}
                  <input value={projName} onChange={e => setProjName(e.target.value)} placeholder="שם פרויקט" className={inputCls} />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-white/40 mb-1">תחילה</label>
                      <input type="date" value={projFrom} onChange={e => setProjFrom(e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-white/40 mb-1">סיום</label>
                      <input type="date" value={projTo} onChange={e => setProjTo(e.target.value)} className={inputCls} />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-xs font-bold text-white/65 cursor-pointer">
                    <input type="checkbox" checked={projActive} onChange={e => setProjActive(e.target.checked)} className="rounded border-white/20 accent-indigo-500" />
                    פרויקט פעיל
                  </label>
                  <div className="flex gap-2">
                    <button type="button" onClick={saveProject} disabled={savingProj} className="flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
                      {savingProj ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} שמור
                    </button>
                    <button type="button" onClick={() => setAddProjOpen(false)} className="rounded-xl border border-white/[0.09] bg-white/[0.05] px-4 py-2 text-xs font-bold text-white/55">
                      ביטול
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map(p => {
                  const pContacts = contacts.filter(c => c.project?.id === p.id);
                  const pValue = pContacts.reduce((s, c) => s + (c.value ?? 0), 0);
                  return (
                    <div key={p.id} className={`rounded-2xl border bg-white/[0.03] p-5 ${p.isActive ? "border-white/[0.09]" : "border-white/[0.05] opacity-60"}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.07] text-white/50">
                            <Briefcase size={16} />
                          </div>
                          <div>
                            <p className="font-black text-white text-sm">{p.name}</p>
                            <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${p.isActive ? "bg-emerald-500/[0.12] text-emerald-300" : "bg-white/[0.06] text-white/35"}`}>
                              {p.isActive ? "פעיל" : "ארכיון"}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteProject(p.id, p.name)}
                          className="rounded-lg p-1.5 text-white/20 hover:text-rose-400 hover:bg-rose-500/[0.10] transition"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      {(p.activeFrom || p.activeTo) && (
                        <div className="flex items-center gap-1.5 text-xs text-white/35 mb-3">
                          <Calendar size={11} /> {formatRange(p.activeFrom, p.activeTo)}
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-white/40">
                          <strong className="text-white/70">{pContacts.length}</strong> לקוחות
                        </p>
                        {pValue > 0 && <p className="text-xs font-black text-emerald-300">{fmtMoney(pValue)}</p>}
                      </div>
                      {pContacts.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {STATUS_COLUMNS.map(s => {
                            const n = pContacts.filter(c => c.status === s.key).length;
                            if (!n) return null;
                            return (
                              <span key={s.key} className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${s.badge}`}>
                                {s.label}: {n}
                              </span>
                            );
                          })}
                        </div>
                      )}
                      {orgBilling && (
                        <div className="mt-4">
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
                  <div className="col-span-full flex flex-col items-center py-16 text-white/25">
                    <Briefcase size={36} className="mb-3 opacity-20" />
                    <p className="font-bold">אין פרויקטים עדיין</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Admin table ── */}
          {organizations.length > 0 && (
            <section className="mt-8 space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="flex items-center gap-2 text-xl font-black text-white">
                  <LayoutGrid className="text-indigo-400" size={20} /> כל הארגונים במערכת
                </h2>
                <span className="rounded-full border border-indigo-500/20 bg-indigo-500/[0.10] px-3 py-0.5 text-xs font-bold text-indigo-300">הרשאת בעלים</span>
              </div>
              <CrmOrganizationsAdminTable
                organizations={organizations}
                showUnifiedBillingLinks={showUnifiedBillingLinks}
              />
            </section>
          )}
        </div>
      </div>

      {/* ── Modal ── */}
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