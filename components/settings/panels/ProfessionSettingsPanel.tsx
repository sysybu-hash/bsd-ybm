"use client";

import { type FormEvent, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness } from "lucide-react";
import { updateIndustryProfileAction } from "@/app/actions/org-settings";
import { useWorkspaceShellTransition } from "@/components/app-shell/WorkspaceShellTransition";
import { useI18n } from "@/components/I18nProvider";
import { mergeConstructionTradeLabel } from "@/lib/construction-trades-i18n";
import { CONSTRUCTION_TRADE_IDS, constructionTradeLabelHe } from "@/lib/construction-trades";
import { getIndustryProfile } from "@/lib/professions/runtime";
import type { SettingsHubOrganizationRecord, SettingsHubViewer } from "@/lib/settings-hub-server";
import {
  asRecord,
  asString,
  inputClass,
  SectionCard,
  SubmitButton,
} from "@/components/settings/settings-form-primitives";

type Busy = "profession" | null;
type ActionResult = { ok: boolean; error?: string };

type Props = Readonly<{
  organization: SettingsHubOrganizationRecord;
  viewer: SettingsHubViewer;
}>;

export default function ProfessionSettingsPanel({ organization, viewer }: Props) {
  const router = useRouter();
  const { update } = useSession();
  const { messages, t } = useI18n();
  const runWithShellTransition = useWorkspaceShellTransition();
  const [busySection, setBusySection] = useState<Busy>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const canManage = viewer.canManageOrganization;

  const industryConfig = asRecord(organization.industryConfigJson);
  const customLabels = asRecord(industryConfig.customLabels);

  const profile = useMemo(
    () =>
      getIndustryProfile(
        organization.industry,
        organization.industryConfigJson,
        organization.constructionTrade,
        messages,
      ),
    [organization.industry, organization.industryConfigJson, organization.constructionTrade, messages],
  );

  const tradeSelectOptions = useMemo(
    () =>
      CONSTRUCTION_TRADE_IDS.map((id) => ({
        id,
        label: mergeConstructionTradeLabel(messages, id, constructionTradeLabelHe(id)),
      })),
    [messages],
  );

  function submitWith(section: Exclude<Busy, null>, action: (fd: FormData) => Promise<ActionResult>) {
    return (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      setBusySection(section);
      setMessage(null);
      runWithShellTransition(async () => {
        try {
          const result = await action(formData);
          if (!result.ok) {
            setMessage({ type: "error", text: result.error ?? "שמירת ההגדרות נכשלה." });
            return;
          }
          setMessage({ type: "success", text: "ההגדרות נשמרו." });
          await update();
          router.refresh();
        } finally {
          setBusySection(null);
        }
      });
    };
  }

  return (
    <div className="grid gap-6" dir="rtl">
      {message ? (
        <div
          className={`rounded-[24px] border px-5 py-4 text-sm font-semibold ${
            message.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      {!canManage ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          צפייה בכל השדות זמינה; שמירה רק למנהל ארגון או למנהל פלטפורמה.
        </div>
      ) : null}

      <SectionCard
        title="מקצוע ושפת ממשק"
        body="התאמת תוויות, מילים ותבניות לפי תחום הפעילות."
        icon={<BriefcaseBusiness className="h-5 w-5" aria-hidden />}
      >
        <form onSubmit={submitWith("profession", updateIndustryProfileAction)} className="grid gap-4">
          <fieldset disabled={!canManage} className="grid gap-4">
            <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/70 px-4 py-3 text-sm leading-7 text-[color:var(--ink-900)]">
              <p>{t("settings.tradeAdaptHint")}</p>
              <p className="mt-2 text-xs text-[color:var(--ink-500)]">{t("settings.tradeSaveRefreshHint")}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-[color:var(--line)] bg-white/90 px-4 py-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[color:var(--ink-500)]">ענף</p>
                <p className="mt-2 font-black text-[color:var(--ink-900)]">בנייה ומקצועות נלווים</p>
              </div>
              <label className="grid gap-2">
                <span className="text-xs font-black text-[color:var(--ink-500)]">התמחות</span>
                <select name="constructionTrade" defaultValue={organization.constructionTrade} className={inputClass} required>
                  {tradeSelectOptions.map(({ id, label: optLabel }) => (
                    <option key={id} value={id}>
                      {optLabel}
                    </option>
                  ))}
                </select>
              </label>
              <div className="rounded-2xl bg-[color:var(--canvas-sunken)] px-4 py-4 md:col-span-2">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[color:var(--ink-500)]">פרופיל</p>
                <p className="mt-2 font-black text-[color:var(--ink-900)]">{profile.industryLabel}</p>
                <p className="mt-2 text-sm text-[color:var(--ink-500)]">{profile.homeDescription}</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <input name="customClientsLabel" defaultValue={asString(customLabels.clients, profile.clientsLabel)} className={inputClass} placeholder="כותרת ללקוחות" />
              <input name="customDocumentsLabel" defaultValue={asString(customLabels.documents, profile.documentsLabel)} className={inputClass} placeholder="כותרת למסמכים" />
              <input name="customRecordsLabel" defaultValue={asString(customLabels.records, profile.recordsLabel)} className={inputClass} placeholder="כותרת לרשומות" />
              <input name="customClientWord" defaultValue={asString(customLabels.client, profile.vocabulary.client)} className={inputClass} placeholder="מילה ללקוח" />
              <input name="customProjectWord" defaultValue={asString(customLabels.project, profile.vocabulary.project)} className={inputClass} placeholder="מילה לפרויקט" />
              <input name="customDocumentWord" defaultValue={asString(customLabels.document, profile.vocabulary.document)} className={inputClass} placeholder="מילה למסמך" />
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-3xl border border-[color:var(--line)] bg-white/88 p-4">
                <p className="text-sm font-black text-[color:var(--ink-900)]">פענוחי AI</p>
                <div className="mt-4 grid gap-3">
                  {profile.analysisTypes.map((analysis) => (
                    <div key={analysis.id} className="rounded-2xl bg-[color:var(--canvas-sunken)] px-4 py-4">
                      <p className="font-black text-[color:var(--ink-900)]">{analysis.label}</p>
                      <p className="mt-2 text-sm text-[color:var(--ink-500)]">{analysis.description}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-3xl border border-[color:var(--line)] bg-white/88 p-4">
                <p className="text-sm font-black text-[color:var(--ink-900)]">תבניות</p>
                <div className="mt-4 grid gap-3">
                  {profile.templates.map((template) => (
                    <div key={template.id} className="rounded-2xl bg-[color:var(--canvas-sunken)] px-4 py-4">
                      <p className="font-black text-[color:var(--ink-900)]">{template.label}</p>
                      <p className="mt-2 text-sm text-[color:var(--ink-500)]">{template.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <SubmitButton busy={busySection === "profession"} disabled={!canManage} label={canManage ? "שמור התאמה מקצועית" : "צפייה בלבד"} />
            </div>
          </fieldset>
        </form>
      </SectionCard>
    </div>
  );
}
