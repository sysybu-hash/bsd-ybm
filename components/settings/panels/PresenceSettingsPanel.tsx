"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { CreditCard, Globe } from "lucide-react";
import { updateBillingConnectionsAction, updateTenantPortalAction } from "@/app/actions/org-settings";
import { useWorkspaceShellTransition } from "@/components/app-shell/WorkspaceShellTransition";
import { settingsHubPath } from "@/lib/settings-hub-nav";
import { tierAllowance, tierLabelHe } from "@/lib/subscription-tier-config";
import type { SettingsHubOrganizationRecord, SettingsHubViewer } from "@/lib/settings-hub-server";
import {
  inputClass,
  jsonValue,
  SectionCard,
  SubmitButton,
  textareaClass,
} from "@/components/settings/settings-form-primitives";

type Busy = "portal" | "billing" | null;
type ActionResult = { ok: boolean; error?: string };

type Props = Readonly<{
  organization: SettingsHubOrganizationRecord;
  viewer: SettingsHubViewer;
}>;

export default function PresenceSettingsPanel({ organization, viewer }: Props) {
  const router = useRouter();
  const { update } = useSession();
  const runWithShellTransition = useWorkspaceShellTransition();
  const [busySection, setBusySection] = useState<Busy>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const canManage = viewer.canManageOrganization;
  const allowance = tierAllowance(organization.subscriptionTier);

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
        title="פורטל ומיתוג"
        body="דומיין ציבורי, מיתוג JSON ויומן — איך הנכס הדיגיטלי שלך נראה מבחוץ."
        icon={<Globe className="h-5 w-5" aria-hidden />}
      >
        <form onSubmit={submitWith("portal", updateTenantPortalAction)} className="grid gap-4">
          <fieldset disabled={!canManage} className="grid gap-4">
            <input
              name="tenantPublicDomain"
              defaultValue={organization.tenantPublicDomain ?? ""}
              className={inputClass}
              dir="ltr"
              placeholder="portal.example.co.il"
            />
            <label className="flex items-center gap-3 rounded-2xl border border-[color:var(--line)] bg-white/88 px-4 py-3 text-sm font-semibold text-[color:var(--ink-900)]">
              <input type="checkbox" name="calendarGoogleEnabled" defaultChecked={organization.calendarGoogleEnabled} />
              הפעל חיבור יומן Google
            </label>
            <textarea
              name="tenantSiteBrandingJson"
              defaultValue={jsonValue(organization.tenantSiteBrandingJson)}
              className={textareaClass}
              spellCheck={false}
              placeholder={`{\n  "landingTitle": "..."\n}`}
            />
            <div className="flex justify-end">
              <SubmitButton busy={busySection === "portal"} disabled={!canManage} label={canManage ? "שמור פורטל" : "צפייה בלבד"} />
            </div>
          </fieldset>
        </form>
      </SectionCard>

      <SectionCard
        title="מנוי פלטפורמה (BSD-YBM)"
        body="שינוי מסלול, תשלום ושליטה פלטפורמית — רק בעמוד «מנויים וחיוב». כאן תצוגה בלבד."
        icon={<CreditCard className="h-5 w-5" aria-hidden />}
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-[color:var(--line)] bg-white/88 px-4 py-4">
            <p className="font-black text-[color:var(--ink-900)]">
              {tierLabelHe(organization.subscriptionTier)} · {organization.subscriptionStatus}
            </p>
            <p className="mt-2 text-sm text-[color:var(--ink-500)]">
              מכסה: {allowance.cheapScans} זולות · {allowance.premiumScans} פרימיום ·{" "}
              {allowance.unlimitedCompanies ? "ללא הגבלת חברות" : `עד ${allowance.maxCompanies}`}
            </p>
            <Link href={settingsHubPath("billing")} className="inline-flex items-center gap-2 rounded-lg bg-[color:var(--ink-900)] px-4 py-2 text-sm font-black text-white mt-4 inline-flex w-fit">
              מעבר למנויים וחיוב
            </Link>
          </div>
          <div className="rounded-2xl border border-dashed border-[color:var(--line)] bg-[color:var(--canvas-sunken)]/80 px-4 py-4 text-sm leading-7 text-[color:var(--ink-500)]">
            <p className="font-bold text-[color:var(--ink-900)]">הפרדה</p>
            <p className="mt-2">
              מנוי BSD-YBM (למעלה) אינו אותו דבר כמו פרטי PayPal בהמשך — אלה ל<strong>גבייה מהלקוחות שלך</strong>.
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="גבייה מול לקוחות"
        body="חשבון PayPal ומפתח live-data לשימוש במסמכים ובפורטל — לא לתשלום על BSD-YBM."
        icon={<CreditCard className="h-5 w-5" aria-hidden />}
      >
        <form onSubmit={submitWith("billing", updateBillingConnectionsAction)} className="grid max-w-xl gap-4">
          <fieldset disabled={!canManage} className="grid gap-4">
            <input name="paypalMerchantEmail" defaultValue={organization.paypalMerchantEmail ?? ""} className={inputClass} dir="ltr" placeholder="billing@example.com" />
            <input name="paypalMeSlug" defaultValue={organization.paypalMeSlug ?? ""} className={inputClass} dir="ltr" placeholder="paypal.me/..." />
            <label className="grid gap-2">
              <span className="text-xs font-black text-[color:var(--ink-500)]">נתונים חיים (רמת עומק)</span>
              <select name="liveDataTier" defaultValue={organization.liveDataTier} className={inputClass}>
                <option value="basic">basic</option>
                <option value="standard">standard</option>
                <option value="premium">premium</option>
              </select>
            </label>
            <div className="flex justify-end">
              <SubmitButton busy={busySection === "billing"} disabled={!canManage} label={canManage ? "שמור פרטי גבייה" : "צפייה בלבד"} />
            </div>
          </fieldset>
        </form>
      </SectionCard>
    </div>
  );
}
