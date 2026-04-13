"use client";

import Link from "next/link";
import { type FormEvent, type ReactNode, useMemo, useState, useTransition } from "react";
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
  Workflow,
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
}>;

type ActionResult = { ok: boolean; error?: string };
type SettingsAction = (formData: FormData) => Promise<ActionResult>;
type BusySection =
  | "organization"
  | "profession"
  | "subscription"
  | "workspace"
  | "billing"
  | "ai"
  | "meckano"
  | null;

const inputClass =
  "w-full rounded-2xl border border-[color:var(--v2-line)] bg-white/90 px-4 py-3 text-sm font-semibold text-[color:var(--v2-ink)] outline-none transition placeholder:text-[color:var(--v2-muted)] focus:border-[color:var(--v2-accent)]";

const textareaClass = `${inputClass} min-h-[132px] resize-y leading-7`;

function readRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function readString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function prettyJson(value: unknown) {
  const record = readRecord(value);
  if (Object.keys(record).length === 0) {
    return "";
  }
  return JSON.stringify(record, null, 2);
}

function Section({
  title,
  body,
  icon,
  children,
}: {
  title: string;
  body: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="v2-panel p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--v2-accent-soft)] text-[color:var(--v2-accent)]">
          {icon}
        </span>
        <div>
          <h2 className="text-xl font-black text-[color:var(--v2-ink)]">{title}</h2>
          <p className="mt-2 text-sm leading-7 text-[color:var(--v2-muted)]">{body}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function SubmitButton({ busy, label }: { busy: boolean; label: string }) {
  return (
    <button type="submit" disabled={busy} className="v2-button v2-button-primary disabled:opacity-60">
      {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <CheckCircle2 className="h-4 w-4" aria-hidden />}
      {label}
    </button>
  );
}

function StatCard({ label, value, children }: { label: string; value: string; children: ReactNode }) {
  return (
    <div className="v2-panel p-5">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--v2-accent-soft)] text-[color:var(--v2-accent)]">
        {children}
      </span>
      <p className="mt-4 text-sm font-bold text-[color:var(--v2-muted)]">{label}</p>
      <p className="mt-2 text-2xl font-black tracking-[-0.04em] text-[color:var(--v2-ink)]">{value}</p>
    </div>
  );
}

export default function SettingsWorkspaceV2({
  organization,
  usersTotal,
  activeUsers,
  integrations,
  meckanoEnabled,
}: Props) {
  const router = useRouter();
  const [busySection, setBusySection] = useState<BusySection>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [, startTransition] = useTransition();

  const industryConfig = readRecord(organization.industryConfigJson);
  const customLabels = readRecord(industryConfig.customLabels);
  const aiControl = readRecord(industryConfig.aiControl);
  const brandingJson = prettyJson(organization.tenantSiteBrandingJson);
  const profile = useMemo(
    () => getIndustryProfile(organization.industry, organization.industryConfigJson),
    [organization.industry, organization.industryConfigJson],
  );
  const allowance = tierAllowance(organization.subscriptionTier);
  const completionRate = Math.round(
    ([organization.taxId, organization.address, organization.tenantPublicDomain, organization.paypalMerchantEmail || organization.paypalMeSlug]
      .filter(Boolean).length /
      4) *
      100,
  );

  function submitWith(section: Exclude<BusySection, null>, action: SettingsAction) {
    return (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      setBusySection(section);
      setMessage(null);
      startTransition(async () => {
        try {
          const result = await action(formData);
          if (!result.ok) {
            setMessage({ type: "error", text: result.error ?? "שמירת ההגדרות נכשלה." });
            return;
          }
          setMessage({ type: "success", text: "ההגדרות נשמרו והמערכת עודכנה." });
          router.refresh();
        } finally {
          setBusySection(null);
        }
      });
    };
  }

  return (
    <div className="grid gap-6" dir="rtl">
      <section className="v2-panel v2-panel-soft p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div>
            <span className="v2-eyebrow">Settings Workspace</span>
            <h1 className="mt-4 text-3xl font-black tracking-[-0.06em] text-[color:var(--v2-ink)] sm:text-5xl">
              מסך שליטה אחד למקצוע, למנוי ולכל מה שמגדיר את הארגון.
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-[color:var(--v2-muted)] sm:text-lg">
              כאן מגדירים את השפה המקצועית, את התפריטים, את סוגי המסמכים והאישורים, את החיבורים,
              את ה-AI ואת המנוי הפעיל. שינוי כאן משפיע על כל המערכת, כולל על מנוי קיים.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/app/documents" className="v2-button v2-button-primary">
                מסמכים וכל האישורים
                <Layers3 className="h-4 w-4" aria-hidden />
              </Link>
              <Link href="/app/billing" className="v2-button v2-button-secondary">
                מנויים וניהול חיוב
                <CreditCard className="h-4 w-4" aria-hidden />
              </Link>
              {meckanoEnabled ? (
                <Link href="/app/operations/meckano" className="v2-button v2-button-secondary">
                  Meckano
                  <Workflow className="h-4 w-4" aria-hidden />
                </Link>
              ) : null}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <StatCard label="רמת מוכנות" value={`${completionRate}%`}>
              <ShieldCheck className="h-5 w-5" aria-hidden />
            </StatCard>
            <StatCard label="משתמשים פעילים" value={`${activeUsers}/${usersTotal}`}>
              <UsersRound className="h-5 w-5" aria-hidden />
            </StatCard>
            <StatCard label="ענף פעיל" value={profile.industryLabel}>
              <Building2 className="h-5 w-5" aria-hidden />
            </StatCard>
            <StatCard label="מנוי" value={tierLabelHe(organization.subscriptionTier)}>
              <Sparkles className="h-5 w-5" aria-hidden />
            </StatCard>
          </div>
        </div>
      </section>

      {message ? (
        <div
          className={`rounded-[24px] border px-5 py-4 text-sm font-semibold ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-4">
          <Section
            title="זהות עסקית"
            body="הפרטים הרשמיים של הארגון כפי שהם מופיעים במסמכים, בדיווחים ובממשקי הלקוח."
            icon={<Building2 className="h-5 w-5" aria-hidden />}
          >
            <form onSubmit={submitWith("organization", updateOrganizationAction)} className="grid gap-4 md:grid-cols-2">
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
                <SubmitButton busy={busySection === "organization"} label="שמור פרטי ארגון" />
              </div>
            </form>
          </Section>

          <Section
            title="מקצוע, תפריטים, AI ומסמכים"
            body="כאן קובעים לאיזה מקצוע הארגון שייך, איך ייקראו הלקוחות והמסמכים, ומה המערכת תציג ותנתח."
            icon={<Layers3 className="h-5 w-5" aria-hidden />}
          >
            <form onSubmit={submitWith("profession", updateIndustryProfileAction)} className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <select name="industry" defaultValue={organization.industry} className={inputClass}>
                  <option value="GENERAL">כללי</option>
                  <option value="LEGAL">משפטי</option>
                  <option value="ACCOUNTING">חשבונאות / מס</option>
                  <option value="CONSTRUCTION">בנייה / קבלנות</option>
                  <option value="MEDICAL">רפואה / קליניקה</option>
                  <option value="RETAIL">קמעונאות / מסחר</option>
                  <option value="REAL_ESTATE">נדל&quot;ן / תיווך</option>
                </select>
                <div className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[color:var(--v2-muted)]">פרופיל פעיל</p>
                  <p className="mt-2 font-black text-[color:var(--v2-ink)]">{profile.industryLabel}</p>
                  <p className="mt-2 text-sm text-[color:var(--v2-muted)]">{profile.homeDescription}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <input
                  name="customClientsLabel"
                  defaultValue={readString(customLabels.clients, profile.clientsLabel)}
                  className={inputClass}
                  placeholder="כותרת לתפריט לקוחות"
                />
                <input
                  name="customDocumentsLabel"
                  defaultValue={readString(customLabels.documents, profile.documentsLabel)}
                  className={inputClass}
                  placeholder="כותרת לתפריט מסמכים"
                />
                <input
                  name="customRecordsLabel"
                  defaultValue={readString(customLabels.records, profile.recordsLabel)}
                  className={inputClass}
                  placeholder="כותרת לאישורים ורשומות"
                />
                <input
                  name="customClientWord"
                  defaultValue={readString(customLabels.client, profile.vocabulary.client)}
                  className={inputClass}
                  placeholder="המילה לקוח"
                />
                <input
                  name="customProjectWord"
                  defaultValue={readString(customLabels.project, profile.vocabulary.project)}
                  className={inputClass}
                  placeholder="המילה פרויקט"
                />
                <input
                  name="customDocumentWord"
                  defaultValue={readString(customLabels.document, profile.vocabulary.document)}
                  className={inputClass}
                  placeholder="המילה מסמך"
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-3xl border border-[color:var(--v2-line)] bg-white/88 p-4">
                  <p className="text-sm font-black text-[color:var(--v2-ink)]">פענוחים וניתוחי AI לפי מקצוע</p>
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
                  <p className="text-sm font-black text-[color:var(--v2-ink)]">סוגי מסמכים ואישורים נתמכים</p>
                  <div className="mt-4 grid gap-3">
                    {profile.templates.map((template) => (
                      <div key={template.id} className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-black text-[color:var(--v2-ink)]">{template.label}</p>
                          <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-black text-[color:var(--v2-muted)]">
                            {template.kind}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-[color:var(--v2-muted)]">{template.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <SubmitButton busy={busySection === "profession"} label="שמור התאמה מקצועית" />
              </div>
            </form>
          </Section>

          <Section
            title="מנוי פעיל והגדרה מחדש"
            body="אפשר להחליף מסלול, לשנות סטטוס ולעדכן את מנוי הארגון גם אם הוא כבר קיים ועובד."
            icon={<CreditCard className="h-5 w-5" aria-hidden />}
          >
            <form onSubmit={submitWith("subscription", updateCurrentSubscriptionAction)} className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <select name="subscriptionTier" defaultValue={organization.subscriptionTier} className={inputClass}>
                  {ADMIN_SUBSCRIPTION_TIER_OPTIONS.map((tier) => (
                    <option key={tier} value={tier}>
                      {tierLabelHe(tier)} ({tier})
                    </option>
                  ))}
                </select>
                <select name="subscriptionStatus" defaultValue={organization.subscriptionStatus} className={inputClass}>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="PENDING_APPROVAL">PENDING_APPROVAL</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[color:var(--v2-muted)]">סריקות זולות</p>
                  <p className="mt-2 text-lg font-black text-[color:var(--v2-ink)]">{allowance.cheapScans}</p>
                </div>
                <div className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[color:var(--v2-muted)]">סריקות פרימיום</p>
                  <p className="mt-2 text-lg font-black text-[color:var(--v2-ink)]">{allowance.premiumScans}</p>
                </div>
                <div className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[color:var(--v2-muted)]">ישויות / חברות</p>
                  <p className="mt-2 text-lg font-black text-[color:var(--v2-ink)]">
                    {allowance.unlimitedCompanies ? "ללא הגבלה" : allowance.maxCompanies}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                {ADMIN_SUBSCRIPTION_TIER_OPTIONS.map((tier) => {
                  const meta = tierAllowance(tier);
                  return (
                    <div
                      key={tier}
                      className={`rounded-3xl border px-4 py-4 ${
                        tier === organization.subscriptionTier
                          ? "border-[color:var(--v2-accent)] bg-[color:var(--v2-accent-soft)]"
                          : "border-[color:var(--v2-line)] bg-white/88"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-black text-[color:var(--v2-ink)]">{tierLabelHe(tier)}</p>
                        <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-black text-[color:var(--v2-muted)]">
                          {meta.monthlyPriceIls == null ? "בתיאום" : `₪${meta.monthlyPriceIls}`}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-[color:var(--v2-muted)]">
                        {meta.cheapScans} זולות · {meta.premiumScans} פרימיום ·{" "}
                        {meta.unlimitedCompanies ? "ללא הגבלת חברות" : `עד ${meta.maxCompanies} חברות`}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end">
                <SubmitButton busy={busySection === "subscription"} label="שמור מנוי פעיל" />
              </div>
            </form>
          </Section>
          <Section
            title="מרחב עבודה, דומיין וחיבורים"
            body="ניהול הדומיין הציבורי, חיבורי היומן, והמיתוג של דפי המנוי והפורטל."
            icon={<Globe className="h-5 w-5" aria-hidden />}
          >
            <form onSubmit={submitWith("workspace", updateTenantPortalAction)} className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  name="tenantPublicDomain"
                  defaultValue={organization.tenantPublicDomain ?? ""}
                  className={inputClass}
                  dir="ltr"
                  placeholder="portal.example.co.il"
                />
                <label className="flex items-center gap-3 rounded-2xl border border-[color:var(--v2-line)] bg-white/88 px-4 py-3 text-sm font-semibold text-[color:var(--v2-ink)]">
                  <input type="checkbox" name="calendarGoogleEnabled" defaultChecked={organization.calendarGoogleEnabled} />
                  הפעל חיבור יומן Google
                </label>
              </div>

              <label className="grid gap-2">
                <span className="text-sm font-black text-[color:var(--v2-ink)]">מיתוג JSON</span>
                <textarea
                  name="tenantSiteBrandingJson"
                  defaultValue={brandingJson}
                  className={textareaClass}
                  spellCheck={false}
                  placeholder={`{\n  "landingTitle": "BSD-YBM",\n  "tagline": "מערכת חכמה לעסק"\n}`}
                />
              </label>

              <div className="flex justify-end">
                <SubmitButton busy={busySection === "workspace"} label="שמור דומיין ומיתוג" />
              </div>
            </form>
          </Section>

          <Section
            title="חיוב, סליקה ונתונים חיים"
            body="כאן מגדירים את ערוץ PayPal ואת רמת הנתונים החיה שבה המערכת תעבוד."
            icon={<CreditCard className="h-5 w-5" aria-hidden />}
          >
            <form onSubmit={submitWith("billing", updateBillingConnectionsAction)} className="grid gap-4 md:grid-cols-2">
              <input
                name="paypalMerchantEmail"
                defaultValue={organization.paypalMerchantEmail ?? ""}
                className={inputClass}
                dir="ltr"
                placeholder="billing@example.com"
              />
              <input
                name="paypalMeSlug"
                defaultValue={organization.paypalMeSlug ?? ""}
                className={inputClass}
                dir="ltr"
                placeholder="paypal.me/your-name"
              />
              <select name="liveDataTier" defaultValue={organization.liveDataTier} className={inputClass}>
                <option value="basic">basic</option>
                <option value="standard">standard</option>
                <option value="premium">premium</option>
              </select>
              <div className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-4 text-sm leading-7 text-[color:var(--v2-muted)]">
                מומלץ לשמור כאן את ערוץ הגבייה הפעיל כדי שכל דפי הבית, ההצטרפות והחיוב יישארו מסונכרנים.
              </div>
              <div className="md:col-span-2 flex justify-end">
                <SubmitButton busy={busySection === "billing"} label="שמור חיבורי חיוב" />
              </div>
            </form>
          </Section>

          <Section
            title="מנועי AI"
            body="הגדרת ספק ראשי, מודלים ומפתחות. ההגדרה נשמרת כחלק מפרופיל הארגון והמקצוע."
            icon={<Bot className="h-5 w-5" aria-hidden />}
          >
            <form onSubmit={submitWith("ai", updateAiConfigAction)} className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <select name="ai_primary" defaultValue={readString(aiControl.primary, "gemini")} className={inputClass}>
                  <option value="gemini">Gemini</option>
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                </select>
                <div className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-4 text-sm leading-7 text-[color:var(--v2-muted)]">
                  המנוע הראשי משרת את הסריקות, הפענוחים וההצעות האוטומטיות שמופעלות במסכים המקצועיים.
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-3xl border border-[color:var(--v2-line)] bg-white/88 p-4">
                  <p className="font-black text-[color:var(--v2-ink)]">Gemini</p>
                  <div className="mt-4 grid gap-3">
                    <input
                      name="model_gemini"
                      defaultValue={readString(readRecord(aiControl.gemini).model, "flash")}
                      className={inputClass}
                      placeholder="flash"
                    />
                    <input
                      name="gemini_key"
                      defaultValue={readString(readRecord(aiControl.gemini).key)}
                      className={inputClass}
                      dir="ltr"
                      placeholder="API key"
                    />
                  </div>
                </div>

                <div className="rounded-3xl border border-[color:var(--v2-line)] bg-white/88 p-4">
                  <p className="font-black text-[color:var(--v2-ink)]">OpenAI</p>
                  <div className="mt-4 grid gap-3">
                    <input
                      name="model_openai"
                      defaultValue={readString(readRecord(aiControl.openai).model, "gpt-4o-mini")}
                      className={inputClass}
                      placeholder="gpt-4o-mini"
                    />
                    <input
                      name="openai_key"
                      defaultValue={readString(readRecord(aiControl.openai).key)}
                      className={inputClass}
                      dir="ltr"
                      placeholder="API key"
                    />
                  </div>
                </div>

                <div className="rounded-3xl border border-[color:var(--v2-line)] bg-white/88 p-4">
                  <p className="font-black text-[color:var(--v2-ink)]">Anthropic</p>
                  <div className="mt-4 grid gap-3">
                    <input
                      name="model_anthropic"
                      defaultValue={readString(readRecord(aiControl.anthropic).model, "sonnet")}
                      className={inputClass}
                      placeholder="sonnet"
                    />
                    <input
                      name="anthropic_key"
                      defaultValue={readString(readRecord(aiControl.anthropic).key)}
                      className={inputClass}
                      dir="ltr"
                      placeholder="API key"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <SubmitButton busy={busySection === "ai"} label="שמור מנועי AI" />
              </div>
            </form>
          </Section>

          {meckanoEnabled ? (
            <Section
              title="גישה ל-Meckano"
              body="הזנת מפתח API עבור הארגון המורשה ל-Meckano. ההגדרה זמינה רק למנוי המורשה."
              icon={<KeyRound className="h-5 w-5" aria-hidden />}
            >
              <form onSubmit={submitWith("meckano", updateMeckanoApiKeyAction)} className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                <input
                  name="meckanoApiKey"
                  defaultValue={organization.meckanoApiKey ?? ""}
                  className={inputClass}
                  dir="ltr"
                  placeholder="Meckano API key"
                />
                <SubmitButton busy={busySection === "meckano"} label="שמור חיבור Meckano" />
              </form>
            </Section>
          ) : null}
        </div>

        <aside className="grid gap-4">
          <section className="v2-panel v2-panel-highlight p-6">
            <p className="text-lg font-black text-[color:var(--v2-ink)]">בריאות סביבת העבודה</p>
            <div className="mt-4 grid gap-3">
              {[
                `כותרת לקוחות פעילה: ${profile.clientsLabel}`,
                `כותרת מסמכים פעילה: ${profile.documentsLabel}`,
                `סטטוס מנוי: ${organization.subscriptionStatus}`,
                `חיבורים פעילים: ${integrations.length}`,
              ].map((item) => (
                <div key={item} className="rounded-2xl bg-white/78 px-4 py-4 text-sm font-semibold text-[color:var(--v2-ink)]">
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="v2-panel p-6">
            <p className="text-lg font-black text-[color:var(--v2-ink)]">תבניות פעילות למקצוע</p>
            <div className="mt-4 grid gap-3">
              {profile.templates.map((template) => (
                <div key={template.id} className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-4">
                  <p className="font-black text-[color:var(--v2-ink)]">{template.label}</p>
                  <p className="mt-2 text-sm leading-7 text-[color:var(--v2-muted)]">{template.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="v2-panel p-6">
            <p className="text-lg font-black text-[color:var(--v2-ink)]">חיבורים וסריקה</p>
            <div className="mt-4 grid gap-3">
              {integrations.length === 0 ? (
                <div className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-4 text-sm text-[color:var(--v2-muted)]">
                  עדיין לא חוברו ספקי ענן. אפשר להפעיל זאת ממסכי התפעול והמסמכים.
                </div>
              ) : null}
              {integrations.map((integration) => (
                <div key={integration.id} className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-4">
                  <p className="font-black text-[color:var(--v2-ink)]">{integration.displayName ?? integration.provider}</p>
                  <p className="mt-2 text-sm text-[color:var(--v2-muted)]">
                    {integration.autoScan ? "Auto scan פעיל" : "Auto scan כבוי"} ·{" "}
                    {integration.backupExports ? "גיבוי יצוא פעיל" : "גיבוי יצוא כבוי"}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="v2-panel p-6">
            <p className="text-lg font-black text-[color:var(--v2-ink)]">צעדים מומלצים</p>
            <div className="mt-4 grid gap-3">
              <Link href="/app/documents" className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-4 text-sm font-semibold text-[color:var(--v2-ink)] transition hover:bg-white">
                לעבור על כל המסמכים, לערוך שמות, סוגים וסטטוסים, ולמחוק מה שלא רלוונטי.
              </Link>
              <Link href="/app/billing" className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-4 text-sm font-semibold text-[color:var(--v2-ink)] transition hover:bg-white">
                לבדוק שמסלול המנוי, המחיר והטקסטים הציבוריים משקפים את החבילה הנכונה.
              </Link>
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}
