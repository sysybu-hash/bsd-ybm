"use client";

import React, { useState, useTransition, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Settings,
  UserPlus,
  Shield,
  CheckCircle2,
  AlertCircle,
  Building2,
  Save,
  User,
  Database,
  Users,
  Cpu,
  CreditCard,
  Sparkles,
  ExternalLink,
  Cloud,
  CalendarDays,
  Globe,
  Wallet,
  BarChart3,
  Bot,
  Receipt,
} from "lucide-react";
import {
  updateOrganizationAction,
  updateTenantPortalAction,
  updateBillingConnectionsAction,
} from "@/app/actions/org-settings";
import { createOrganizationInviteAction } from "@/app/actions/organization-invite";
import CloudBackupPanel from "@/components/CloudBackupPanel";
import TenantCalendarMini from "@/components/TenantCalendarMini";
import QuickPaymentPresetsSettings from "@/components/settings/QuickPaymentPresetsSettings";
import type { BillingWorkspaceV1 } from "@/lib/billing-workspace";
import { useI18n } from "@/components/I18nProvider";

const ORG_TYPE_VALUES = [
  { value: "HOME", msgKey: "settings.orgTypeHome" },
  { value: "FREELANCER", msgKey: "settings.orgTypeFreelancer" },
  { value: "COMPANY", msgKey: "settings.orgTypeCompany" },
  { value: "ENTERPRISE", msgKey: "settings.orgTypeEnterprise" },
] as const;

const COMPANY_TYPE_VALUES = [
  { value: "LICENSED_DEALER", label: "עוסק מורשה (מע״מ)" },
  { value: "EXEMPT_DEALER", label: "עוסק פטור (ללא מע״מ)" },
  { value: "LTD_COMPANY", label: "חברה בע״מ" },
] as const;

const PREFS_STORAGE_KEY = "bsd-settings-prefs";

type TabId = "account" | "erp" | "crm" | "ai" | "billing" | "cloud";

const TAB_ORDER: TabId[] = ["account", "erp", "crm", "ai", "billing", "cloud"];

const TAB_ICONS: Record<TabId, React.ReactNode> = {
  account: <Building2 size={14} />,
  erp:     <Receipt size={14} />,
  crm:     <Users size={14} />,
  ai:      <Bot size={14} />,
  billing: <CreditCard size={14} />,
  cloud:   <Cloud size={14} />,
};

const TAB_COLORS: Record<TabId, string> = {
  account: "text-indigo-600 border-indigo-600",
  erp:     "text-blue-600 border-blue-600",
  crm:     "text-violet-600 border-violet-600",
  ai:      "text-emerald-600 border-emerald-600",
  billing: "text-rose-600 border-rose-600",
  cloud:   "text-sky-600 border-sky-600",
};

type PlaceholderTabId = Exclude<TabId, "account" | "cloud">;

const PLACEHOLDER_FIELDS: Record<
  PlaceholderTabId,
  { key: string; label: string; hint?: string; options: { value: string; label: string }[] }[]
> = {
  erp: [
    {
      key: "defaultCurrency",
      label: "מטבע ברירת מחדל",
      hint: "יופיע בחשבוניות ובדוחות",
      options: [
        { value: "ILS", label: "₪ שקל חדש (ILS)" },
        { value: "USD", label: "$ דולר אמריקאי (USD)" },
        { value: "EUR", label: "€ יורו (EUR)" },
        { value: "GBP", label: "£ פאונד בריטי (GBP)" },
      ],
    },
    {
      key: "fiscalYearEnd",
      label: "סגירת שנת כספים",
      hint: "התאריך שבו מסתיימת שנת הכספים",
      options: [
        { value: "12-31", label: "31 בדצמבר (רגיל)" },
        { value: "03-31", label: "31 במרץ" },
        { value: "06-30", label: "30 ביוני" },
        { value: "09-30", label: "30 בספטמבר" },
      ],
    },
    {
      key: "vatRate",
      label: "שיעור מע\"מ",
      hint: "לחישוב חשבוניות מס",
      options: [
        { value: "18", label: "18% (ישראל — עדכני 2025)" },
        { value: "17", label: "17% (ישראל — עד 2024)" },
        { value: "0", label: "0% (עסק פטור / יצוא)" },
      ],
    },
    {
      key: "bankSync",
      label: "סנכרון בנקים",
      hint: "ייבוא תנועות בנקאיות אוטומטי",
      options: [
        { value: "manual", label: "ידני — ייבוא CSV/Excel" },
        { value: "auto", label: "אוטומטי (בפיתוח)" },
        { value: "none", label: "לא בשימוש" },
      ],
    },
  ],
  crm: [
    {
      key: "leadStatus",
      label: "סטטוס ברירת מחדל לליד חדש",
      hint: "הסטטוס שמוקצה אוטומטית בפנייה נכנסת",
      options: [
        { value: "new", label: "פנייה ראשונה" },
        { value: "active", label: "פעיל" },
        { value: "hot", label: "חם" },
        { value: "cold", label: "קר" },
      ],
    },
    {
      key: "quoteExpiry",
      label: "תוקף הצעת מחיר",
      hint: "כמה ימים ההצעה בתוקף לאחר הפקה",
      options: [
        { value: "7", label: "7 ימים" },
        { value: "14", label: "14 ימים" },
        { value: "30", label: "30 ימים" },
        { value: "0", label: "ללא הגבלה" },
      ],
    },
    {
      key: "whatsapp",
      label: "אינטגרציה WhatsApp",
      hint: "שליחת עדכונים ולידים דרך WhatsApp Business API",
      options: [
        { value: "none", label: "לא מחובר" },
        { value: "beta", label: "מחובר (בטא)" },
        { value: "disabled", label: "לא רלוונטי לארגון" },
      ],
    },
    {
      key: "followUpDays",
      label: "תזכורת מעקב אוטומטי",
      hint: "כמה ימים אחרי יצירת ליד לשלוח תזכורת",
      options: [
        { value: "1", label: "יום אחד" },
        { value: "3", label: "3 ימים" },
        { value: "7", label: "שבוע" },
        { value: "0", label: "ללא תזכורת" },
      ],
    },
  ],
  ai: [
    {
      key: "engine",
      label: "מנוע AI ראשי",
      hint: "המנוע שישמש לסריקה, חילוץ נתונים וצ׳אט",
      options: [
        { value: "auto", label: "אוטומטי (מומלץ)" },
        { value: "gemini", label: "Google Gemini" },
        { value: "openai", label: "OpenAI GPT" },
        { value: "claude", label: "Anthropic Claude" },
      ],
    },
    {
      key: "docLang",
      label: "שפת זיהוי מסמכים",
      hint: "שפת ברירת מחדל לחילוץ טקסט ממסמכים",
      options: [
        { value: "auto", label: "אוטומטי (זיהוי שפה)" },
        { value: "he", label: "עברית" },
        { value: "en", label: "אנגלית" },
        { value: "ar", label: "ערבית" },
      ],
    },
    {
      key: "ocr",
      label: "רמת פיענוח OCR",
      hint: "איזון בין מהירות לדיוק בחילוץ טקסט",
      options: [
        { value: "standard", label: "סטנדרטי — מהיר ומדויק" },
        { value: "high", label: "גבוה — מדויק יותר, איטי יותר" },
        { value: "fast", label: "מהיר — פחות מדויק" },
      ],
    },
    {
      key: "autoSummarize",
      label: "סיכום מסמך אוטומטי",
      hint: "יצירת סיכום AI אחרי כל העלאה",
      options: [
        { value: "on", label: "מופעל" },
        { value: "off", label: "כבוי" },
        { value: "ask", label: "שאל בכל פעם" },
      ],
    },
  ],
  billing: [
    {
      key: "billingCycle",
      label: "מחזור חיוב מועדף",
      hint: "תדירות חיוב המנוי",
      options: [
        { value: "monthly", label: "חודשי" },
        { value: "yearly", label: "שנתי (חיסכון 20%)" },
      ],
    },
    {
      key: "invoiceFormat",
      label: "פורמט חשבוניות להורדה",
      options: [
        { value: "pdf", label: "PDF" },
        { value: "html", label: "HTML" },
        { value: "both", label: "PDF + HTML" },
      ],
    },
    {
      key: "autoRenew",
      label: "חידוש מנוי אוטומטי",
      hint: "חידוש אוטומטי לפני תום התקופה",
      options: [
        { value: "on", label: "מופעל" },
        { value: "off", label: "כבוי — חידוש ידני" },
      ],
    },
  ],
};

export default function SettingsPageClient({
  initialOrg,
  initialBillingWorkspace,
  initialTab,
}: {
  initialOrg: {
    name: string;
    type: string;
    companyType: string;
    taxId: string | null;
    address: string | null;
    isReportable: boolean;
    calendarGoogleEnabled: boolean;
    tenantPublicDomain: string | null;
    tenantSiteBrandingJson: string;
    paypalMerchantEmail: string | null;
    paypalMeSlug: string | null;
    liveDataTier: string;
  } | null;
  initialBillingWorkspace: BillingWorkspaceV1 | null;
  initialTab?: string;
}) {
  const { t, dir } = useI18n();
  const { data: session } = useSession();
  const canEditTaxProfile =
    session?.user?.role === "ORG_ADMIN" || session?.user?.role === "SUPER_ADMIN";
  const router = useRouter();
  const orgFormRef = useRef<HTMLFormElement>(null);
  const [activeTab, setActiveTab] = useState<TabId>("account");
  const [prefs, setPrefs] = useState<Record<string, string>>({});
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [prefsMsg, setPrefsMsg] = useState<string | null>(null);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("EMPLOYEE");
  const [status, setStatus] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);
  const [teamInviteMsg, setTeamInviteMsg] = useState<string | null>(null);
  const [pendingTeamInvite, startTeamInvite] = useTransition();
  const [orgMsg, setOrgMsg] = useState<string | null>(null);
  const [pendingOrg, startOrgTransition] = useTransition();
  const [portalMsg, setPortalMsg] = useState<string | null>(null);
  const [pendingPortal, startPortalTransition] = useTransition();
  const [calendarConnectHint, setCalendarConnectHint] = useState<string | null>(null);
  const [paymentConnMsg, setPaymentConnMsg] = useState<string | null>(null);
  const [pendingPayment, startPaymentTransition] = useTransition();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PREFS_STORAGE_KEY);
      if (raw) setPrefs(JSON.parse(raw) as Record<string, string>);
    } catch {
      /* ignore */
    }
    setPrefsLoaded(true);
  }, []);

  useEffect(() => {
    if (initialTab && TAB_ORDER.includes(initialTab as TabId)) {
      setActiveTab(initialTab as TabId);
    }
  }, [initialTab]);

  const prefKey = (tab: PlaceholderTabId, key: string) => `${tab}:${key}`;
  const getPref = (tab: PlaceholderTabId, key: string) =>
    prefs[prefKey(tab, key)] ?? "";
  const setPref = (tab: PlaceholderTabId, key: string, value: string) => {
    setPrefs((p) => ({ ...p, [prefKey(tab, key)]: value }));
  };

  const persistPrefs = () => {
    if (!prefsLoaded) return;
    localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
    setPrefsMsg(t("settings.prefsSavedLocal"));
    setTimeout(() => setPrefsMsg(null), 3500);
  };

  const handleHeaderSave = () => {
    if (activeTab === "account") {
      orgFormRef.current?.requestSubmit();
      return;
    }
    if (activeTab === "cloud") {
      setPrefsMsg(t("settings.saveHint"));
      setTimeout(() => setPrefsMsg(null), 3500);
      return;
    }
    persistPrefs();
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    const res = await fetch("/api/assign-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: inviteEmail,
        organizationId: session?.user?.organizationId,
        role: inviteRole as "EMPLOYEE" | "ORG_ADMIN" | "PROJECT_MGR" | "CLIENT",
      }),
    });

    const data = await res.json();
    if (res.ok) {
      setStatus({
        type: "success",
        msg: t("settings.inviteOk", { email: inviteEmail }),
      });
      setInviteEmail("");
    } else {
      setStatus({
        type: "error",
        msg: data.error || t("settings.assignError"),
      });
    }
  };

  const currentTitle = t(`settings.${activeTab}`);

  return (
    <div className="text-gray-900" dir={dir}>
      <div className="overflow-hidden rounded-3xl border border-indigo-100 bg-white shadow-sm">

        {/* ── Page hero ── */}
        <div className="relative overflow-hidden border-b border-indigo-900/20 bg-gradient-to-l from-indigo-950 to-indigo-900 px-6 py-5">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-8 end-20 h-32 w-32 rounded-full bg-indigo-400/10 blur-[50px]" />
          </div>
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-400/20 text-indigo-200 ring-1 ring-indigo-400/30">
                <Settings size={18} />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">{currentTitle}</h3>
                <p className="text-[11px] text-indigo-300/70">הגדרות המערכת והארגון</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleHeaderSave}
              disabled={activeTab === "account" ? pendingOrg : false}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-indigo-900/40 transition hover:bg-indigo-400 disabled:opacity-50"
            >
              <Save size={15} />
              {activeTab === "account"
                ? pendingOrg
                  ? t("common.loading")
                  : t("settings.save")
                : activeTab === "cloud"
                  ? t("settings.cloudSaveCTA")
                  : t("settings.savePrefs")}
            </button>
          </div>
        </div>

        {/* ── Tab bar ── */}
        <nav className="flex flex-row overflow-x-auto border-b border-gray-100 bg-gray-50/60 px-3 gap-0">
          {TAB_ORDER.map((tabId) => (
            <button
              key={tabId}
              type="button"
              onClick={() => setActiveTab(tabId)}
              className={`flex items-center gap-2 whitespace-nowrap px-4 py-3.5 text-[12px] font-bold border-b-2 transition-all ${
                activeTab === tabId
                  ? `border-b-2 bg-white ${TAB_COLORS[tabId]}`
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200"
              }`}
            >
              <span className={activeTab === tabId ? "" : "text-gray-400"}>{TAB_ICONS[tabId]}</span>
              {t(`settings.${tabId}`)}
            </button>
          ))}
        </nav>

        {/* ── Content ── */}
        <main className="min-w-0 flex-1 p-5 md:p-7">

          {prefsMsg && (
            <p className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700">
              {prefsMsg}
            </p>
          )}

          {activeTab === "account" && (
            <div className="grid grid-cols-1 gap-6">
              <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/50 to-teal-50/30 p-6">
                <h4 className="mb-4 flex items-center gap-2 text-base font-black text-slate-800">
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600"><Shield size={14} /></span> פרופיל אישי
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600">
                  <div className="bg-white p-4 rounded-2xl border border-slate-100">
                    שם:{" "}
                    <span className="text-slate-900 block font-bold text-lg mt-1">
                      {session?.user?.name ?? "—"}
                    </span>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-100">
                    אימייל:{" "}
                    <span className="text-slate-900 block font-bold text-lg mt-1">
                      {session?.user?.email ?? "—"}
                    </span>
                  </div>
                </div>
              </div>

              {initialOrg && (
                <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/40 to-blue-50/30 p-6">
                  <h4 className="flex items-center gap-2 text-base font-black text-slate-900 mb-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600"><Building2 size={14} /></span>
                    חברה / ארגון
                  </h4>
                  <p className="text-slate-600 text-sm mb-6">
                    השם משמש לזיהוי הארגון במערכת (CRM, מסמכים וכו׳).
                  </p>
                  <form
                    ref={orgFormRef}
                    action={(fd) => {
                      setOrgMsg(null);
                      startOrgTransition(async () => {
                        const r = await updateOrganizationAction(fd);
                        setOrgMsg(r.ok ? "✓ נשמר" : r.error || "שגיאה");
                        if (r.ok) router.refresh();
                      });
                    }}
                    className="space-y-4 max-w-lg"
                  >
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        שם העסק / הארגון
                      </label>
                      <input
                        name="name"
                        required
                        defaultValue={initialOrg.name}
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">סוג</label>
                      <select
                        name="type"
                        defaultValue={initialOrg.type}
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 bg-white text-slate-900"
                      >
                        {ORG_TYPE_VALUES.map((o) => (
                          <option key={o.value} value={o.value}>
                            {t(o.msgKey)}
                          </option>
                        ))}
                      </select>
                    </div>
                    {canEditTaxProfile ? (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            סיווג מס (חשבוניות / מע״מ)
                          </label>
                          <select
                            name="companyType"
                            defaultValue={initialOrg.companyType}
                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 bg-white text-slate-900"
                          >
                            {COMPANY_TYPE_VALUES.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            ח.פ / ע.מ
                          </label>
                          <input
                            name="taxId"
                            defaultValue={initialOrg.taxId ?? ""}
                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 bg-white"
                            placeholder="למשל מספר עוסק מורשה"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">כתובת</label>
                          <textarea
                            name="address"
                            rows={3}
                            defaultValue={initialOrg.address ?? ""}
                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 bg-white resize-y min-h-[5rem]"
                            placeholder="כתובת להצגה במסמכים"
                          />
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 space-y-2">
                          <label className="flex items-start gap-3 cursor-pointer text-sm font-medium text-slate-800">
                            <input
                              type="checkbox"
                              name="isReportable"
                              defaultChecked={initialOrg.isReportable}
                              className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span>
                              ארגון מדווח למס (חשבוניות והפקות רשמיות)
                              <span className="block text-xs font-normal text-slate-500 mt-1">
                                כבו את הסימון לניהול אישי בלבד — מסמכים יוצגו כמזכר פנימי ללא חישוב מע״מ.
                              </span>
                            </span>
                          </label>
                        </div>
                        <div className="rounded-xl border border-sky-100 bg-sky-50/60 px-4 py-3 text-sm text-slate-700 leading-relaxed">
                          <p className="font-bold text-slate-900 mb-1">הפקת מסמכים ותשלומים</p>
                          <p>
                            לפי הסיווג והדיווח שמגדירים כאן (מנהל ארגון), ניתן להפיק בדף{" "}
                            <Link href="/dashboard/billing" className="font-bold text-blue-700 underline">
                              מנוי ותשלומים
                            </Link>{" "}
                            את <strong>כל סוגי המסמכים</strong> שבמערכת: חשבונית מס, קבלה, חשבונית
                            מס־קבלה וזיכוי. מע״מ וחישובים תואמים את סוג העוסק. גבייה מהלקוחות מתבצעת
                            לפי הגדרות התשלום (PayPal של הארגון בלשונית מנויים) והמנוי.
                          </p>
                          <p className="mt-2 text-xs text-slate-600">
                            חשבון PayPal של <strong>מפעיל האתר</strong> מוגדר בשרת בלבד (משתני סביבה) ומוצג
                            בדף אדמין — לא כאן.
                          </p>
                          <p className="mt-2 text-xs text-slate-600">
                            מסמכים סרוקים ישנים מהמחשב נכנסים דרך{" "}
                            <Link href="/dashboard/erp" className="font-bold text-blue-700 underline">
                              תפעול וכספים (ERP)
                            </Link>{" "}
                            — סורק ה־AI עם העלאה מרובת־קבצים; חיבור ענן — בלשונית{" "}
                            <Link href="/dashboard/settings?tab=cloud" className="font-bold text-blue-700 underline">
                              גיבוי ענן
                            </Link>
                            .
                          </p>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-slate-500 bg-white border border-slate-100 rounded-xl px-4 py-3">
                        פרטי מס וכתובת (ח.פ, סיווג עוסק) ניתנים לעדכון על ידי{" "}
                        <strong>מנהל ארגון</strong> בלבד. לשינוי — בקשו ממנהל הארגון או פנו לתמיכה.
                        <span className="block mt-2 text-slate-600">
                          הפקת כל סוגי המסמכים ותשלומי לקוחות — ב־
                          <Link href="/dashboard/billing" className="font-bold text-blue-700 underline">
                            מנוי ותשלומים
                          </Link>
                          ; ייבוא סריקות ישנות — ב־
                          <Link href="/dashboard/erp" className="font-bold text-blue-700 underline">
                            ERP
                          </Link>
                          .
                        </span>
                      </p>
                    )}
                  </form>
                  {orgMsg && (
                    <p
                      className={`mt-3 text-sm ${
                        orgMsg.startsWith("✓") ? "text-emerald-700" : "text-red-600"
                      }`}
                    >
                      {orgMsg}
                    </p>
                  )}
                </div>
              )}

              {initialOrg && canEditTaxProfile && (
                <div className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50/40 to-cyan-50/30 p-6">
                  <h4 className="flex items-center gap-2 text-base font-black text-slate-900 mb-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-sky-100 text-sky-600"><Globe size={14} /></span>
                    פורטל המנוי, דף הבית ודומיין
                  </h4>
                  <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                    דומיין ציבורי (לאחר הגדרת DNS ב־Vercel), מיתוג JSON לעמוד הנחיתה, ולוח שנה עם סנכרון Google
                    — כאן מגדירים את חוויית האתר של הארגון.
                  </p>
                  <form
                    action={(fd) => {
                      setPortalMsg(null);
                      startPortalTransition(async () => {
                        const r = await updateTenantPortalAction(fd);
                        setPortalMsg(r.ok ? "✓ הגדרות הפורטל נשמרו" : r.error || "שגיאה");
                        if (r.ok) router.refresh();
                      });
                    }}
                    className="space-y-4 max-w-2xl"
                  >
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        דומיין ציבורי (ללא https)
                      </label>
                      <input
                        name="tenantPublicDomain"
                        type="text"
                        dir="ltr"
                        defaultValue={initialOrg.tenantPublicDomain ?? ""}
                        placeholder="app.example.co.il"
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 bg-white font-mono text-sm"
                      />
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                      <label className="flex items-start gap-3 cursor-pointer text-sm font-medium text-slate-800">
                        <input
                          type="checkbox"
                          name="calendarGoogleEnabled"
                          defaultChecked={initialOrg.calendarGoogleEnabled}
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="flex items-center gap-2">
                          <CalendarDays size={16} className="text-blue-600 shrink-0" aria-hidden />
                          הצגת לוח שנה בדשבורד והכנה לסנכרון Google Calendar
                        </span>
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        מיתוג אתר (JSON — אופציונלי)
                      </label>
                      <textarea
                        name="tenantSiteBrandingJson"
                        rows={6}
                        dir="ltr"
                        defaultValue={initialOrg.tenantSiteBrandingJson}
                        placeholder='{ "landingTitle": "...", "tagline": "...", "primaryColor": "#2563eb" }'
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 bg-white resize-y min-h-[8rem] font-mono text-xs"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={pendingPortal}
                      className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {pendingPortal ? "שומר…" : "שמור הגדרות פורטל"}
                    </button>
                  </form>
                  {portalMsg && (
                    <p
                      className={`mt-3 text-sm ${
                        portalMsg.startsWith("✓") ? "text-emerald-700" : "text-red-600"
                      }`}
                    >
                      {portalMsg}
                    </p>
                  )}
                  {initialOrg.calendarGoogleEnabled ? (
                    <div className="mt-8 space-y-4 border-t border-slate-200 pt-8">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm font-bold text-slate-800">לוח שנה</p>
                        <button
                          type="button"
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50"
                          onClick={async () => {
                            setCalendarConnectHint(null);
                            try {
                              const res = await fetch("/api/integrations/google-calendar");
                              const data = (await res.json()) as { message?: string };
                              setCalendarConnectHint(
                                data.message ?? "לא ניתן לטעון סטטוס חיבור.",
                              );
                            } catch {
                              setCalendarConnectHint("שגיאת רשת בבדיקת החיבור.");
                            }
                          }}
                        >
                          בדיקת סטטוס חיבור Google
                        </button>
                      </div>
                      {calendarConnectHint ? (
                        <p className="text-sm text-slate-600 bg-white border border-slate-100 rounded-xl px-4 py-3">
                          {calendarConnectHint}
                        </p>
                      ) : null}
                      <TenantCalendarMini />
                    </div>
                  ) : null}
                </div>
              )}

              <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/40 to-purple-50/30 p-6">
                <h4 className="flex items-center gap-2 text-base font-black text-slate-900 mb-4">
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-violet-100 text-violet-600"><UserPlus size={14} /></span> ניהול צוות
                </h4>
                <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                  <strong className="text-slate-800">דרך מומלצת:</strong> שליחת קישור במייל — אתם בוחרים
                  תפקיד מראש, והנרשם <strong>לא</strong> מקבל ארגון משלו ולא הופך אוטומטית למנהל, אלא
                  מצטרף <strong>רק</strong> לארגון שלכם.
                </p>

                <div className="mb-8 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
                  <p className="text-sm font-bold text-emerald-900 mb-3">1 — הזמנת צוות במייל (קישור)</p>
                  <form
                    className="flex flex-col gap-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      setTeamInviteMsg(null);
                      const fd = new FormData(e.currentTarget);
                      startTeamInvite(async () => {
                        const r = await createOrganizationInviteAction(fd);
                        if (r.ok) {
                          setTeamInviteMsg(`נשלח מייל עם קישור הרשמה. ניתן גם להעתיק: ${r.registerUrl}`);
                          (e.target as HTMLFormElement).reset();
                        } else {
                          setTeamInviteMsg(`שגיאה: ${r.error}`);
                        }
                      });
                    }}
                  >
                    <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
                      <input
                        type="email"
                        name="email"
                        placeholder="אימייל מוזמן"
                        className="flex-1 min-w-[200px] bg-white border border-slate-200 rounded-2xl px-5 py-3 text-sm text-slate-900"
                        required
                      />
                      <select
                        name="role"
                        defaultValue="EMPLOYEE"
                        className="sm:w-56 bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900"
                        aria-label="תפקיד בהזמנה"
                      >
                        <option value="EMPLOYEE">עובד / צוות</option>
                        <option value="PROJECT_MGR">מנהל פרויקטים</option>
                        <option value="CLIENT">לקוח / צופה</option>
                        <option value="ORG_ADMIN">מנהל ארגון (שימוש זהיר)</option>
                      </select>
                      <input type="hidden" name="validDays" value="14" />
                      <button
                        type="submit"
                        disabled={pendingTeamInvite}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-2xl font-bold disabled:opacity-50"
                      >
                        {pendingTeamInvite ? "שולח…" : "שליחת קישור במייל"}
                      </button>
                    </div>
                  </form>
                  {teamInviteMsg && (
                    <p className="mt-3 text-xs text-emerald-900 whitespace-pre-wrap break-all">
                      {teamInviteMsg}
                    </p>
                  )}
                </div>

                <details className="mb-4 text-sm text-slate-600 bg-white/80 rounded-2xl border border-slate-100 px-4 py-3">
                  <summary className="cursor-pointer font-bold text-slate-800">
                    מה ההבדל בין תפקידים?
                  </summary>
                  <ul className="mt-2 space-y-2 list-disc list-inside pe-2">
                    <li>
                      <strong>עובד / צוות</strong> — שגרה; בלי ניהול צוות והגדרות ארגון.
                    </li>
                    <li>
                      <strong>מנהל פרויקטים / לקוח</strong> — רמות גישה מצומצמות יותר לפי המערכת.
                    </li>
                    <li>
                      <strong>מנהל ארגון</strong> — שיוך משתמשים והגדרות.
                    </li>
                  </ul>
                </details>

                <p className="text-slate-600 text-sm mb-3 font-bold text-slate-800">
                  2 — שיוך ידני (רק אחרי שכבר נכנסו פעם אחת עם Google)
                </p>
                <form onSubmit={handleInvite} className="flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="אימייל (Google)"
                      className="flex-1 min-w-[200px] bg-white border border-slate-200 rounded-2xl px-5 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[var(--primary-color,#3b82f6)] outline-none"
                      required
                    />
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="sm:w-56 bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900"
                      aria-label="תפקיד משתמש"
                    >
                      <option value="EMPLOYEE">תפקיד: עובד / צוות</option>
                      <option value="PROJECT_MGR">תפקיד: מנהל פרויקטים</option>
                      <option value="CLIENT">תפקיד: לקוח / צופה</option>
                      <option value="ORG_ADMIN">תפקיד: מנהל ארגון</option>
                    </select>
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-blue-600/20"
                    >
                      שייך לארגון
                    </button>
                  </div>
                </form>
                {status && (
                  <div
                    className={`mt-6 p-4 rounded-2xl flex items-center gap-3 ${
                      status.type === "success"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-red-50 text-red-800 border border-red-200"
                    }`}
                  >
                    {status.type === "success" ? (
                      <CheckCircle2 size={18} />
                    ) : (
                      <AlertCircle size={18} />
                    )}
                    <span className="text-sm font-medium">{status.msg}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "cloud" && <CloudBackupPanel />}

          {activeTab !== "account" && activeTab !== "cloud" && (
            <div className="grid grid-cols-1 gap-6">
              {activeTab === "billing" && initialOrg && canEditTaxProfile && (
                <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/40 to-sky-50/30 p-6">
                  <h4 className="flex items-center gap-2 text-base font-black text-slate-900 mb-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#e8f4fd] text-[#0070ba]"><Wallet size={14} /></span>
                    PayPal של הארגון + רמת נתונים חיים
                  </h4>
                  <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                    Stripe הוסר מהמערכת (לא מתאים לישראל). השדות למטה הם ל־<strong>לקוחות הארגון</strong>{" "}
                    (לא חשבון מפעיל האתר). בממשק המנויים תשלומי קצה מוצגים ב־PayPal לפי מה שמוגדר כאן —
                    ראו{" "}
                    <Link href="/dashboard/billing" className="font-bold text-blue-700 underline">
                      דף המנויים
                    </Link>
                    . כאן מגדירים את חשבון PayPal: מייל לקבלה ואופציונלית PayPal.Me לקישורי תשלום.
                  </p>
                  <form
                    action={(fd) => {
                      setPaymentConnMsg(null);
                      startPaymentTransition(async () => {
                        const r = await updateBillingConnectionsAction(fd);
                        setPaymentConnMsg(r.ok ? "✓ נשמר" : r.error || "שגיאה");
                        if (r.ok) router.refresh();
                      });
                    }}
                    className="space-y-4 max-w-xl"
                  >
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        מייל חשבון PayPal (לקבלת תשלומים)
                      </label>
                      <input
                        name="paypalMerchantEmail"
                        type="email"
                        dir="ltr"
                        defaultValue={initialOrg.paypalMerchantEmail ?? ""}
                        placeholder="your-paypal@email.com"
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 bg-white font-mono text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        שם משתמש PayPal.Me (אופציונלי)
                      </label>
                      <input
                        name="paypalMeSlug"
                        type="text"
                        dir="ltr"
                        defaultValue={initialOrg.paypalMeSlug ?? ""}
                        placeholder="למשל: MyBusiness"
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 bg-white font-mono text-sm"
                      />
                      <p className="mt-1 text-xs text-slate-500">
                        רק השם — יוצג קישור ל־paypal.me/… לשיתוף עם לקוחות.
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        רמת נתונים חיים / הכנה לביטוח ושירותים
                      </label>
                      <select
                        name="liveDataTier"
                        defaultValue={initialOrg.liveDataTier || "basic"}
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 bg-white text-slate-900 text-sm font-medium"
                      >
                        <option value="basic">בסיסי — ללא הזנת נתונים חיצוניים</option>
                        <option value="standard">מתקדם — מוכן לחיבור ספקים</option>
                        <option value="premium">פרימיום — נתונים חיים + ביטוח (הרחבה עתידית)</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      disabled={pendingPayment}
                      className="rounded-2xl bg-[#0070ba] px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-[#005ea6] disabled:opacity-50"
                    >
                      {pendingPayment ? "שומר…" : "שמור הגדרות תשלום ונתונים"}
                    </button>
                  </form>
                  {paymentConnMsg && (
                    <p
                      className={`mt-3 text-sm ${
                        paymentConnMsg.startsWith("✓") ? "text-emerald-700" : "text-red-600"
                      }`}
                    >
                      {paymentConnMsg}
                    </p>
                  )}
                </div>
              )}

              {activeTab === "billing" && initialBillingWorkspace && canEditTaxProfile ? (
                <QuickPaymentPresetsSettings
                  key={JSON.stringify(initialBillingWorkspace.quickPaymentPresets)}
                  workspace={initialBillingWorkspace}
                />
              ) : null}

              {(activeTab === "ai" || activeTab === "billing") && (
                <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-blue-200 bg-gradient-to-l from-blue-50 to-indigo-50 p-4">
                  <Sparkles className="text-blue-600 shrink-0" size={22} />
                  <div className="flex-1 min-w-[200px] text-sm text-slate-700">
                    {activeTab === "ai" ? (
                      <>
                        לסריקה, צ׳אט והנחיות AI מלאות — פתחו את{" "}
                        <Link href="/dashboard/ai" className="font-bold text-blue-700 underline">
                          מרכז AI
                        </Link>
                        .
                      </>
                    ) : (
                      <>
                        ניהול מנוי ותשלומים —{" "}
                        <Link
                          href="/dashboard/billing"
                          className="font-bold text-blue-700 underline inline-flex items-center gap-1"
                        >
                          דף המנויים <ExternalLink size={14} />
                        </Link>
                        .
                      </>
                    )}
                  </div>
                </div>
              )}
              {activeTab === "erp" && (
                <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/50 p-4 text-sm text-slate-700">
                  <Receipt size={16} className="text-blue-600 shrink-0" />
                  <span>ניהול מסמכים ודוחות —{" "}
                  <Link href="/dashboard/erp" className="font-bold text-blue-700 underline">פתיחת ERP</Link>.</span>
                </div>
              )}
              {activeTab === "crm" && (
                <div className="flex items-center gap-3 rounded-2xl border border-violet-100 bg-violet-50/50 p-4 text-sm text-slate-700">
                  <Users size={16} className="text-violet-600 shrink-0" />
                  <span>לקוחות ולידים —{" "}
                  <Link href="/dashboard/crm" className="font-bold text-violet-700 underline">פתיחת CRM</Link>.</span>
                </div>
              )}

              {PLACEHOLDER_FIELDS[activeTab as PlaceholderTabId].map((field) => (
                <div
                  key={field.key}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <label className="block font-bold text-slate-800 mb-1">{field.label}</label>
                  {field.hint && (
                    <p className="text-xs text-slate-500 mb-3">{field.hint}</p>
                  )}
                  <select
                    value={getPref(activeTab as PlaceholderTabId, field.key) || field.options[0].value}
                    onChange={(e) =>
                      setPref(activeTab as PlaceholderTabId, field.key, e.target.value)
                    }
                    className="w-full sm:w-72 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-medium"
                  >
                    {field.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              ))}
              <p className="text-xs text-slate-500 italic">
                הגדרות אלו נשמרות מקומית בדפדפן; חיבור לשרת יגיע בעדכון עתידי.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
