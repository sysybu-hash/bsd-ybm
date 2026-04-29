"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Download, FileStack, Loader2, PenLine } from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
import { SectionHeader, Surface } from "@/components/ui/claude";
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
  /** כותרת מותאמת למרכז AI ב־/app/scan */
  variant?: "default" | "aiHub";
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

export default function DocumentGeneratorsStrip({
  industryProfile,
  onDraftIssued,
  variant = "default",
}: Props) {
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

  const headingId = variant === "aiHub" ? "ai-hub-generators-heading" : "doc-generators-heading";

  const sectionTitle =
    variant === "aiHub" ? t("workspaceAiHub.hubGeneratorsAiTitle") : t("workspaceDocuments.generatorsTitle");
  const sectionSubtitle =
    variant === "aiHub" ? t("workspaceAiHub.hubGeneratorsAiSubtitle") : t("workspaceDocuments.generatorsSubtitle");

  return (
    <Surface className="overflow-hidden !p-6 sm:!p-8" aria-labelledby={headingId}>
      <p className="cd-eyebrow mb-3 inline-flex items-center gap-2 normal-case tracking-normal">
        <FileStack className="h-4 w-4 text-[color:var(--cd-accent)]" aria-hidden />
        {variant === "aiHub" ? t("workspaceAiHub.eyebrow") : industryProfile.documentsLabel}
      </p>
      <SectionHeader id={headingId} title={sectionTitle} subtitle={sectionSubtitle} />

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {templates.map((template) => {
          const issueMode = templateDraftMode(template) === "issue";
          const busy = isPending && pendingId === template.id;
          return (
            <div
              key={template.id}
              className="rounded-[var(--cd-radius)] border border-[color:var(--cd-line)] bg-[color:var(--cd-bg-raised)] px-4 py-4"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--cd-ink-mute)]">
                {kindGroup(template.kind, t)}
              </p>
              <p className="mt-2 text-sm font-semibold text-[color:var(--cd-ink)]">{template.label}</p>
              <p className="cd-mute mt-2 text-sm leading-relaxed">{template.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href={`/api/professional-template/pdf?templateId=${encodeURIComponent(template.id)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="cd-btn cd-btn-secondary"
                >
                  <Download className="h-3.5 w-3.5" aria-hidden />
                  {t("workspaceDocuments.generatorsCtaPdf")}
                </a>
                <button type="button" disabled={busy} onClick={() => handleTemplate(template.id)} className="cd-btn cd-btn-primary">
                  {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <PenLine className="h-3.5 w-3.5" aria-hidden />}
                  {issueMode ? t("workspaceDocuments.generatorsCtaIssue") : t("workspaceDocuments.generatorsCtaDraft")}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </Surface>
  );
}
