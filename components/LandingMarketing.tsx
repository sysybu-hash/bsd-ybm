"use client";

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
  const primaryColor = "#3b82f6";

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-hidden font-sans" dir="rtl">
      <main className="relative z-10 pt-32 pb-24 max-w-7xl mx-auto px-6">
        <section
          id="ai-solutions"
          className="text-center mb-32 grid grid-cols-1 md:grid-cols-2 gap-12 items-center scroll-mt-28"
        >
          <div className="text-right">
            <p className="mb-4 inline-flex items-center gap-2 py-2 px-4 rounded-full bg-gray-50 border border-gray-100 text-gray-400 text-xs font-bold uppercase tracking-widest">
              <Brain size={14} className="text-blue-500" /> AI-Powered Business Intelligence
            </p>
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-black italic tracking-tighter leading-[0.85] mb-8 text-slate-900">
              <span className="text-blue-600">BSD-YBM.</span>
              <br />
              <span className="text-indigo-600">Intelligence.</span>
            </h1>
            <p className="max-w-xl text-gray-400 text-lg sm:text-xl leading-relaxed mb-10 font-medium ms-auto">
              פלטפורמה אחודה המשלבת AI, CRM ו-ERP מתקדם. פתרון מקיף לניהול חכם של משקי בית, עוסקים
              וחברות בדומיין אחד.
            </p>
            <div className="flex flex-col items-end gap-4 sm:flex-row sm:items-center sm:gap-5">
              <Link
                href="/dashboard"
                className="inline-flex rounded-2xl px-10 py-4 text-lg font-black text-white shadow-xl bg-blue-600"
                style={{
                  boxShadow: "0 20px 40px -10px rgba(59, 130, 246, 0.45)",
                }}
              >
                התחל עכשיו - חינם
              </Link>
              <Link
                href="/login"
                className="text-sm font-bold text-gray-500 underline decoration-slate-300 underline-offset-4 hover:text-blue-600"
              >
                יש לך חשבון? התחברות עם Google
              </Link>
            </div>
          </div>
          <div id="tutorial" className="scroll-mt-28 rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-lg shadow-indigo-500/5 sm:p-10">
            <p className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
              הדרכה מונפשת
            </p>
            <SiteTutorialShowcase variant="embedded" />
            <div className="text-center mt-4">
              <Link
                href="/tutorial"
                className="text-sm font-bold text-blue-600 hover:underline"
              >
                מסך מלא להדרכה
              </Link>
            </div>
          </div>
        </section>

        <section id="erp" className="scroll-mt-28">
          <h2 className="text-3xl font-black mb-12 italic text-center text-gray-900">
            פתרון מותאם לכל סוג ישות
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-32">
            {sectors.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.title}
                  className={`cursor-pointer rounded-2xl border border-gray-200 p-10 shadow-sm transition-all hover:scale-[1.02] ${s.color}`}
                >
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-sm">
                    <Icon className="text-blue-600" size={32} />
                  </div>
                  <h3 className="text-2xl font-black mb-3 italic text-gray-900">{s.title}</h3>
                  <p className="text-gray-400 leading-relaxed text-sm font-medium">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        <LandingVideoTutorials />

        <section id="crm" className="scroll-mt-28">
          <h2 className="text-3xl font-black mb-12 italic text-center text-gray-900">
            בחר את המסלול המתאים לך
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl border bg-white p-10 ${
                  plan.level === "Premium"
                    ? "border-indigo-500/30 shadow-lg shadow-indigo-200/60"
                    : "border-gray-200 shadow-sm"
                } relative`}
              >
                {plan.level === "Premium" && (
                  <div className="absolute top-6 start-6 text-indigo-500 p-2 bg-indigo-400/15 rounded-full">
                    <Star size={18} fill="currentColor" />
                  </div>
                )}
                <h3 className="text-2xl font-black mb-1 italic text-gray-950">{plan.name}</h3>
                <p className="text-gray-400 text-sm mb-6">{plan.desc}</p>
                <div
                  className="text-5xl font-black mb-8 italic text-gray-900"
                >
                  {plan.price}
                  <span className="text-sm font-medium text-gray-400 not-italic"> / חודש</span>
                </div>

                <ul className="space-y-3 mb-10 text-sm font-medium text-gray-500">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-start">
                      <CheckCircle2 size={16} className="text-indigo-500 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/dashboard/admin?section=subscriptions"
                  className={`block w-full text-center py-4 rounded-2xl font-bold transition-all hover:opacity-90 ${
                    plan.level === "Premium"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-50 text-gray-950"
                  }`}
                >
                  בחר מסלול
                </Link>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-400 mt-8">
            *במסלול תאגיד — בהתאם להסכם שירות. המחירים להמחשה בלבד.
          </p>
        </section>

        <EuComplianceStrip />
      </main>
    </div>
  );
}
