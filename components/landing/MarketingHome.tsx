"use client";

import React, { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from "framer-motion";
import { 
  Zap, Layers, ArrowRight, ShieldCheck, 
  Cpu, Globe, LayoutDashboard, CheckCircle2,
  Menu, X, Sparkles, Bot, LineChart, Users
} from "lucide-react";
import { useI18n } from "@/components/I18nProvider";

/**
 * 🌌 BSD-YBM 2026: THE EXECUTIVE AVENUE (Version X-Premium)
 * Design Strategy:
 * 1. "Avenue of Intelligence" - Visual linear flow leading the user through the story.
 * 2. Absolute I18n Consistency - Zero hardcoded strings.
 * 3. Liquid Glassmorphism - Premium transparency and blur effects.
 * 4. Micro-Interactions - Haptic-like visual feedback on every hover.
 */

const GlassCard = ({ children, delay = 0, className = "" }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.8, delay, ease: [0.21, 1, 0.36, 1] }}
    className={`relative overflow-hidden rounded-[2.5rem] border border-white/20 bg-white/5 backdrop-blur-3xl shadow-2xl ${className}`}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
    <div className="relative z-10 p-8 md:p-12">
      {children}
    </div>
  </motion.div>
);

const NavLink = ({ href, children }: any) => (
  <Link href={href} className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 hover:text-indigo-600 transition-colors">
    {children}
  </Link>
);

export default function MarketingHome() {
  const { t, dir, locale, setLocale } = useI18n();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const scrollRef = useRef(null);
  
  const greeting = (() => {
    const hr = new Date().getHours();
    if (hr < 12) return t("dashboard.greetings.morning");
    if (hr < 17) return t("dashboard.greetings.afternoon");
    if (hr < 21) return t("dashboard.greetings.evening");
    return t("dashboard.greetings.night");
  })();

  return (
    <div ref={scrollRef} className="relative min-h-screen bg-[#020617] text-white overflow-x-hidden font-sans selection:bg-indigo-500 selection:text-white" dir={dir}>
      
      {/* 🔮 LIQUID ORBS (Atmosphere) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div 
          animate={{ x: [0, 100, 0], y: [0, -100, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-indigo-600/10 blur-[150px]" 
        />
        <motion.div 
          animate={{ x: [0, -80, 0], y: [0, 50, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear", delay: 2 }}
          className="absolute top-[30%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-blue-600/10 blur-[150px]" 
        />
      </div>

      {/* 🚀 ELITE HEADER */}
      <header className="fixed top-0 inset-x-0 z-[100] px-6 py-8">
        <nav className="max-w-7xl mx-auto flex items-center justify-between bg-[#0f172a]/40 backdrop-blur-3xl border border-white/5 rounded-[2rem] px-8 py-4 shadow-2xl">
          <Link href="/" className="flex items-center gap-4 group">
             <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">
                <Zap size={20} fill="white" />
             </div>
             <div className="text-start">
               <span className="text-lg font-black tracking-tighter uppercase block leading-none">{t("brand.name")}</span>
               <span className="text-[9px] font-black uppercase tracking-[0.4em] text-indigo-400 mt-0.5 block">{t("marketing3D.heroBadge")}</span>
             </div>
          </Link>
          
          <div className="hidden lg:flex items-center gap-12">
            <NavLink href="#solutions">{t("nav.solutions")}</NavLink>
            <NavLink href="#intelligence">{t("dashboard.aiHub")}</NavLink>
            <NavLink href="#pricing">{t("landing.pricingBadge")}</NavLink>
            <div className="h-4 w-px bg-white/10" />
            <Link href="/login" className="text-xs font-black uppercase tracking-widest text-white hover:text-indigo-400 transition-colors">
              {t("nav.login")}
            </Link>
            <Link href="/register" className="px-6 py-3 bg-white text-slate-900 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-500 hover:text-white transition-all">
              {t("marketing3D.ctaStart")}
            </Link>
          </div>

          <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden p-2 text-white/70 hover:text-white transition-colors">
            <Menu size={24} />
          </button>
        </nav>
      </header>

      {/* 📱 MOBILE OVERLAY */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            className="fixed inset-0 z-[200] bg-slate-950 p-10 flex flex-col gap-10"
          >
            <div className="flex justify-between items-center">
              <span className="text-xl font-black uppercase tracking-tighter">{t("brand.name")}</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 bg-white/5 rounded-xl"><X size={24} /></button>
            </div>
            <div className="flex flex-col gap-8 mt-10">
              <Link href="#solutions" onClick={() => setMobileMenuOpen(false)} className="text-2xl font-black uppercase italic tracking-tighter hover:text-indigo-400 transition-colors">{t("nav.solutions")}</Link>
              <Link href="#intelligence" onClick={() => setMobileMenuOpen(false)} className="text-2xl font-black uppercase italic tracking-tighter hover:text-indigo-400 transition-colors">{t("dashboard.aiHub")}</Link>
              <Link href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-2xl font-black uppercase italic tracking-tighter hover:text-indigo-400 transition-colors">{t("landing.pricingBadge")}</Link>
            </div>
            <div className="mt-auto space-y-4">
              <Link href="/login" className="block w-full text-center py-5 border border-white/10 rounded-2xl font-black uppercase tracking-widest">{t("nav.login")}</Link>
              <Link href="/register" className="block w-full text-center py-5 bg-indigo-600 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-600/30">{t("marketing3D.ctaStart")}</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🏛️ HERO: THE AVENUE OF LIGHT */}
      <section className="relative min-h-screen flex items-center justify-center pt-32 px-6">
        <div className="absolute inset-0 pointer-events-none">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent rotate-[15deg]" />
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent -rotate-[15deg]" />
        </div>

        <div className="max-w-7xl mx-auto z-10 text-center">
           <motion.div 
             initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
             className="mb-10 inline-flex items-center gap-3 px-6 py-2 bg-white/5 border border-white/10 rounded-full backdrop-blur-3xl"
           >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.4em] text-white/50 italic">
                {greeting}. {t("marketing3D.heroBadge")}
              </span>
           </motion.div>

           <h1 className="text-5xl md:text-8xl lg:text-[10rem] font-black tracking-tightest leading-[0.85] mb-12 italic uppercase text-white">
             {t("marketing3D.heroTitle")} <br/>
             <span className="relative inline-block mt-4 lg:mt-8">
               <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-indigo-500 to-indigo-600">
                 {t("marketing3D.heroTitleGlow")}
               </span>
               <motion.div 
                 animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 4, repeat: Infinity }}
                 className="absolute inset-x-0 -bottom-4 h-8 bg-indigo-500/40 blur-[50px] -z-10" 
               />
             </span>
           </h1>

           <p className="text-lg md:text-2xl text-slate-400 max-w-3xl mx-auto font-bold leading-relaxed mb-20">
              {t("marketing3D.heroDesc")}
           </p>

           <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link href="/register" className="group relative flex items-center gap-6 px-16 py-7 bg-indigo-600 text-white text-lg font-black uppercase tracking-[0.2em] rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(79,70,229,0.4)] hover:bg-indigo-500 transition-all active:scale-95">
                 {t("marketing3D.ctaStart")}
                 <ArrowRight size={24} className="group-hover:translate-x-3 transition-transform" />
              </Link>
              <Link href="#solutions" className="px-12 py-7 border border-white/10 rounded-[2rem] text-lg font-black uppercase tracking-[0.2em] hover:bg-white/5 transition-all">
                 {t("marketing3D.ctaExplore")}
              </Link>
           </div>
        </div>
      </section>

      {/* 🏗️ SOLUTIONS: MODULAR CORE */}
      <section className="py-48 px-6 relative" id="solutions">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <GlassCard delay={0.1}>
              <div className="h-14 w-14 bg-indigo-600 rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-indigo-600/30 italic">
                 <Layers size={28} />
              </div>
              <h2 className="text-4xl md:text-5xl font-black italic uppercase text-white tracking-tighter mb-8">{t("marketing3D.fieldOpsTitle")}</h2>
              <p className="text-lg text-slate-400 font-bold leading-relaxed mb-10">{t("marketing3D.fieldOpsDesc")}</p>
              
              <div className="grid grid-cols-2 gap-4">
                 <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    {t("marketing3D.autonomous")}
                 </div>
                 <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <CheckCircle2 size={16} className="text-indigo-500" />
                    {t("marketing3D.native2026")}
                 </div>
              </div>
            </GlassCard>

            <div className="relative">
              <motion.div 
                whileInView={{ y: [0, -20, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="aspect-square bg-gradient-to-br from-indigo-500/10 to-blue-500/5 rounded-[4rem] border border-white/10 p-1 bg-white/[0.02]"
              >
                <div className="h-full w-full rounded-[3.8rem] bg-slate-950 flex items-center justify-center overflow-hidden relative">
                   <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:40px_40px]" />
                   <div className="relative z-10 flex flex-col items-center gap-6">
                      <div className="h-48 w-48 bg-indigo-600/20 rounded-full blur-[80px] absolute" />
                      <LayoutDashboard size={120} className="text-indigo-500 drop-shadow-3xl" />
                      <span className="text-xs font-black uppercase tracking-[0.5em] text-indigo-400 animate-pulse">Processing Avenue...</span>
                   </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* 🧠 INTELLIGENCE: THE HYPERBRAIN */}
      <section className="py-48 px-6 bg-slate-950/40" id="intelligence">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="order-2 lg:order-1 relative flex items-center justify-center h-[500px]">
               <motion.div 
                 animate={{ rotate: 360, scale: [1, 1.05, 1] }} transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                 className="absolute w-[400px] h-[400px] border border-white/5 rounded-full"
               />
               <motion.div 
                 animate={{ rotate: -360 }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                 className="absolute w-[300px] h-[300px] border border-white/10 border-dashed rounded-full"
               />
               <GlassCard className="relative z-10 w-80 h-80 flex items-center justify-center !p-0">
                  <div className="absolute inset-0 bg-indigo-600/10" />
                  <Cpu size={100} className="text-indigo-500 drop-shadow-glow" />
               </GlassCard>
            </div>

            <GlassCard delay={0.2} className="order-1 lg:order-2">
              <div className="h-14 w-14 bg-indigo-600 rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-indigo-600/30">
                 <Bot size={28} />
              </div>
              <h2 className="text-4xl md:text-5xl font-black italic uppercase text-white tracking-tighter mb-8">
                {t("marketing3D.intelTitle")} <span className="text-indigo-500">{t("marketing3D.intelTitleGlow")}</span>
              </h2>
              <p className="text-lg text-slate-400 font-bold leading-relaxed mb-10">{t("marketing3D.intelDesc")}</p>
              
              <div className="space-y-6">
                 {[t("marketing3D.intelF1"), t("marketing3D.intelF2"), t("marketing3D.intelF3"), t("marketing3D.intelF4")].map((f, i) => (
                   <motion.div 
                     key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                     className="flex items-center gap-5 text-xs font-black uppercase tracking-widest text-slate-500"
                   >
                      <Sparkles size={16} className="text-indigo-500 shrink-0" />
                      {f}
                   </motion.div>
                 ))}
              </div>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* 💵 PRICING: THE REVENUE TIERS */}
      <section className="py-64 px-6 relative" id="pricing">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-start mb-24 max-w-2xl">
            <div className="inline-block px-5 py-1.5 bg-indigo-600 rounded-full mb-6">
               <span className="text-[10px] font-black uppercase tracking-widest">{t("pricing.headline")}</span>
            </div>
            <h2 className="text-5xl md:text-7xl font-black italic uppercase text-white tracking-tighter leading-[0.9]">
              {t("pricing.subheadline")}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {["free", "household", "dealer", "company", "corporate"].map((key, i) => {
              const info = {
                free: { icon: Users, color: "slate" },
                household: { icon: Globe, color: "blue" },
                dealer: { icon: Zap, color: "indigo" },
                company: { icon: Layers, color: "emerald" },
                corporate: { icon: ShieldCheck, color: "indigo" },
              }[key] as any;
              
              const isPopular = key === "dealer";

              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`relative p-8 rounded-[2.5rem] bg-white/[0.03] border transition-all duration-500 group flex flex-col justify-between ${isPopular ? 'border-indigo-500 bg-indigo-500/5 ring-4 ring-indigo-500/10' : 'border-white/10 hover:border-white/20 hover:bg-white/[0.05]'}`}
                >
                  <div className="text-start">
                    <div className={`h-10 w-10 mb-8 rounded-xl flex items-center justify-center ${isPopular ? 'bg-indigo-600 text-white' : 'bg-white/5 text-white/50 group-hover:text-white'}`}>
                       <info.icon size={20} />
                    </div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-2">{t(`pricing.${key}.name`)}</h4>
                    <p className="text-4xl font-black italic text-white mb-4">{t(`pricing.${key}.price`)}</p>
                    <p className="text-[11px] font-bold text-slate-500 mb-8 min-h-[44px] leading-relaxed italic">{t(`pricing.${key}.desc`)}</p>
                    
                    <div className="space-y-3 mb-12">
                       {[1,2,3].map(n => (
                         <div key={n} className="flex items-center gap-3 text-[9px] font-black uppercase tracking-tighter text-slate-400">
                           <CheckCircle2 size={12} className={isPopular ? 'text-indigo-400' : 'text-slate-600'} />
                           {t(`pricing.${key}.f${n}`)}
                         </div>
                       ))}
                    </div>
                  </div>
                  <Link href="/register" className={`w-full py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-center transition-all ${isPopular ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30' : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'}`}>
                     {t("pricing.choose")}
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 🌌 FINAL CUT: THE CONVERGENCE */}
      <section className="py-72 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-indigo-600/5 blur-[120px] rounded-full translate-y-1/2" />
        <div className="relative z-10">
           <h2 className="text-6xl md:text-9xl lg:text-[14rem] font-black italic tracking-tightest leading-[0.8] mb-16 text-white uppercase">
              {t("marketing3D.ctaFinalTitle")} <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-indigo-500 to-indigo-600">
                 {t("marketing3D.ctaFinalGlow")}
              </span>
           </h2>
           <p className="text-xl md:text-4xl text-slate-400 font-bold max-w-4xl mx-auto mb-20 leading-relaxed uppercase italic">
              {t("marketing3D.ctaFinalDesc")}
           </p>
           <Link href="/register" className="inline-flex items-center gap-8 px-20 py-10 bg-indigo-600 text-white text-2xl font-black uppercase tracking-[0.2em] rounded-[2.5rem] shadow-2xl hover:bg-indigo-500 transition-all active:scale-95 group">
              {t("marketing3D.ctaFinalJoin")}
              <ArrowRight size={32} className="group-hover:translate-x-5 transition-transform" />
           </Link>
        </div>
      </section>

      {/* 🏁 ELITE FOOTER: THE IDENTITY */}
      <footer className="py-24 px-6 bg-slate-950/40 border-t border-white/5 relative z-10 text-start">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-16">
          <div className="flex flex-col items-center md:items-start gap-6">
             <div className="h-12 w-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white italic shadow-lg shadow-indigo-600/20">
                <Zap size={24} />
             </div>
             <div className="text-center md:text-start">
               <span className="text-xs font-black uppercase tracking-[0.5em] text-white/30 block mb-1 tracking-tighter underline">BSD-YBM EXECUTIVE © 2026</span>
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500/50">{t("brand.tagline")}</span>
             </div>
          </div>
          <div className="flex flex-wrap justify-center md:justify-end gap-x-12 gap-y-6 text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">
             <Link href="#" className="hover:text-white transition-colors">{t("marketing3D.footer.identity")}</Link>
             <Link href="#" className="hover:text-white transition-colors">{t("marketing3D.footer.ethics")}</Link>
             <Link href="#" className="hover:text-white transition-colors">{t("marketing3D.footer.security")}</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
