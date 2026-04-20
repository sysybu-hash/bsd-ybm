"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Download, FileStack, Loader2, PenLine } from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
import { createDraftFromProfessionalTemplateAction } from "@/app/actions/professional-documents";
import type { IndustryProfile, ProfessionalTemplateKind } from "@/lib/professions/runtime";
import { templateDraftMode } from "@/lib/professional-template-draft";

type IssuedPayload = {
  id: string;
  type: string;
  number: number;
  date: string;
  dueDate: string | null;
  clientName: string;
  amount: number;
  vat: number;
  total: number;
  status: string;
  items: Array<{ desc?: string; qty?: number; price?: number }>;
  contactId: string | null;
};

type Props = {
  industryProfile: IndustryProfile;
  onDraftIssued: (issued: IssuedPayload) => void;
};

function kindGroup(kind: ProfessionalTemplateKind, t: (k: string) => string): string {
  switch (kind) {
    case "OFFICIAL":
      return t("workspaceDocuments.generatorsKindOfficial");
    case "REPORT":
      return t("workspaceDocuments.generatorsKindReport");
    default:
      return t("workspaceDocuments.generatorsKindOther");
  }
}

export default function DocumentGeneratorsStrip({ industryProfile, onDraftIssued }: Props) {
  const { t } = useI18n();
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleTemplate(templateId: string) {
    setPendingId(templateId);
    startTransition(async () => {
      const result = await createDraftFromProfessionalTemplateAction(templateId);
      setPendingId(null);
      if (!result.ok) {
        window.alert(result.error);
        return;
      }
      if (result.mode === "issue") {
        router.push("/app/documents/issue");
        return;
      }
      onDraftIssued(result.issued);
      router.refresh();
    });
  }

  const templates = industryProfile.templates;

  return (
    <section className="v2-panel v2-panel-soft overflow-hidden p-6 sm:p-8" aria-labelledby="doc-generators-heading">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="v2-eyebrow inline-flex items-center gap-2">
            <FileStack className="h-4 w-4 text-[color:var(--v2-accent)]" aria-hidden />
            {industryProfile.documentsLabel}
          </span>
          <h2 id="doc-generators-heading" className="mt-3 text-xl font-black text-[color:var(--v2-ink)] sm:text-2xl">
            {t("workspaceDocuments.generatorsTitle")}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-[color:var(--v2-muted)]">{t("workspaceDocuments.generatorsSubtitle")}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {templates.map((template) => {
          const issueMode = templateDraftMode(template) === "issue";
          const busy = isPending && pendingId === template.id;
          return (
            <div key={template.id} className="rounded-2xl border border-[color:var(--v2-line)] bg-white/88 px-4 py-4">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[color:var(--v2-muted)]">
                {kindGroup(template.kind, t)}
              </p>
              <p className="mt-2 font-black text-[color:var(--v2-ink)]">{template.label}</p>
              <p className="mt-2 text-sm leading-6 text-[color:var(--v2-muted)]">{template.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href={`/api/professional-template/pdf?templateId=${encodeURIComponent(template.id)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-2xl border border-[color:var(--v2-line)] bg-white/90 px-4 py-2 text-sm font-black text-[color:var(--v2-ink)] transition hover:border-[color:var(--v2-accent)]"
                >
                  <Download className="h-4 w-4 text-[color:var(--v2-accent)]" aria-hidden />
                  {t("workspaceDocuments.generatorsCtaPdf")}
                </a>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleTemplate(template.id)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[color:var(--v2-accent-soft)] px-4 py-2 text-sm font-black text-[color:var(--v2-accent-strong)] transition hover:bg-[color:var(--v2-accent)]/20 disabled:opacity-60"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <PenLine className="h-4 w-4" aria-hidden />}
                  {issueMode ? t("workspaceDocuments.generatorsCtaIssue") : t("workspaceDocuments.generatorsCtaDraft")}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
