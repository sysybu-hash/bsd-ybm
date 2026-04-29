"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createProjectAction } from "@/app/actions/crm";
import { toastClientActionFeedback } from "@/lib/polish/action-response-toast";
import { inputClass, SubmitButton } from "@/components/settings/settings-form-primitives";

export default function QuickProjectForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <form
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        void (async () => {
          setPending(true);
          try {
            const r = await toastClientActionFeedback(() => createProjectAction(fd), {
              successMessage: "הפרויקט נוצר בהצלחה",
              loadingMessage: "יוצר פרויקט…",
            });
            if (r && typeof r === "object" && "ok" in r && (r as { ok: boolean }).ok) {
              (e.target as HTMLFormElement).reset();
              router.refresh();
            }
          } finally {
            setPending(false);
          }
        })();
      }}
    >
      <div className="sm:col-span-2">
        <label className="mb-1 block text-[11px] font-bold text-[color:var(--ink-500)]">שם פרויקט</label>
        <input name="name" className={inputClass} placeholder="לדוגמה: אתר רוממה" required />
      </div>
      <div>
        <label className="mb-1 block text-[11px] font-bold text-[color:var(--ink-500)]">תחילת תקופה</label>
        <input name="activeFrom" type="date" className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-[11px] font-bold text-[color:var(--ink-500)]">סיום מתוכנן</label>
        <input name="activeTo" type="date" className={inputClass} />
      </div>
      <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-[color:var(--ink-700)]">
          <input type="checkbox" name="isActive" value="on" defaultChecked className="rounded border-[color:var(--line-strong)]" />
          פרויקט פעיל
        </label>
        <div className="ms-auto">
          <SubmitButton busy={pending} label="פרויקט חדש" />
        </div>
      </div>
    </form>
  );
}
