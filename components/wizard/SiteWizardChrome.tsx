"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Compass, Sparkles } from "lucide-react";
import {
  SITE_WIZARD_STEPS,
  findWizardStep,
  findWizardStepIndex,
  getAdjacentWizardRoute,
} from "@/lib/site-wizard";
import { trackWizardEvent } from "@/lib/client-telemetry";

type Props = {
  children: ReactNode;
};

const STORAGE_KEY = "bsd-ybm:wizard:visited";

function isUtilityPage(pathname: string): boolean {
  return pathname.startsWith("/privacy") || pathname.startsWith("/terms") || pathname.startsWith("/legal");
}

export default function SiteWizardChrome({ children }: Props) {
  const pathname = usePathname() || "/";
  const isDashboard = pathname.startsWith("/dashboard");
  const hidden = pathname.startsWith("/api") || isUtilityPage(pathname);

  const currentStep = findWizardStep(pathname);
  const currentIndex = findWizardStepIndex(pathname);
  const nextRoute = getAdjacentWizardRoute(pathname, "next");
  const prevRoute = getAdjacentWizardRoute(pathname, "prev");

  const [visited, setVisited] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as string[];
      if (Array.isArray(parsed)) {
        setVisited(parsed.filter((x) => typeof x === "string"));
      }
    } catch {
      // Ignore malformed local storage.
    }
  }, []);

  useEffect(() => {
    setVisited((prev) => {
      if (prev.includes(currentStep.id)) return prev;
      const next = [...prev, currentStep.id];
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage write errors.
      }
      return next;
    });
  }, [currentStep.id]);

  useEffect(() => {
    void trackWizardEvent("site_step_view", `step=${currentStep.id};route=${pathname}`);
  }, [currentStep.id, pathname]);

  const progressPct = useMemo(() => {
    return Math.max(5, Math.round(((currentIndex + 1) / SITE_WIZARD_STEPS.length) * 100));
  }, [currentIndex]);

  if (hidden) return <>{children}</>;

  if (isDashboard) {
    return (
      <>
        <div className="pointer-events-none fixed inset-x-0 top-3 z-[70] flex justify-center px-3">
          <div className="pointer-events-auto w-full max-w-xl rounded-2xl border border-emerald-200/70 bg-white/92 p-3 shadow-xl backdrop-blur">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">
                <Sparkles size={14} />
                Wizard Mode
              </div>
              <div className="text-xs font-semibold text-slate-600">{progressPct}% complete</div>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
              <span>{currentStep.title}</span>
              <div className="flex items-center gap-1">
                {prevRoute ? (
                  <Link
                    href={prevRoute}
                    onClick={() => void trackWizardEvent("site_nav_prev", `from=${pathname};to=${prevRoute}`)}
                    className="rounded-lg border border-slate-200 px-2 py-1 hover:bg-slate-50"
                  >
                    Back
                  </Link>
                ) : null}
                {nextRoute ? (
                  <Link
                    href={nextRoute}
                    onClick={() => void trackWizardEvent("site_nav_next", `from=${pathname};to=${nextRoute}`)}
                    className="rounded-lg bg-emerald-600 px-2 py-1 font-semibold text-white hover:bg-emerald-700"
                  >
                    Next
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </div>
        {children}
      </>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_0%_0%,rgba(20,184,166,0.16),transparent_35%),radial-gradient(circle_at_100%_0%,rgba(249,115,22,0.16),transparent_40%),linear-gradient(180deg,#f7fafc_0%,#ffffff_100%)]">
      <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:linear-gradient(rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.04)_1px,transparent_1px)] [background-size:30px_30px]" />

      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-teal-700">
              <Compass size={14} />
              Guided Workspace
            </div>
            <div className="text-xs font-semibold text-slate-600">Step {currentIndex + 1} of {SITE_WIZARD_STEPS.length}</div>
          </div>

          <div className="mb-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-teal-500 transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-4">
            {SITE_WIZARD_STEPS.map((step, idx) => {
              const done = visited.includes(step.id);
              const active = idx === currentIndex;
              return (
                <Link
                  key={step.id}
                  href={step.primaryRoute}
                  onClick={() =>
                    void trackWizardEvent("site_step_click", `from=${pathname};to=${step.primaryRoute};step=${step.id}`)
                  }
                  className={`rounded-xl border px-3 py-2 text-start transition-all ${
                    active
                      ? "border-teal-300 bg-teal-50 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between text-xs font-bold uppercase tracking-wide">
                    <span className={active ? "text-teal-700" : "text-slate-500"}>{step.title}</span>
                    {done ? <CheckCircle2 size={14} className="text-emerald-600" /> : null}
                  </div>
                  <p className="text-xs text-slate-600">{step.description}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      <main className="relative z-10">{children}</main>

      <div className="sticky bottom-0 z-40 border-t border-slate-200/80 bg-white/92 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="text-sm text-slate-600">{currentStep.description}</div>
          <div className="flex items-center gap-2">
            {prevRoute ? (
              <Link
                href={prevRoute}
                onClick={() => void trackWizardEvent("site_nav_prev", `from=${pathname};to=${prevRoute}`)}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <ArrowLeft size={16} />
                Previous
              </Link>
            ) : null}
            {nextRoute ? (
              <Link
                href={nextRoute}
                onClick={() => void trackWizardEvent("site_nav_next", `from=${pathname};to=${nextRoute}`)}
                className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Next
                <ArrowRight size={16} />
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
