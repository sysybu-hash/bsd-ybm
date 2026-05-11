"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { updateContactAction, deleteContactAction } from "@/app/actions/crm";
import { FieldError } from "@/components/forms/FormWrapper";
import { useI18n } from "@/components/I18nProvider";
import PortalToBody, { WORKSPACE_OVERLAY_Z_CLASS } from "@/components/portal/PortalToBody";
import { inputClass, SubmitButton } from "@/components/settings/settings-form-primitives";
import { toastClientActionFeedback } from "@/lib/polish/action-response-toast";
import { clientUpdateFormSchema } from "@/lib/validation/schemas/client";
import { ALL_STATUS_OPTIONS } from "./clients-workspace-constants";
import type { ClientRecord, ProjectRecord } from "./clients-workspace-types";

type Props = {
  contact: ClientRecord;
  projects: ProjectRecord[];
  onClose: () => void;
};

export default function ClientsWorkspaceEditContactModal({ contact, projects, onClose }: Props) {
  const router = useRouter();
  const { t } = useI18n();
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  return (
    <PortalToBody>
      <div className={`fixed inset-0 ${WORKSPACE_OVERLAY_Z_CLASS} flex items-end justify-center sm:items-center`} dir="rtl">
        <button
          type="button"
          className="absolute inset-0 bg-[color:var(--ink-900)]/50 backdrop-blur-sm"
          aria-label={t("workspaceClients.editModal.closeAria")}
          onClick={onClose}
        />
        <div className="relative z-10 m-4 w-full max-w-2xl rounded-2xl border border-[color:var(--line-strong)] bg-[color:var(--canvas-raised)] p-6 shadow-xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[color:var(--ink-400)]">
                {t("workspaceClients.editModal.eyebrow")}
              </p>
              <h2 className="mt-1 text-xl font-black text-[color:var(--ink-900)]">{t("workspaceClients.editModal.title")}</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[color:var(--line)] px-3 py-1.5 text-sm font-bold text-[color:var(--ink-600)] hover:bg-[color:var(--canvas-sunken)]"
            >
              ✕
            </button>
          </div>

          <form
            className="mt-5 grid gap-4 md:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const raw = {
                contactId: contact.id,
                name: String(fd.get("name") ?? ""),
                email: String(fd.get("email") ?? ""),
                phone: String(fd.get("phone") ?? ""),
                status: String(fd.get("status") ?? "LEAD"),
                projectId: String(fd.get("projectId") ?? ""),
                value: String(fd.get("value") ?? ""),
                notes: String(fd.get("notes") ?? ""),
              };
              const parsed = clientUpdateFormSchema.safeParse(raw);
              if (!parsed.success) {
                const next: Record<string, string> = {};
                for (const issue of parsed.error.issues) {
                  const k = issue.path[0];
                  if (typeof k === "string" && next[k] == null) next[k] = issue.message;
                }
                setErrors(next);
                return;
              }
              setErrors({});
              void (async () => {
                setPending(true);
                try {
                  const r = await toastClientActionFeedback(
                    () =>
                      updateContactAction({
                        contactId: parsed.data.contactId,
                        name: parsed.data.name,
                        email: parsed.data.email ?? "",
                        phone: parsed.data.phone ?? "",
                        status: parsed.data.status,
                        projectId: parsed.data.projectId ?? "",
                        value: parsed.data.value ?? "",
                        notes: parsed.data.notes ?? "",
                      }),
                    {
                      successMessage: "פרטי הלקוח עודכנו בהצלחה",
                      loadingMessage: "שומר…",
                    },
                  );
                  if (r && typeof r === "object" && "ok" in r && (r as { ok: boolean }).ok) {
                    router.refresh();
                    onClose();
                  }
                } finally {
                  setPending(false);
                }
              })();
            }}
          >
            <div className="md:col-span-2">
              <label className="mb-1 block text-[11px] font-bold text-[color:var(--ink-500)]">שם לקוח</label>
              <input name="name" defaultValue={contact.name} className={inputClass} required />
              <FieldError message={errors.name} />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold text-[color:var(--ink-500)]">אימייל</label>
              <input name="email" type="email" defaultValue={contact.email ?? ""} className={inputClass} dir="ltr" />
              <FieldError message={errors.email} />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold text-[color:var(--ink-500)]">טלפון</label>
              <input name="phone" type="tel" defaultValue={contact.phone ?? ""} className={inputClass} />
              <FieldError message={errors.phone} />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold text-[color:var(--ink-500)]">סטטוס</label>
              <select name="status" defaultValue={contact.status} className={inputClass}>
                {ALL_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {t(`workspaceClients.status.${s}`)}
                  </option>
                ))}
              </select>
              <FieldError message={errors.status} />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold text-[color:var(--ink-500)]">פרויקט</label>
              <select name="projectId" defaultValue={contact.project?.id ?? ""} className={inputClass}>
                <option value="">—</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <FieldError message={errors.projectId} />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-[11px] font-bold text-[color:var(--ink-500)]">
                {t("workspaceClients.editModal.valuePlaceholder")}
              </label>
              <input
                name="value"
                defaultValue={contact.value != null ? String(contact.value) : ""}
                className={inputClass}
                inputMode="decimal"
              />
              <FieldError message={errors.value} />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-[11px] font-bold text-[color:var(--ink-500)]">
                {t("workspaceClients.editModal.notesPlaceholder")}
              </label>
              <textarea name="notes" defaultValue={contact.notes ?? ""} rows={3} className={`${inputClass} min-h-[88px]`} />
              <FieldError message={errors.notes} />
            </div>
            <div className="flex flex-wrap justify-end gap-2 pt-2 md:col-span-2">
              <button
                type="button"
                onClick={() => {
                  if (!confirm(t("workspaceClients.editModal.deleteConfirm", { name: contact.name }))) return;
                  void (async () => {
                    setPending(true);
                    try {
                      const r = await toastClientActionFeedback(() => deleteContactAction(contact.id), {
                        successMessage: "הלקוח הוסר מהמערכת",
                        loadingMessage: "מוחק…",
                      });
                      if (r && typeof r === "object" && "ok" in r && (r as { ok: boolean }).ok) {
                        router.refresh();
                        onClose();
                      }
                    } finally {
                      setPending(false);
                    }
                  })();
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-black text-rose-800 hover:bg-rose-100 disabled:opacity-60"
                disabled={pending}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                {t("workspaceClients.editModal.delete")}
              </button>
              <SubmitButton busy={pending} label={t("workspaceClients.editModal.save")} />
            </div>
          </form>
        </div>
      </div>
    </PortalToBody>
  );
}
