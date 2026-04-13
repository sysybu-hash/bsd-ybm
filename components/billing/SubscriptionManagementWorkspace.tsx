"use client";

import Link from "next/link";
import { type FormEvent, type ReactNode, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Building2, CheckCircle2, CreditCard, Globe, Loader2, MailPlus, ShieldCheck, Sparkles } from "lucide-react";
import { updateCurrentSubscriptionAction } from "@/app/actions/org-settings";
import {
  manageSubsCreateManualUserAction,
  manageSubsSaveTenantDomainAction,
  manageSubsSendTierInviteAction,
  manageSubsUpdateSubscriptionAction,
} from "@/app/actions/manage-subscriptions";
import type { IndustryProfile } from "@/lib/professions/runtime";
import { ADMIN_SUBSCRIPTION_TIER_OPTIONS, tierAllowance, tierLabelHe } from "@/lib/subscription-tier-config";
import { formatCurrencyILS } from "@/lib/ui-formatters";

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
}>;

type ActionResult = { ok: boolean; error?: string };
type ActionHandler = (formData: FormData) => Promise<ActionResult>;

const inputClass =
  "w-full rounded-2xl border border-[color:var(--v2-line)] bg-white/90 px-4 py-3 text-sm font-semibold text-[color:var(--v2-ink)] outline-none transition placeholder:text-[color:var(--v2-muted)] focus:border-[color:var(--v2-accent)]";

function SubmitButton({ busy, label }: { busy: boolean; label: string }) {
  return (
    <button type="submit" disabled={busy} className="v2-button v2-button-primary disabled:opacity-60">
      {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <CheckCircle2 className="h-4 w-4" aria-hidden />}
      {label}
    </button>
  );
}

function ActionForm({
  onSubmit,
  children,
}: {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
}) {
  return <form onSubmit={onSubmit} className="grid gap-4">{children}</form>;
}

export default function SubscriptionManagementWorkspace({
  currentOrganization,
  industryProfile,
  openIssuedCount,
  paidIssuedTotal,
  adminOrganizations,
}: Props) {
  const router = useRouter();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [, startTransition] = useTransition();
  const currentAllowance = tierAllowance(currentOrganization.subscriptionTier);

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
            <span className="v2-eyebrow">Subscription Workspace</span>
            <h1 className="mt-4 text-3xl font-black tracking-[-0.06em] text-[color:var(--v2-ink)] sm:text-5xl">
              מסך מנויים אחד לארגון, למסלולים ולהצטרפות.
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-[color:var(--v2-muted)] sm:text-lg">
              המסלול הפעיל, מכסות הסריקה וההצטרפות של הלקוחות לארגון מחוברים כאן לשפת המקצוע של
              {` ${industryProfile.industryLabel}`}. אפשר להגדיר מחדש גם מנוי קיים בלי לפרק את הארגון.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/register" className="v2-button v2-button-primary">
                עמוד הצטרפות
                <MailPlus className="h-4 w-4" aria-hidden />
              </Link>
              <Link href="/app/settings" className="v2-button v2-button-secondary">
                הגדרות מקצוע וארגון
                <Sparkles className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: "מסלול פעיל", value: tierLabelHe(currentOrganization.subscriptionTier), icon: CreditCard },
              { label: "סטטוס", value: currentOrganization.subscriptionStatus, icon: ShieldCheck },
              { label: "גבייה פתוחה", value: openIssuedCount.toString(), icon: Building2 },
              { label: "שולם עד כה", value: formatCurrencyILS(paidIssuedTotal), icon: Globe },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="v2-panel p-5">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--v2-accent-soft)] text-[color:var(--v2-accent)]">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <p className="mt-4 text-sm font-bold text-[color:var(--v2-muted)]">{label}</p>
                <p className="mt-2 text-2xl font-black tracking-[-0.04em] text-[color:var(--v2-ink)]">{value}</p>
              </div>
            ))}
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
          <section className="v2-panel p-6">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--v2-accent-soft)] text-[color:var(--v2-accent)]">
                <CreditCard className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h2 className="text-xl font-black text-[color:var(--v2-ink)]">המנוי של הארגון</h2>
                <p className="mt-2 text-sm leading-7 text-[color:var(--v2-muted)]">
                  אפשר לעבור בין מסלולים, לשנות סטטוס ולבצע הגדרה מחדש של מנוי פעיל.
                </p>
              </div>
            </div>

            <ActionForm onSubmit={submitWith("current-org", updateCurrentSubscriptionAction)}>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
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
                <SubmitButton busy={busyKey === "current-org"} label="שמור מנוי קיים" />
              </div>
            </ActionForm>
          </section>

          <section className="grid gap-3 lg:grid-cols-2">
            {ADMIN_SUBSCRIPTION_TIER_OPTIONS.map((tier) => {
              const allowance = tierAllowance(tier);
              return (
                <article
                  key={tier}
                  className={`rounded-3xl border px-5 py-5 ${
                    currentOrganization.subscriptionTier === tier
                      ? "border-[color:var(--v2-accent)] bg-[color:var(--v2-accent-soft)]"
                      : "border-[color:var(--v2-line)] bg-white/88"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-lg font-black text-[color:var(--v2-ink)]">{tierLabelHe(tier)}</p>
                    <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-black text-[color:var(--v2-muted)]">
                      {allowance.monthlyPriceIls == null ? "בתיאום" : `₪${allowance.monthlyPriceIls}`}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-[color:var(--v2-muted)]">
                    {allowance.cheapScans} זולות · {allowance.premiumScans} פרימיום ·{" "}
                    {allowance.unlimitedCompanies ? "ללא הגבלת חברות" : `עד ${allowance.maxCompanies} חברות`}
                  </p>
                </article>
              );
            })}
          </section>

          {adminOrganizations.length > 0 ? (
            <section className="v2-panel p-6">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--v2-accent-soft)] text-[color:var(--v2-accent)]">
                  <ShieldCheck className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <h2 className="text-xl font-black text-[color:var(--v2-ink)]">ניהול מנויים ברמת אדמין</h2>
                  <p className="mt-2 text-sm leading-7 text-[color:var(--v2-muted)]">
                    שליטה על ארגונים קיימים, עדכון דומיין, החלפת מסלול, ושליחת הזמנות להצטרפות.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 xl:grid-cols-2">
                <section className="rounded-3xl border border-[color:var(--v2-line)] bg-white/88 p-5">
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
                </section>

                <section className="rounded-3xl border border-[color:var(--v2-line)] bg-white/88 p-5">
                  <p className="font-black text-[color:var(--v2-ink)]">יצירת ארגון ידני</p>
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
                </section>
              </div>

              <div className="mt-5 grid gap-4">
                {adminOrganizations.map((organization) => (
                  <article key={organization.id} className="rounded-3xl border border-[color:var(--v2-line)] bg-white/88 p-5">
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
                        <input
                          name="tenantPublicDomain"
                          defaultValue={organization.tenantPublicDomain ?? ""}
                          className={inputClass}
                          dir="ltr"
                          placeholder="subdomain.example.co.il"
                        />
                        <div className="flex justify-end">
                          <SubmitButton busy={busyKey === `domain-${organization.id}`} label="שמור דומיין" />
                        </div>
                      </ActionForm>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="grid gap-4">
          <section className="v2-panel v2-panel-highlight p-6">
            <p className="text-lg font-black text-[color:var(--v2-ink)]">מצב המסלול הפעיל</p>
            <div className="mt-4 grid gap-3">
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
          </section>

          <section className="v2-panel p-6">
            <p className="text-lg font-black text-[color:var(--v2-ink)]">קישורי הצטרפות מהירים</p>
            <div className="mt-4 grid gap-3">
              {ADMIN_SUBSCRIPTION_TIER_OPTIONS.map((tier) => (
                <Link
                  key={tier}
                  href={`/register?plan=${encodeURIComponent(tier)}`}
                  className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-4 text-sm font-semibold text-[color:var(--v2-ink)] transition hover:bg-white"
                >
                  הצטרפות ל-{tierLabelHe(tier)}
                </Link>
              ))}
            </div>
          </section>

          <section className="v2-panel p-6">
            <p className="text-lg font-black text-[color:var(--v2-ink)]">הקשר מקצועי</p>
            <div className="mt-4 rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-4 text-sm leading-7 text-[color:var(--v2-muted)]">
              מסלול המנוי, סוגי המסמכים והטקסטים הציבוריים צריכים להתאים ל-{industryProfile.industryLabel}.
              לכן כל שינוי במנוי צריך להיבדק יחד עם דף הבית והגדרות המקצוע.
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}
