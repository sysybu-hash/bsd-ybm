"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import {
  createContactAction,
  deleteContactAction,
  updateContactAction,
} from "@/app/actions/crm";
import Link from "next/link";
import PortalToBody, { WORKSPACE_OVERLAY_Z_CLASS } from "@/components/portal/PortalToBody";
import {
  ChevronDown,
  Loader2,
  Plus,
  ReceiptText,
  Settings,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { DOC_STATUS_LABEL, DOC_TYPE_LABEL, STATUS_COLUMNS, crmInputCls } from "./crm-client-constants";
import type { ModalState, ProjectRow, StatusKey } from "./crm-client-types";
import { avatarColor, fmtDate, fmtMoney, initials } from "./crm-client-utils";

type Props = {
  state: ModalState;
  projects: ProjectRow[];
  onClose: () => void;
  onSaved: (msg: string) => void;
};

export default function CrmContactModal({ state, projects, onClose, onSaved }: Props) {
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
  const [invoices, setInvoices] = useState(c?.issuedDocuments ?? []);
  const [erpMsg, setErpMsg] = useState<string | null>(null);

  const loadErpInvoices = useCallback(async () => {
    if (!c?.id) return;
    setErpLoading(true);
    try {
      const res = await fetch(`/api/crm/contacts/${c.id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.contact?.issuedDocuments) setInvoices(data.contact.issuedDocuments);
    } catch {
      /* silent */
    } finally {
      setErpLoading(false);
    }
  }, [c?.id]);

  useEffect(() => {
    void loadErpInvoices();
  }, [loadErpInvoices]);

  const markInvoice = async (invId: string, nextStatus: string) => {
    setErpMsg(null);
    try {
      const res = await fetch(`/api/erp/issued-documents/${invId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error();
      setInvoices((prev) => prev.map((i) => (i.id === invId ? { ...i, status: nextStatus } : i)));
      setErpMsg(`✔ חשבונית עודכנה`);
    } catch {
      setErpMsg("שגיאת עדכון");
    }
  };

  const submit = () => {
    if (!name.trim()) {
      setErr("שם הלקוח שדה חובה");
      return;
    }
    setErr(null);
    startTransition(async () => {
      if (isEdit && c) {
        const r = await updateContactAction({ contactId: c.id, name, email, phone, status, projectId, value, notes });
        if (r.ok) {
          onSaved("✔ הרשומה עודכנה");
          onClose();
        } else setErr(r.error ?? "שגיאה");
      } else {
        const fd = new FormData();
        fd.set("name", name);
        fd.set("email", email);
        fd.set("phone", phone);
        fd.set("status", status);
        if (projectId) fd.set("projectId", projectId);
        if (value) fd.set("value", value);
        fd.set("notes", notes);
        const r = await createContactAction(fd);
        if (r.ok) {
          onSaved("✔ הרשומה נוצרה");
          onClose();
        } else setErr(r.error ?? "שגיאה");
      }
    });
  };

  const deleteContact = () => {
    if (!c) return;
    if (!confirm(`למחוק את "${c.name}"?`)) return;
    startTransition(async () => {
      const r = await deleteContactAction(c.id);
      if (r.ok) {
        onSaved("✔ נמחק");
        onClose();
      } else setErr(r.error ?? "שגיאה");
    });
  };

  return (
    <PortalToBody>
      <div
        className={`fixed inset-0 ${WORKSPACE_OVERLAY_Z_CLASS} flex items-end justify-center p-4 sm:items-center`}
        dir="rtl"
      >
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
        <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-blue-900/10">
          <div className="flex items-center justify-between border-b border-slate-100 px-8 py-6">
            <div className="flex items-center gap-4">
              {isEdit ? (
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl text-base font-black text-white shadow-sm"
                  style={{ backgroundColor: avatarColor(c?.id ?? "") }}
                >
                  {initials(c?.name ?? "ללק")}
                </div>
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-700 bg-blue-600 text-white shadow-sm">
                  <UserPlus size={20} />
                </div>
              )}
              <div>
                <p className="text-xl font-black italic text-slate-900">
                  {isEdit ? "עריכת לקוח / שותף" : "יצירת כרטיס חדש"}
                </p>
                {isEdit && c && <p className="mt-1 text-xs font-medium text-slate-400">נוצר ב- {fmtDate(c.createdAt)}</p>}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 transition-all duration-200 hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 active:scale-[0.97]"
            >
              <X size={20} />
            </button>
          </div>

          <div className="max-h-[65vh] space-y-4 overflow-y-auto px-8 py-6">
            {err && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 shadow-sm">
                {err}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">השם המלא *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="שם חברה / פרטי"
                className={crmInputCls}
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">דואר אלקטרוני</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="mail@example.com"
                  className={crmInputCls}
                  dir="ltr"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">טלפון נייד</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="050-0000000"
                  className={crmInputCls}
                  dir="ltr"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Settings size={14} className="text-slate-400" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">שדות מערכת מותאמים</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">סטטוס תהליך</label>
                  <div className="relative">
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as StatusKey)}
                      className={`${crmInputCls} appearance-none`}
                    >
                      {STATUS_COLUMNS.map((s) => (
                        <option key={s.key} value={s.key}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={14}
                      className="pointer-events-none absolute end-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                    פוטנציאל עסקי (₪)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="0"
                    className={`${crmInputCls} font-bold text-blue-700`}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">שיוך לתיק פרויקט</label>
              <div className="relative">
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className={`${crmInputCls} appearance-none bg-white`}
                >
                  <option value="">— ללא שיוך —</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                      {!p.isActive ? " (בארכיון)" : ""}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="pointer-events-none absolute end-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                הערות ותקציר לקוח (AI יסכם)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="הערות אישיות..."
                rows={3}
                className={`${crmInputCls} resize-none`}
              />
            </div>

            {isEdit && (
              <div className="space-y-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-5">
                <div className="flex items-center justify-between border-b border-blue-100 pb-2">
                  <p className="flex items-center gap-2 text-xs font-black uppercase text-blue-700">
                    <ReceiptText size={15} /> היסטוריית חשבוניות ERP
                    {erpLoading && <Loader2 size={13} className="animate-spin text-blue-500" />}
                  </p>
                  <Link
                    href={`/app/documents/issue?client=${encodeURIComponent(c?.name ?? "")}&contactId=${c?.id ?? ""}`}
                    className="flex items-center gap-1 rounded-lg border border-blue-200 bg-white px-2 py-1 text-[11px] font-bold text-blue-600 shadow-sm transition hover:text-blue-800"
                  >
                    <Plus size={12} /> הפק חשבונית חדשה
                  </Link>
                </div>
                {erpMsg && <p className="rounded bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-600">{erpMsg}</p>}

                {invoices.length === 0 ? (
                  <p className="py-4 text-center text-sm font-medium text-slate-500">
                    אין חשבוניות כרגע המשויכות ללקוח זה באמצעות ה-ERP שלנו.
                  </p>
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">סה״כ לתשלום</p>
                        <p className="mt-1 text-base font-black text-slate-900">
                          {fmtMoney(invoices.reduce((s, i) => s + i.total, 0))}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">סך ששולם</p>
                        <p className="mt-1 text-base font-black text-emerald-600">
                          {fmtMoney(invoices.filter((i) => i.status === "PAID").reduce((s, i) => s + i.total, 0))}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">יתרת חוב</p>
                        <p className="mt-1 text-base font-black text-rose-600">
                          {fmtMoney(invoices.filter((i) => i.status === "PENDING").reduce((s, i) => s + i.total, 0))}
                        </p>
                      </div>
                    </div>
                    <div className="max-h-[160px] space-y-2 overflow-y-auto pe-1">
                      {invoices.map((inv) => {
                        const stMeta = DOC_STATUS_LABEL[inv.status] ?? DOC_STATUS_LABEL.PENDING;
                        return (
                          <div
                            key={inv.id}
                            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[11px] font-black text-slate-700">
                                  {DOC_TYPE_LABEL[inv.type] ?? inv.type} #{inv.number}
                                </span>
                                <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${stMeta.cls}`}>{stMeta.label}</span>
                              </div>
                              <div className="mt-1 flex items-center gap-2">
                                <span className="text-sm font-black text-slate-900">{fmtMoney(inv.total)}</span>
                                <span className="text-[11px] font-medium text-slate-500">
                                  {fmtDate(inv.date ?? inv.createdAt)}
                                </span>
                              </div>
                            </div>
                            {inv.status === "PENDING" && (
                              <div className="flex shrink-0 flex-col gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => void markInvoice(inv.id, "PAID")}
                                  className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black text-emerald-700 shadow-sm transition hover:bg-emerald-100"
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
                <button
                  type="button"
                  onClick={deleteContact}
                  disabled={pending}
                  className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-xs font-bold text-rose-600 shadow-sm transition hover:bg-rose-50 disabled:opacity-50"
                >
                  <Trash2 size={15} /> מחק רשומה
                </button>
              )}
              {isEdit && c?.status === "CLOSED_WON" && (
                <Link
                  href={`/app/documents/issue?client=${encodeURIComponent(c.name)}`}
                  className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-bold text-blue-700 shadow-sm transition hover:bg-blue-100"
                >
                  <ReceiptText size={15} /> הפקת מסמך
                </Link>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-slate-50"
              >
                ביטול
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={pending}
                className="btn-primary flex items-center gap-2 py-2.5 shadow-lg shadow-blue-500/20"
              >
                {pending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                {isEdit ? "שמור שינויים" : "צור רשומה"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </PortalToBody>
  );
}
