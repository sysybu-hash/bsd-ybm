"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Mail, Phone, ReceiptText, Wallet } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { updateContactAction } from "@/app/actions/crm";
import { toastClientActionFeedback } from "@/lib/polish/action-response-toast";
import { inputClass, SubmitButton } from "@/components/settings/settings-form-primitives";
import { formatCurrencyILS, formatShortDate } from "@/lib/ui-formatters";
import { Surface } from "@/components/ui/claude";

const STATUS_OPTIONS = [
  { key: "LEAD", label: "ליד חדש" },
  { key: "ACTIVE", label: "בתהליך" },
  { key: "PROPOSAL", label: "הצעת מחיר" },
  { key: "CLOSED_WON", label: "נסגר בהצלחה" },
  { key: "CLOSED_LOST", label: "לא רלוונטי" },
] as const;

type Props = {
  contact: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    status: string;
    value: number | null;
    notes: string | null;
    project: { id: string; name: string } | null;
  };
  issuedDocuments: Array<{
    id: string;
    type: string;
    number: number;
    status: string;
    total: number;
    date: string;
  }>;
  expenses: Array<{
    id: string;
    vendorName: string;
    total: number;
    expenseDate: string;
    status: string;
    allocation: string;
  }>;
  totalBilled: number;
  totalPending: number;
  projectOptions: { id: string; name: string }[];
};

export default function ClientDetailWorkspace({
  contact,
  issuedDocuments,
  expenses,
  totalBilled,
  totalPending,
  projectOptions,
}: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  return (
    <div className="space-y-8" dir="rtl">
      <div className="grid gap-3 sm:grid-cols-3">
        <Surface className="!p-4">
          <p className="text-[11px] font-bold uppercase text-[color:var(--ink-500)]">גבייה פתוחה</p>
          <p className="mt-1 text-xl font-black tabular-nums text-[color:var(--state-warning)]">{formatCurrencyILS(totalPending)}</p>
        </Surface>
        <Surface className="!p-4">
          <p className="text-[11px] font-bold uppercase text-[color:var(--ink-500)]">סה״כ הופק</p>
          <p className="mt-1 text-xl font-black tabular-nums text-[color:var(--state-success)]">{formatCurrencyILS(totalBilled)}</p>
        </Surface>
        <Surface className="!p-4">
          <p className="text-[11px] font-bold uppercase text-[color:var(--ink-500)]">פרויקט</p>
          <p className="mt-1 text-sm font-black text-[color:var(--ink-900)]">
            {contact.project ? (
              <Link href={`/app/crm/project/${encodeURIComponent(contact.project.id)}`} className="text-[color:var(--axis-clients)] hover:underline">
                {contact.project.name}
              </Link>
            ) : (
              "—"
            )}
          </p>
        </Surface>
      </div>

      <Surface className="!p-5">
        <h2 className="text-lg font-black">פרטי קשר</h2>
        <div className="mt-4 space-y-2 text-sm">
          {contact.email ? (
            <p className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0" aria-hidden />
              <a href={`mailto:${contact.email}`} className="font-medium hover:underline" dir="ltr">
                {contact.email}
              </a>
            </p>
          ) : null}
          {contact.phone ? (
            <p className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0" aria-hidden />
              <a href={`tel:${contact.phone}`} className="font-medium hover:underline">
                {contact.phone}
              </a>
            </p>
          ) : null}
          {contact.notes ? <p className="mt-3 whitespace-pre-wrap text-[color:var(--ink-600)]">{contact.notes}</p> : null}
        </div>
        <button
          type="button"
          className="mt-4 text-sm font-black text-[color:var(--axis-clients)] hover:underline"
          onClick={() => setEditOpen((o) => !o)}
        >
          {editOpen ? "הסתרת טופס עריכה" : "עריכת לקוח"}
        </button>
        {editOpen ? (
          <form
            className="mt-4 grid gap-3 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              void (async () => {
                setPending(true);
                try {
                  const r = await toastClientActionFeedback(
                    () =>
                      updateContactAction({
                        contactId: contact.id,
                        name: String(fd.get("name") ?? ""),
                        email: String(fd.get("email") ?? ""),
                        phone: String(fd.get("phone") ?? ""),
                        status: String(fd.get("status") ?? "LEAD"),
                        projectId: String(fd.get("projectId") ?? ""),
                        value: String(fd.get("value") ?? ""),
                        notes: String(fd.get("notes") ?? ""),
                      }),
                    {
                      successMessage: "פרטי הלקוח עודכנו בהצלחה",
                      loadingMessage: "שומר…",
                    },
                  );
                  if (r && typeof r === "object" && "ok" in r && (r as { ok: boolean }).ok) {
                    setEditOpen(false);
                    router.refresh();
                  }
                } finally {
                  setPending(false);
                }
              })();
            }}
          >
            <div className="sm:col-span-2">
              <label className="mb-1 block text-[11px] font-bold text-[color:var(--ink-500)]">שם</label>
              <input name="name" className={inputClass} required defaultValue={contact.name} />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold text-[color:var(--ink-500)]">אימייל</label>
              <input
                name="email"
                type="email"
                className={inputClass}
                defaultValue={contact.email ?? ""}
                dir="ltr"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold text-[color:var(--ink-500)]">טלפון</label>
              <input name="phone" className={inputClass} defaultValue={contact.phone ?? ""} />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold text-[color:var(--ink-500)]">סטטוס</label>
              <select name="status" className={inputClass} defaultValue={contact.status}>
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold text-[color:var(--ink-500)]">צפי (₪)</label>
              <input
                name="value"
                className={inputClass}
                inputMode="decimal"
                defaultValue={contact.value != null ? String(contact.value) : ""}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-[11px] font-bold text-[color:var(--ink-500)]">פרויקט CRM</label>
              <select name="projectId" className={inputClass} defaultValue={contact.project?.id ?? ""}>
                <option value="">—</option>
                {projectOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-[11px] font-bold text-[color:var(--ink-500)]">הערות</label>
              <textarea name="notes" className={inputClass + " min-h-[100px]"} defaultValue={contact.notes ?? ""} />
            </div>
            <div className="sm:col-span-2">
              <SubmitButton busy={pending} label="שמירה" />
            </div>
          </form>
        ) : null}
      </Surface>

      <Surface className="!p-5">
        <div className="flex items-center gap-2">
          <ReceiptText className="h-5 w-5 text-[color:var(--axis-finance)]" aria-hidden />
          <h2 className="text-lg font-black">מסמכים מונפקים</h2>
        </div>
        {issuedDocuments.length === 0 ? (
          <EmptyState
            variant="bare"
            icon={ReceiptText}
            title="עדיין אין מסמכים משויכים ללקוח"
            description="כשתפיקו חשבונית או קבלה מהכספים עם שיוך ללקוח זה, הרשימה תתעדכן כאן אוטומטית."
            className="mt-4 rounded-xl border border-dashed border-slate-200/80 bg-slate-50/70 py-8"
          />
        ) : (
          <ul className="mt-4 divide-y divide-[color:var(--line-subtle)]">
            {issuedDocuments.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <span className="font-bold">
                  {d.type} #{d.number}
                </span>
                <span className="text-[color:var(--ink-500)]">{formatShortDate(d.date)}</span>
                <span>{d.status}</span>
                <span className="font-black tabular-nums">{formatCurrencyILS(d.total)}</span>
              </li>
            ))}
          </ul>
        )}
      </Surface>

      <Surface className="!p-5">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-[color:var(--axis-finance)]" aria-hidden />
          <h2 className="text-lg font-black">הוצאות משויכות ללקוח</h2>
        </div>
        {expenses.length === 0 ? (
          <EmptyState
            variant="bare"
            icon={Wallet}
            title="אין הוצאות משויכות ללקוח"
            description="קלטו הוצאות מהכספים או מסריקה ושייכו ללקוח — כך תראו כאן את התמונה המלאה."
            className="mt-4 rounded-xl border border-dashed border-slate-200/80 bg-slate-50/70 py-8"
          />
        ) : (
          <ul className="mt-4 divide-y divide-[color:var(--line-subtle)]">
            {expenses.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <span className="font-bold">{e.vendorName}</span>
                <span className="text-[color:var(--ink-500)]">{formatShortDate(e.expenseDate)}</span>
                <span className="text-xs">{e.status}</span>
                <span className="font-black tabular-nums">{formatCurrencyILS(e.total)}</span>
              </li>
            ))}
          </ul>
        )}
        <Link
          href="/app/erp?tab=expenses"
          className="mt-4 inline-block text-sm font-bold text-[color:var(--axis-finance)] hover:underline"
        >
          ניהול הוצאות בכספים
        </Link>
      </Surface>
    </div>
  );
}
