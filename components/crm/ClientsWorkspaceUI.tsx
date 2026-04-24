import Link from "next/link";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { Users, Briefcase, MapPin, BrainCircuit, Plus } from "lucide-react";
import { ClientsCrmSemanticSearchPanel } from "@/components/crm/ClientsCrmSemanticSearchPanel";

export type ClientWorkspaceRecentRow = {
  id: string;
  name: string;
  email: string;
  statusKey: string;
  statusLabel: string;
  insight: string;
};

const STATUS_BADGE: Record<string, string> = {
  LEAD: "bg-sky-50 text-sky-800 border border-sky-200/70",
  PROPOSAL: "bg-amber-50 text-amber-800 border border-amber-200/70",
  ACTIVE: "bg-brand-background text-brand border border-brand-light/30",
  CLOSED_WON: "bg-emerald-50 text-emerald-800 border border-emerald-200/70",
  CLOSED_LOST: "bg-rose-50 text-rose-800 border border-rose-200/70",
};

type ClientsWorkspaceUIProps = {
  totalClients: number;
  activeProjects: number;
  meckanoZonesCount: number;
  /** true כש־API Gemini מוגדר (חיפוש סמנטי יכול לעבוד) */
  aiInsightsEnabled: boolean;
  recentClients: ClientWorkspaceRecentRow[];
  contactDirectory: Array<{ id: string; name: string }>;
  newContactHref?: string;
};

/**
 * שכבת מבט־על: מדדים, טבלת אנשי קשר אחרונים וחיפוש AI
 */
export function ClientsWorkspaceUI({
  totalClients,
  activeProjects,
  meckanoZonesCount,
  aiInsightsEnabled,
  recentClients,
  contactDirectory,
  newContactHref = "/app/clients#quick-client-form",
}: ClientsWorkspaceUIProps) {
  return (
    <div className="mx-auto max-w-7xl space-y-8 p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">ניהול לקוחות ופרויקטים</h1>
          <p className="mt-1 text-text-secondary">אינטליגנציה עסקית, אזורי מקאנו והצעות מחיר</p>
        </div>
        <Link
          href={newContactHref}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-2.5 font-medium text-white shadow-card transition-colors hover:bg-brand-dark"
        >
          <Plus size={20} />
          איש קשר חדש
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard className="border-l-4 border-l-brand" title="סך לקוחות/ספקים">
          <div className="flex items-center justify-between">
            <div className="text-3xl font-semibold text-text-primary">{totalClients}</div>
            <Users className="text-brand opacity-80" size={28} aria-hidden />
          </div>
        </DashboardCard>

        <DashboardCard className="border-l-4 border-l-blue-500" title="פרויקטים פעילים">
          <div className="flex items-center justify-between">
            <div className="text-3xl font-semibold text-text-primary">{activeProjects}</div>
            <Briefcase className="text-blue-500 opacity-80" size={28} aria-hidden />
          </div>
        </DashboardCard>

        <DashboardCard className="border-l-4 border-l-emerald-500" title="אזורי מקאנו מקושרים">
          <div className="flex items-center justify-between">
            <div className="text-3xl font-semibold text-text-primary">{meckanoZonesCount}</div>
            <MapPin className="text-emerald-500 opacity-80" size={28} aria-hidden />
          </div>
        </DashboardCard>

        <DashboardCard
          className="border-l-4 border-l-purple-500 bg-purple-50/50"
          title="תובנות AI / חיפוש"
        >
          <div className="flex items-center justify-between">
            <div
              className={`text-2xl font-semibold ${aiInsightsEnabled ? "text-purple-700" : "text-text-secondary"}`}
            >
              {aiInsightsEnabled ? "פעיל" : "לא מוגדר"}
            </div>
            <BrainCircuit
              className={
                aiInsightsEnabled ? "animate-pulse text-purple-500" : "text-gray-300"
              }
              size={28}
              aria-hidden
            />
          </div>
        </DashboardCard>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <DashboardCard className="lg:col-span-2" title="אנשי קשר אחרונים">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-start">
              <thead>
                <tr className="border-b border-gray-100 text-sm text-text-secondary">
                  <th className="w-[22%] pb-4 pe-4 font-medium">שם</th>
                  <th className="w-[24%] pb-4 font-medium">דוא״ל</th>
                  <th className="w-[12%] pb-4 font-medium">סטטוס</th>
                  <th className="min-w-0 pb-4 font-medium">הערה / תובנה</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {recentClients.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-text-secondary">
                      אין אנשי קשר. הוסיפו איש קשר חדש.
                    </td>
                  </tr>
                ) : (
                  recentClients.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-gray-50 transition-colors hover:bg-brand-background/50"
                    >
                      <td className="py-4 pe-4">
                        <Link
                          href={`/app/clients?clientId=${encodeURIComponent(c.id)}`}
                          className="font-medium text-brand hover:underline"
                        >
                          {c.name}
                        </Link>
                      </td>
                      <td className="max-w-[200px] truncate py-4 text-text-secondary" title={c.email}>
                        {c.email}
                      </td>
                      <td className="py-4">
                        <span
                          className={`inline-block rounded-md px-2.5 py-1 text-xs font-medium ${
                            STATUS_BADGE[c.statusKey] ?? "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {c.statusLabel}
                        </span>
                      </td>
                      <td className="max-w-md truncate py-4 text-text-secondary" title={c.insight}>
                        {c.insight}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </DashboardCard>

        <ClientsCrmSemanticSearchPanel contactDirectory={contactDirectory} />
      </div>
    </div>
  );
}
