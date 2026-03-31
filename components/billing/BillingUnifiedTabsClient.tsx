"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { BarChart3, Crown } from "lucide-react";
import { useI18n } from "@/components/I18nProvider";

type TabId = "overview" | "control";

function parseTab(raw: string | null | undefined, isSteelAdmin: boolean): TabId {
  if (!isSteelAdmin) return "overview";
  const r = raw ?? "";
  if (r === "manage" || r === "advanced" || r === "control") return "control";
  if (r === "overview") return "overview";
  return "overview";
}

type Props = {
  isSteelAdmin: boolean;
  childrenOverview: ReactNode;
  /** מרכז ניהול מנויים — רק לאדמין פלטפורמה */
  childrenControl: ReactNode | null;
};

export default function BillingUnifiedTabsClient({
  isSteelAdmin,
  childrenOverview,
  childrenControl,
}: Props) {
  const { dir } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabFromUrl = useMemo(
    () => parseTab(searchParams.get("tab"), isSteelAdmin),
    [searchParams, isSteelAdmin],
  );
  const [tab, setTab] = useState<TabId>(tabFromUrl);

  useEffect(() => {
    setTab(tabFromUrl);
  }, [tabFromUrl]);

  const setTabAndUrl = useCallback(
    (next: TabId) => {
      setTab(next);
      const p = new URLSearchParams(searchParams.toString());
      if (next === "overview") {
        p.delete("tab");
        p.delete("orgId");
      } else {
        p.set("tab", "control");
      }
      const q = p.toString();
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const tabs: {
    id: TabId;
    label: string;
    step: number;
    hint: string;
    icon: typeof BarChart3;
    adminOnly?: boolean;
  }[] = [
    {
      id: "overview",
      step: 1,
      label: "סקירה וגרפים",
      hint: "מצב, מכסות ויזואליות",
      icon: BarChart3,
    },
    {
      id: "control",
      step: 2,
      label: "מרכז שליטה במנויים",
      hint: "ניהול מלא — טבלה וכרטיס בודד",
      icon: Crown,
      adminOnly: true,
    },
  ];

  const visibleTabs = tabs.filter((x) => !x.adminOnly || isSteelAdmin);

  return (
    <div className="min-h-screen bg-transparent font-sans text-slate-900" dir={dir}>
      <div className="mx-auto max-w-[1600px] px-4 pt-6 sm:px-8">
        <h1 className="mb-1 text-2xl font-black italic tracking-tight text-slate-900 sm:text-3xl">
          מנויים ותשלומים
        </h1>
        <p className="mb-6 text-sm font-medium text-slate-600">
          סקירה עם גרפים — או מרכז שליטה אחד לניהול כל המנויים (למפעילי פלטפורמה בלבד).
        </p>

        <div
          className="mb-8 rounded-2xl border border-slate-200/90 bg-white/95 p-2 shadow-md shadow-slate-200/50 backdrop-blur-md ring-1 ring-slate-100/90"
          role="tablist"
          aria-label="מקטעי מנויים"
        >
          <div className="flex flex-wrap gap-2">
            {visibleTabs.map(({ id, label, hint, step, icon: Icon }) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTabAndUrl(id)}
                  className={`inline-flex min-w-0 flex-1 flex-col items-stretch gap-0.5 rounded-xl px-4 py-3 text-start transition-all sm:min-w-[10rem] sm:flex-none ${
                    active
                      ? "bg-gradient-to-br from-blue-50 via-white to-slate-50 text-slate-900 shadow-md shadow-blue-200/40 ring-1 ring-blue-300/80"
                      : "border border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <span className="flex items-center gap-2 text-xs font-black text-blue-700/80">
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] ${
                        active ? "bg-blue-500 text-white" : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {step}
                    </span>
                    <Icon size={16} className={active ? "text-blue-600" : "text-slate-400"} strokeWidth={2} />
                    <span className="font-black text-slate-900">{label}</span>
                  </span>
                  <span className="pe-8 text-[11px] font-medium text-slate-500">{hint}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="pb-16"
          role="tabpanel"
        >
          {tab === "overview" ? childrenOverview : null}
          {isSteelAdmin && tab === "control" ? childrenControl : null}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
