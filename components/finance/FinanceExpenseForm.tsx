"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createExpenseAction, updateExpenseAction } from "@/app/actions/expenses";
import { toastClientActionFeedback } from "@/lib/polish/action-response-toast";
import { inputClass, SubmitButton } from "@/components/settings/settings-form-primitives";
import type { FinanceSelectOption, FinanceExpenseRow } from "@/lib/finance-workspace-types";

type Props = {
  projects: FinanceSelectOption[];
  contacts: FinanceSelectOption[];
  mode?: "create" | "edit";
  initialRow?: FinanceExpenseRow;
  onEditDone?: () => void;
};

export default function FinanceExpenseForm({
  projects,
  contacts,
  mode = "create",
  initialRow,
  onEditDone,
}: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [allocation, setAllocation] = useState<"OFFICE" | "PROJECT" | "CLIENT">(
    () => (initialRow?.allocation as "OFFICE" | "PROJECT" | "CLIENT") || "OFFICE",
  );
  const isEdit = mode === "edit" && initialRow != null;

  const dateStr = initialRow ? initialRow.expenseDate.slice(0, 10) : undefined;

  return (
    <form
      className="grid gap-3 md:grid-cols-2 lg:grid-cols-3"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const act = isEdit ? updateExpenseAction : createExpenseAction;
        void (async () => {
          setPending(true);
          try {
            const r = await toastClientActionFeedback(
              async () => act(fd),
              {
                successMessage: isEdit ? "פרטי ההוצאה עודכנו בהצלחה" : "ההוצאה נשמרה בהצלחה",
                loadingMessage: "שומר הוצאה…",
                errorFallback: "שמירת ההוצאה נכשלה",
              },
            );
            if (r && typeof r === "object" && "ok" in r && (r as { ok: boolean }).ok) {
              if (!isEdit) {
                (e.target as HTMLFormElement).reset();
                setAllocation("OFFICE");
              } else onEditDone?.();
              router.refresh();
            }
          } finally {
            setPending(false);
          }
        })();
      }}
    >
      {isEdit ? <input type="hidden" name="id" value={initialRow.id} /> : null}
      <div>
        <label className="mb-1 block text-[11px] font-bold text-[color:var(--ink-500)]">ספק / מוציא</label>
        <input name="vendorName" className={inputClass} required defaultValue={initialRow?.vendorName} />
      </div>
      <div>
        <label className="mb-1 block text-[11px] font-bold text-[color:var(--ink-500)]">מספר חשבונית</label>
        <input
          name="invoiceNumber"
          className={inputClass}
          defaultValue={initialRow?.invoiceNumber ?? ""}
        />
      </div>
      <div>
        <label className="mb-1 block text-[11px] font-bold text-[color:var(--ink-500)]">תאריך</label>
        <input
          name="expenseDate"
          type="date"
          className={inputClass}
          required
          defaultValue={dateStr}
        />
      </div>
      <div>
        <label className="mb-1 block text-[11px] font-bold text-[color:var(--ink-500)]">סכום לפני מע״מ</label>
        <input
          name="amountNet"
          className={inputClass}
          inputMode="decimal"
          required
          defaultValue={initialRow != null ? String(initialRow.amountNet) : undefined}
        />
      </div>
      <div>
        <label className="mb-1 block text-[11px] font-bold text-[color:var(--ink-500)]">מע״מ</label>
        <input
          name="vat"
          className={inputClass}
          inputMode="decimal"
          defaultValue={initialRow != null ? String(initialRow.vat) : "0"}
        />
      </div>
      <div>
        <label className="mb-1 block text-[11px] font-bold text-[color:var(--ink-500)]">סה״כ</label>
        <input
          name="total"
          className={inputClass}
          inputMode="decimal"
          placeholder="אוטומטי אם ריק"
          defaultValue={initialRow != null ? String(initialRow.total) : undefined}
        />
      </div>
      <div className="md:col-span-2 lg:col-span-3">
        <label className="mb-1 block text-[11px] font-bold text-[color:var(--ink-500)]">תיאור</label>
        <input
          name="description"
          className={inputClass}
          defaultValue={initialRow?.description ?? ""}
        />
      </div>
      <div>
        <label className="mb-1 block text-[11px] font-bold text-[color:var(--ink-500)]">שיוך</label>
        <select
          name="allocation"
          className={inputClass}
          value={allocation}
          onChange={(e) => setAllocation(e.target.value as typeof allocation)}
        >
          <option value="OFFICE">הוצאות משרד</option>
          <option value="PROJECT">פרויקט</option>
          <option value="CLIENT">לקוח</option>
        </select>
      </div>
      {allocation === "PROJECT" ? (
        <div>
          <label className="mb-1 block text-[11px] font-bold text-[color:var(--ink-500)]">פרויקט</label>
          <select
            name="projectId"
            className={inputClass}
            required={allocation === "PROJECT"}
            defaultValue={initialRow?.projectId ?? ""}
          >
            <option value="">—</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      {allocation === "CLIENT" ? (
        <div>
          <label className="mb-1 block text-[11px] font-bold text-[color:var(--ink-500)]">לקוח</label>
          <select
            name="contactId"
            className={inputClass}
            required={allocation === "CLIENT"}
            defaultValue={initialRow?.contactId ?? ""}
          >
            <option value="">—</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <div>
        <label className="mb-1 block text-[11px] font-bold text-[color:var(--ink-500)]">סטטוס</label>
        <select
          name="status"
          className={inputClass}
          defaultValue={initialRow?.status ?? "POSTED"}
        >
          <option value="POSTED">מאושר</option>
          <option value="DRAFT">טיוטה</option>
        </select>
      </div>
      <div className="flex items-end md:col-span-2 lg:col-span-3">
        <SubmitButton busy={pending} label={isEdit ? "עדכון הוצאה" : "שמירת הוצאה"} />
      </div>
    </form>
  );
}
