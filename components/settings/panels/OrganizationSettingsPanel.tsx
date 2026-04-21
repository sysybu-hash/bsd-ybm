"use client";

import { type FormEvent, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Building2, MailPlus } from "lucide-react";
import { updateOrganizationAction } from "@/app/actions/org-settings";
import { createOrganizationInviteAction } from "@/app/actions/organization-invite";
import { useWorkspaceShellTransition } from "@/components/app-shell/WorkspaceShellTransition";
import type { SettingsHubOrganizationRecord, SettingsHubViewer } from "@/lib/settings-hub-server";
import {
  inputClass,
  SectionCard,
  SubmitButton,
} from "@/components/settings/settings-form-primitives";

type Busy = "organization" | "invite" | null;
type ActionResult = { ok: boolean; error?: string };

type Props = Readonly<{
  organization: SettingsHubOrganizationRecord;
  viewer: SettingsHubViewer;
}>;

export default function OrganizationSettingsPanel({ organization, viewer }: Props) {
  const router = useRouter();
  const { update } = useSession();
  const runWithShellTransition = useWorkspaceShellTransition();
  const [busySection, setBusySection] = useState<Busy>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const canManage = viewer.canManageOrganization;

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
        title="זהות ארגונית"
        body="שם, סוג ישות, ח.פ וכתובת — כפי שיופיעו במסמכים."
        icon={<Building2 className="h-5 w-5" aria-hidden />}
      >
        <form onSubmit={submitWith("organization", updateOrganizationAction)} className="grid gap-4 md:grid-cols-2">
          <fieldset disabled={!canManage} className="contents">
            <input name="name" defaultValue={organization.name} className={inputClass} placeholder="שם הארגון" required />
            <select name="type" defaultValue={organization.type} className={inputClass}>
              <option value="HOME">בית / יחיד</option>
              <option value="FREELANCER">פרילנס / עצמאי</option>
              <option value="COMPANY">חברה</option>
              <option value="ENTERPRISE">תאגיד</option>
            </select>
            <select name="companyType" defaultValue={organization.companyType} className={inputClass}>
              <option value="LICENSED_DEALER">עוסק מורשה</option>
              <option value="EXEMPT_DEALER">עוסק פטור</option>
              <option value="LTD_COMPANY">חברה בע&quot;מ</option>
            </select>
            <input name="taxId" defaultValue={organization.taxId ?? ""} className={inputClass} dir="ltr" placeholder="ח.פ / ע.מ" />
            <input name="address" defaultValue={organization.address ?? ""} className={`${inputClass} md:col-span-2`} placeholder="כתובת" />
            <label className="flex items-center gap-3 rounded-2xl border border-[color:var(--v2-line)] bg-white/88 px-4 py-3 md:col-span-2">
              <input type="checkbox" name="isReportable" defaultChecked={organization.isReportable} />
              <span className="text-sm font-semibold">דיווח למע&quot;מ (לפי הגדרות המס)</span>
            </label>
            <div className="flex justify-end md:col-span-2">
              <SubmitButton busy={busySection === "organization"} disabled={!canManage} label={canManage ? "שמור" : "צפייה בלבד"} />
            </div>
          </fieldset>
        </form>
      </SectionCard>

      <SectionCard
        title="הזמנת חבר צוות"
        body="שליחת קישור הרשמה לארגון הקיים עם תפקיד מוגדר ותוקף מוגבל בזמן."
        icon={<MailPlus className="h-5 w-5" aria-hidden />}
      >
        <form onSubmit={submitWith("invite", createOrganizationInviteAction)} className="grid gap-4 md:grid-cols-[1.2fr_0.8fr_0.6fr]">
          <fieldset disabled={!canManage} className="contents">
            <input name="email" className={inputClass} dir="ltr" placeholder="team@example.com" required />
            <select name="role" className={inputClass} defaultValue="EMPLOYEE">
              <option value="EMPLOYEE">עובד / צוות</option>
              <option value="PROJECT_MGR">מנהל פרויקטים</option>
              <option value="CLIENT">לקוח / צופה</option>
              <option value="ORG_ADMIN">מנהל ארגון</option>
            </select>
            <select name="validDays" className={inputClass} defaultValue="14">
              <option value="7">7 ימים</option>
              <option value="14">14 ימים</option>
              <option value="30">30 ימים</option>
            </select>
            <div className="md:col-span-3 flex justify-end">
              <SubmitButton busy={busySection === "invite"} disabled={!canManage} label={canManage ? "שלח הזמנה" : "צפייה בלבד"} />
            </div>
          </fieldset>
        </form>
      </SectionCard>
    </div>
  );
}
