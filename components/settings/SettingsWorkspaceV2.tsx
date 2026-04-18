"use client";

import Link from "next/link";
import { type FormEvent, type ReactNode, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Bot,
  Building2,
  CheckCircle2,
  CreditCard,
  Globe,
  KeyRound,
  Layers3,
  Loader2,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import {
  updateAiConfigAction,
  updateBillingConnectionsAction,
  updateCurrentSubscriptionAction,
  updateIndustryProfileAction,
  updateMeckanoApiKeyAction,
  updateOrganizationAction,
  updateTenantPortalAction,
} from "@/app/actions/org-settings";
import { ADMIN_SUBSCRIPTION_TIER_OPTIONS, tierAllowance, tierLabelHe } from "@/lib/subscription-tier-config";
import { useWorkspaceShellTransition } from "@/components/app-shell/WorkspaceShellTransition";
import { useI18n } from "@/components/I18nProvider";
import { mergeConstructionTradeLabel } from "@/lib/construction-trades-i18n";
import { CONSTRUCTION_TRADE_IDS, constructionTradeLabelHe } from "@/lib/construction-trades";
import { getIndustryProfile } from "@/lib/professions/runtime";

type IntegrationRecord = {
  id: string;
  provider: string;
  displayName: string | null;
  autoScan: boolean;
  backupExports: boolean;
  lastSyncAt: string | null;
};

type OrganizationRecord = {
  name: string;
  type: string;
  companyType: string;
  taxId: string | null;
  address: string | null;
  isReportable: boolean;
  calendarGoogleEnabled: boolean;
  tenantPublicDomain: string | null;
  tenantSiteBrandingJson: unknown;
  paypalMerchantEmail: string | null;
  paypalMeSlug: string | null;
  liveDataTier: string;
  industry: string;
  constructionTrade: string;
  industryConfigJson: unknown;
  meckanoApiKey: string | null;
  subscriptionTier: string;
  subscriptionStatus: string;
};

type Props = Readonly<{
  organization: OrganizationRecord;
  usersTotal: number;
  activeUsers: number;
  integrations: IntegrationRecord[];
  meckanoEnabled: boolean;
  viewer: {
    role: string;
    roleLabel: string;
    canManageOrganization: boolean;
  };
}>;

type BusySection = "organization" | "profession" | "portal" | "subscription" | "billing" | "ai" | "meckano" | null;
type ActionResult = { ok: boolean; error?: string };
type SettingsAction = (formData: FormData) => Promise<ActionResult>;
type SettingsTab = "overview" | "organization" | "profession" | "portal" | "ai" | "integrations";

const inputClass =
  "w-full rounded-2xl border border-[color:var(--v2-line)] bg-white/90 px-4 py-3 text-sm font-semibold text-[color:var(--v2-ink)] outline-none transition placeholder:text-[color:var(--v2-muted)] focus:border-[color:var(--v2-accent)]";
const textareaClass = `${inputClass} min-h-[120px] resize-y leading-7`;

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function jsonValue(value: unknown) {
  const record = asRecord(value);
  return Object.keys(record).length === 0 ? "" : JSON.stringify(record, null, 2);
}

function SubmitButton({ busy, disabled, label }: { busy: boolean; disabled?: boolean; label: string }) {
  return (
    <button type="submit" disabled={busy || disabled} className="v2-button v2-button-primary disabled:cursor-not-allowed disabled:opacity-60">
      {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <CheckCircle2 className="h-4 w-4" aria-hidden />}
      {label}
    </button>
  );
}

function SectionCard({ title, body, icon, children }: { title: string; body: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="v2-panel p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--v2-accent-soft)] text-[color:var(--v2-accent)]">{icon}</span>
        <div>
          <h2 className="text-xl font-black text-[color:var(--v2-ink)]">{title}</h2>
          <p className="mt-2 text-sm leading-7 text-[color:var(--v2-muted)]">{body}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default function SettingsWorkspaceV2({
  organization,
  usersTotal,
  activeUsers,
  integrations,
  meckanoEnabled,
  viewer,
}: Props) {
  const router = useRouter();
  const { update } = useSession();
  const { messages, t } = useI18n();
  const runWithShellTransition = useWorkspaceShellTransition();
  const [busySection, setBusySection] = useState<BusySection>(null);
  const [activeTab, setActiveTab] = useState<SettingsTab>("overview");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const canManage = viewer.canManageOrganization;

  const industryConfig = asRecord(organization.industryConfigJson);
  const customLabels = asRecord(industryConfig.customLabels);
  const aiControl = asRecord(industryConfig.aiControl);
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
  const allowance = tierAllowance(organization.subscriptionTier);
  const completionRate = Math.round(([organization.taxId, organization.address, organization.tenantPublicDomain, organization.paypalMerchantEmail || organization.paypalMeSlug].filter(Boolean).length / 4) * 100);

  function submitWith(section: Exclude<BusySection, null>, action: SettingsAction) {
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

  const tabs: Array<{ id: SettingsTab; label: string }> = [
    { id: "overview", label: "סקירה" },
    { id: "organization", label: "ארגון" },
    { id: "profession", label: "מקצוע ותוכן" },
    { id: "portal", label: "פורטל וחיוב" },
    { id: "ai", label: "AI" },
    { id: "integrations", label: "חיבורים" },
  ];

  return (
    <div className="grid gap-6" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3.5 text-sm text-white shadow-sm">
        <span className="font-black tracking-tight">לוח בקרה · הגדרות</span>
        <span className="inline-flex items-center gap-2 font-semibold text-emerald-400">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </span>
          סטטוס מערכת תקין
        </span>
      </div>

      <section className="v2-panel v2-panel-soft p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div>
            <span className="v2-eyebrow">Settings Workspace</span>
            <h1 className="mt-4 text-3xl font-black tracking-[-0.06em] text-[color:var(--v2-ink)] sm:text-5xl">
              הגדרות מסודרות לפי משימות, לא לפי בלגן.
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-[color:var(--v2-muted)] sm:text-lg">
              במקום מסך אחד עמוס, ההגדרות מחולקות עכשיו לתחנות ברורות: פרטי ארגון, התאמה מקצועית, פורטל וחיוב, מנועי AI וחיבורים.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-black text-[color:var(--v2-ink)]">{viewer.roleLabel}</span>
              <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-black text-[color:var(--v2-muted)]">{canManage ? "מצב ניהול" : "מצב צפייה"}</span>
              <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-black text-[color:var(--v2-muted)]">{tierLabelHe(organization.subscriptionTier)}</span>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/app/documents" className="v2-button v2-button-primary">
                מסמכים ואישורים
                <Layers3 className="h-4 w-4" aria-hidden />
              </Link>
              <Link href="/app/billing" className="v2-button v2-button-secondary">
                מנויים וחיוב
                <CreditCard className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: "רמת מוכנות", value: `${completionRate}%`, icon: ShieldCheck },
              { label: "משתמשים פעילים", value: `${activeUsers}/${usersTotal}`, icon: UsersRound },
              { label: "מקצוע פעיל", value: profile.industryLabel, icon: Building2 },
              { label: "סטטוס מנוי", value: organization.subscriptionStatus, icon: Sparkles },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="v2-panel p-5">
                <Icon className="h-5 w-5 text-[color:var(--v2-accent)]" aria-hidden />
                <p className="mt-4 text-sm font-bold text-[color:var(--v2-muted)]">{label}</p>
                <p className="mt-2 text-2xl font-black text-[color:var(--v2-ink)]">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="flex flex-wrap gap-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-full px-5 py-2 text-sm font-black transition ${
              activeTab === tab.id
                ? "bg-[color:var(--v2-accent)] text-white"
                : "border border-[color:var(--v2-line)] bg-white/88 text-[color:var(--v2-muted)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </section>

      {message ? (
        <div className={`rounded-[24px] border px-5 py-4 text-sm font-semibold ${message.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
          {message.text}
        </div>
      ) : null}

      {!canManage ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
          אפשר לצפות בכל ההגדרות, אבל רק מנהל ארגון או מנהל פלטפורמה יכולים לשמור שינויים.
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-4">
          {activeTab === "overview" ? (
            <>
              <SectionCard title="איך משתמשים במסך הזה" body="בחר תחנה אחת בכל פעם. כל תחנה מרכזת נושא אחד בלבד כדי שלא תצטרך להבין את כל המערכת בבת אחת." icon={<Sparkles className="h-5 w-5" aria-hidden />}>
                <div className="grid gap-3 md:grid-cols-2">
                  {[
                    "ארגון: שם, סוג ישות, ח.פ וכתובת.",
                    "מקצוע ותוכן: תפריטים, מילים, סוגי מסמכים ופענוחי AI.",
                    "פורטל וחיוב: דומיין, מיתוג, PayPal ומסלול מנוי.",
                    "AI: ספק ראשי, מודלים ומפתחות.",
                  ].map((item) => (
                    <div key={item} className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-4 text-sm font-semibold text-[color:var(--v2-ink)]">
                      {item}
                    </div>
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="תמונת מצב" body="החיבורים, המסמכים והמקצוע הפעיל של הארגון במקום אחד." icon={<Globe className="h-5 w-5" aria-hidden />}>
                <div className="grid gap-3">
                  {[
                    `לקוחות: ${profile.clientsLabel}`,
                    `מסמכים: ${profile.documentsLabel}`,
                    `חיבורים פעילים: ${integrations.length}`,
                    `מכסה חודשית: ${allowance.cheapScans} זולות / ${allowance.premiumScans} פרימיום`,
                  ].map((item) => (
                    <div key={item} className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-4 text-sm font-semibold text-[color:var(--v2-ink)]">
                      {item}
                    </div>
                  ))}
                </div>
              </SectionCard>
            </>
          ) : null}

          {activeTab === "organization" ? (
            <SectionCard title="זהות ארגונית" body="פרטי היסוד של העסק והישות הרשמית." icon={<Building2 className="h-5 w-5" aria-hidden />}>
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
                  <div className="md:col-span-2 flex justify-end">
                    <SubmitButton busy={busySection === "organization"} disabled={!canManage} label={canManage ? "שמור פרטי ארגון" : "צפייה בלבד"} />
                  </div>
                </fieldset>
              </form>
            </SectionCard>
          ) : null}

          {activeTab === "profession" ? (
            <SectionCard title="התאמה מקצועית" body="כאן מגדירים את השפה של המערכת לפי תחום הפעילות שלך." icon={<Layers3 className="h-5 w-5" aria-hidden />}>
              <form onSubmit={submitWith("profession", updateIndustryProfileAction)} className="grid gap-4">
                <fieldset disabled={!canManage} className="grid gap-4">
                  <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/70 px-4 py-3 text-sm leading-7 text-[color:var(--v2-ink)]">
                    <p>{t("settings.tradeAdaptHint")}</p>
                    <p className="mt-2 text-xs text-[color:var(--v2-muted)]">{t("settings.tradeSaveRefreshHint")}</p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-[color:var(--v2-line)] bg-white/90 px-4 py-4">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-[color:var(--v2-muted)]">ענף</p>
                      <p className="mt-2 font-black text-[color:var(--v2-ink)]">בנייה ומקצועות נלווים</p>
                      <p className="mt-2 text-xs text-[color:var(--v2-muted)]">המערכת ממוקדת בענף הבנייה. בוחרים את סוג העסק/ההתמחות כדי להתאים AI ומסמכים.</p>
                    </div>
                    <label className="grid gap-2">
                      <span className="text-xs font-black text-[color:var(--v2-muted)]">התמחות בענף</span>
                      <select name="constructionTrade" defaultValue={organization.constructionTrade} className={inputClass} required>
                        {tradeSelectOptions.map(({ id, label }) => (
                          <option key={id} value={id}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-4 md:col-span-2">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-[color:var(--v2-muted)]">פרופיל פעיל</p>
                      <p className="mt-2 font-black text-[color:var(--v2-ink)]">{profile.industryLabel}</p>
                      <p className="mt-2 text-sm text-[color:var(--v2-muted)]">{profile.homeDescription}</p>
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
                    <div className="rounded-3xl border border-[color:var(--v2-line)] bg-white/88 p-4">
                      <p className="text-sm font-black text-[color:var(--v2-ink)]">פענוחי AI פעילים</p>
                      <div className="mt-4 grid gap-3">
                        {profile.analysisTypes.map((analysis) => (
                          <div key={analysis.id} className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-4">
                            <p className="font-black text-[color:var(--v2-ink)]">{analysis.label}</p>
                            <p className="mt-2 text-sm text-[color:var(--v2-muted)]">{analysis.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-3xl border border-[color:var(--v2-line)] bg-white/88 p-4">
                      <p className="text-sm font-black text-[color:var(--v2-ink)]">תבניות מסמכים</p>
                      <div className="mt-4 grid gap-3">
                        {profile.templates.map((template) => (
                          <div key={template.id} className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-4">
                            <p className="font-black text-[color:var(--v2-ink)]">{template.label}</p>
                            <p className="mt-2 text-sm text-[color:var(--v2-muted)]">{template.description}</p>
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
          ) : null}

          {activeTab === "portal" ? (
            <>
              <SectionCard title="פורטל ודומיין" body="כל מה שקשור לכתובת הציבורית, מיתוג ותצוגת הפורטל." icon={<Globe className="h-5 w-5" aria-hidden />}>
                <form onSubmit={submitWith("portal", updateTenantPortalAction)} className="grid gap-4">
                  <fieldset disabled={!canManage} className="grid gap-4">
                    <input name="tenantPublicDomain" defaultValue={organization.tenantPublicDomain ?? ""} className={inputClass} dir="ltr" placeholder="portal.example.co.il" />
                    <label className="flex items-center gap-3 rounded-2xl border border-[color:var(--v2-line)] bg-white/88 px-4 py-3 text-sm font-semibold text-[color:var(--v2-ink)]">
                      <input type="checkbox" name="calendarGoogleEnabled" defaultChecked={organization.calendarGoogleEnabled} />
                      הפעל חיבור יומן Google
                    </label>
                    <textarea name="tenantSiteBrandingJson" defaultValue={jsonValue(organization.tenantSiteBrandingJson)} className={textareaClass} spellCheck={false} placeholder={`{\n  "landingTitle": "BSD-YBM"\n}`} />
                    <div className="flex justify-end">
                      <SubmitButton busy={busySection === "portal"} disabled={!canManage} label={canManage ? "שמור פורטל" : "צפייה בלבד"} />
                    </div>
                  </fieldset>
                </form>
              </SectionCard>

              <SectionCard title="מנוי וחיוב" body="מסלול פעיל, סטטוס, ופרטי גבייה בסיסיים במקום אחד." icon={<CreditCard className="h-5 w-5" aria-hidden />}>
                <div className="grid gap-4 lg:grid-cols-2">
                  <form onSubmit={submitWith("subscription", updateCurrentSubscriptionAction)} className="grid gap-4">
                    <fieldset disabled={!canManage} className="grid gap-4">
                      <select name="subscriptionTier" defaultValue={organization.subscriptionTier} className={inputClass}>
                        {ADMIN_SUBSCRIPTION_TIER_OPTIONS.map((tier) => (
                          <option key={tier} value={tier}>{tierLabelHe(tier)} ({tier})</option>
                        ))}
                      </select>
                      <select name="subscriptionStatus" defaultValue={organization.subscriptionStatus} className={inputClass}>
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="PENDING_APPROVAL">PENDING_APPROVAL</option>
                        <option value="SUSPENDED">SUSPENDED</option>
                        <option value="INACTIVE">INACTIVE</option>
                      </select>
                      <div className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-4 text-sm text-[color:var(--v2-muted)]">
                        מכסה נוכחית: {allowance.cheapScans} זולות · {allowance.premiumScans} פרימיום ·{" "}
                        {allowance.unlimitedCompanies ? "ללא הגבלת חברות" : `עד ${allowance.maxCompanies} ישויות`}
                      </div>
                      <div className="flex justify-end">
                        <SubmitButton busy={busySection === "subscription"} disabled={!canManage} label={canManage ? "שמור מנוי" : "צפייה בלבד"} />
                      </div>
                    </fieldset>
                  </form>

                  <form onSubmit={submitWith("billing", updateBillingConnectionsAction)} className="grid gap-4">
                    <fieldset disabled={!canManage} className="grid gap-4">
                      <input name="paypalMerchantEmail" defaultValue={organization.paypalMerchantEmail ?? ""} className={inputClass} dir="ltr" placeholder="billing@example.com" />
                      <input name="paypalMeSlug" defaultValue={organization.paypalMeSlug ?? ""} className={inputClass} dir="ltr" placeholder="paypal.me/your-name" />
                      <select name="liveDataTier" defaultValue={organization.liveDataTier} className={inputClass}>
                        <option value="basic">basic</option>
                        <option value="standard">standard</option>
                        <option value="premium">premium</option>
                      </select>
                      <div className="flex justify-end">
                        <SubmitButton busy={busySection === "billing"} disabled={!canManage} label={canManage ? "שמור חיבורי חיוב" : "צפייה בלבד"} />
                      </div>
                    </fieldset>
                  </form>
                </div>
              </SectionCard>
            </>
          ) : null}

          {activeTab === "ai" ? (
            <SectionCard title="מנועי AI" body="בחירת הספק הראשי, מודלים ומפתחות גישה של הארגון." icon={<Bot className="h-5 w-5" aria-hidden />}>
              <form onSubmit={submitWith("ai", updateAiConfigAction)} className="grid gap-4">
                <fieldset disabled={!canManage} className="grid gap-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <select name="ai_primary" defaultValue={asString(aiControl.primary, "gemini")} className={inputClass}>
                      <option value="gemini">Gemini</option>
                      <option value="openai">OpenAI</option>
                      <option value="anthropic">Anthropic</option>
                    </select>
                    <div className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-4 text-sm leading-7 text-[color:var(--v2-muted)]">
                      המנוע הראשי משפיע על הסריקה, הפענוח, העוזר וההמלצות בכל מסכי העבודה.
                    </div>
                  </div>
                  <div className="grid gap-4 lg:grid-cols-3">
                    <input name="model_gemini" defaultValue={asString(asRecord(aiControl.gemini).model, "flash")} className={inputClass} placeholder="Gemini model" />
                    <input name="model_openai" defaultValue={asString(asRecord(aiControl.openai).model, "gpt-4o-mini")} className={inputClass} placeholder="OpenAI model" />
                    <input name="model_anthropic" defaultValue={asString(asRecord(aiControl.anthropic).model, "sonnet")} className={inputClass} placeholder="Anthropic model" />
                    <input name="gemini_key" defaultValue={asString(asRecord(aiControl.gemini).key)} className={inputClass} dir="ltr" placeholder="Gemini key" />
                    <input name="openai_key" defaultValue={asString(asRecord(aiControl.openai).key)} className={inputClass} dir="ltr" placeholder="OpenAI key" />
                    <input name="anthropic_key" defaultValue={asString(asRecord(aiControl.anthropic).key)} className={inputClass} dir="ltr" placeholder="Anthropic key" />
                  </div>
                  <div className="flex justify-end">
                    <SubmitButton busy={busySection === "ai"} disabled={!canManage} label={canManage ? "שמור מנועי AI" : "צפייה בלבד"} />
                  </div>
                </fieldset>
              </form>
            </SectionCard>
          ) : null}

          {activeTab === "integrations" ? (
            <>
              <SectionCard title="חיבורים פעילים" body="ספקי ענן, סריקה אוטומטית וגיבוי יצוא." icon={<Globe className="h-5 w-5" aria-hidden />}>
                <div className="grid gap-3">
                  {integrations.length === 0 ? (
                    <div className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-4 text-sm text-[color:var(--v2-muted)]">
                      עדיין לא חוברו ספקי ענן. אפשר להפעיל זאת ממסכי התפעול והמסמכים.
                    </div>
                  ) : null}
                  {integrations.map((integration) => (
                    <div key={integration.id} className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-4">
                      <p className="font-black text-[color:var(--v2-ink)]">{integration.displayName ?? integration.provider}</p>
                      <p className="mt-2 text-sm text-[color:var(--v2-muted)]">
                        {integration.autoScan ? "Auto scan פעיל" : "Auto scan כבוי"} · {integration.backupExports ? "גיבוי יצוא פעיל" : "גיבוי יצוא כבוי"}
                      </p>
                    </div>
                  ))}
                </div>
              </SectionCard>

              {meckanoEnabled ? (
                <SectionCard title="גישה ל-Meckano" body="חיבור API לארגון המורשה בלבד." icon={<KeyRound className="h-5 w-5" aria-hidden />}>
                  <form onSubmit={submitWith("meckano", updateMeckanoApiKeyAction)} className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                    <fieldset disabled={!canManage} className="contents">
                      <input name="meckanoApiKey" defaultValue={organization.meckanoApiKey ?? ""} className={inputClass} dir="ltr" placeholder="Meckano API key" />
                      <SubmitButton busy={busySection === "meckano"} disabled={!canManage} label={canManage ? "שמור חיבור Meckano" : "צפייה בלבד"} />
                    </fieldset>
                  </form>
                </SectionCard>
              ) : null}
            </>
          ) : null}
        </div>

        <aside className="grid gap-4">
          <SectionCard title="סיכום סביבת העבודה" body="תמונת מצב קצרה של ההגדרות הפעילות." icon={<ShieldCheck className="h-5 w-5" aria-hidden />}>
            <div className="grid gap-3">
              {[`לקוחות: ${profile.clientsLabel}`, `מסמכים: ${profile.documentsLabel}`, `סטטוס מנוי: ${organization.subscriptionStatus}`, `חיבורים פעילים: ${integrations.length}`].map((item) => (
                <div key={item} className="rounded-2xl bg-white/78 px-4 py-4 text-sm font-semibold text-[color:var(--v2-ink)]">
                  {item}
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="צעדים מומלצים" body="קיצורי דרך לדפים שהכי קשורים להגדרות." icon={<Layers3 className="h-5 w-5" aria-hidden />}>
            <div className="grid gap-3">
              <Link href="/app/documents" className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-4 text-sm font-semibold text-[color:var(--v2-ink)] transition hover:bg-white">
                לעבור על כל המסמכים ולעדכן סוגים, שמות וסטטוסים.
              </Link>
              <Link href="/app/billing" className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-4 text-sm font-semibold text-[color:var(--v2-ink)] transition hover:bg-white">
                לבדוק שהמנוי, המחיר והחיבורים תואמים למצב האמיתי של הארגון.
              </Link>
            </div>
          </SectionCard>
        </aside>
      </section>
    </div>
  );
}
