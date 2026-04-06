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
    <div className="min-h-screen bg-[#050508] font-sans text-white" dir={dir}>
      <div className="mx-auto max-w-[1600px] px-4 pt-6 sm:px-8">
        <h1 className="mb-1 text-2xl font-black tracking-tight text-white sm:text-3xl">
          מנויים ותשלומים
        </h1>
        <p className="mb-6 text-sm font-medium text-white/40">
          סקירה עם גרפים — או מרכז שליטה לניהול כל המנויים (למפעילי פלטפורמה בלבד).
        </p>

        <div
          className="mb-8 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-2"
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
                      ? "bg-white/[0.10] text-white shadow-sm ring-1 ring-white/15"
                      : "text-white/35 hover:bg-white/[0.06] hover:text-white/65"
                  }`}
                >
                  <span className="flex items-center gap-2 text-xs font-black">
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] ${
                        active ? "bg-indigo-500 text-white" : "bg-white/[0.08] text-white/45"
                      }`}
                    >
                      {step}
                    </span>
                    <Icon size={16} className={active ? "text-indigo-400" : "text-white/30"} strokeWidth={2} />
                    <span className={`font-black ${active ? "text-white" : "text-white/50"}`}>{label}</span>
                  </span>
                  <span className="pe-8 text-[11px] font-medium text-white/30">{hint}</span>
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
