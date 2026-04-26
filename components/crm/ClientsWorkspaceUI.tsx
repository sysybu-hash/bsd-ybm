import Link from "next/link";
import { BrainCircuit, Briefcase, MapPin, Plus, Users } from "lucide-react";
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
  LEAD: "bg-sky-50 text-sky-800 border border-sky-200",
  PROPOSAL: "bg-amber-50 text-amber-800 border border-amber-200",
  ACTIVE: "bg-emerald-50 text-emerald-800 border border-emerald-200",
  CLOSED_WON: "bg-teal-50 text-teal-800 border border-teal-200",
  CLOSED_LOST: "bg-rose-50 text-rose-800 border border-rose-200",
};

type ClientsWorkspaceUIProps = {
  totalClients: number;
  activeProjects: number;
  meckanoZonesCount: number;
  aiInsightsEnabled: boolean;
  recentClients: ClientWorkspaceRecentRow[];
  contactDirectory: Array<{ id: string; name: string }>;
  newContactHref?: string;
};

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
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-lg border border-[color:var(--line)] bg-[color:var(--canvas-raised)] p-5 shadow-[var(--shadow-sm)] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black text-[color:var(--axis-clients)]">CRM COMMAND</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-[color:var(--ink-900)]">לקוחות ופרויקטים</h1>
          <p className="mt-2 text-sm text-[color:var(--ink-500)]">ניהול קשרים, אתרים, הצעות ותובנות עסקיות במקום אחד.</p>
        </div>
        <Link
          href={newContactHref}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[color:var(--axis-ai)] px-5 text-sm font-black text-white shadow-[0_12px_26px_rgba(79,70,229,0.22)] transition hover:bg-[color:var(--axis-ai-strong)]"
        >
          <Plus size={18} aria-hidden />
          איש קשר חדש
        </Link>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric icon={Users} label="לקוחות / ספקים" value={String(totalClients)} tone="clients" />
        <Metric icon={Briefcase} label="פרויקטים פעילים" value={String(activeProjects)} tone="indigo" />
        <Metric icon={MapPin} label="אזורי מקאנו" value={String(meckanoZonesCount)} tone="teal" />
        <Metric icon={BrainCircuit} label="AI / חיפוש" value={aiInsightsEnabled ? "פעיל" : "לא מוגדר"} tone="ai" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-lg border border-[color:var(--line)] bg-[color:var(--canvas-raised)] p-5 shadow-[var(--shadow-sm)]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black text-[color:var(--ink-500)]">RECENT CONTACTS</p>
              <h2 className="mt-1 text-base font-black text-[color:var(--ink-900)]">אנשי קשר אחרונים</h2>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-start">
              <thead>
                <tr className="border-b border-[color:var(--line)] text-xs font-black text-[color:var(--ink-500)]">
                  <th className="w-[22%] pb-3 pe-4">שם</th>
                  <th className="w-[24%] pb-3">דוא״ל</th>
                  <th className="w-[14%] pb-3">סטטוס</th>
                  <th className="pb-3">תובנה</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {recentClients.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-[color:var(--ink-500)]">
                      אין אנשי קשר עדיין.
                    </td>
                  </tr>
                ) : (
                  recentClients.map((client) => (
                    <tr key={client.id} className="border-b border-[color:var(--line-subtle)] transition-colors hover:bg-[color:var(--canvas-sunken)]">
                      <td className="py-3 pe-4">
                        <Link
                          href={`/app/clients?clientId=${encodeURIComponent(client.id)}`}
                          className="font-black text-[color:var(--axis-ai)] hover:underline"
                        >
                          {client.name}
                        </Link>
                      </td>
                      <td className="max-w-[220px] truncate py-3 text-[color:var(--ink-500)]" title={client.email}>
                        {client.email}
                      </td>
                      <td className="py-3">
                        <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-black ${STATUS_BADGE[client.statusKey] ?? "bg-slate-100 text-slate-800"}`}>
                          {client.statusLabel}
                        </span>
                      </td>
                      <td className="max-w-md truncate py-3 text-[color:var(--ink-500)]" title={client.insight}>
                        {client.insight}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <ClientsCrmSemanticSearchPanel contactDirectory={contactDirectory} />
      </div>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  tone: "clients" | "indigo" | "teal" | "ai";
}) {
  const toneClass =
    tone === "teal"
      ? "bg-teal-50 text-teal-700"
      : tone === "clients"
        ? "bg-cyan-50 text-cyan-700"
        : "bg-[color:var(--axis-ai-soft)] text-[color:var(--axis-ai)]";
  return (
    <div className="rounded-lg border border-[color:var(--line)] bg-[color:var(--canvas-raised)] p-5 shadow-[var(--shadow-sm)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black text-[color:var(--ink-500)]">{label}</p>
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${toneClass}`}>
          <Icon className="h-5 w-5" aria-hidden />
        </span>
      </div>
      <p className="mt-4 text-3xl font-black text-[color:var(--ink-900)]">{value}</p>
    </div>
  );
}
