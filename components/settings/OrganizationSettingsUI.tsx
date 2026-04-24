"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { updateOrganizationTrade } from "@/app/actions/organization-actions";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { Building2, Key, Loader2, ShieldCheck, UserPlus, Users, Zap } from "lucide-react";
import type { UserRole } from "@prisma/client";
import {
  type ConstructionTradeId,
  CONSTRUCTION_TRADE_IDS,
  constructionTradeLabelHe,
  listConstructionTradesForSelect,
  normalizeConstructionTrade,
} from "@/lib/construction-trades";

export type OrganizationTeamMember = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type OrganizationSettingsUIProps = {
  orgName: string;
  taxId: string;
  /** מקצוע בנייה נוכחי (Prisma `constructionTrade`) */
  constructionTrade?: string | null;
  /** מנהל ארגון / הרשאת עריכת מקצוע */
  canUpdateTrade?: boolean;
  meckanoKeyExists: boolean;
  teamMembers: OrganizationTeamMember[];
  onSaveCompany?: (data: { name: string; taxId: string }) => void;
  onInviteClick?: () => void;
  /** true כש־read-only / ללא עריכה */
  readOnly?: boolean;
};

const ROLE_UI: Record<
  string,
  { text: string; css: string }
> = {
  ORG_ADMIN: { text: "מנהל ארגון", css: "bg-purple-50 text-purple-700 border-purple-200" },
  PROJECT_MGR: { text: "מנהל פרויקט", css: "bg-blue-50 text-blue-700 border-blue-200" },
  EMPLOYEE: { text: "עובד", css: "bg-gray-100 text-gray-700 border-gray-200" },
  CLIENT: { text: "לקוח", css: "bg-amber-50 text-amber-800 border-amber-200" },
  SUPER_ADMIN: { text: "אדמין פלטפורמה", css: "bg-rose-50 text-rose-800 border-rose-200" },
};

function roleBadge(role: string) {
  const r = ROLE_UI[role] ?? {
    text: role,
    css: "bg-gray-100 text-gray-700 border-gray-200",
  };
  return (
    <span className={`rounded-md border px-2.5 py-1 text-xs font-medium ${r.css}`}>{r.text}</span>
  );
}

/** אייקוני תצוגה בלבד — הערכים המאומתים הם `CONSTRUCTION_TRADE_IDS` */
const TRADE_EMOJI: Partial<Record<ConstructionTradeId, string>> = {
  GENERAL_CONTRACTOR: "🏗️",
  ELECTRICAL: "⚡",
  PLUMBING: "🚰",
  HVAC: "❄️",
  PAINTING: "🎨",
  FLOORING: "⬛",
  ALUMINUM: "🪟",
  FINISHING: "🚪",
  LANDSCAPING: "🌳",
  SUBCONTRACTOR_OTHER: "🔧",
};

/**
 * מבט־על: פרטי חברה, מקאנו, טבלת צוות (שדות העריכה הם UI בלבד — חיבור ל־action בקומפוננטת העטיפה)
 */
export function OrganizationSettingsUI({
  orgName,
  taxId,
  constructionTrade,
  canUpdateTrade = false,
  meckanoKeyExists,
  teamMembers,
  onInviteClick,
  readOnly,
}: OrganizationSettingsUIProps) {
  const currentTrade = normalizeConstructionTrade(constructionTrade) as ConstructionTradeId;
  const tradeList = listConstructionTradesForSelect();
  const [selectedTrade, setSelectedTrade] = useState<ConstructionTradeId>(currentTrade);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    setSelectedTrade(normalizeConstructionTrade(constructionTrade) as ConstructionTradeId);
  }, [constructionTrade]);

  const handleUpdateTrade = () => {
    startTransition(async () => {
      setMessage(null);
      const result = await updateOrganizationTrade(selectedTrade);
      if (result.success) {
        setMessage({ type: "success", text: 'ההתאמה המקצועית ("השדרה") עודכנה בהצלחה.' });
        setTimeout(() => setMessage(null), 4000);
      } else {
        setMessage({ type: "error", text: result.error || "אירעה שגיאה בעדכון." });
      }
    });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">הגדרות ארגון</h1>
        <p className="mt-1 text-text-secondary">ניהול פרטי חברה, צוותים ואינטגרציות</p>
        <p className="mt-1 text-sm text-text-secondary/90">
          BSD-YBM פתרונות AI — התאמת &quot;השדרה&quot; לפי מקצוע הארגון
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <DashboardCard title="התאמה מקצועית (השדרה)" actionIcon={<Zap className="text-brand" size={20} />}>
            {canUpdateTrade ? (
              <div className="space-y-4">
                <p className="text-xs leading-relaxed text-text-secondary">
                  בחירת התחום מכוונת את מנועי ה־AI והמדדים. לאחר שמירה, הממשקים המותאמים יתרעננו.
                </p>
                <div className="max-h-64 space-y-2 overflow-y-auto pe-1">
                  {CONSTRUCTION_TRADE_IDS.map((id) => {
                    const label = constructionTradeLabelHe(id);
                    const emoji = TRADE_EMOJI[id] ?? "•";
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setSelectedTrade(id)}
                        className={`flex w-full items-center gap-3 rounded-xl border p-3 text-start text-sm transition-all ${
                          selectedTrade === id
                            ? "border-brand bg-brand/5 font-bold text-brand shadow-sm"
                            : "border-gray-100 bg-white text-text-secondary hover:border-gray-200"
                        }`}
                      >
                        <span aria-hidden>{emoji}</span>
                        <span className="min-w-0 flex-1">{label}</span>
                        {selectedTrade === id ? <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden /> : null}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={handleUpdateTrade}
                  disabled={isPending || selectedTrade === currentTrade}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-bold text-white shadow-card transition-all hover:bg-brand-dark disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                  {isPending ? "מעדכן…" : "עדכן התאמה מקצועית"}
                </button>
                {message ? (
                  <div
                    className={`rounded-lg p-2 text-center text-sm font-medium ${
                      message.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                    }`}
                  >
                    {message.text}
                  </div>
                ) : null}
                <Link
                  href="/app/settings/profession"
                  className="block w-full text-center text-xs font-semibold text-brand hover:underline"
                >
                  פאנל התאמה מקצועית מורחב
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs leading-relaxed text-text-secondary">
                  בחירת המקצוע מכוונת מנועי AI, סוגי מסמכים ומדדים. עריכה — למנהל הארגון או בפאנל המקצוע.
                </p>
                <p className="text-sm font-bold text-text-primary">
                  נבחר היום: {constructionTradeLabelHe(currentTrade)}
                </p>
                <ul className="max-h-48 space-y-1.5 overflow-y-auto text-xs text-text-secondary">
                  {tradeList.map((row) => (
                    <li
                      key={row.id}
                      className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 ${
                        row.id === currentTrade
                          ? "border-brand/40 bg-brand/5 font-semibold text-brand"
                          : "border-gray-100"
                      }`}
                    >
                      {row.id === currentTrade ? <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden /> : null}
                      <span className="min-w-0">{row.label}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/app/settings/profession"
                  className="inline-flex w-full items-center justify-center rounded-xl bg-brand py-2.5 text-sm font-bold text-white shadow-card transition-all hover:bg-brand-dark"
                >
                  מעבר להתאמה מקצועית
                </Link>
              </div>
            )}
          </DashboardCard>

          <DashboardCard title="פרטי חברה" actionIcon={<Building2 size={20} />}>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">שם הארגון</label>
                <input
                  type="text"
                  defaultValue={orgName}
                  readOnly={readOnly}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 p-2.5 text-sm outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">ח.פ / עוסק מורשה</label>
                <input
                  type="text"
                  defaultValue={taxId}
                  readOnly={readOnly}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 p-2.5 text-sm outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
              <p className="text-xs text-text-secondary">
                לשמירה בפועל השתמשו בפאנל ההגדרות המלא — כאן תצוגה מקוצרת.
              </p>
            </div>
          </DashboardCard>

          <DashboardCard title="אינטגרציות" actionIcon={<Key size={20} />}>
            <div className="space-y-4">
              <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-text-primary">Meckano</span>
                  {meckanoKeyExists ? (
                    <span className="rounded bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-600">
                      מחובר
                    </span>
                  ) : (
                    <span className="rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-600">חסר מפתח</span>
                  )}
                </div>
                <p className="text-xs text-text-secondary">ניהול מפתח — בלשונית המלאה בהגדרות.</p>
              </div>
            </div>
          </DashboardCard>
        </div>

        <DashboardCard className="lg:col-span-2" title="צוות והרשאות" actionIcon={<Users size={20} />}>
          <div className="mb-6 flex justify-end">
            <button
              type="button"
              onClick={onInviteClick}
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
            >
              <UserPlus size={16} />
              הזמנת עובד
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-start">
              <thead>
                <tr className="border-b border-gray-100 text-sm text-text-secondary">
                  <th className="pb-3 pe-4 font-medium">שם</th>
                  <th className="pb-3 font-medium">דוא״ל</th>
                  <th className="pb-3 font-medium">הרשאה</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {teamMembers.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-text-secondary">
                      <Users className="mx-auto mb-2 inline-block h-7 w-7 opacity-30" />
                      <br />
                      אין משתמשים מוצגים
                    </td>
                  </tr>
                ) : (
                  teamMembers.map((member) => (
                    <tr key={member.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="py-3 pe-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-light/20 text-xs font-bold text-brand">
                            {(member.name || member.email).charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-text-primary">{member.name || "—"}</span>
                        </div>
                      </td>
                      <td className="py-3 text-text-secondary">{member.email}</td>
                      <td className="py-3">{roleBadge(member.role)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}
