"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Eye,
  Printer,
  Edit3,
  Plus,
  Loader2,
  Inbox,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import { CompanyType, DocStatus, DocType } from "@prisma/client";
import type { OrganizationPrintModel } from "@/components/billing/DocumentPrintTemplate";
import type { IssuedDocRow } from "@/components/billing/GlobalBillingPageClient";

/* ─── Types ─────────────────────────────────────────────────────────────── */

type Props = {
  /** pass a contactId OR a projectId to load related docs */
  contactId?: string;
  projectId?: string;
  clientName?: string;
  org: OrganizationPrintModel;
  companyType: CompanyType;
  isReportable: boolean;
  onEditDoc: (doc: IssuedDocRow) => void;
  onPreviewDoc: (doc: IssuedDocRow) => void;
};

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const DOC_TYPE_LABEL: Record<DocType, string> = {
  INVOICE: "חשבונית מס",
  RECEIPT: "קבלה",
  INVOICE_RECEIPT: "חשבונית מס קבלה",
  CREDIT_NOTE: "זיכוי",
};

const STATUS_META: Record<DocStatus, { label: string; cls: string; icon: typeof CheckCircle2 }> = {
  PAID: { label: "שולם", cls: "bg-emerald-100 text-emerald-400", icon: CheckCircle2 },
  PENDING: { label: "בהמתנה", cls: "bg-amber-100 text-amber-400", icon: Clock },
  CANCELLED: { label: "בוטל", cls: "bg-white/[0.05] text-white/45", icon: XCircle },
};

function fmtMoney(n: number) {
  return `₪${n.toLocaleString("he-IL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/* ─── Component ──────────────────────────────────────────────────────────── */

export default function ProjectDocumentBox({
  contactId,
  projectId,
  clientName,
  org,
  companyType,
  isReportable,
  onEditDoc,
  onPreviewDoc,
}: Props) {
  const [docs, setDocs] = useState<IssuedDocRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!contactId && !projectId) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (contactId) params.set("contactId", contactId);
      if (projectId) params.set("projectId", projectId);
      const res = await fetch(`/api/erp/issued-documents/box?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json() as { documents: IssuedDocRow[] };
      setDocs(data.documents ?? []);
    } catch {
      setError("לא ניתן לטעון מסמכים");
    } finally {
      setLoading(false);
    }
  }, [contactId, projectId]);

  useEffect(() => { void load(); }, [load]);

  const totalBilled = docs.reduce((s, d) => s + d.total, 0);
  const totalPaid = docs.filter((d) => d.status === DocStatus.PAID).reduce((s, d) => s + d.total, 0);
  const totalPending = docs.filter((d) => d.status === DocStatus.PENDING).reduce((s, d) => s + d.total, 0);

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#0a0b14] shadow-sm" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-400">
            <FileText size={15} />
          </div>
          <div>
            <p className="text-sm font-black text-white">תיבת מסמכים</p>
            <p className="text-[10px] text-white/35">{docs.length} מסמכים</p>
          </div>
        </div>
        <Link
          href={`/dashboard/billing?createFor=${encodeURIComponent(clientName ?? "")}`}
          onClick={() => {}}
          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition"
        >
          <Plus size={12} /> הפקת מסמך
        </Link>
      </div>

      {/* Stats row */}
      {docs.length > 0 && (
        <div className="grid grid-cols-3 divide-x divide-x-reverse divide-white/[0.07] border-b border-white/[0.07]">
          <div className="px-4 py-3 text-center">
            <p className="text-[10px] font-bold text-white/35 uppercase tracking-wider">סך חוייב</p>
            <p className="mt-0.5 text-sm font-black text-white/75">{fmtMoney(totalBilled)}</p>
          </div>
          <div className="px-4 py-3 text-center">
            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">שולם</p>
            <p className="mt-0.5 text-sm font-black text-emerald-400">{fmtMoney(totalPaid)}</p>
          </div>
          <div className="px-4 py-3 text-center">
            <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">פתוח</p>
            <p className="mt-0.5 text-sm font-black text-amber-400">{fmtMoney(totalPending)}</p>
          </div>
        </div>
      )}

      {/* Document list */}
      <div className="divide-y divide-white/[0.05]">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={24} className="animate-spin text-indigo-400" />
          </div>
        ) : error ? (
          <div className="px-5 py-6 text-center text-sm text-rose-600">{error}</div>
        ) : docs.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.03] text-white/25">
              <Inbox size={24} />
            </div>
            <p className="text-sm font-bold text-white/45">אין מסמכים עדיין</p>
            <p className="text-xs text-white/35">הפק מסמך ראשון דרך הכפתור למעלה</p>
          </div>
        ) : (
          docs.map((doc) => {
            const meta = STATUS_META[doc.status];
            const StatusIcon = meta.icon;
            return (
              <div key={doc.id} className="group flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.03]/60 transition-colors">
                {/* Doc number badge */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-xs font-black text-indigo-400">
                  #{doc.number}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{DOC_TYPE_LABEL[doc.docType]}</p>
                  <div className="mt-0.5 flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold ${meta.cls}`}>
                      <StatusIcon size={9} /> {meta.label}
                    </span>
                    <span className="text-[10px] text-white/35">{doc.dateLabel}</span>
                  </div>
                </div>

                {/* Total */}
                <p className="shrink-0 text-sm font-black text-white/75">{fmtMoney(doc.total)}</p>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => onPreviewDoc(doc)}
                    title="תצוגה מקדימה + הדפסה"
                    className="rounded-lg p-1.5 text-white/35 hover:bg-indigo-500/15 hover:text-indigo-400 transition"
                  >
                    <Eye size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onPreviewDoc(doc)}
                    title="הדפסה"
                    className="rounded-lg p-1.5 text-white/35 hover:bg-indigo-500/15 hover:text-indigo-400 transition"
                  >
                    <Printer size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onEditDoc(doc)}
                    title="עריכה"
                    className="rounded-lg p-1.5 text-white/35 hover:bg-amber-500/15 hover:text-amber-600 transition"
                  >
                    <Edit3 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {docs.length > 0 && (
        <div className="border-t border-white/[0.07] px-5 py-3 text-center">
          <Link
            href="/dashboard/billing"
            className="text-xs font-bold text-indigo-400 hover:underline"
          >
            פתח מרכז פיננסי מלא ←
          </Link>
        </div>
      )}
    </div>
  );
}
