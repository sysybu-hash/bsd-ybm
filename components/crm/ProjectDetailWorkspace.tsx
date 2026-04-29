"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil, Trash2, Users } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { deleteProjectAction, updateProjectAction } from "@/app/actions/crm";
import { toastClientActionFeedback } from "@/lib/polish/action-response-toast";
import { formatCurrencyILS } from "@/lib/ui-formatters";
import { inputClass, SubmitButton } from "@/components/settings/settings-form-primitives";
import { Surface } from "@/components/ui/claude";

type ContactRow = {
  id: string;
  name: string;
  status: string;
  value: number | null;
  totalBilled: number;
  totalPending: number;
};

type Props = {
  organizationId: string;
  project: {
    id: string;
    name: string;
    isActive: boolean;
    activeFrom: string | null;
    activeTo: string | null;
  };
  contacts: ContactRow[];
  expensesPostedTotal: number;
};

export default function ProjectDetailWorkspace({
  organizationId: _organizationId,
  project,
  contacts,
  expensesPostedTotal,
}: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [editing, setEditing] = useState(false);

  const activeFromInput = project.activeFrom ? project.activeFrom.slice(0, 10) : "";
  const activeToInput = project.activeTo ? project.activeTo.slice(0, 10) : "";

  return (
    <div className="space-y-8" dir="rtl">
      <div className="grid gap-3 sm:grid-cols-3">
        <Surface className="!p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[color:var(--ink-500)]">הוצאות (מאושרות)</p>
          <p className="mt-1 text-xl font-black tabular-nums text-[color:var(--axis-finance)]">
            {formatCurrencyILS(expensesPostedTotal)}
          </p>
          <Link href="/app/erp" className="mt-2 inline-block text-xs font-bold text-[color:var(--axis-finance)] hover:underline">
            ניהול בכספים
          </Link>
        </Surface>
        <Surface className="!p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[color:var(--ink-500)]">לקוחות בפרויקט</p>
          <p className="mt-1 text-xl font-black tabular-nums">{contacts.length}</p>
        </Surface>
        <Surface className="!p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[color:var(--ink-500)]">גבייה פתוחה</p>
          <p className="mt-1 text-xl font-black tabular-nums text-[color:var(--state-warning)]">
            {formatCurrencyILS(contacts.reduce((s, c) => s + c.totalPending, 0))}
          </p>
        </Surface>
      </div>

      <Surface className="!p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-black text-[color:var(--ink-900)]">פרטי פרויקט</h2>
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--line)] px-3 py-2 text-sm font-bold text-[color:var(--ink-700)] hover:bg-[color:var(--canvas-sunken)]"
          >
            <Pencil className="h-4 w-4" aria-hidden />
            {editing ? "סגירה" : "עריכה"}
          </button>
        </div>

        {editing ? (
          <form
            className="mt-5 grid gap-4 md:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              void (async () => {
                setPending(true);
                try {
                  const r = await toastClientActionFeedback(() => updateProjectAction(fd), {
                    successMessage: "פרטי הפרויקט עודכנו בהצלחה",
                    loadingMessage: "שומר…",
                  });
                  if (r && typeof r === "object" && "ok" in r && (r as { ok: boolean }).ok) {
                    setEditing(false);
                    router.refresh();
                  }
                } finally {
                  setPending(false);
                }
              })();
            }}
          >
            <input type="hidden" name="projectId" value={project.id} />
            <div className="md:col-span-2">
              <label className="mb-1 block text-[11px] font-bold text-[color:var(--ink-500)]">שם</label>
              <input name="name" className={inputClass} defaultValue={project.name} required />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold text-[color:var(--ink-500)]">תחילת תקופה</label>
              <input name="activeFrom" type="date" className={inputClass} defaultValue={activeFromInput} />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold text-[color:var(--ink-500)]">סיום מתוכנן</label>
              <input name="activeTo" type="date" className={inputClass} defaultValue={activeToInput} />
            </div>
            <div className="md:col-span-2 flex flex-wrap items-center gap-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-bold">
                <input
                  type="checkbox"
                  name="isActive"
                  value="on"
                  defaultChecked={project.isActive}
                  className="rounded border-[color:var(--line-strong)]"
                />
                פרויקט פעיל
              </label>
              <SubmitButton busy={pending} label="שמירה" />
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-black text-rose-800 hover:bg-rose-100 disabled:opacity-50"
                disabled={pending}
                onClick={() => {
                  if (!confirm("למחוק את הפרויקט? לקוחות יוסרו מהשיוך.")) return;
                  void (async () => {
                    setPending(true);
                    try {
                      const r = await toastClientActionFeedback(() => deleteProjectAction(project.id), {
                        successMessage: "הפרויקט נמחק מהמערכת",
                        loadingMessage: "מוחק…",
                      });
                      if (r && typeof r === "object" && "ok" in r && (r as { ok: boolean }).ok) {
                        router.push("/app/crm");
                        router.refresh();
                      }
                    } finally {
                      setPending(false);
                    }
                  })();
                }}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                מחיקה
              </button>
            </div>
          </form>
        ) : (
          <dl className="mt-4 grid gap-2 text-sm">
            <div className="flex justify-between gap-4 border-b border-[color:var(--line-subtle)] py-2">
              <dt className="text-[color:var(--ink-500)]">סטטוס</dt>
              <dd className="font-bold">{project.isActive ? "פעיל" : "ארכיון"}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-[color:var(--line-subtle)] py-2">
              <dt className="text-[color:var(--ink-500)]">תקופה</dt>
              <dd className="font-bold tabular-nums">
                {activeFromInput || "—"} — {activeToInput || "—"}
              </dd>
            </div>
          </dl>
        )}
      </Surface>

      <Surface className="!p-5">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-[color:var(--axis-clients)]" aria-hidden />
          <h2 className="text-lg font-black text-[color:var(--ink-900)]">לקוחות ועסקאות</h2>
        </div>
        {contacts.length === 0 ? (
          <EmptyState
            variant="bare"
            icon={Users}
            title="הפרויקט מחכה ללקוחות משויכים"
            description="הוסיפו לקוחות מהצנרת או קשרו לקוח קיים לפרויקט — כך תוכלו לעקוב אחרי צפי, גבייה והפקות במקום אחד."
            className="mt-4 rounded-xl border border-dashed border-slate-200/80 bg-slate-50/70 py-8"
          />
        ) : (
          <ul className="mt-4 divide-y divide-[color:var(--line-subtle)]">
            {contacts.map((c) => (
              <li key={c.id} className="py-3">
                <Link
                  href={`/app/crm/client/${encodeURIComponent(c.id)}`}
                  className="flex flex-wrap items-center justify-between gap-2 transition hover:text-[color:var(--axis-clients)]"
                >
                  <span className="font-black text-[color:var(--ink-900)]">{c.name}</span>
                  <span className="text-xs text-[color:var(--ink-500)]">{c.status}</span>
                  <span className="w-full text-xs text-[color:var(--ink-400)] sm:w-auto">
                    צפי {formatCurrencyILS(c.value ?? 0)}
                    {c.totalPending > 0 ? ` · פתוח ${formatCurrencyILS(c.totalPending)}` : null}
                    {c.totalBilled > 0 ? ` · הופק ${formatCurrencyILS(c.totalBilled)}` : null}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Surface>
    </div>
  );
}
