"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, Rocket } from "lucide-react";
import { trackWizardEvent } from "@/lib/client-telemetry";

const ONBOARDING_KEY = "bsd-ops:onboarding-checklist";

type ChecklistState = {
  billing: boolean;
  settings: boolean;
  users: boolean;
  workflows: boolean;
};

const initialState: ChecklistState = {
  billing: false,
  settings: false,
  users: false,
  workflows: false,
};

export default function OperatorOnboardingPanel() {
  const [state, setState] = useState<ChecklistState>(initialState);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(ONBOARDING_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<ChecklistState>;
      setState({
        billing: Boolean(parsed.billing),
        settings: Boolean(parsed.settings),
        users: Boolean(parsed.users),
        workflows: Boolean(parsed.workflows),
      });
    } catch {
      setState(initialState);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(ONBOARDING_KEY, JSON.stringify(state));
  }, [state]);

  const progress = useMemo(() => {
    const done = Object.values(state).filter(Boolean).length;
    return Math.round((done / 4) * 100);
  }, [state]);

  useEffect(() => {
    void trackWizardEvent("ops_onboarding_progress", `progress=${progress}`);
  }, [progress]);

  const toggle = (k: keyof ChecklistState) => {
    setState((prev) => ({ ...prev, [k]: !prev[k] }));
  };

  return (
    <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5" dir="rtl">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="inline-flex items-center gap-1.5 rounded-full border border-blue-300 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-blue-700">
            <Rocket size={12} />
            Onboarding
          </p>
          <h2 className="mt-1 text-lg font-black text-slate-900">צ&apos;קליסט מנהל חדש</h2>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-blue-800">{progress}% הושלם</span>
      </div>

      <div className="mb-3 h-2 overflow-hidden rounded-full bg-blue-100">
        <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
      </div>

      <div className="space-y-2">
        <button type="button" onClick={() => toggle("billing")} className="flex w-full items-center justify-between rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm hover:bg-blue-50">
          <span>1. בדיקת מנוי ותשלומים</span>
          {state.billing ? <CheckCircle2 size={16} className="text-emerald-600" /> : <Circle size={16} className="text-slate-400" />}
        </button>
        <button type="button" onClick={() => toggle("settings")} className="flex w-full items-center justify-between rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm hover:bg-blue-50">
          <span>2. מילוי הגדרות ארגון</span>
          {state.settings ? <CheckCircle2 size={16} className="text-emerald-600" /> : <Circle size={16} className="text-slate-400" />}
        </button>
        <button type="button" onClick={() => toggle("users")} className="flex w-full items-center justify-between rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm hover:bg-blue-50">
          <span>3. פתיחת משתמשים והרשאות</span>
          {state.users ? <CheckCircle2 size={16} className="text-emerald-600" /> : <Circle size={16} className="text-slate-400" />}
        </button>
        <button type="button" onClick={() => toggle("workflows")} className="flex w-full items-center justify-between rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm hover:bg-blue-50">
          <span>4. הפעלת CRM/ERP ב-Wizard</span>
          {state.workflows ? <CheckCircle2 size={16} className="text-emerald-600" /> : <Circle size={16} className="text-slate-400" />}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/dashboard/billing" className="rounded-xl bg-blue-700 px-3 py-2 text-xs font-bold text-white hover:bg-blue-800">מנויים</Link>
        <Link href="/dashboard/settings" className="rounded-xl border border-blue-300 bg-white px-3 py-2 text-xs font-bold text-blue-900 hover:bg-blue-100">הגדרות</Link>
        <Link href="/dashboard/crm#crm-wizard" className="rounded-xl border border-blue-300 bg-white px-3 py-2 text-xs font-bold text-blue-900 hover:bg-blue-100">CRM Wizard</Link>
        <Link href="/dashboard/erp#erp-wizard" className="rounded-xl border border-blue-300 bg-white px-3 py-2 text-xs font-bold text-blue-900 hover:bg-blue-100">ERP Wizard</Link>
      </div>
    </section>
  );
}
