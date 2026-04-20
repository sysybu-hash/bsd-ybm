"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  CreditCard,
  Globe,
  Loader2,
  MailPlus,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import { updateCurrentSubscriptionAction } from "@/app/actions/org-settings";
import {
  manageSubsCreateManualUserAction,
  manageSubsDeleteOrganizationAction,
  manageSubsDeleteUserByEmailAction,
  manageSubsSaveTenantDomainAction,
  manageSubsSendTierInviteAction,
  manageSubsUpdateSubscriptionAction,
} from "@/app/actions/manage-subscriptions";
import type { IndustryProfile } from "@/lib/professions/runtime";
import { ADMIN_SUBSCRIPTION_TIER_OPTIONS, tierAllowance, tierLabelHe } from "@/lib/subscription-tier-config";
import { formatCurrencyILS } from "@/lib/ui-formatters";
import {
  WorkspaceActionForm,
  WorkspaceManagementNotice,
  WorkspaceMetricCard,
  WorkspaceSectionCard,
  WorkspaceSubmitButton,
} from "@/components/workspace/WorkspaceSectionCard";
import { useI18n } from "@/components/I18nProvider";

type CurrentOrganization = {
  id: string;
  name: string;
  subscriptionTier: string;
  subscriptionStatus: string;
  cheapScansRemaining: number;
  premiumScansRemaining: number;
  maxCompanies: number;
  trialEndsAt: string | null;
  tenantPublicDomain: string | null;
};

type AdminOrganization = {
  id: string;
  name: string;
  subscriptionTier: string;
  subscriptionStatus: string;
  cheapScansRemaining: number;
  premiumScansRemaining: number;
  maxCompanies: number;
  tenantPublicDomain: string | null;
  primaryEmail: string | null;
};

type Props = Readonly<{
  currentOrganization: CurrentOrganization;
  industryProfile: IndustryProfile;
  openIssuedCount: number;
  paidIssuedTotal: number;
  adminOrganizations: AdminOrganization[];
  viewer: {
    role: string;
    roleLabel: string;
    canManageCurrentOrganization: boolean;
    canAccessPlatformControls: boolean;
  };
  initialSection?: "overview" | "control";
  focusedOrganizationId?: string | null;
}>;

type ActionResult = { ok: boolean; error?: string };
type ActionHandler = (formData: FormData) => Promise<ActionResult>;

const ActionForm = WorkspaceActionForm;
const ManagementNotice = WorkspaceManagementNotice;
const MetricCard = WorkspaceMetricCard;
const SectionCard = WorkspaceSectionCard;
const SubmitButton = WorkspaceSubmitButton;

const inputClass =
  "w-full rounded-2xl border border-[color:var(--v2-line)] bg-white/90 px-4 py-3 text-sm font-semibold text-[color:var(--v2-ink)] outline-none transition placeholder:text-[color:var(--v2-muted)] focus:border-[color:var(--v2-accent)]";

export default function SubscriptionManagementWorkspace({
  currentOrganization,
  industryProfile,
  openIssuedCount,
  paidIssuedTotal,
  adminOrganizations,
  viewer,
  initialSection = "overview",
  focusedOrganizationId,
}: Props) {
  const { t } = useI18n();
  const router = useRouter();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activeSection, setActiveSection] = useState<"overview" | "control">(viewer.canAccessPlatformControls ? initialSection : "overview");
  const [, startTransition] = useTransition();

  const currentAllowance = useMemo(() => tierAllowance(currentOrganization.subscriptionTier), [currentOrganization.subscriptionTier]);
  /** רק בעל הפלטפורמה — מנהל ארגון רגיל לא יכול לשדרג מנוי בלי תשלום */
  const canDirectEditSubscriptionTier = viewer.canAccessPlatformControls && viewer.canManageCurrentOrganization;

  useEffect(() => {
    setActiveSection(viewer.canAccessPlatformControls ? initialSection : "overview");
  }, [initialSection, viewer.canAccessPlatformControls]);

  useEffect(() => {
    if (!focusedOrganizationId || activeSection !== "control") return;
    const timer = window.setTimeout(() => {
      document.getElementById(`platform-org-${focusedOrganizationId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 180);
    return () => window.clearTimeout(timer);
  }, [activeSection, focusedOrganizationId]);

  function submitWith(key: string, action: ActionHandler) {
    return (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      setBusyKey(key);
      setMessage(null);
      startTransition(async () => {
        try {
          const result = await action(formData);
          if (!result.ok) {
            setMessage({ type: "error", text: result.error ?? "הפעולה נכשלה." });
            return;
          }
          setMessage({ type: "success", text: "הנתונים נשמרו." });
          router.refresh();
        } finally {
          setBusyKey(null);
        }
      });
    };
  }

  return (
    <div className="grid gap-6" dir="rtl">
      <section className="v2-panel v2-panel-soft p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div>
            <span className="v2-eyebrow">{t("workspaceSubscription.eyebrow")}</span>
            <h1 className="mt-4 text-3xl font-black tracking-[-0.06em] text-[color:var(--v2-ink)] sm:text-5xl">
              ניהול מנויים ברור, עם שליטה אמיתית על ארגונים קיימים.
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-[color:var(--v2-muted)] sm:text-lg">
              המסך הזה מסודר עכשיו לפי משימות: מה המסלול הפעיל, איך מנהלים את הארגון שלך, ואיך מנהל פלטפורמה שולט על ארגונים,
              דומיינים, הזמנות ומחיקות — מנויים לענף הבנייה והמקצועות הנלווים. פרופיל: {industryProfile.industryLabel}.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-black text-[color:var(--v2-ink)]">{viewer.roleLabel}</span>
              <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-black text-[color:var(--v2-muted)]">{tierLabelHe(currentOrganization.subscriptionTier)}</span>
              <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-black text-[color:var(--v2-muted)]">{currentOrganization.subscriptionStatus}</span>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/register" className="v2-button v2-button-primary">
                עמוד ההצטרפות
                <MailPlus className="h-4 w-4" aria-hidden />
              </Link>
              <Link href="/app/settings/overview" className="v2-button v2-button-secondary">
                הגדרות ארגון ומקצוע
                <Sparkles className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <MetricCard label="מסלול פעיל" value={tierLabelHe(currentOrganization.subscriptionTier)} icon={CreditCard} />
            <MetricCard label="סטטוס" value={currentOrganization.subscriptionStatus} icon={ShieldCheck} />
            <MetricCard label="גבייה פתוחה" value={openIssuedCount.toString()} icon={Building2} />
            <MetricCard label="שולם עד כה" value={formatCurrencyILS(paidIssuedTotal)} icon={Globe} />
          </div>
        </div>
      </section>

      {viewer.canAccessPlatformControls ? (
        <section className="flex flex-wrap gap-3">
          {[
            { id: "overview", label: "הארגון שלי" },
            { id: "control", label: "מרכז שליטה" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveSection(item.id as "overview" | "control")}
              className={`rounded-full px-5 py-2 text-sm font-black transition ${
                activeSection === item.id
                  ? "bg-[color:var(--v2-accent)] text-white"
                  : "border border-[color:var(--v2-line)] bg-white/88 text-[color:var(--v2-muted)]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </section>
      ) : null}

      {message ? (
        <div className={`rounded-[24px] border px-5 py-4 text-sm font-semibold ${message.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
          {message.text}
        </div>
      ) : null}

      {activeSection === "overview" ? (
        <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="grid gap-4">
            <SectionCard
              title="המסלול של הארגון"
              description="מסלול בתשלום נקבע אחרי תשלום או הזמנה. עריכה ידנית של מסלול/סטטוס זמינה רק לבעל הפלטפורמה; מנהל ארגון יכול לצפות ולשדרג דרך תשלום."
              icon={<CreditCard className="h-5 w-5" aria-hidden />}
            >
              <ManagementNotice visible={!viewer.canManageCurrentOrganization} text="אפשר לצפות בפרטי המנוי, אבל רק מנהל ארגון או מנהל פלטפורמה יכולים לבצע פעולות ניהול." />
              <ManagementNotice
                visible={viewer.canManageCurrentOrganization && !viewer.canAccessPlatformControls}
                text="שינוי מסלול בתשלום מתבצע דרך כפתורי התשלום למטה — לא ניתן לקבוע מסלול בתשלום ידנית מהטופס."
              />
              {canDirectEditSubscriptionTier ? (
                <ActionForm onSubmit={submitWith("current-org", updateCurrentSubscriptionAction)}>
                  <fieldset className="grid gap-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <select name="subscriptionTier" defaultValue={currentOrganization.subscriptionTier} className={inputClass}>
                        {ADMIN_SUBSCRIPTION_TIER_OPTIONS.map((tier) => (
                          <option key={tier} value={tier}>
                            {tierLabelHe(tier)} ({tier})
                          </option>
                        ))}
                      </select>
                      <select name="subscriptionStatus" defaultValue={currentOrganization.subscriptionStatus} className={inputClass}>
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="PENDING_APPROVAL">PENDING_APPROVAL</option>
                        <option value="SUSPENDED">SUSPENDED</option>
                        <option value="INACTIVE">INACTIVE</option>
                      </select>
                    </div>
                    <div className="flex justify-end">
                      <SubmitButton busy={busyKey === "current-org"} label="שמור מנוי (בעל פלטפורמה)" />
                    </div>
                  </fieldset>
                </ActionForm>
              ) : (
                <div className="grid gap-4 rounded-2xl border border-[color:var(--v2-line)] bg-white/88 px-4 py-4">
                  <p className="text-sm font-semibold text-[color:var(--v2-ink)]">מסלול וסטטוס נוכחיים</p>
                  <p className="text-sm text-[color:var(--v2-muted)]">
                    {tierLabelHe(currentOrganization.subscriptionTier)} · {currentOrganization.subscriptionStatus}
                  </p>
                  {viewer.canManageCurrentOrganization ? (
                    <Link href="/app/settings/billing" className="v2-button v2-button-secondary w-fit">
                      שדרוג ותשלום (עמוד חיוב)
                    </Link>
                  ) : null}
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="השוואת מסלולים"
              description="תצוגה מרוכזת של המכסות והיכולות בכל מסלול כדי להבין מה מתאים לארגון."
              icon={<Sparkles className="h-5 w-5" aria-hidden />}
            >
              <div className="grid gap-3 lg:grid-cols-2">
                {ADMIN_SUBSCRIPTION_TIER_OPTIONS.map((tier) => {
                  const allowance = tierAllowance(tier);
                  return (
                    <article
                      key={tier}
                      className={`rounded-3xl border px-5 py-5 ${
                        currentOrganization.subscriptionTier === tier ? "border-[color:var(--v2-accent)] bg-[color:var(--v2-accent-soft)]" : "border-[color:var(--v2-line)] bg-white/88"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-lg font-black text-[color:var(--v2-ink)]">{tierLabelHe(tier)}</p>
                        <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-black text-[color:var(--v2-muted)]">
                          {allowance.monthlyPriceIls == null ? "בתיאום" : `₪${allowance.monthlyPriceIls}`}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-7 text-[color:var(--v2-muted)]">
                        {allowance.cheapScans} סריקות זולות, {allowance.premiumScans} סריקות פרימיום,{" "}
                        {allowance.unlimitedCompanies ? "ללא הגבלת חברות" : `עד ${allowance.maxCompanies} ישויות`}
                      </p>
                    </article>
                  );
                })}
              </div>
            </SectionCard>
          </div>

          <aside className="grid gap-4">
            <SectionCard title="מצב המסלול" description="תמונת מצב מהירה של המכסות והיתרות הפעילות." icon={<ShieldCheck className="h-5 w-5" aria-hidden />}>
              <div className="grid gap-3">
                {[
                  `סריקות זולות כלולות: ${currentAllowance.cheapScans}`,
                  `סריקות פרימיום כלולות: ${currentAllowance.premiumScans}`,
                  `מכסת ישויות: ${currentAllowance.unlimitedCompanies ? "ללא הגבלה" : currentAllowance.maxCompanies}`,
                  `יתרה נוכחית: ${currentOrganization.cheapScansRemaining}/${currentOrganization.premiumScansRemaining}`,
                ].map((item) => (
                  <div key={item} className="rounded-2xl bg-white/78 px-4 py-4 text-sm font-semibold text-[color:var(--v2-ink)]">
                    {item}
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="קישורי הצטרפות" description="מעבר מהיר לכל מסלולי ההצטרפות הציבוריים." icon={<MailPlus className="h-5 w-5" aria-hidden />}>
              <div className="grid gap-3">
                {ADMIN_SUBSCRIPTION_TIER_OPTIONS.map((tier) => (
                  <Link key={tier} href={`/register?plan=${encodeURIComponent(tier)}`} className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-4 text-sm font-semibold text-[color:var(--v2-ink)] transition hover:bg-white">
                    הצטרפות ל-{tierLabelHe(tier)}
                  </Link>
                ))}
              </div>
            </SectionCard>
          </aside>
        </section>
      ) : null}

      {viewer.canAccessPlatformControls && activeSection === "control" ? (
        <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="grid gap-4">
            <SectionCard
              title="פעולות מערכת"
              description="שליחת הזמנות, יצירת ארגון חדש, ומחיקה מסודרת של משתמשים או ארגונים."
              icon={<Users className="h-5 w-5" aria-hidden />}
            >
              <div className="grid gap-4 xl:grid-cols-2">
                <div className="rounded-3xl border border-[color:var(--v2-line)] bg-white/88 p-5">
                  <p className="font-black text-[color:var(--v2-ink)]">שליחת הזמנה למסלול</p>
                  <ActionForm onSubmit={submitWith("invite", manageSubsSendTierInviteAction)}>
                    <input name="email" className={inputClass} dir="ltr" placeholder="client@example.com" />
                    <div className="grid gap-3 md:grid-cols-2">
                      <select name="tier" className={inputClass} defaultValue={currentOrganization.subscriptionTier}>
                        {ADMIN_SUBSCRIPTION_TIER_OPTIONS.map((tier) => (
                          <option key={tier} value={tier}>
                            {tierLabelHe(tier)}
                          </option>
                        ))}
                      </select>
                      <input name="validDays" className={inputClass} dir="ltr" placeholder="14" />
                    </div>
                    <div className="flex justify-end">
                      <SubmitButton busy={busyKey === "invite"} label="שלח הזמנה" />
                    </div>
                  </ActionForm>
                </div>

                <div className="rounded-3xl border border-[color:var(--v2-line)] bg-white/88 p-5">
                  <p className="font-black text-[color:var(--v2-ink)]">יצירת ארגון ידנית</p>
                  <ActionForm onSubmit={submitWith("manual-org", manageSubsCreateManualUserAction)}>
                    <input name="organizationName" className={inputClass} placeholder="שם ארגון" />
                    <input name="name" className={inputClass} placeholder="שם מנהל" />
                    <input name="email" className={inputClass} dir="ltr" placeholder="admin@example.com" />
                    <div className="grid gap-3 md:grid-cols-2">
                      <select name="tier" className={inputClass} defaultValue="FREE">
                        {ADMIN_SUBSCRIPTION_TIER_OPTIONS.map((tier) => (
                          <option key={tier} value={tier}>
                            {tierLabelHe(tier)}
                          </option>
                        ))}
                      </select>
                      <select name="orgType" className={inputClass} defaultValue="COMPANY">
                        <option value="HOME">בית / יחיד</option>
                        <option value="FREELANCER">פרילנס</option>
                        <option value="COMPANY">חברה</option>
                        <option value="ENTERPRISE">תאגיד</option>
                      </select>
                    </div>
                    <div className="flex justify-end">
                      <SubmitButton busy={busyKey === "manual-org"} label="צור ארגון" />
                    </div>
                  </ActionForm>
                </div>

                <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
                  <p className="font-black text-amber-900">מחיקת משתמש לפי אימייל</p>
                  <p className="mt-2 text-sm leading-7 text-amber-800">שימושי לניקוי משתמשים שגויים או כפולים בלי למחוק את כל הארגון.</p>
                  <ActionForm onSubmit={submitWith("delete-user", manageSubsDeleteUserByEmailAction)} className="mt-4 grid gap-4">
                    <input name="email" className={inputClass} dir="ltr" placeholder="user@example.com" />
                    <div className="flex justify-end">
                      <SubmitButton busy={busyKey === "delete-user"} label="מחק משתמש" tone="danger" />
                    </div>
                  </ActionForm>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="ארגונים פעילים"
              description="כל ארגון מוצג עכשיו עם פעולות ברורות: מסלול, דומיין ואזור מחיקה נפרד."
              icon={<Building2 className="h-5 w-5" aria-hidden />}
            >
              <div className="grid gap-4">
                {adminOrganizations.map((organization) => {
                  const focused = focusedOrganizationId === organization.id;

                  return (
                    <article
                      key={organization.id}
                      id={`platform-org-${organization.id}`}
                      className={`rounded-3xl border p-5 transition ${
                        focused ? "border-[color:var(--v2-accent)] bg-[color:var(--v2-accent-soft)]" : "border-[color:var(--v2-line)] bg-white/88"
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-lg font-black text-[color:var(--v2-ink)]">{organization.name}</p>
                          <p className="mt-1 text-sm text-[color:var(--v2-muted)]">{organization.primaryEmail ?? "ללא אימייל ראשי"}</p>
                        </div>
                        <div className="text-sm font-semibold text-[color:var(--v2-muted)]">
                          {organization.cheapScansRemaining} זולות · {organization.premiumScansRemaining} פרימיום
                        </div>
                      </div>

                      <div className="mt-4 grid gap-4 xl:grid-cols-2">
                        <ActionForm onSubmit={submitWith(`tier-${organization.id}`, manageSubsUpdateSubscriptionAction)}>
                          <input type="hidden" name="organizationId" value={organization.id} />
                          <div className="grid gap-3 md:grid-cols-2">
                            <select name="tier" defaultValue={organization.subscriptionTier} className={inputClass}>
                              {ADMIN_SUBSCRIPTION_TIER_OPTIONS.map((tier) => (
                                <option key={tier} value={tier}>
                                  {tierLabelHe(tier)}
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
                          <div className="flex justify-end">
                            <SubmitButton busy={busyKey === `tier-${organization.id}`} label="שמור מסלול" />
                          </div>
                        </ActionForm>

                        <ActionForm onSubmit={submitWith(`domain-${organization.id}`, manageSubsSaveTenantDomainAction)}>
                          <input type="hidden" name="organizationId" value={organization.id} />
                          <input name="tenantPublicDomain" defaultValue={organization.tenantPublicDomain ?? ""} className={inputClass} dir="ltr" placeholder="subdomain.example.co.il" />
                          <div className="flex justify-end">
                            <SubmitButton busy={busyKey === `domain-${organization.id}`} label="שמור דומיין" />
                          </div>
                        </ActionForm>
                      </div>

                      <div className="mt-4 rounded-3xl border border-rose-200 bg-rose-50 p-4">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="mt-1 h-5 w-5 text-rose-600" aria-hidden />
                          <div className="w-full">
                            <p className="font-black text-rose-900">אזור מחיקה</p>
                            <p className="mt-1 text-sm leading-7 text-rose-800">
                              למחיקת מנוי/ארגון יש להקליד את שם הארגון בדיוק. המחיקה מסירה גם משתמשים, מסמכים, הזמנות ונתוני ארגון קשורים.
                            </p>
                            <ActionForm onSubmit={submitWith(`delete-org-${organization.id}`, manageSubsDeleteOrganizationAction)} className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
                              <input type="hidden" name="organizationId" value={organization.id} />
                              <input name="confirmation" className={inputClass} placeholder={`הקלד "${organization.name}"`} />
                              <div className="flex justify-end">
                                <SubmitButton busy={busyKey === `delete-org-${organization.id}`} label="מחק ארגון" tone="danger" />
                              </div>
                            </ActionForm>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </SectionCard>
          </div>

          <aside className="grid gap-4">
            <SectionCard title="מצב אדמין" description="תמונה מהירה של סביבת הניהול הפעילה." icon={<ShieldCheck className="h-5 w-5" aria-hidden />}>
              <div className="grid gap-3">
                {[
                  `ארגונים מנוהלים: ${adminOrganizations.length}`,
                  `ארגון מחובר: ${currentOrganization.name}`,
                  `מנוי מחובר: ${tierLabelHe(currentOrganization.subscriptionTier)}`,
                  `מיקוד מסך: ${focusedOrganizationId ? "ארגון מסומן" : "כל הארגונים"}`,
                ].map((item) => (
                  <div key={item} className="rounded-2xl bg-white/78 px-4 py-4 text-sm font-semibold text-[color:var(--v2-ink)]">
                    {item}
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="קישורי עבודה" description="מעבר מהיר למסכים הקרובים ביותר לניהול מנויים." icon={<Users className="h-5 w-5" aria-hidden />}>
              <div className="grid gap-3">
                <Link href="/app/admin" className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-4 text-sm font-semibold text-[color:var(--v2-ink)] transition hover:bg-white">
                  חזרה למסך Admin
                </Link>
                <Link href="/app/settings/overview" className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-4 text-sm font-semibold text-[color:var(--v2-ink)] transition hover:bg-white">
                  הגדרות הארגון המחובר
                </Link>
              </div>
            </SectionCard>
          </aside>
        </section>
      ) : null}
    </div>
  );
}
