"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, Lock, Fingerprint, Zap, Briefcase, 
  Wrench, Code, ShoppingBag, ArrowLeft, CheckCircle2, 
  Accessibility, Moon, Sun, Type, EyeOff, Search
} from "lucide-react";

type ProfessionKey = "electrician" | "contractor" | "hightech" | "retail";

const PROFESSIONS: Record<ProfessionKey, { name: string; title: string; desc: string; metrics: React.ReactNode }> = {
  electrician: {
    name: "חשמלאי / אינסטלטור",
    title: "העסק שלך בשטח, גם המשרד שלך.",
    desc: "תיאור מדויק עבור חשמלאים. המערכת הופכת אוטומטית לקליניקת שטח: פיצ׳רים של קריאות שירות, תמחור חלפים און-ליין (כבלים, צינורות), והחתמת לקוחות מיידית ישירות מהנייד.",
    metrics: (
      <>
         <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <span className="text-sm font-bold text-gray-500">קריאות פתוחות חודש נוכחי</span>
            <div className="text-3xl font-black text-gray-900 mt-2">12 <span className="text-sm text-emerald-500 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">+4 קריאות</span></div>
         </div>
         <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <span className="text-sm font-bold text-gray-500">סטוק ציוד (כבלים, מתגים)</span>
            <div className="text-3xl font-black text-gray-900 mt-2">84% מלא</div>
            <button className="mt-2 text-xs text-indigo-600 bg-indigo-50 py-1 rounded font-bold">הזמן חלפים מהספק (אוטומטי)</button>
         </div>
      </>
    )
  },
  contractor: {
    name: "קבלן / יזם בנייה",
    title: "שליטה הרמטית על כל פרויקט ובלוק.",
    desc: "הפלטפורמה משנה את עורה. מודולים של תזרים פרויקטלי, תשלומים לספקי בטון וברזל, מוסר תשלומים מקוזז על בסיס התקדמות הבנייה. הכל מסונכרן למנהל העבודה למטה.",
    metrics: (
      <>
         <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <span className="text-sm font-bold text-gray-500">פרויקט ׳מגדלי השמש׳ - סטטוס</span>
            <div className="text-3xl font-black text-emerald-600 mt-2">שלד 40%</div>
            <div className="w-full bg-emerald-100 h-2 rounded-full mt-2"><div className="bg-emerald-500 w-[40%] h-full rounded-full"></div></div>
         </div>
         <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <span className="text-sm font-bold text-gray-500">תשלומי קבלני משנה</span>
            <div className="text-3xl font-black text-gray-900 mt-2">₪450,000 <span className="text-sm text-rose-500 font-bold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">ממתין לאישור הנדסי</span></div>
         </div>
      </>
    )
  },
  hightech: {
    name: "הייטק / שירותים (B2B)",
    title: "ניהול ריטיינרים כמו בוואלי.",
    desc: "התאמה מלאה לחברות הייטק, משרדי פרסום ועורכי דין. דשבורד מבוסס שעתי ריטיינר, חיוב אוטומטי בכרטיסי אשראי כל 1 לחודש, והפקת דוחות זמנים מהממת ללקוח.",
    metrics: (
      <>
         <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <span className="text-sm font-bold text-gray-500">גבייה ריטיינר קבוע</span>
            <div className="text-3xl font-black text-gray-900 mt-2">₪58,958.00</div>
            <span className="text-xs text-emerald-500 font-bold mt-1">12% יותר מחודש קודם</span>
         </div>
         <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <span className="text-sm font-bold text-gray-500">מדד שריפת שעות (Burn Rate)</span>
            <div className="text-3xl font-black text-blue-600 mt-2">64% ביצוע</div>
         </div>
      </>
    )
  },
  retail: {
    name: "קמעונאות וחנויות",
    title: "קופה רושמת שהיא גם רואת חשבון.",
    desc: "מועדון לקוחות מבוסס AI, חיזוי חוסרים במלאי לפני החג לפי נתוני שנים קודמות, וחיבור API נטול תקלות ל-Shopify ו-WooCommerce.",
    metrics: (
      <>
         <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none"><ShoppingBag size={64}/></div>
            <span className="text-sm font-bold text-gray-500 relative z-10">הזמנות אונליין להיום</span>
            <div className="text-3xl font-black text-gray-900 mt-2 relative z-10">342</div>
         </div>
         <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-xl shadow-md flex flex-col justify-between text-white">
            <span className="text-sm font-bold text-white/80">מועדון חוזרים השבוע</span>
            <div className="text-3xl font-black mt-2">₪14,500 <span className="text-sm bg-white/20 px-2 py-0.5 rounded-full inline-block mt-1">+2% חיזוי צמיחה</span></div>
         </div>
      </>
    )
  }
};

export default function DynamicEnterpriseHome() {
  const [activeProf, setActiveProf] = useState<ProfessionKey>("hightech");
  const [scrolled, setScrolled] = useState(false);
  const [showAccess, setShowAccess] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen font-sans bg-gray-50 overflow-x-hidden selection:bg-yellow-300 selection:text-purple-900" dir="rtl">
      
      {/* ACCESS PANEL (Floating Widget Demo) */}
      <div className={`fixed inset-0 z-[999] pointer-events-none ${showAccess ? 'pointer-events-auto' : ''}`}>
        <div className="absolute right-0 top-1/4 select-none pointer-events-auto">
           <button 
             onClick={() => setShowAccess(!showAccess)}
             className="bg-[#2A59FF] text-white p-3 rounded-l-xl shadow-lg border-y border-l border-blue-400 hover:bg-blue-600 transition"
           >
             <Accessibility size={28} />
           </button>
           
           <AnimatePresence>
             {showAccess && (
               <motion.div 
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: 20 }}
                 className="absolute top-0 right-full mr-2 w-80 bg-white shadow-2xl rounded-2xl border border-gray-200 overflow-hidden"
               >
                  <div className="bg-[#2A59FF] text-white py-3 px-4 flex justify-between items-center font-bold">
                    <span>כלי נגישות</span>
                    <button onClick={() => setShowAccess(false)}><ArrowLeft size={18} className="rotate-180" /></button>
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto w-full">
                     <button className="flex flex-col items-center justify-center p-3 border border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition">
                       <Moon size={24} className="mb-2 text-gray-500"/>
                       <span className="text-xs font-semibold">ניגודיות הפוכה</span>
                     </button>
                     <button className="flex flex-col items-center justify-center p-3 border border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition">
                       <Sun size={24} className="mb-2 text-gray-500"/>
                       <span className="text-xs font-semibold">ניגודיות גבוהה</span>
                     </button>
                     <button className="flex flex-col items-center justify-center p-3 border border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition">
                       <Type size={24} className="mb-2 text-gray-500"/>
                       <span className="text-xs font-semibold">הגדלת טקסט</span>
                     </button>
                     <button className="flex flex-col items-center justify-center p-3 border border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition">
                       <EyeOff size={24} className="mb-2 text-gray-500"/>
                       <span className="text-xs font-semibold">קורא מסך</span>
                     </button>
                  </div>
               </motion.div>
             )}
           </AnimatePresence>
        </div>
      </div>

      {/* TOP NAVIGATION */}
      <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#5B37D2]/95 backdrop-blur-md shadow-lg border-b border-purple-500/30 py-3' : 'bg-[#6F42C1] py-5'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
           <div className="flex items-baseline gap-2">
             <span className="text-2xl font-black text-white tracking-widest uppercase">BSD-YBM</span>
             <span className="hidden sm:inline-block text-purple-200 text-sm font-bold opacity-80 border-r border-purple-400 pr-2">- פתרונות AI</span>
           </div>
           
           <nav className="hidden md:flex gap-8 text-white/90 text-sm font-bold">
             <Link href="#features" className="hover:text-yellow-400 transition-colors">הפיצ׳רים</Link>
             <Link href="#security" className="hover:text-yellow-400 transition-colors">אבטחה ומודולריות</Link>
             <Link href="#pricing" className="hover:text-yellow-400 transition-colors">מחירון</Link>
             <Link href="#contact" className="hover:text-yellow-400 transition-colors">יצירת קשר</Link>
           </nav>

           <div className="flex items-center gap-4">
              <Link href="/login" className="text-white font-bold text-sm hover:text-yellow-400 transition-colors">כניסה</Link>
              <Link href="/register" className="bg-[#FFD600] text-[#4A148C] font-black px-6 py-2 rounded-xl text-sm shadow-[0_0_15px_rgba(255,214,0,0.4)] hover:bg-yellow-300 transition-all hover:scale-105 active:scale-95">
                הרשמה
              </Link>
           </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative bg-[#6F42C1] pt-36 pb-48 px-6 overflow-hidden">
        {/* Abstract Background Orbs */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-500 rounded-full blur-[100px] opacity-60"></div>
        <div className="absolute bottom-12 -left-24 w-[30rem] h-[30rem] bg-indigo-600 rounded-full blur-[120px] opacity-60"></div>
        
        <div className="relative max-w-5xl mx-auto text-center z-10">
           <div className="inline-block bg-white/10 text-yellow-300 font-bold border border-white/20 rounded-full px-5 py-1.5 mb-6 text-sm flex items-center gap-2 mx-auto w-fit backdrop-blur-md">
             <Zap size={16} className="text-yellow-400 fill-yellow-400"/> המערכת המודולרית הראשונה בעולם
           </div>
           
           <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.1] mb-6 drop-shadow-md">
             השדרה שמחברת <br className="hidden md:block"/> <span className="text-[#FFD600]">בין כולם.</span>
           </h1>
           
           <p className="text-xl md:text-2xl text-purple-100 max-w-3xl mx-auto font-medium leading-normal mb-10 opacity-95">
             באתר שלנו לא מתאימים את העסק למערכת. המערכת מתאימה את עצמה במדויק לסוג המקצוע שלך - מחשמלאים ועד הייטק. הפלטפורמה האחת שתסגור לך הכל.
           </p>

           <button className="bg-[#FFD600] text-[#311B92] text-xl font-black px-10 py-4 rounded-2xl shadow-[0_10px_25px_-5px_rgba(255,214,0,0.5)] border-2 border-transparent hover:border-white transition-all duration-300 transform hover:-translate-y-1">
             אני רוצה 45 ימי ניסיון חינם
           </button>
        </div>
      </section>

      {/* MODULARITY WIDGET - Overlapping the hero */}
      <section className="max-w-6xl mx-auto px-6 relative z-20 -mt-32 mb-32">
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-2 md:p-4 shadow-[0_20px_50px_-12px_rgba(49,27,146,0.3)] border border-white/40 ring-1 ring-black/5 flex flex-col">
            
            {/* Tab Selector */}
            <div className="flex flex-wrap gap-2 p-2 bg-gray-100/80 rounded-2xl mb-6">
              <span className="flex items-center text-gray-500 font-black text-sm px-4">מי אני?</span>
              
              <button onClick={() => setActiveProf("electrician")} className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all ${activeProf === 'electrician' ? 'bg-white text-indigo-700 shadow border-b-2 border-indigo-600' : 'text-gray-600 hover:bg-white/50'}`}>
                <Wrench size={18}/> חשמלאים / שיפוצים
              </button>
              
              <button onClick={() => setActiveProf("contractor")} className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all ${activeProf === 'contractor' ? 'bg-white text-rose-700 shadow border-b-2 border-rose-600' : 'text-gray-600 hover:bg-white/50'}`}>
                <Briefcase size={18}/> קבלני פרויקטים
              </button>
              
              <button onClick={() => setActiveProf("hightech")} className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all ${activeProf === 'hightech' ? 'bg-white text-purple-700 shadow border-b-2 border-purple-600' : 'text-gray-600 hover:bg-white/50'}`}>
                <Code size={18}/> מוצרי תוכנה / B2B
              </button>
              
              <button onClick={() => setActiveProf("retail")} className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all ${activeProf === 'retail' ? 'bg-white text-emerald-700 shadow border-b-2 border-emerald-600' : 'text-gray-600 hover:bg-white/50'}`}>
                <ShoppingBag size={18}/> חנויות וקמעונות
              </button>
            </div>

            {/* Selected Interface Preview */}
            <AnimatePresence mode="wait">
              <motion.div 
                key={activeProf}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
                className="bg-gray-100 rounded-3xl p-6 lg:p-10 border border-gray-200 grid lg:grid-cols-2 gap-10 items-center overflow-hidden relative"
              >
                 <div className="space-y-6">
                    <div className="inline-block bg-white text-gray-800 font-bold px-3 py-1 rounded-lg border border-gray-200 text-sm shadow-sm opacity-80">
                      התאמה מתחלפת אוטומטית למקצוע:
                    </div>
                    <h3 className="text-4xl font-black text-gray-900 leading-tight tracking-tight">
                       {PROFESSIONS[activeProf].title}
                    </h3>
                    <p className="text-lg text-gray-600 font-medium leading-relaxed">
                       {PROFESSIONS[activeProf].desc}
                    </p>
                    <div className="pt-4 flex items-center gap-4">
                       <button className="bg-gray-900 text-white font-bold rounded-xl px-6 py-3 hover:bg-gray-800 transition shadow-lg">צור סביבת {PROFESSIONS[activeProf].name}</button>
                    </div>
                 </div>

                 {/* Faux Dashboard Grid */}
                 <div className="grid grid-cols-2 gap-4">
                    {PROFESSIONS[activeProf].metrics}
                    <div className="col-span-2 bg-white p-4 rounded-xl border border-gray-100 shadow-sm mt-2">
                       <span className="text-sm font-bold text-gray-500 mb-4 block">הכנסות מול הוצאות השנה</span>
                       <div className="h-32 w-full flex items-end justify-between gap-1 mt-auto">
                          {[40, 20, 60, 45, 80, 55, 90, 30, 85, 120, 100, 130].map((h, i) => (
                            <div key={i} className="w-full relative group">
                               {/* Expenses */}
                               <div className="absolute bottom-0 w-full bg-rose-200 rounded-b-md" style={{ height: `${h * 0.3}%` }} />
                               {/* Income */}
                               <div className="absolute bottom-0 w-full bg-indigo-500/80 rounded-t-md transition-all hover:bg-indigo-400 cursor-pointer" style={{ height: `${h}%`, opacity: h > 60 ? 1 : 0.6 }} />
                            </div>
                          ))}
                       </div>
                    </div>
                 </div>
              </motion.div>
            </AnimatePresence>

        </div>
      </section>

      {/* ULTRA SECURITY SECTION */}
      <section className="bg-black text-white py-32 px-6">
         <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            <div>
               <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400 mb-6 font-bold shadow-lg shadow-emerald-500/10">
                 <ShieldCheck size={32} className="ml-3" /> תקן הגנה עולמי הרמטי
               </div>
               <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight text-transparent bg-clip-text bg-gradient-to-l from-white to-gray-400">
                 אבטחת המידע הגבוהה בעולם. ללא פשרות.
               </h2>
               <p className="text-xl text-gray-400 font-medium mb-10 leading-relaxed max-w-lg">
                 המידע הפיננסי שלך סגור בכספת מבוילת. המערכת נבנתה במיוחד לעמוד בתקנים המחמירים ביותר בעולם הפיננסי, באופן אשר מונע דליפות מידע גם בפקודות בינה מלאכותית מורכבות. 
               </p>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-300">
                  <div className="flex items-start gap-4">
                     <Lock size={28} className="text-blue-400 mt-1 shrink-0" />
                     <div>
                       <h4 className="text-white font-bold text-lg">בנקאות צללים (Grade A)</h4>
                       <p className="text-sm mt-1">נהלי SSL קשוחים והצפנת נתונים 256-bit במנוחה ובתנועה.</p>
                     </div>
                  </div>
                  <div className="flex items-start gap-4">
                     <Fingerprint size={28} className="text-yellow-400 mt-1 shrink-0" />
                     <div>
                       <h4 className="text-white font-bold text-lg">מנועי הזדהות ביומטרים</h4>
                       <p className="text-sm mt-1">AI שמזהה אנומליות בהתחברות מעובדים בזמנים לא צפויים ונועל פורטים.</p>
                     </div>
                  </div>
               </div>
            </div>
            
            <div className="relative">
               {/* 3D representation of a Vault / Shield overlapping */}
               <div className="absolute inset-0 bg-blue-600 rounded-full blur-[150px] opacity-20 animate-pulse"></div>
               <div className="bg-[#111111] p-2 rounded-3xl border border-gray-800 shadow-2xl relative z-10 w-full max-w-md mx-auto aspect-square overflow-hidden flex flex-col items-center justify-center">
                   
                   {/* Radar / Security Ring sweep */}
                   <div className="absolute inset-0 flex items-center justify-center">
                     <div className="w-[120%] h-[120%] rounded-full border border-gray-800/80 animate-[spin_6s_linear_infinite]" />
                     <div className="absolute w-[80%] h-[80%] rounded-full border border-emerald-900/30 animate-[spin_4s_linear_infinite_reverse]" />
                   </div>

                   <ShieldCheck size={120} className="text-emerald-500 mb-6 drop-shadow-[0_0_30px_rgba(16,185,129,0.5)] mix-blend-screen relative z-20" />
                   <h3 className="text-2xl font-black tracking-widest text-[#FFD600] relative z-20">NO LEAKS.</h3>
                   <div className="mt-4 flex items-center gap-2 text-gray-400 font-mono text-xs z-20">
                     <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                     END TO END ENCRYPTION ACTIVE
                   </div>
               </div>
            </div>
         </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-[#FFD600] text-[#311B92] py-24 text-center px-6">
         <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-8">מוכן שהעסק שלך יתחיל לעבוד בשבילך?</h2>
         <p className="text-xl font-bold opacity-80 mb-10 max-w-2xl mx-auto">מערכת ה-AI היחידה שיודעת איזו עבודה אתה עושה בבוקר, ומתאימה את החליפה עבורך.</p>
         <Link href="/register" className="inline-block bg-[#311B92] text-white text-2xl font-black px-12 py-5 rounded-full shadow-2xl hover:-translate-y-2 transition-all duration-300">
            פתח חשבון בחינם (ללא התחייבות)
         </Link>
      </section>

      <footer className="bg-gray-100 text-gray-500 text-center py-12 border-t border-gray-200 font-bold text-sm">
        <p>© 2026 BSD-YBM פתרונות AI. כל הזכויות שמורות.</p>
        <p className="mt-2 text-xs">נבנה בסטנדרט העתיד.</p>
      </footer>
    </div>
  );
}
