"use client";

import { useEffect, useState } from "react";

/* ─────────────── step cycling hook ────────────── */
function useStepCycle(totalSteps: number, msPerStep: number) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % totalSteps), msPerStep);
    return () => clearInterval(id);
  }, [totalSteps, msPerStep]);
  return step;
}

/* ───────────── shared progress bar ────────────── */
function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="mt-4 space-y-1.5">
      <div className="flex items-center justify-between text-[11px] font-bold text-gray-500">
        <span>שלב {step + 1} מתוך {total}</span>
        <span>{Math.round(((step + 1) / total) * 100)}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-l from-indigo-500 to-indigo-500 transition-all duration-700"
          style={{ width: `${((step + 1) / total) * 100}%` }}
        />
      </div>
    </div>
  );
}

/* ══════ ANIMATION 1: ERP × CRM Integration ══════ */
function AnimErpCrm({ step }: { step: number }) {
  const contacts = [
    { name: "ממן לוגיסטיקה", status: "ACTIVE", amount: "₪18,400" },
    { name: "טכנולוגיות אלרן", status: "PROPOSAL", amount: "₪7,200" },
    { name: "סינרגיה בע״מ", status: "LEAD", amount: "₪31,000" },
  ];

  const STATUS_COLOR: Record<string, string> = {
    LEAD: "bg-gray-100 text-gray-600",
    ACTIVE: "bg-indigo-100 text-indigo-700",
    PROPOSAL: "bg-amber-100 text-amber-700",
    "CLOSED_WON ✓": "bg-emerald-100 text-emerald-700",
  };

  const mutatedContacts = contacts.map((c, i) =>
    step >= 1 && i === 0 ? { ...c, status: "CLOSED_WON ✓" } : c
  );

  return (
    <div className="h-full flex flex-col gap-2.5 text-right" dir="rtl">
      {/* Step 0 / Step 1: Contact list */}
      {(step === 0 || step === 1) && (
        <div className="flex-1 space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">
            {step === 0 ? "לקוחות CRM — פייפליין פעיל" : "עסקה נסגרה — CLOSED_WON"}
          </p>
          {mutatedContacts.map((c) => (
            <div
              key={c.name}
              className={`flex items-center justify-between rounded-xl border px-3 py-2.5 transition-all duration-500 ${
                step === 1 && c.status === "CLOSED_WON ✓"
                  ? "border-emerald-300 bg-emerald-50 scale-[1.02]"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-indigo-100 flex items-center justify-center text-[10px] font-black text-indigo-600">
                  {c.name[0]}
                </div>
                <span className="text-[12px] font-bold text-gray-800">{c.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-500">{c.amount}</span>
                <span className={`rounded-full px-2 py-0.5 text-[9px] font-black ${STATUS_COLOR[c.status] ?? "bg-gray-100 text-gray-600"}`}>
                  {c.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Step 2: Invoice auto-creation */}
      {step === 2 && (
        <div className="flex-1 animate-[bsd-fadein_0.4s_ease]">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">
            חשבונית ERP נוצרה אוטומטית ✨
          </p>
          <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-indigo-50 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase text-indigo-600">חשבונית מס #INV-0041</span>
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[9px] font-black text-indigo-700">ממתין לתשלום</span>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center text-[11px] font-black text-indigo-600">מ</div>
              <div>
                <p className="text-[12px] font-black text-gray-800">ממן לוגיסטיקה</p>
                <p className="text-[10px] text-gray-500">לקוח CRM → ERP</p>
              </div>
            </div>
            {[["שירות ניהול לוגיסטי", "₪14,000"], ["עמלת שירות", "₪4,400"]].map(([desc, amt]) => (
              <div key={desc} className="flex justify-between py-1.5 border-t border-indigo-100 text-[11px]">
                <span className="text-gray-600">{desc}</span>
                <span className="font-black text-gray-800">{amt}</span>
              </div>
            ))}
            <div className="flex justify-between pt-2 border-t-2 border-indigo-200 text-[12px]">
              <span className="font-black text-gray-700">סה״כ</span>
              <span className="font-black text-indigo-700">₪18,400</span>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Payment marked + ERP sync */}
      {step === 3 && (
        <div className="flex-1 animate-[bsd-fadein_0.4s_ease]">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">
            תשלום אושר — ERP מסונכרן ✅
          </p>
          <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 mb-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-lg font-black">✓</div>
              <div>
                <p className="text-[13px] font-black text-gray-800">שולם ✓ — ₪18,400</p>
                <p className="text-[10px] text-emerald-600">ממן לוגיסטיקה · INV-0041</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "סטטוס CRM", val: "CLOSED_WON", color: "text-emerald-600" },
              { label: "סטטוס ERP", val: "שולם", color: "text-indigo-600" },
              { label: "סוג מסמך", val: "חשבונית מס", color: "text-indigo-600" },
              { label: "סינכרון", val: "אוטומטי ✓", color: "text-emerald-600" },
            ].map(({ label, val, color }) => (
              <div key={label} className="rounded-xl border border-gray-200 bg-white p-2.5">
                <p className="text-[9px] text-gray-400 mb-0.5">{label}</p>
                <p className={`text-[11px] font-black ${color}`}>{val}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════ ANIMATION 2: Subscription Registration ══════ */
function AnimRegistration({ step }: { step: number }) {
  return (
    <div className="h-full flex flex-col gap-2.5 text-right" dir="rtl">

      {/* Step 0: Register form */}
      {step === 0 && (
        <div className="flex-1 animate-[bsd-fadein_0.4s_ease]">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">הרשמה למערכת</p>
          <div className="space-y-2.5">
            {[
              { label: "שם מלא", placeholder: "דוד כהן", filled: true },
              { label: "אימייל", placeholder: "david@example.com", filled: true },
              { label: "שם החברה", placeholder: "כהן אנד קו בע״מ", filled: true },
            ].map(({ label, placeholder, filled }) => (
              <div key={label}>
                <p className="text-[10px] font-bold text-gray-600 mb-1">{label}</p>
                <div className={`rounded-xl border px-3 py-2 text-[11px] transition-all ${filled ? "border-indigo-300 bg-indigo-50 text-gray-700 font-semibold" : "border-gray-200 bg-white text-gray-400"}`}>
                  {placeholder}
                </div>
              </div>
            ))}
            <div className="rounded-xl bg-indigo-600 py-2.5 text-center text-[12px] font-black text-white shadow-sm shadow-indigo-600/30">
              צור חשבון חינם ←
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Plan selection */}
      {step === 1 && (
        <div className="flex-1 animate-[bsd-fadein_0.4s_ease]">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">בחר מנוי</p>
          <div className="space-y-2">
            {[
              { name: "FREE", price: "חינם", color: "border-gray-200 bg-white", tag: "" },
              { name: "BASIC", price: "₪99/חודש", color: "border-indigo-300 bg-indigo-50 scale-[1.02]", tag: "פופולרי" },
              { name: "PRO", price: "₪249/חודש", color: "border-indigo-200 bg-indigo-50", tag: "" },
            ].map(({ name, price, color, tag }) => (
              <div key={name} className={`flex items-center justify-between rounded-xl border px-3 py-2.5 transition-all ${color}`}>
                <div className="flex items-center gap-2">
                  <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${name === "BASIC" ? "border-indigo-500 bg-indigo-500" : "border-gray-300"}`}>
                    {name === "BASIC" && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </div>
                  <span className="text-[12px] font-black text-gray-800">{name}</span>
                  {tag && <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[8px] font-black text-indigo-700">{tag}</span>}
                </div>
                <span className="text-[11px] font-bold text-gray-600">{price}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Payment */}
      {step === 2 && (
        <div className="flex-1 animate-[bsd-fadein_0.4s_ease]">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">תשלום מאובטח</p>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-600">תוכנית BASIC</span>
              <span className="text-[13px] font-black text-gray-900">₪99 / חודש</span>
            </div>
            <div className="h-px bg-gray-100" />
            <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-3 flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-[#003087] flex items-center justify-center">
                <span className="text-[8px] font-black text-white">Pay</span>
              </div>
              <div>
                <p className="text-[11px] font-black text-gray-800">PayPal</p>
                <p className="text-[9px] text-gray-500">תשלום מאובטח ב-SSL</p>
              </div>
            </div>
            <div className="rounded-xl bg-indigo-600 py-2.5 text-center text-[12px] font-black text-white">
              שלם ₪99 ←
            </div>
            <p className="text-center text-[9px] text-gray-400">🔒 מאובטח · ניתן לביטול בכל עת</p>
          </div>
        </div>
      )}

      {/* Step 3: Welcome dashboard */}
      {step === 3 && (
        <div className="flex-1 animate-[bsd-fadein_0.4s_ease]">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-3">ברוך הבא! ✓ המנוי פעיל</p>
          <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-indigo-50 p-4 mb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-lg">✓</div>
              <div>
                <p className="text-[13px] font-black text-gray-800">כהן אנד קו — BASIC</p>
                <p className="text-[10px] text-emerald-600">מנוי פעיל · ₪99/חודש</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { icon: "📋", label: "ERP" },
              { icon: "👥", label: "CRM" },
              { icon: "🔍", label: "סריקה" },
              { icon: "📊", label: "דוחות" },
              { icon: "🤖", label: "AI Chat" },
              { icon: "⚙️", label: "הגדרות" },
            ].map(({ icon, label }) => (
              <div key={label} className="rounded-xl border border-gray-200 bg-white p-2 text-center">
                <div className="text-base mb-0.5">{icon}</div>
                <p className="text-[9px] font-bold text-gray-600">{label}</p>
              </div>
            ))}
          </div>
          <div className="mt-2 rounded-xl bg-indigo-600 py-2 text-center text-[11px] font-black text-white">
            כניסה לדשבורד ←
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════ ANIMATION 3: Scanner + AI Decoder ══════ */
function AnimScanner({ step }: { step: number }) {
  return (
    <div className="h-full flex flex-col gap-2.5 text-right" dir="rtl">

      {/* Step 0: Upload document */}
      {step === 0 && (
        <div className="flex-1 animate-[bsd-fadein_0.4s_ease]">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">העלאת מסמך</p>
          <div className="rounded-2xl border-2 border-dashed border-indigo-300 bg-indigo-50 p-5 text-center mb-3">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100">
              <span className="text-2xl">📄</span>
            </div>
            <p className="text-[12px] font-black text-gray-700">גרור קובץ לכאן</p>
            <p className="text-[10px] text-gray-400 mt-1">PDF, JPG, PNG · עד 20MB</p>
            <div className="mt-3 rounded-xl bg-indigo-600 py-1.5 text-[11px] font-black text-white">
              בחר קובץ
            </div>
          </div>
          <div className="flex gap-2">
            {["חשבונית_012024.pdf", "קבלה_מס555.jpg"].map((f) => (
              <div key={f} className="flex-1 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-center">
                <p className="text-[9px] font-bold text-gray-600 truncate">{f}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 1: Scanning progress */}
      {step === 1 && (
        <div className="flex-1 animate-[bsd-fadein_0.4s_ease]">
          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-3">
            סורק מסמך... 🔍
          </p>
          <div className="relative mb-3 overflow-hidden rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-4">
            {/* Document preview mock */}
            <div className="space-y-1.5 opacity-60">
              {[80, 60, 90, 50, 70].map((w, i) => (
                <div key={i} className="h-2 rounded-full bg-gray-300" style={{ width: `${w}%` }} />
              ))}
            </div>
            {/* Scan line animation */}
            <div className="absolute inset-x-0 h-0.5 bg-gradient-to-l from-transparent via-indigo-500 to-transparent opacity-90" style={{ animation: 'bsd-tut-scan-line 2s ease-in-out infinite', position: 'absolute' }} />
          </div>
          <div className="space-y-1.5">
            {[
              { label: "OCR טקסט", pct: 72, color: "bg-indigo-500" },
              { label: "זיהוי שדות", pct: 45, color: "bg-indigo-500" },
              { label: "AI מיפוי", pct: 18, color: "bg-indigo-500" },
            ].map(({ label, pct, color }) => (
              <div key={label}>
                <div className="flex justify-between text-[9px] font-bold text-gray-500 mb-0.5">
                  <span>{label}</span><span>{pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
                  <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%`, animation: 'bsd-tut-scan-prog 3s ease-out forwards' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: AI extraction */}
      {step === 2 && (
        <div className="flex-1 animate-[bsd-fadein_0.4s_ease]">
          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-3">
            AI מחלץ נתונים... 🤖
          </p>
          <div className="space-y-2">
            {[
              { field: "ספק", value: "מ.ב. ספקים בע״מ", delay: "0s", done: true },
              { field: "מספר חשבונית", value: "INV-2024-0812", delay: "0.3s", done: true },
              { field: "תאריך", value: "15/01/2025", delay: "0.6s", done: true },
              { field: "סכום לפני מע״מ", value: "₪4,200", delay: "0.9s", done: true },
              { field: "מע״מ (17%)", value: "₪714", delay: "1.2s", done: false },
            ].map(({ field, value, delay, done }) => (
              <div
                key={field}
                className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2 text-[11px]"
                style={{ animationDelay: delay }}
              >
                <span className="text-gray-500 font-medium">{field}</span>
                <div className="flex items-center gap-1.5">
                  {done ? (
                    <span className="font-black text-gray-800">{value}</span>
                  ) : (
                    <span className="inline-flex h-2 w-16 rounded bg-gray-200 animate-pulse" />
                  )}
                  {done && <span className="text-emerald-500 text-[9px]">✓</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Structured output */}
      {step === 3 && (
        <div className="flex-1 animate-[bsd-fadein_0.4s_ease]">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-3">
            הנתונים מוכנים לשמירה ✓
          </p>
          <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 space-y-2">
            {[
              ["ספק", "מ.ב. ספקים בע״מ"],
              ["מספר חשבונית", "INV-2024-0812"],
              ["תאריך הנפקה", "15/01/2025"],
              ["סכום נטו", "₪4,200"],
              ["מע״מ", "₪714"],
              ["סה״כ לתשלום", "₪4,914"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-[11px] border-b border-emerald-100 pb-1 last:border-0">
                <span className="text-gray-500 font-medium">{k}</span>
                <span className="font-black text-gray-800">{v}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <div className="flex-1 rounded-xl bg-emerald-600 py-2 text-center text-[11px] font-black text-white">שמור ב-ERP</div>
            <div className="flex-1 rounded-xl border border-gray-200 bg-white py-2 text-center text-[11px] font-bold text-gray-600">ייצא CSV</div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═════════ Card wrapper ═════════ */
interface TutorialCardProps {
  index: number;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  accentColor: string;
  children: React.ReactNode;
}

function TutorialCard({ index, title, subtitle, description, icon, accentColor, children }: TutorialCardProps) {
  const step = useStepCycle(4, 3750);

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md">
      {/* Card header */}
      <div className={`px-5 pt-5 pb-4 ${accentColor}`}>
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl">{icon}</span>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/60">סרטון {index}</p>
            <h3 className="text-sm font-black text-white leading-tight">{title}</h3>
          </div>
        </div>
      </div>

      {/* Animation viewport */}
      <div className="flex-1 px-4 pt-4 pb-2 min-h-[280px]">
        {children}
      </div>

      {/* Progress bar */}
      <div className="px-4 pb-4">
        <ProgressBar step={step} total={4} />
      </div>

      {/* Description */}
      <div className="border-t border-gray-100 px-5 py-4">
        <p className="text-xs font-bold text-gray-500 leading-relaxed">{subtitle}</p>
        <p className="mt-1 text-[11px] text-gray-400 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

/* ══════════════ MAIN EXPORT ══════════════ */
export default function LandingTutorialSection() {
  const t1 = useStepCycle(4, 3750);
  const t2 = useStepCycle(4, 3750);
  const t3 = useStepCycle(4, 3750);

  return (
    <section id="tutorial-videos" className="bg-gray-50 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6" dir="rtl">
        {/* Section header */}
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-indigo-700">
            ▶ הדגמות חיות
          </span>
          <h2 className="mt-4 text-3xl font-black text-gray-900 sm:text-4xl">
            ראה איך המערכת עובדת — בפועל
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-gray-500">
            שלושה סרטוני הדגמה המציגים את יכולות הליבה. כל אנימציה רצה 15 שניות ולופת אוטומטית.
          </p>
        </div>

        {/* Videos grid */}
        <div className="grid gap-6 md:grid-cols-3">

          {/* Video 1 */}
          <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md">
            <div className="px-5 pt-5 pb-4 bg-gradient-to-l from-indigo-700 to-indigo-700">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔄</span>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/60">סרטון 1</p>
                  <h3 className="text-sm font-black text-white">מערכת ERP ו-CRM משולבת</h3>
                </div>
              </div>
            </div>
            <div className="flex-1 px-4 pt-4 pb-2 min-h-[280px]">
              <AnimErpCrm step={t1} />
            </div>
            <div className="px-4 pb-4">
              <ProgressBar step={t1} total={4} />
            </div>
            <div className="border-t border-gray-100 px-5 py-4">
              <p className="text-xs font-bold text-gray-600">עסקת CRM → חשבונית ERP אוטומטית</p>
              <p className="mt-1 text-[11px] text-gray-400 leading-relaxed">
                כשעסקה נסגרת ב-CRM, הנתונים עוברים אוטומטית ל-ERP ומייצרים חשבונית מס — ללא עבודה ידנית.
              </p>
            </div>
          </div>

          {/* Video 2 */}
          <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md">
            <div className="px-5 pt-5 pb-4 bg-gradient-to-l from-emerald-700 to-teal-700">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📝</span>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/60">סרטון 2</p>
                  <h3 className="text-sm font-black text-white">הרשמה ומנוי</h3>
                </div>
              </div>
            </div>
            <div className="flex-1 px-4 pt-4 pb-2 min-h-[280px]">
              <AnimRegistration step={t2} />
            </div>
            <div className="px-4 pb-4">
              <ProgressBar step={t2} total={4} />
            </div>
            <div className="border-t border-gray-100 px-5 py-4">
              <p className="text-xs font-bold text-gray-600">הרשמה · בחירת מנוי · תשלום · כניסה</p>
              <p className="mt-1 text-[11px] text-gray-400 leading-relaxed">
                תהליך ההרשמה אורך פחות מדקה: מילוי פרטים, בחירת המנוי המתאים, תשלום ב-PayPal, ופתיחת דשבורד מלא.
              </p>
            </div>
          </div>

          {/* Video 3 */}
          <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md">
            <div className="px-5 pt-5 pb-4 bg-gradient-to-l from-indigo-700 to-indigo-600">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔍</span>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/60">סרטון 3</p>
                  <h3 className="text-sm font-black text-white">סריקה ופענוח AI</h3>
                </div>
              </div>
            </div>
            <div className="flex-1 px-4 pt-4 pb-2 min-h-[280px]">
              <AnimScanner step={t3} />
            </div>
            <div className="px-4 pb-4">
              <ProgressBar step={t3} total={4} />
            </div>
            <div className="border-t border-gray-100 px-5 py-4">
              <p className="text-xs font-bold text-gray-600">העלאה · סריקה · AI חילוץ · שמירה</p>
              <p className="mt-1 text-[11px] text-gray-400 leading-relaxed">
                העלה חשבונית, קבלה או כל מסמך — ה-AI מפענח אוטומטית את כל השדות ושומר ישירות ב-ERP.
              </p>
            </div>
          </div>

        </div>

        {/* Duration note */}
        <p className="mt-8 text-center text-[11px] text-gray-400">
          ⏱ כל סרטון מציג מחזור של 15 שניות · רץ בלופ אוטומטי
        </p>
      </div>
    </section>
  );
}
