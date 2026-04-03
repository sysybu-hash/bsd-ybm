"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, ArrowRight, Compass } from "lucide-react";
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
  const hidden = isDashboard || pathname.startsWith("/api") || isUtilityPage(pathname);

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

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_0%_0%,rgba(20,184,166,0.16),transparent_35%),radial-gradient(circle_at_100%_0%,rgba(249,115,22,0.16),transparent_40%),linear-gradient(180deg,#f7fafc_0%,#ffffff_100%)]">
      <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:linear-gradient(rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.04)_1px,transparent_1px)] [background-size:30px_30px]" />

      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto max-w-5xl px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-teal-700">
              <Compass size={14} />
              Guided Workspace
            </div>
            <div className="text-xs font-semibold text-slate-600">Step {currentIndex + 1} of {SITE_WIZARD_STEPS.length}</div>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-teal-500 transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-slate-900">{currentStep.title}</p>
              <p className="text-xs text-slate-600">{currentStep.description}</p>
            </div>
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
      </header>

      <main className="relative z-10">{children}</main>
    </div>
  );
}
