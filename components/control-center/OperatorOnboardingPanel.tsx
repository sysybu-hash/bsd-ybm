"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, Rocket } from "lucide-react";
import { getAdvancedWorkspaceHref } from "@/components/app-shell/app-nav";
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
  const advancedClientsHref = getAdvancedWorkspaceHref("clients");
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
    <section className="rounded-2xl border border-teal-500/30 bg-teal-500/15 p-5" dir="rtl">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/40 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-teal-300">
            <Rocket size={12} />
            Onboarding
          </p>
          <h2 className="mt-1 text-lg font-black text-gray-900">צ&apos;קליסט מנהל חדש</h2>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-teal-800">{progress}% הושלם</span>
      </div>

      <div className="mb-3 h-2 overflow-hidden rounded-full bg-teal-100">
        <div className="h-full rounded-full bg-teal-600 transition-all" style={{ width: `${progress}%` }} />
      </div>

      <div className="space-y-2">
        <button type="button" onClick={() => toggle("billing")} className="flex w-full items-center justify-between rounded-xl border border-teal-500/30 bg-white px-3 py-2 text-sm hover:bg-teal-500/15">
          <span>1. בדיקת מנוי ותשלומים</span>
          {state.billing ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Circle size={16} className="text-gray-400" />}
        </button>
        <button type="button" onClick={() => toggle("settings")} className="flex w-full items-center justify-between rounded-xl border border-teal-500/30 bg-white px-3 py-2 text-sm hover:bg-teal-500/15">
          <span>2. מילוי הגדרות ארגון</span>
          {state.settings ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Circle size={16} className="text-gray-400" />}
        </button>
        <button type="button" onClick={() => toggle("users")} className="flex w-full items-center justify-between rounded-xl border border-teal-500/30 bg-white px-3 py-2 text-sm hover:bg-teal-500/15">
          <span>3. פתיחת משתמשים והרשאות</span>
          {state.users ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Circle size={16} className="text-gray-400" />}
        </button>
        <button type="button" onClick={() => toggle("workflows")} className="flex w-full items-center justify-between rounded-xl border border-teal-500/30 bg-white px-3 py-2 text-sm hover:bg-teal-500/15">
          <span>4. הפעלת CRM/ERP ב-Wizard</span>
          {state.workflows ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Circle size={16} className="text-gray-400" />}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/app/billing" className="rounded-xl bg-teal-700 px-3 py-2 text-xs font-bold text-white hover:bg-teal-800">מנויים</Link>
        <Link href="/app/settings" className="rounded-xl border border-teal-500/40 bg-white px-3 py-2 text-xs font-bold text-white hover:bg-teal-500/25">הגדרות</Link>
        <Link href={`${advancedClientsHref}#crm-wizard`} className="rounded-xl border border-teal-500/40 bg-white px-3 py-2 text-xs font-bold text-white hover:bg-teal-500/25">CRM Wizard</Link>
        <Link href="/app/documents/erp#erp-wizard" className="rounded-xl border border-teal-500/40 bg-white px-3 py-2 text-xs font-bold text-white hover:bg-teal-500/25">ERP Wizard</Link>
      </div>
    </section>
  );
}
