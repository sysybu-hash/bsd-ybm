"use client";

import React, { useState, useTransition, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Globe,
  Settings,
  CreditCard,
  Bot,
  Receipt,
  UserPlus,
  Save,
  CheckCircle2,
  CalendarDays,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { updateOrganizationAction, updateTenantPortalAction, updateBillingConnectionsAction } from "@/app/actions/org-settings";
import { createOrganizationInviteAction } from "@/app/actions/organization-invite";
import type { BillingWorkspaceV1 } from "@/lib/billing-workspace";
import { useI18n } from "@/components/I18nProvider";
import WizardContainer, { WizardStepConfig } from "@/components/wizard/WizardContainer";
import CloudBackupPanel from "@/components/CloudBackupPanel";

// Data Configs
const ORG_TYPE_VALUES = [
  { value: "HOME", label: "ניהול אישי ותקציב ביתי" },
  { value: "FREELANCER", label: "עצמאי / חברה יחידה" },
  { value: "COMPANY", label: "חברה (עד 50 עובדים)" },
  { value: "ENTERPRISE", label: "תאגיד / Enterprise" },
];

const COMPANY_TYPE_VALUES = [
  { value: "LICENSED_DEALER", label: "עוסק מורשה (הגשת מע״מ)" },
  { value: "EXEMPT_DEALER", label: "עוסק פטור (ללא מע״מ)" },
  { value: "LTD_COMPANY", label: "חברה בע״מ (LTD)" },
];

export default function SettingsPageClient({
  initialOrg,
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
}) {
  const { dir } = useI18n();
  const { data: session } = useSession();
  const canEdit = session?.user?.role === "ORG_ADMIN" || session?.user?.role === "SUPER_ADMIN";
  const router = useRouter();

  const [activeStepIndex, setActiveStepIndex] = useState(0);

  // Transitions
  const [pendingOrg, startOrgTransition] = useTransition();
  const [orgMsg, setOrgMsg] = useState<string | null>(null);

  const [pendingPortal, startPortalTransition] = useTransition();
  const [portalMsg, setPortalMsg] = useState<string | null>(null);

  const [pendingPayment, startPaymentTransition] = useTransition();
  const [paymentMsg, setPaymentMsg] = useState<string | null>(null);

  const [inviteEmail, setInviteEmail] = useState("");
  const [teamInviteMsg, setTeamInviteMsg] = useState<string | null>(null);

  // Submit Handlers
  const handleOrgSubmit = (fd: FormData) => {
    startOrgTransition(async () => {
      const r = await updateOrganizationAction(fd);
      setOrgMsg(r.ok ? "✓ פרופיל הארגון חודש בהצלחה" : r.error || "שגיאה בעדכון");
      if (r.ok) {
         router.refresh();
         setTimeout(() => setActiveStepIndex(1), 1000);
      }
    });
  };

  const handlePortalSubmit = (fd: FormData) => {
    startPortalTransition(async () => {
      const r = await updateTenantPortalAction(fd);
      setPortalMsg(r.ok ? "✓ הגדרות מערכת האתר עודכנו" : r.error || "שגיאה בעדכון הפורטל");
      if (r.ok) {
         router.refresh();
         setTimeout(() => setActiveStepIndex(2), 1000);
      }
    });
  };

  const handlePaymentSubmit = (fd: FormData) => {
    startPaymentTransition(async () => {
      const r = await updateBillingConnectionsAction(fd);
      setPaymentMsg(r.ok ? "✓ נתוני הסליקה והחיוב אומתו ונשמרו" : r.error || "שגיאה בחיבור הארנק");
      if (r.ok) {
         router.refresh();
         setTimeout(() => setActiveStepIndex(3), 1000);
      }
    });
  };

  const handleTeamInvite = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    startOrgTransition(async () => {
      const r = await createOrganizationInviteAction(fd);
      if (r.ok) {
        setTeamInviteMsg(`נשלח בהצלחה! קישור הרשמה לעובד: ${r.registerUrl}`);
        (e.target as HTMLFormElement).reset();
      } else {
        setTeamInviteMsg(`שגיאה: ${r.error}`);
      }
    });
  };

  // Styles
  const inputClass = "w-full rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 hover:border-blue-300 placeholder:text-slate-400";
  const labelClass = "mb-2 block text-xs font-black uppercase tracking-widest text-slate-500";

  if (!initialOrg) {
    return <div className="p-10 text-center font-bold text-slate-500">אנא המתן, טוען נתוני ארגון...</div>;
  }

  const STEPS: WizardStepConfig[] = [
    {
      id: "org-profile",
      title: "פרופיל עסקי ומסים",
      description: "הגדרה ראשונית של היישות העסקית שלך מול רשויות המס (ERP).",
      icon: <Building2 />,
      content: (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
             <div className="flex items-center gap-4 border-b border-slate-100 pb-6 mb-6">
               <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Receipt size={24}/></div>
               <div>
                  <h3 className="text-xl font-black text-slate-900">הגדרת יישות ל-ERP</h3>
                  <p className="text-sm font-medium text-slate-500">הנתונים יופיעו בחשבוניות המס שמופקות ללקוחות בארץ ובחו״ל.</p>
               </div>
             </div>
             
             <form action={handleOrgSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                      <label className={labelClass}>שם העסק / חברה (יופיע במסמכים)</label>
                      <input name="name" required defaultValue={initialOrg.name} className={inputClass} placeholder="השם הרשמי..." />
                   </div>
                   <div>
                      <label className={labelClass}>צורת התאגדות</label>
                      <select name="type" defaultValue={initialOrg.type} className={inputClass}>
                         {ORG_TYPE_VALUES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                   </div>
                   <div>
                      <label className={labelClass}>סיווג מול רשויות המס (מע״מ)</label>
                      <select name="companyType" defaultValue={initialOrg.companyType} disabled={!canEdit} className={inputClass}>
                         {COMPANY_TYPE_VALUES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                   </div>
                   <div>
                      <label className={labelClass}>ח.פ / מס׳ תאגיד / ת.ז</label>
                      <input name="taxId" defaultValue={initialOrg.taxId || ""} disabled={!canEdit} className={inputClass} placeholder="מספר העסק לדיווח..." />
                   </div>
                </div>
                <div>
                   <label className={labelClass}>כתובת המטה / כתובת להנהלת חשבונות</label>
                   <textarea name="address" defaultValue={initialOrg.address || ""} rows={3} disabled={!canEdit} className={`${inputClass} resize-none`} placeholder="רחוב, עיר, מיקוד" />
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <input type="checkbox" name="isReportable" defaultChecked={initialOrg.isReportable} id="rep" className="w-5 h-5 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer" />
                    <label htmlFor="rep" className="text-sm font-bold text-slate-700 cursor-pointer">החברה מדווחת בארץ ויש להחיל מע״מ על העסקאות (ERP חוקי)</label>
                </div>
                
                {canEdit && (
                   <div className="pt-4 flex items-center justify-between">
                     <span className={`text-[11px] font-black uppercase tracking-widest ${orgMsg?.startsWith("✓") ? "text-emerald-500" : "text-rose-500"}`}>
                       {orgMsg}
                     </span>
                     <button type="submit" disabled={pendingOrg} className="btn-primary shadow-lg shadow-blue-500/30 px-8 py-3 flex items-center gap-2">
                        <Save size={18}/> {pendingOrg ? "מעדכן מסדי נתונים..." : "שמירה והמשך צעד הבא"}
                     </button>
                   </div>
                )}
             </form>
           </div>
        </div>
      ),
    },
    {
      id: "portal-domain",
      title: "פורטל ומנועי בינה",
      description: "הגדר את סביבת העבודה שלך ב-Web ואת מנועי ה-AI.",
      icon: <Globe />,
      content: (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
             <div className="flex items-center gap-4 border-b border-slate-100 pb-6 mb-6">
               <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Bot size={24}/></div>
               <div>
                  <h3 className="text-xl font-black text-slate-900">התאמת פורטל אישי ובינה מלאכותית</h3>
                  <p className="text-sm font-medium text-slate-500">מערכת ה-AI שלנו מתקשרת תמידית עם ארכיטקטורת המותג שלך.</p>
               </div>
             </div>
             
             <form action={handlePortalSubmit} className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                   <label className={labelClass}>שיוך נכס אינטרנטי (דומיין / סאב דומיין)</label>
                   <input name="tenantPublicDomain" defaultValue={initialOrg.tenantPublicDomain || ""} dir="ltr" className={inputClass} placeholder="crm.yourcompany.com" />
                 </div>
                 <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" name="calendarGoogleEnabled" defaultChecked={initialOrg.calendarGoogleEnabled} className="w-5 h-5 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500" />
                      <span className="text-sm font-bold text-slate-700 flex items-center gap-2"><CalendarDays size={18}/> הפעל סנכרון תצוגת יומנים של Google</span>
                    </label>
                 </div>
               </div>
               
               <div className="pt-4 flex items-center justify-between">
                 <span className={`text-[11px] font-black uppercase tracking-widest ${portalMsg?.startsWith("✓") ? "text-emerald-500" : "text-rose-500"}`}>
                   {portalMsg}
                 </span>
                 <button type="submit" disabled={pendingPortal} className="btn-secondary border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300 shadow-md shadow-indigo-500/10 px-8 py-3 flex items-center gap-2">
                    <Save size={18}/> {pendingPortal ? "מבצע סנכרון..." : "שמור הגדרות פורטל"}
                 </button>
               </div>
             </form>
           </div>
        </div>
      ),
    },
    {
      id: "billing",
      title: "סליקה והכנסות",
      description: "חיבור ערוצי סליקה שיזרימו כסף לעסק שלך (PayPal).",
      icon: <CreditCard />,
      content: (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
             <div className="flex items-center gap-4 border-b border-slate-100 pb-6 mb-6">
               <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><CreditCard size={24}/></div>
               <div>
                  <h3 className="text-xl font-black text-slate-900">אמצעי גבייה מסחריים</h3>
                  <p className="text-sm font-medium text-slate-500">מכאן הפלטפורמה תדע לאיזה חשבון להפנות את כל התשלומים האוטומטיים מהלקוחות.</p>
               </div>
             </div>
             
             <form action={handlePaymentSubmit} className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                   <label className={labelClass}>כתובת המייל הארגונית ב-PayPal (לקבלת תמורה)</label>
                   <input name="paypalMerchantEmail" type="email" defaultValue={initialOrg.paypalMerchantEmail || ""} dir="ltr" className={inputClass} placeholder="accounting@company.com" />
                 </div>
                 <div>
                   <label className={labelClass}>שם המשתמש (Slug) של שירות PayPal.Me</label>
                   <input name="paypalMeSlug" defaultValue={initialOrg.paypalMeSlug || ""} dir="ltr" className={inputClass} placeholder="YourCompanyName" />
                   <p className="text-[10px] text-slate-400 mt-2 font-medium">יקשר אוטומטית לקוחות המקבלים חשבונית לתשלום מקוון בקליק.</p>
                 </div>
               </div>
               
               <div className="pt-4 flex items-center justify-between">
                 <span className={`text-[11px] font-black uppercase tracking-widest ${paymentMsg?.startsWith("✓") ? "text-emerald-500" : "text-rose-500"}`}>
                   {paymentMsg}
                 </span>
                 <button type="submit" disabled={pendingPayment} className="btn-primary bg-emerald-600 hover:bg-emerald-500 ring-emerald-600 border-emerald-500 shadow-lg shadow-emerald-500/30 px-8 py-3 flex items-center gap-2">
                    <ShieldCheck size={18}/> {pendingPayment ? "מצפין נתונים..." : "הבא את הכסף! (שמור)"}
                 </button>
               </div>
             </form>
           </div>
        </div>
      ),
    },
    {
      id: "team",
      title: "ניהול הרשאות וצוותים",
      description: "מנהל את האנשים המורשים לקרוא מודיעין פיננסי.",
      icon: <UserPlus />,
      content: (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
             <div className="flex items-center gap-4 border-b border-slate-100 pb-6 mb-6">
               <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><UserPlus size={24}/></div>
               <div>
                  <h3 className="text-xl font-black text-slate-900">מרכז בקרת צוות עובדים</h3>
                  <p className="text-sm font-medium text-slate-500">הזמן עובדים פנימה. בחר את רמת ההרשאה (מודל RBAC) באופן תכליתי.</p>
               </div>
             </div>
             
             <form onSubmit={handleTeamInvite} className="flex flex-col md:flex-row items-end gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="w-full md:flex-1">
                   <label className={labelClass}>כתובת המייל של העובד</label>
                   <input name="email" type="email" required value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className={inputClass} placeholder="employee@domain.com" />
                </div>
                <div className="w-full md:w-64">
                   <label className={labelClass}>רמת הרשאה למערכת</label>
                   <select name="role" defaultValue="EMPLOYEE" className={inputClass}>
                      <option value="EMPLOYEE">פעיל / איש צוות (שגרה)</option>
                      <option value="PROJECT_MGR">מנהל תפעול פרויקטים</option>
                      <option value="CLIENT">לקוח (צפייה בלבד למסמכים)</option>
                      <option value="ORG_ADMIN">מנהל על (גישה מלאה כולל כספים)</option>
                   </select>
                </div>
                <input type="hidden" name="validDays" value="30" />
                <button type="submit" className="btn-primary w-full md:w-auto px-8 py-3.5 shadow-lg shadow-blue-500/20">שגר הזמנה מאובטחת</button>
             </form>
             {teamInviteMsg && <p className="mt-4 p-4 bg-slate-900 text-slate-200 text-sm font-mono rounded-xl border border-slate-800 break-all">{teamInviteMsg}</p>}
           </div>
           
           <CloudBackupPanel />
        </div>
      ),
    }
  ];

  return (
    <div className="max-w-[1200px] mx-auto py-8 text-start" dir={dir}>
       <div className="mb-10 text-center">
         <span className="inline-flex flex-col items-center justify-center p-3 rounded-2xl bg-blue-50 border border-blue-100 shadow-sm text-blue-600 mb-4">
            <Settings size={28} />
         </span>
         <h1 className="text-4xl font-black italic tracking-tight text-slate-900 drop-shadow-sm">תחנת העבודה המרכזית (Settings)</h1>
         <p className="text-slate-500 font-medium max-w-2xl mx-auto mt-4 leading-relaxed">
           אשף ההגדרות שלנו נועד למנוע כפילויות ולרכז הכל במקום אחד. הגדר כאן מי הבוס, איך רשויות המס מסתכלות עליך ואיך מקבלים תשלומים.
         </p>
       </div>

       <WizardContainer
         steps={STEPS}
         currentStepIndex={activeStepIndex}
         onStepChange={setActiveStepIndex}
         theme="blue"
       />
    </div>
  );
}