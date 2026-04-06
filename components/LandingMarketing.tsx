"use client";

import { motion } from "framer-motion";
import { Zap, Shield, Briefcase, Building2, Brain, CheckCircle2, Star } from "lucide-react";
import Link from "next/link";
import SiteTutorialShowcase from "@/components/SiteTutorialShowcase";
import EuComplianceStrip from "@/components/EuComplianceStrip";
import LandingVideoTutorials from "@/components/LandingVideoTutorials";

const sectors = [
  { title: "משק בית", desc: "סריקת חשבוניות, ניהול הוצאות משפחתי וסדר פיננסי מלא.", icon: Zap, color: "bg-indigo-500/15" },
  { title: "עוסק מורשה", desc: "הנהלת חשבונות חכמה, ניהול לקוחות (CRM) ודיווחים מהירים.", icon: Shield, color: "bg-emerald-500/15" },
  { title: "חברה", desc: "שליטה במלאי, ניהול צוותים, ERP תפעולי ודוחות רווח והפסד.", icon: Briefcase, color: "bg-indigo-500/15" },
  { title: "תאגיד", desc: "ניהול מרובה ישויות, קונסולידציה של נתונים ובינה עסקית (BI).", icon: Building2, color: "bg-indigo-500/15" },
];

const plans = [
  {
    name: "חינם (FREE)",
    price: "₪0",
    desc: "התנסות בסיסית במערכת",
    features: ["5 סריקות AI בחודש", "CRM בסיסי", "משתמש 1"],
    level: "Basic" as const,
  },
  {
    name: "פרו (PRO)",
    price: "₪99",
    desc: "לעוסקים וחברות קטנות",
    features: ["100 סריקות AI בחודש", "CRM מלא", "3 משתמשים", "תמיכה במייל"],
    level: "Premium" as const,
  },
  {
    name: "עסקי (BUSINESS)",
    price: "₪249",
    desc: "לחברות וצוותים",
    features: ["500 סריקות AI בחודש", "ERP מלא", "10 משתמשים", "תמיכה טלפונית"],
    level: "Enterprise" as const,
  },
  {
    name: "תאגיד (ENTERPRISE)",
    price: "₪499",
    desc: "לארגונים מרובי ישויות",
    features: ["סריקות ללא הגבלה*", "BI מתקדם", "כל המודלים פתוחים", "מנהל לקוח אישי"],
    level: "Master" as const,
  },
];

export default function LandingMarketing() {
  const primaryColor = "var(--primary-color, #3b82f6)";

  return (
    <div className="min-h-screen bg-[#0a0b14] text-white overflow-hidden font-sans" dir="rtl">
      <main className="relative z-10 pt-32 pb-24 max-w-7xl mx-auto px-6">
        <section
          id="ai-solutions"
          className="text-center mb-32 grid grid-cols-1 md:grid-cols-2 gap-12 items-center scroll-mt-28"
        >
          <div className="text-right">
            <p className="mb-4 inline-flex items-center gap-2 py-2 px-4 rounded-full bg-white/[0.03] border border-white/[0.07] text-white/45 text-xs font-bold uppercase tracking-widest">
              <Brain size={14} style={{ color: primaryColor }} /> AI-Powered Business Intelligence
            </p>
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
              className="text-5xl sm:text-7xl md:text-8xl font-black italic tracking-tighter leading-[0.85] mb-8"
            >
              <span style={{ color: primaryColor }}>BSD-YBM.</span>
              <br />
              <span className="text-white">Intelligence.</span>
            </motion.h1>
            <p className="max-w-xl text-white/45 text-lg sm:text-xl leading-relaxed mb-10 font-medium ms-auto">
              פלטפורמה אחודה המשלבת AI, CRM ו-ERP מתקדם. פתרון מקיף לניהול חכם של משקי בית, עוסקים
              וחברות בדומיין אחד.
            </p>
            <div className="flex flex-col items-end gap-4 sm:flex-row sm:items-center sm:gap-5">
              <Link
                href="/dashboard"
                className="inline-flex rounded-2xl px-10 py-4 text-lg font-black text-white shadow-xl transition-transform hover:scale-[1.02] active:scale-95"
                style={{
                  backgroundColor: primaryColor,
                  boxShadow:
                    "0 20px 40px -10px color-mix(in srgb, var(--primary-color, #3b82f6) 45%, transparent)",
                }}
              >
                התחל עכשיו - חינם
              </Link>
              <Link
                href="/login"
                className="text-sm font-bold text-white/55 underline decoration-slate-300 underline-offset-4 hover:text-[var(--primary-color)]"
              >
                יש לך חשבון? התחברות עם Google
              </Link>
            </div>
          </div>
          <div id="tutorial" className="scroll-mt-28 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 shadow-lg shadow-indigo-500/5 sm:p-10">
            <p className="text-center text-xs font-bold text-white/35 uppercase tracking-widest mb-4">
              הדרכה מונפשת
            </p>
            <SiteTutorialShowcase variant="embedded" />
            <div className="text-center mt-4">
              <Link
                href="/tutorial"
                className="text-sm font-bold text-[var(--primary-color,#3b82f6)] hover:underline"
              >
                מסך מלא להדרכה
              </Link>
            </div>
          </div>
        </section>

        <section id="erp" className="scroll-mt-28">
          <h2 className="text-3xl font-black mb-12 italic text-center text-white">
            פתרון מותאם לכל סוג ישות
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-32">
            {sectors.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.title}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`cursor-pointer rounded-2xl border border-white/[0.08] p-10 shadow-sm transition-all hover:scale-[1.02] ${s.color}`}
                >
                  <div className="w-16 h-16 bg-[#0a0b14] rounded-2xl flex items-center justify-center mb-8 shadow-sm">
                    <Icon style={{ color: primaryColor }} size={32} />
                  </div>
                  <h3 className="text-2xl font-black mb-3 italic text-white">{s.title}</h3>
                  <p className="text-white/45 leading-relaxed text-sm font-medium">{s.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </section>

        <LandingVideoTutorials />

        <section id="crm" className="scroll-mt-28">
          <h2 className="text-3xl font-black mb-12 italic text-center text-white">
            בחר את המסלול המתאים לך
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 + 0.4 }}
                className={`rounded-2xl border bg-[#0a0b14] p-10 ${
                  plan.level === "Premium"
                    ? "border-indigo-500/30 shadow-lg shadow-indigo-200/60"
                    : "border-white/[0.08] shadow-sm"
                } relative`}
              >
                {plan.level === "Premium" && (
                  <div className="absolute top-6 start-6 text-indigo-500 p-2 bg-indigo-400/15 rounded-full animate-pulse">
                    <Star size={18} fill="currentColor" />
                  </div>
                )}
                <h3 className="text-2xl font-black mb-1 italic text-gray-950">{plan.name}</h3>
                <p className="text-white/35 text-sm mb-6">{plan.desc}</p>
                <p
                  className="text-5xl font-black mb-8 italic text-white"
                  style={plan.level === "Premium" ? { color: primaryColor } : undefined}
                >
                  {plan.price}
                  <span className="text-sm font-medium text-white/35 not-italic"> / חודש</span>
                </p>

                <ul className="space-y-3 mb-10 text-sm font-medium text-white/55">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-indigo-500 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/dashboard/billing"
                  className={`block w-full text-center py-4 rounded-2xl font-bold transition-all hover:opacity-90 ${
                    plan.level === "Premium"
                      ? "bg-indigo-600 text-white"
                      : "bg-white/[0.05] text-gray-950"
                  }`}
                >
                  בחר מסלול
                </Link>
              </motion.div>
            ))}
          </div>
          <p className="text-center text-xs text-white/35 mt-8">
            *במסלול תאגיד — בהתאם להסכם שירות. המחירים להמחשה בלבד.
          </p>
        </section>

        <EuComplianceStrip />
      </main>
    </div>
  );
}
