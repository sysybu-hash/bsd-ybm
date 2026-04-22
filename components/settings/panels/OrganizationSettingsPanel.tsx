"use client";

import { type FormEvent, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Building2, MailPlus } from "lucide-react";
import { updateOrganizationAction } from "@/app/actions/org-settings";
import { createOrganizationInviteAction } from "@/app/actions/organization-invite";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import type { SettingsHubOrganizationRecord, SettingsHubViewer } from "@/lib/settings-hub-server";
import {
  organizationIdentityFormSchema,
  organizationInviteFormSchema,
} from "@/lib/validation/schemas/organization";
import type { ZodIssue } from "zod";
import {
  inputClass,
  SectionCard,
  SubmitButton,
} from "@/components/settings/settings-form-primitives";
import { FieldError } from "@/components/forms/FormWrapper";

type Props = Readonly<{
  organization: SettingsHubOrganizationRecord;
  viewer: SettingsHubViewer;
}>;

function recordFirstIssues(issues: ZodIssue[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const iss of issues) {
    const key = iss.path.map(String).join(".") || "_form";
    if (out[key] == null) out[key] = iss.message;
  }
  return out;
}

export default function OrganizationSettingsPanel({ organization, viewer }: Props) {
  const router = useRouter();
  const { update } = useSession();
  const { pending: orgPending, run: runOrg } = useAsyncAction();
  const { pending: invitePending, run: runInvite } = useAsyncAction();
  const [orgErrors, setOrgErrors] = useState<Record<string, string>>({});
  const [inviteErrors, setInviteErrors] = useState<Record<string, string>>({});
  const canManage = viewer.canManageOrganization;

  return (
    <div className="grid gap-6" dir="rtl">
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
        <form
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            const raw = {
              name: String(formData.get("name") ?? ""),
              type: String(formData.get("type") ?? "HOME"),
              companyType: String(formData.get("companyType") ?? "LICENSED_DEALER"),
              taxId: String(formData.get("taxId") ?? ""),
              address: String(formData.get("address") ?? ""),
            };
            const parsed = organizationIdentityFormSchema.safeParse(raw);
            if (!parsed.success) {
              setOrgErrors(recordFirstIssues(parsed.error.issues));
              return;
            }
            setOrgErrors({});
            void runOrg(async () => updateOrganizationAction(formData), {
              successToast: "ההגדרות נשמרו",
              errorToast: "שמירת ההגדרות נכשלה",
            }).then((r) => {
              if (r && typeof r === "object" && "ok" in r && (r as { ok: boolean }).ok) {
                void update();
                router.refresh();
              }
            });
          }}
          className="grid gap-4 md:grid-cols-2"
        >
          <fieldset disabled={!canManage} className="contents">
            <div>
              <input name="name" defaultValue={organization.name} className={inputClass} placeholder="שם הארגון" required />
              <FieldError message={orgErrors.name} />
            </div>
            <div>
              <select name="type" defaultValue={organization.type} className={inputClass}>
                <option value="HOME">בית / יחיד</option>
                <option value="FREELANCER">פרילנס / עצמאי</option>
                <option value="COMPANY">חברה</option>
                <option value="ENTERPRISE">תאגיד</option>
              </select>
              <FieldError message={orgErrors.type} />
            </div>
            <div>
              <select name="companyType" defaultValue={organization.companyType} className={inputClass}>
                <option value="LICENSED_DEALER">עוסק מורשה</option>
                <option value="EXEMPT_DEALER">עוסק פטור</option>
                <option value="LTD_COMPANY">חברה בע&quot;מ</option>
              </select>
              <FieldError message={orgErrors.companyType} />
            </div>
            <div>
              <input name="taxId" defaultValue={organization.taxId ?? ""} className={inputClass} dir="ltr" placeholder="ח.פ / ע.מ" />
              <FieldError message={orgErrors.taxId} />
            </div>
            <div className="md:col-span-2">
              <input name="address" defaultValue={organization.address ?? ""} className={inputClass} placeholder="כתובת" />
              <FieldError message={orgErrors.address} />
            </div>
            <label className="flex items-center gap-3 rounded-2xl border border-[color:var(--line-strong)] bg-[color:var(--canvas-raised)] px-4 py-3 md:col-span-2">
              <input type="checkbox" name="isReportable" defaultChecked={organization.isReportable} />
              <span className="text-sm font-semibold">דיווח למע&quot;מ (לפי הגדרות המס)</span>
            </label>
            <div className="flex justify-end md:col-span-2">
              <SubmitButton busy={orgPending} disabled={!canManage} label={canManage ? "שמור" : "צפייה בלבד"} />
            </div>
          </fieldset>
        </form>
      </SectionCard>

      <SectionCard
        title="הזמנת חבר צוות"
        body="שליחת קישור הרשמה לארגון הקיים עם תפקיד מוגדר ותוקף מוגבל בזמן."
        icon={<MailPlus className="h-5 w-5" aria-hidden />}
      >
        <form
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            const raw = {
              email: String(formData.get("email") ?? ""),
              role: String(formData.get("role") ?? "EMPLOYEE"),
              validDays: String(formData.get("validDays") ?? "14"),
            };
            const parsed = organizationInviteFormSchema.safeParse(raw);
            if (!parsed.success) {
              setInviteErrors(recordFirstIssues(parsed.error.issues));
              return;
            }
            setInviteErrors({});
            void runInvite(async () => createOrganizationInviteAction(formData), {
              successToast: "ההזמנה נשלחה",
              errorToast: "שליחת ההזמנה נכשלה",
            }).then((r) => {
              if (r && typeof r === "object" && "ok" in r && (r as { ok: boolean }).ok) {
                (event.target as HTMLFormElement).reset();
                router.refresh();
              }
            });
          }}
          className="grid gap-4 md:grid-cols-[1.2fr_0.8fr_0.6fr]"
        >
          <fieldset disabled={!canManage} className="contents">
            <div>
              <input name="email" className={inputClass} dir="ltr" placeholder="team@example.com" required />
              <FieldError message={inviteErrors.email} />
            </div>
            <div>
              <select name="role" className={inputClass} defaultValue="EMPLOYEE">
                <option value="EMPLOYEE">עובד / צוות</option>
                <option value="PROJECT_MGR">מנהל פרויקטים</option>
                <option value="CLIENT">לקוח / צופה</option>
                <option value="ORG_ADMIN">מנהל ארגון</option>
              </select>
              <FieldError message={inviteErrors.role} />
            </div>
            <div>
              <select name="validDays" className={inputClass} defaultValue="14">
                <option value="7">7 ימים</option>
                <option value="14">14 ימים</option>
                <option value="30">30 ימים</option>
              </select>
              <FieldError message={inviteErrors.validDays} />
            </div>
            <div className="md:col-span-3 flex justify-end">
              <SubmitButton busy={invitePending} disabled={!canManage} label={canManage ? "שלח הזמנה" : "צפייה בלבד"} />
            </div>
          </fieldset>
        </form>
      </SectionCard>
    </div>
  );
}
