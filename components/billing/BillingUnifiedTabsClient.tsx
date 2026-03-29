"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BarChart3, Crown, Settings2 } from "lucide-react";

type TabId = "overview" | "manage" | "advanced";

function parseTab(raw: string | null | undefined, isSteelAdmin: boolean): TabId {
  if (!isSteelAdmin) return "overview";
  if (raw === "manage" || raw === "advanced" || raw === "overview") return raw;
  return "overview";
}

type Props = {
  isSteelAdmin: boolean;
  childrenOverview: ReactNode;
  childrenManage: ReactNode | null;
  childrenAdvanced: ReactNode | null;
};

export default function BillingUnifiedTabsClient({
  isSteelAdmin,
  childrenOverview,
  childrenManage,
  childrenAdvanced,
}: Props) {
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
      if (next === "overview") p.delete("tab");
      else p.set("tab", next);
      const q = p.toString();
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const tabs: { id: TabId; label: string; icon: typeof BarChart3; adminOnly?: boolean }[] = [
    { id: "overview", label: "דוחות וסקירה כללית", icon: BarChart3 },
    { id: "manage", label: "ניהול ועריכת מנויים", icon: Crown, adminOnly: true },
    { id: "advanced", label: "הגדרות מתקדמות", icon: Settings2, adminOnly: true },
  ];

  const visibleTabs = tabs.filter((x) => !x.adminOnly || isSteelAdmin);

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100" dir="rtl">
      <div className="max-w-[1600px] mx-auto px-4 pt-6 sm:px-8">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2">
          מנויים ותשלומים
        </h1>
        <p className="text-sm text-slate-400 mb-6">
          מרכז אחד לשימוש, שדרוג מנוי וניהול — לפי ההרשאות שלך.
        </p>

        <div
          className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-slate-900/80 border border-amber-500/20 shadow-inner shadow-black/40 mb-8"
          role="tablist"
          aria-label="מקטעי מנויים ותשלומים"
        >
          {visibleTabs.map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTabAndUrl(id)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                  active
                    ? "bg-gradient-to-br from-amber-200/95 via-amber-100 to-slate-200 text-slate-900 shadow-md shadow-amber-900/30 ring-1 ring-amber-300/80"
                    : "text-slate-300 hover:bg-slate-800/90 hover:text-white border border-transparent"
                }`}
              >
                <Icon size={18} className={active ? "text-amber-900" : "text-slate-500"} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="pb-16" role="tabpanel" hidden={tab !== "overview"}>
        {tab === "overview" ? childrenOverview : null}
      </div>
      {isSteelAdmin ? (
        <>
          <div className="pb-16" role="tabpanel" hidden={tab !== "manage"}>
            {tab === "manage" ? childrenManage : null}
          </div>
          <div className="pb-16" role="tabpanel" hidden={tab !== "advanced"}>
            {tab === "advanced" ? childrenAdvanced : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
