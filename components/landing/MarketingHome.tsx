"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Zap, ArrowRight, Scan, BarChart3, 
  Network, CheckCircle2,
  ChevronDown
} from "lucide-react";

/**
 * 🌌 BSD-YBM: THE ULTIMATE MINIMALIST REWRITE (2026)
 * Motto: "השדרה שמחברת בין כולם"
 * Aesthetic: Dreamy Glassmorphism, Clean Typography, Zero Clutter.
 */

const NavItem = ({ label }: { label: string }) => (
  <Link href="#" className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 hover:text-white transition-all">
    {label}
  </Link>
);

const FeatureSection = ({ title, desc, icon: Icon, src, reversed = false }: any) => (
  <div className={`flex flex-col ${reversed ? "lg:flex-row-reverse" : "lg:flex-row"} items-center gap-16 py-32 border-b border-white/5`}>
    <div className="flex-1 space-y-8 text-start">
      <div className="h-16 w-16 bg-indigo-600/20 border border-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400">
        <Icon size={32} />
      </div>
      <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter text-white leading-tight">{title}</h2>
      <p className="text-xl text-slate-400 font-bold leading-relaxed italic max-w-xl">{desc}</p>
      <div className="flex gap-4">
        <span className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-400 italic">Production Ready</span>
      </div>
    </div>
    <div className="flex-1 w-full aspect-video bg-slate-900 rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl group">
      <img src={src} alt={title} className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-1000" />
    </div>
  </div>
);

export default function MarketingHome() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#020617] text-white selection:bg-indigo-500/30 overflow-x-hidden font-sans" dir="rtl">
      
      {/* 🌌 Atmospheric Backdrop */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,_#4f46e515_0%,_transparent_50%)]" />
        <div className="absolute bottom-0 right-0 w-[50vw] h-[50vw] bg-purple-600/5 rounded-full blur-[150px]" />
      </div>

      {/* 🚀 Sleek Header */}
      <nav className={`fixed top-0 inset-x-0 z-[100] transition-all duration-700 px-6 py-6 ${isScrolled ? "bg-slate-950/80 backdrop-blur-3xl border-b border-white/5 py-4" : ""}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-4">
            <div className="h-12 w-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-xl">
               <Zap size={24} fill="white" />
            </div>
            <div className="flex flex-col text-start">
               <span className="text-2xl font-black italic tracking-tighter leading-none uppercase">BSD-YBM</span>
               <span className="text-[8px] font-black uppercase tracking-[0.5em] text-indigo-400 mt-1 italic">השדרה שמחברת בין כולם</span>
            </div>
          </Link>
          <div className="hidden lg:flex items-center gap-12">
            <NavItem label="הסורק" />
            <NavItem label="בקרה" />
            <NavItem label="השדרה" />
            <Link href="/login" className="px-10 py-3 bg-white text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-xl">כניסה</Link>
          </div>
        </div>
      </nav>

      {/* 🏛️ Dreamy Hero */}
      <section className="relative h-screen flex flex-col items-center justify-center px-6 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="space-y-12"
        >
          <div className="inline-flex items-center gap-3 px-5 py-2 bg-indigo-600/10 border border-indigo-500/20 rounded-full">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-indigo-400 italic">The Final Protocol 2026</span>
          </div>
          
          <h1 className="text-7xl md:text-9xl font-black italic tracking-tighter leading-[0.9] text-white uppercase italic">
            BSD-YBM <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-indigo-500 to-purple-600">פתרונות AI</span>
          </h1>
          
          <p className="text-xl md:text-3xl text-slate-400 max-w-3xl mx-auto font-bold italic leading-relaxed tracking-tighter">
            "השדרה שמחברת בין כולם" <br/>
            <span className="text-white">ניצוח מוחלט של בינה מלאכותית על כל פעימה בעסק שלך. פלטפורמה מודולרית שמשתנה עבורך.</span>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 pt-10">
            <Link href="/register" className="px-20 py-8 bg-indigo-600 rounded-2xl text-[14px] font-black uppercase tracking-[0.2em] shadow-[0_25px_50px_-12px_rgba(79,70,229,0.5)] hover:scale-105 active:scale-95 transition-all">הצטרפות לשדרה</Link>
            <div className="flex items-center gap-4 text-slate-500 font-bold italic">
               <ChevronDown size={20} className="animate-bounce" />
               <span>לצפייה ב-Live Demos</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 📺 System Overviews (Clean) */}
      <section className="max-w-7xl mx-auto px-6 pb-64">
      <FeatureSection 
          title="פענוח Vision."
          icon={Scan}
          src="/demos/system_demo_1.png"
          desc="סריקה אחת, חכמה אינסופית. המערכת לומדת את המקצוע שלך ומחלצת נתונים מדויקים מחשבוניות, חוזים ומרשמים בתיוק אוטומטי."
        />
        <FeatureSection 
          title="Executive BI."
          icon={BarChart3}
          src="/demos/system_demo_2.png"
          reversed
          desc="לוח בקרה אקסקלוסיבי למקבלי החלטות. תצוגת על של הכנסות, הוצאות ותחזית תזרים מבוססת AI בזמן אמת."
        />
        <FeatureSection 
          title="Mission Control."
          icon={Network}
          src="/demos/system_demo_3.png"
          desc="השדרה שמחברת בין לקוחות, פרויקטים ועובדים. סנכרון מלא של כל נקודות המגע בארגון לכדי חוויית ניהול מנצחת אחת."
        />
      </section>

      {/* 🏙️ Adaptive Protocol */}
      <section className="py-48 bg-slate-950/40 border-y border-white/5 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 text-center space-y-16">
          <h3 className="text-[12px] font-black uppercase tracking-[1em] text-indigo-500 italic">ADAPTIVE INTELLIGENCE</h3>
          <p className="text-4xl md:text-6xl font-black italic tracking-tighter text-white leading-tight">
             "BSD-YBM משנה את שפת הניהול שלה עבור המקצוע שלך."
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20">
             {["עורכי דין", "קבלנים", "רופאים", "רואי חשבון"].map((m, i) => (
               <div key={i} className="p-10 bg-white/5 rounded-3xl border border-white/10 hover:border-indigo-500/50 transition-colors">
                  <span className="text-xl font-black text-white italic">{m}</span>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* 🏁 Footer */}
      <footer className="py-48 px-10 text-center relative">
        <div className="max-w-4xl mx-auto space-y-12">
           <div className="flex flex-col items-center gap-6">
              <Zap className="text-indigo-600" size={48} fill="currentColor" />
              <span className="text-3xl font-black italic tracking-tightest uppercase">BSD-YBM פתרונות AI</span>
           </div>
           <p className="text-2xl text-slate-500 font-bold italic italic">
             "השפה החדשה של הניהול המקצועי."
           </p>
           <div className="pt-20 text-[10px] font-black uppercase tracking-[0.5em] text-white/5">
             COPYRIGHT © 2026 BSD-YBM — השדרה שמחברת בין כולם
           </div>
        </div>
      </footer>

    </div>
  );
}
