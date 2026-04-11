"use client";

import React, { useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Globe,
  Settings,
  CreditCard,
  Bot,
  Receipt,
  Save,
  CheckCircle2,
  Zap,
  Cpu,
  ShieldCheck,
  Key,
  Sparkles,
  Command,
  Database,
  Search,
  ChevronLeft,
  Loader2
} from "lucide-react";
import { 
  updateOrganizationAction, 
  updateTenantPortalAction, 
  updateBillingConnectionsAction,
  updateAiConfigAction
} from "@/app/actions/org-settings";
import { useI18n } from "@/components/I18nProvider";
import WizardContainer, { WizardStepConfig } from "@/components/wizard/WizardContainer";
import CloudBackupPanel from "@/components/CloudBackupPanel";

export default function SettingsHubClient({
  initialOrg,
}: {
  initialOrg: any;
}) {
  const { dir } = useI18n();
  const { data: session } = useSession();
  const router = useRouter();
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  // Extract AI Config Helper
  const industryConfig = (initialOrg.industryConfigJson as any) || {};
  const aiConfig = industryConfig.aiControl || {
    primary: "gemini",
    gemini: { model: "flash", key: "" },
    openai: { model: "4o-mini", key: "" },
    anthropic: { model: "sonnet", key: "" }
  };

  // Stats
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" | null }>({ text: "", type: null });

  const showMsg = (text: string, type: "success" | "error") => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: "", type: null }), 5000);
  };

  const handleAction = (action: (fd: FormData) => Promise<any>, nextIndex?: number) => {
    return (fd: FormData) => {
      startTransition(async () => {
        const r = await action(fd);
        if (r.ok) {
          showMsg("שינויים נשמרו בסנכרון מלא", "success");
          router.refresh();
          if (nextIndex !== undefined) {
             setTimeout(() => setActiveStepIndex(nextIndex), 800);
          }
        } else {
          showMsg(r.error || "שגיאה בביצוע הפעולה", "error");
        }
      });
    };
  };

  const labelCls = "mb-2.5 block text-[11px] font-black uppercase tracking-[0.1em] text-slate-500/80";
  const inputCls = "w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 hover:border-indigo-300";
  const sectionCls = "rounded-[2.5rem] border border-slate-200/60 bg-white p-8 md:p-12 shadow-2xl shadow-slate-200/40 relative overflow-hidden";
  const cardIconCls = "flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-indigo-50 text-indigo-600 shadow-sm mb-6";

  const STEPS: WizardStepConfig[] = [
    {
      id: "business",
      title: "פרופיל ו-ERP",
      description: "הגדרת הזהות העסקית והתאמה למסמכי מס.",
      icon: <Building2 />,
      content: (
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
           <div className={sectionCls}>
             <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                <Building2 size={240} />
             </div>
             
             <div className="relative z-10 max-w-4xl">
               <div className={cardIconCls}><Receipt size={28} /></div>
               <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-2">מרכז ה-ERP של המשרד</h3>
               <p className="text-slate-500 font-medium mb-12">הגדר כאן את פרטי החברה שיופיעו על כל מסמך רשמי שהבינה המלאכותית תפיק עבורך.</p>

               <form action={handleAction(updateOrganizationAction, 1)} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="col-span-1 md:col-span-2">
                     <label className={labelCls}>שם העסק / מותג (יופיע בראש האתר ובמסמכים)</label>
                     <input name="name" required defaultValue={initialOrg.name} className={inputCls} placeholder="השם הרשמי שלך..." />
                  </div>
                  <div>
                     <label className={labelCls}>ח.פ / עוסק / ת.ז</label>
                     <input name="taxId" defaultValue={initialOrg.taxId || ""} className={inputCls} placeholder="מספר זיהוי לצרכי מס..." />
                  </div>
                  <div>
                     <label className={labelCls}>סוג תאגיד</label>
                     <select name="companyType" defaultValue={initialOrg.companyType} className={inputCls}>
                        <option value="LICENSED_DEALER">עוסק מורשה (מע״מ)</option>
                        <option value="EXEMPT_DEALER">עוסק פטור</option>
                        <option value="LTD_COMPANY">חברה בע״מ (LTD)</option>
                     </select>
                  </div>
                  <div className="col-span-1 md:col-span-2">
                     <label className={labelCls}>כתובת המטה לעדכונים</label>
                     <input name="address" defaultValue={initialOrg.address || ""} className={inputCls} placeholder="רחוב, עיר, מיקוד..." />
                  </div>
                  
                  <div className="col-span-1 md:col-span-2 pt-6">
                    <button type="submit" disabled={pending} className="group btn-primary w-full md:w-auto px-12 py-4 shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-3">
                       {pending ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                       {pending ? "מבצע סנכרון נתונים..." : "שמירה והמשך גלובלי"}
                       <ChevronLeft className="group-hover:-translate-x-1 transition-transform" size={18} />
                    </button>
                  </div>
               </form>
             </div>
           </div>
        </div>
      ),
    },
    {
      id: "ai-engines",
      title: "פיקוד מנועי ה-AI",
      description: "ניהול מנועי הבינה המלאכותית שמפעילים את האתר.",
      icon: <Cpu />,
      content: (
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
           <div className={sectionCls}>
             <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none text-indigo-600">
                <Bot size={240} />
             </div>

             <div className="relative z-10">
               <div className={cardIconCls + " bg-indigo-600 text-white"}><Zap size={28} /></div>
               <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-2">ניהול בינה מלאכותית אחודה</h3>
               <p className="text-slate-500 font-medium mb-12">בחר אילו מנועים מפעילים את ניתוח המסמכים, הסריקה המודולרית והצ׳אט החכם.</p>

               <form action={handleAction(updateAiConfigAction, 2)} className="space-y-10">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                     {/* Google Gemini */}
                     <div className="rounded-3xl border-2 border-slate-100 bg-slate-50/50 p-6 transition-all hover:border-indigo-500/30 hover:bg-white group">
                        <div className="flex items-center gap-3 mb-4">
                           <div className="h-10 w-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center"><Sparkles size={18}/></div>
                           <h4 className="font-black text-slate-800">Google Gemini</h4>
                        </div>
                        <p className="text-xs text-slate-500 mb-6 font-semibold leading-relaxed">מנוע ברירת המחדל לסריקות מהירות וניתוח טקסטואלי עמוק.</p>
                        <div className="space-y-3">
                           <select name="model_gemini" defaultValue={aiConfig.gemini.model} className={inputCls + " !py-2.5 !px-3 text-xs"}>
                              <option value="flash">Gemini 2.5 Flash (מהיר)</option>
                              <option value="pro">Gemini 1.5 Pro (חכם)</option>
                           </select>
                           <div className="relative">
                              <input 
                                name="gemini_key"
                                type="password" 
                                placeholder="API Key (מוצפן)" 
                                className={inputCls + " !py-2.5 !px-3 !pl-10 text-xs"} 
                                defaultValue={aiConfig.gemini.key} 
                              />
                              <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                           </div>
                        </div>
                     </div>

                     {/* OpenAI */}
                     <div className="rounded-3xl border-2 border-slate-100 bg-slate-50/50 p-6 transition-all hover:border-emerald-500/30 hover:bg-white">
                        <div className="flex items-center gap-3 mb-4">
                           <div className="h-10 w-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center"><Command size={18}/></div>
                           <h4 className="font-black text-slate-800">OpenAI (GPT)</h4>
                        </div>
                        <p className="text-xs text-slate-500 mb-6 font-semibold leading-relaxed">מצוין ליצירת מסמכים שיווקיים וג׳נרציה של פלטים מורכבים.</p>
                        <div className="space-y-3">
                           <select name="model_openai" defaultValue={aiConfig.openai.model} className={inputCls + " !py-2.5 !px-3 text-xs"}>
                              <option value="4o">GPT-4o (מתקדם)</option>
                              <option value="4o-mini">GPT-4o-mini (יעיל)</option>
                           </select>
                           <div className="relative">
                              <input 
                                name="openai_key"
                                type="password" 
                                placeholder="API Key (מוצפן)" 
                                className={inputCls + " !py-2.5 !px-3 !pl-10 text-xs"} 
                                defaultValue={aiConfig.openai.key}
                              />
                              <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                           </div>
                        </div>
                     </div>

                     {/* Anthropic */}
                     <div className="rounded-3xl border-2 border-slate-100 bg-slate-50/50 p-6 transition-all hover:border-amber-500/30 hover:bg-white">
                        <div className="flex items-center gap-3 mb-4">
                           <div className="h-10 w-10 rounded-xl bg-amber-500 text-white flex items-center justify-center"><Database size={18}/></div>
                           <h4 className="font-black text-slate-800">Anthropic Claude</h4>
                        </div>
                        <p className="text-xs text-slate-500 mb-6 font-semibold leading-relaxed">הבחירה האידיאלית לניתוח קוד ולוגיקה עסקית מורכבת במיוחד.</p>
                        <div className="space-y-3">
                           <select name="model_anthropic" defaultValue={aiConfig.anthropic.model} className={inputCls + " !py-2.5 !px-3 text-xs"}>
                              <option value="sonnet">Claude 3.7 Sonnet</option>
                              <option value="haiku">Claude 3.5 Haiku</option>
                           </select>
                           <div className="relative">
                              <input 
                                name="anthropic_key"
                                type="password" 
                                placeholder="API Key (מוצפן)" 
                                className={inputCls + " !py-2.5 !px-3 !pl-10 text-xs"} 
                                defaultValue={aiConfig.anthropic.key}
                              />
                              <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="p-8 bg-indigo-50 border border-indigo-100 rounded-[2rem] flex flex-col md:flex-row items-center gap-8">
                     <div className="flex-1">
                        <h5 className="font-black text-indigo-900 mb-1 flex items-center gap-2">
                           <Search size={18} />
                           הגדרות סריקה סינכרוניות
                        </h5>
                        <p className="text-sm text-indigo-700 font-medium">כאן נקבע איזה מנוע ינתח את המסמכים שלך כברירת מחדל בכל האתר.</p>
                     </div>
                     <div className="flex gap-4">
                        <label className="flex items-center gap-3 cursor-pointer bg-white px-5 py-3 rounded-2xl border border-indigo-200 shadow-sm transition-all hover:shadow-md">
                           <input type="radio" name="ai_primary" value="gemini" defaultChecked={aiConfig.primary === "gemini"} className="w-5 h-5 text-indigo-600 focus:ring-indigo-500" />
                           <span className="text-sm font-black text-slate-800 italic underline">Gemini Primary</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer bg-white/40 px-5 py-3 rounded-2xl border border-indigo-100/50 transition-all hover:bg-white">
                           <input type="radio" name="ai_primary" value="openai" defaultChecked={aiConfig.primary === "openai"} className="w-5 h-5 text-indigo-600 focus:ring-indigo-500" />
                           <span className="text-sm font-black text-slate-600">OpenAI Hybrid</span>
                        </label>
                     </div>
                  </div>

                  <div className="pt-6 flex justify-between items-center">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">מנועי ה-AI עוברים אימות בזמן אמת</p>
                    <button type="submit" disabled={pending} className="btn-primary px-12 py-4 flex items-center gap-3">
                       <Save size={20} />
                       {pending ? "מאמת מול השרתים..." : "שמור הגדרות מנוע והמשך"}
                    </button>
                  </div>
               </form>
             </div>
           </div>
        </div>
      ),
    },
    {
      id: "portal",
      title: "פורטל ומותג",
      description: "התאמת הממשק לצרכים הדיגיטליים שלך.",
      icon: <Globe />,
      content: (
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
           <div className={sectionCls}>
             <div className="relative z-10 max-w-2xl">
               <div className={cardIconCls}><Globe size={28} /></div>
               <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-2">פורטל Web ותקשורת</h3>
               <p className="text-slate-500 font-medium mb-12">הגדר את הדומיין האישי שלך ואיך המערכת תיחשף לעולם.</p>

               <form action={handleAction(updateTenantPortalAction, 3)} className="space-y-6">
                  <div>
                    <label className={labelCls}>כתובת האתר (Custom Domain / Sub-domain)</label>
                    <input name="tenantPublicDomain" defaultValue={initialOrg.tenantPublicDomain || ""} dir="ltr" className={inputCls} placeholder="crm.yourbrand.ai" />
                    <p className="mt-2 text-[10px] text-slate-400 font-bold">הגדרת רשומת CNAME ל-bsd-ybm.vercel.app נדרשת לאירוח עצמי.</p>
                  </div>
                  <div className="pt-10">
                    <button type="submit" disabled={pending} className="btn-secondary px-10 py-4 font-black">
                       עדכן פורטל
                    </button>
                  </div>
               </form>
             </div>
           </div>
        </div>
      ),
    },
    {
      id: "billing",
      title: "חיוב וסליקה",
      description: "ניהול פתרונות תשלום וגבייה.",
      icon: <CreditCard />,
      content: (
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
           <div className={sectionCls}>
             <div className="relative z-10 max-w-2xl">
               <div className={cardIconCls}><CreditCard size={28} /></div>
               <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-2">עורק החיים הפיננסי</h3>
               <p className="text-slate-500 font-medium mb-12">חבר את חשבונות הסליקה כדי לקבל תשלומים ישירות מהלקוחות שלך.</p>

               <form action={handleAction(updateBillingConnectionsAction, 4)} className="space-y-8">
                  <div>
                    <label className={labelCls}>חשבון PayPal עסקי (לקבלת כספים)</label>
                    <input name="paypalMerchantEmail" defaultValue={initialOrg.paypalMerchantEmail || ""} dir="ltr" className={inputCls} placeholder="accounting@yourbrand.ai" />
                  </div>
                  <div>
                    <label className={labelCls}>PayPal.Me Slug (לתשלום מהיר)</label>
                    <input name="paypalMeSlug" defaultValue={initialOrg.paypalMeSlug || ""} dir="ltr" className={inputCls} placeholder="brandname" />
                  </div>
                  <div className="pt-6">
                    <button type="submit" disabled={pending} className="btn-primary bg-emerald-600 hover:bg-emerald-500 border-none shadow-xl shadow-emerald-500/20 px-12 py-4">
                       שמור וסיים את הגדרות התשלום
                    </button>
                  </div>
               </form>
             </div>
           </div>
        </div>
      ),
    }
  ];

  return (
    <div className="max-w-[1400px] mx-auto py-12 px-6" dir={dir}>
      <header className="mb-16 text-start flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-3 px-5 py-2 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 mb-6 group transition-all hover:bg-indigo-600 hover:text-white cursor-default">
            <Settings size={20} className="group-hover:rotate-90 transition-transform duration-500" />
            <span className="text-[11px] font-black uppercase tracking-widest italic">Global System Hub</span>
          </div>
          <h1 className="text-5xl font-black italic tracking-tighter text-slate-900 mb-4">ניהול והגדרות הפלטפורמה</h1>
          <p className="text-lg text-slate-500 font-semibold leading-relaxed">
            מרכז הפיקוד המאוחד של BSD-YBM. כאן תוכל לנהל את מנועי ה-AI, מיתוג האתר, חיובים וצוותים במקום אחד, בקליק אחד ובסנכרון מלא.
          </p>
        </div>
        
        {msg.text && (
          <div className={`animate-in fade-in zoom-in slide-in-from-top-4 duration-300 px-6 py-4 rounded-3xl border-2 flex items-center gap-3 shadow-xl ${
            msg.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800"
          }`}>
            <CheckCircle2 size={24} />
            <span className="text-sm font-black italic">{msg.text}</span>
          </div>
        )}
      </header>

      <WizardContainer
        steps={STEPS}
        currentStepIndex={activeStepIndex}
        onStepChange={setActiveStepIndex}
        theme="indigo"
        finishLabel="סיים הגדרה גלובלית"
      />

      <div className="mt-20 grid grid-cols-1 md:grid-cols-2 gap-8">
        <CloudBackupPanel />
        <div className="rounded-[2.5rem] border border-slate-200 bg-white p-10 flex flex-col justify-center gap-6">
           <div className="h-14 w-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShieldCheck size={28} />
           </div>
           <div>
              <h4 className="text-xl font-black text-slate-900 mb-2">אבטחת מערכת וסנכרון</h4>
              <p className="text-sm text-slate-500 font-semibold leading-relaxed">
                כל שינוי שתבצע כאן משפיע באופן מיידי על לוחות הסריקה, הצ׳אטים ומערכות ה-CRM. המערכת עוברת גיבוי אוטומטי לאחר כל שינוי מוצלח.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}