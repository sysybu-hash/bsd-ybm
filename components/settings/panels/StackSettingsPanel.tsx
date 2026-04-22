"use client";

import { type FormEvent, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Bot, Cloud, KeyRound } from "lucide-react";
import { updateAiConfigAction, updateMeckanoApiKeyAction } from "@/app/actions/org-settings";
import { useWorkspaceShellTransition } from "@/components/app-shell/WorkspaceShellTransition";
import CloudBackupPanel from "@/components/CloudBackupPanel";
import type {
  SettingsHubIntegrationRecord,
  SettingsHubOrganizationRecord,
  SettingsHubViewer,
} from "@/lib/settings-hub-server";
import {
  asRecord,
  asString,
  inputClass,
  SectionCard,
  SubmitButton,
} from "@/components/settings/settings-form-primitives";

type Busy = "ai" | "meckano" | null;
type ActionResult = { ok: boolean; error?: string };

type Props = Readonly<{
  organization: SettingsHubOrganizationRecord;
  integrations: SettingsHubIntegrationRecord[];
  meckanoEnabled: boolean;
  viewer: SettingsHubViewer;
}>;

export default function StackSettingsPanel({ organization, integrations, meckanoEnabled, viewer }: Props) {
  const router = useRouter();
  const { update } = useSession();
  const runWithShellTransition = useWorkspaceShellTransition();
  const [busySection, setBusySection] = useState<Busy>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const canManage = viewer.canManageOrganization;

  const industryConfig = asRecord(organization.industryConfigJson);
  const aiControl = asRecord(industryConfig.aiControl);

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

      <SectionCard title="מנועי AI" body="ספק ראשי, מודלים ומפתחות לארגון." icon={<Bot className="h-5 w-5" aria-hidden />}>
        <form onSubmit={submitWith("ai", updateAiConfigAction)} className="grid gap-4">
          <fieldset disabled={!canManage} className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <select name="ai_primary" defaultValue={asString(aiControl.primary, "gemini")} className={inputClass}>
                <option value="gemini">Gemini</option>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
              </select>
              <div className="rounded-2xl bg-[color:var(--canvas-sunken)] px-4 py-4 text-sm leading-7 text-[color:var(--ink-500)]">
                המנוע הראשי משפיע על סריקה, פענוח ועוזר.
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <input name="model_gemini" defaultValue={asString(asRecord(aiControl.gemini).model, "flash")} className={inputClass} placeholder="Gemini model" />
              <input name="model_openai" defaultValue={asString(asRecord(aiControl.openai).model, "gpt-5.4-turbo")} className={inputClass} placeholder="OpenAI model" />
              <input name="model_anthropic" defaultValue={asString(asRecord(aiControl.anthropic).model, "sonnet")} className={inputClass} placeholder="Anthropic model" />
              <input name="gemini_key" defaultValue={asString(asRecord(aiControl.gemini).key)} className={inputClass} dir="ltr" placeholder="Gemini API key" />
              <input name="openai_key" defaultValue={asString(asRecord(aiControl.openai).key)} className={inputClass} dir="ltr" placeholder="OpenAI API key" />
              <input name="anthropic_key" defaultValue={asString(asRecord(aiControl.anthropic).key)} className={inputClass} dir="ltr" placeholder="Anthropic API key" />
            </div>
            <div className="flex justify-end">
              <SubmitButton busy={busySection === "ai"} disabled={!canManage} label={canManage ? "שמור AI" : "צפייה בלבד"} />
            </div>
          </fieldset>
        </form>
      </SectionCard>

      <SectionCard title="חיבורי ענן" body="ספקים מחוברים — ניהול מלא ממסכי מסמכים ותפעול." icon={<Cloud className="h-5 w-5" aria-hidden />}>
        <div className="grid gap-3">
          {integrations.length === 0 ? (
            <p className="rounded-2xl bg-[color:var(--canvas-sunken)] px-4 py-4 text-sm text-[color:var(--ink-500)]">
              אין חיבורי ענן פעילים. ניתן להוסיף ממסמכים או מתפעול.
            </p>
          ) : null}
          {integrations.map((integration) => (
            <div key={integration.id} className="rounded-2xl bg-[color:var(--canvas-sunken)] px-4 py-4">
              <p className="font-black text-[color:var(--ink-900)]">{integration.displayName ?? integration.provider}</p>
              <p className="mt-2 text-sm text-[color:var(--ink-500)]">
                {integration.autoScan ? "סריקה אוטומטית" : "ללא סריקה אוטומטית"} · {integration.backupExports ? "גיבוי יצוא" : "ללא גיבוי יצוא"}
              </p>
            </div>
          ))}
        </div>
      </SectionCard>

      {meckanoEnabled ? (
        <SectionCard title="Meckano" body="מפתח API לארגון מורשה." icon={<KeyRound className="h-5 w-5" aria-hidden />}>
          <form onSubmit={submitWith("meckano", updateMeckanoApiKeyAction)} className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <fieldset disabled={!canManage} className="contents">
              <input name="meckanoApiKey" defaultValue={organization.meckanoApiKey ?? ""} className={inputClass} dir="ltr" placeholder="Meckano API key" />
              <SubmitButton busy={busySection === "meckano"} disabled={!canManage} label={canManage ? "שמור" : "צפייה"} />
            </fieldset>
          </form>
        </SectionCard>
      ) : null}

      <SectionCard title="גיבוי לענן" body="מדיניות גיבוי וייצוא — כפי שהוגדר במערכת." icon={<Cloud className="h-5 w-5" aria-hidden />}>
        <CloudBackupPanel />
      </SectionCard>
    </div>
  );
}
