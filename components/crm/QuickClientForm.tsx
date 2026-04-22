"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { createContactAction } from "@/app/actions/crm";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { clientCreateFormSchema } from "@/lib/validation/schemas/client";
import { FieldError } from "@/components/forms/FormWrapper";
import { inputClass } from "@/components/settings/settings-form-primitives";
import { useI18n } from "@/components/I18nProvider";

type Project = { id: string; name: string };

export default function QuickClientForm({ projects }: { projects: Project[] }) {
  const { t } = useI18n();
  const router = useRouter();
  const { pending, run } = useAsyncAction();
  const [errors, setErrors] = useState<Record<string, string>>({});

  return (
    <form
      className="grid gap-4 md:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const raw = {
          name: String(fd.get("name") ?? ""),
          email: String(fd.get("email") ?? ""),
          phone: String(fd.get("phone") ?? ""),
          status: String(fd.get("status") ?? "LEAD"),
          projectId: String(fd.get("projectId") ?? ""),
          value: String(fd.get("value") ?? ""),
          notes: String(fd.get("notes") ?? ""),
        };
        const parsed = clientCreateFormSchema.safeParse(raw);
        if (!parsed.success) {
          const next: Record<string, string> = {};
          for (const issue of parsed.error.issues) {
            const k = issue.path[0];
            if (typeof k === "string" && !next[k]) next[k] = issue.message;
          }
          setErrors(next);
          return;
        }
        setErrors({});
        void run(
          async () => {
            const f = new FormData();
            f.set("name", parsed.data.name);
            f.set("email", parsed.data.email ?? "");
            f.set("phone", parsed.data.phone ?? "");
            f.set("status", parsed.data.status);
            f.set("projectId", parsed.data.projectId ?? "");
            f.set("value", parsed.data.value ?? "");
            f.set("notes", parsed.data.notes ?? "");
            return createContactAction(f);
          },
          { successToast: "הלקוח נוסף", errorToast: "שמירת לקוח נכשלה" },
        ).then((r) => {
          if (r && typeof r === "object" && "ok" in r && (r as { ok: boolean }).ok) {
            (e.target as HTMLFormElement).reset();
            router.refresh();
          }
        });
      }}
    >
      <div className="md:col-span-2">
        <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[color:var(--ink-500)]">
          שם לקוח
        </label>
        <input name="name" className={inputClass} placeholder={t("crm.search")} required />
        <FieldError message={errors.name} />
      </div>
      <div>
        <label className="mb-1 block text-[11px] font-bold text-[color:var(--ink-500)]">אימייל</label>
        <input name="email" type="email" className={inputClass} dir="ltr" />
        <FieldError message={errors.email} />
      </div>
      <div>
        <label className="mb-1 block text-[11px] font-bold text-[color:var(--ink-500)]">טלפון</label>
        <input name="phone" type="tel" className={inputClass} />
        <FieldError message={errors.phone} />
      </div>
      <div>
        <label className="mb-1 block text-[11px] font-bold text-[color:var(--ink-500)]">סטטוס</label>
        <select name="status" className={inputClass} defaultValue="LEAD">
          {(["LEAD", "PROPOSAL", "ACTIVE", "CLOSED_WON", "CLOSED_LOST"] as const).map((s) => (
            <option key={s} value={s}>
              {t(`workspaceClients.status.${s}`)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-[11px] font-bold text-[color:var(--ink-500)]">פרויקט</label>
        <select name="projectId" className={inputClass} defaultValue="">
          <option value="">—</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div className="md:col-span-2">
        <label className="mb-1 block text-[11px] font-bold text-[color:var(--ink-500)]">
          {t("workspaceClients.editModal.valuePlaceholder")}
        </label>
        <input name="value" className={inputClass} inputMode="decimal" />
        <FieldError message={errors.value} />
      </div>
      <div className="md:col-span-2">
        <label className="mb-1 block text-[11px] font-bold text-[color:var(--ink-500)]">הערות</label>
        <textarea name="notes" rows={2} className={`${inputClass} min-h-[72px]`} />
        <FieldError message={errors.notes} />
      </div>
      <div className="flex justify-end md:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-2xl bg-[color:var(--axis-clients)] px-5 py-2.5 text-sm font-black text-white shadow-lg disabled:opacity-60"
        >
          {pending ? null : <Plus className="h-4 w-4" aria-hidden />}
          {pending ? "שומר…" : t("workspaceClients.addCta")}
        </button>
      </div>
    </form>
  );
}
