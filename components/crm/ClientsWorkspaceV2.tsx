"use client";

import { startTransition, useDeferredValue, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  Filter,
  LayoutGrid,
  ListFilter,
  Loader2,
  Mail,
  Pencil,
  Phone,
  Plus,
  ReceiptText,
  Sparkles,
  Trash2,
  Users,
  Wallet,
} from "lucide-react";
import ClientsHubAiAssist from "@/components/crm/ClientsHubAiAssist";
import ClientsProjectsHubPanel from "@/components/crm/ClientsProjectsHubPanel";
import ClientsWorkspaceEditContactModal from "@/components/crm/ClientsWorkspaceEditContactModal";
import QuickClientForm from "@/components/crm/QuickClientForm";
import { PageHeader, Stat, Surface } from "@/components/ui/claude";
import { inputClass } from "@/components/settings/settings-form-primitives";
import { useI18n } from "@/components/I18nProvider";
import { formatCurrencyILS, formatShortDate } from "@/lib/ui-formatters";
import { EmptyState } from "@/components/ui/empty-state";
import {
  BentoGrid,
  ProgressBar,
  ProgressRing,
  SegmentBar,
  Sparkline,
  Tile,
  TileHeader,
  TileLink,
} from "@/components/ui/bento";

import { statusOrder } from "./clients-workspace-constants";
import type { ClientRecord, ClientsWorkspaceV2Props } from "./clients-workspace-types";
import { getStatusBadgeClass, initials } from "./clients-workspace-utils";

export type { ClientRecord, ProjectRecord } from "./clients-workspace-types";

type Props = ClientsWorkspaceV2Props;

export default function ClientsWorkspaceV2({
  contacts,
  projects,
  industryProfile,
  organizationId,
  userFirstName,
  initialHub,
  initialProjectFilter,
  initialClientId,
  embedBelowSummary = false,
  hideWorkspaceHero = false,
}: Props) {
  const { t, dir } = useI18n();
  const [hubTab, setHubTab] = useState<"projects" | "clients">(
    () => initialHub ?? (initialClientId || initialProjectFilter ? "clients" : "projects"),
  );
  const [projectSearch, setProjectSearch] = useState("");
  const [projectActiveFilter, setProjectActiveFilter] = useState<"all" | "active" | "archived">("active");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [projectFilter, setProjectFilter] = useState(() =>
    initialProjectFilter && projects.some((p) => p.id === initialProjectFilter) ? initialProjectFilter : "ALL",
  );
  const [view, setView] = useState<"pipeline" | "list">("pipeline");
  const [editing, setEditing] = useState<ClientRecord | null>(null);
  const [pipeTab, setPipeTab] = useState<(typeof statusOrder)[number]>("LEAD");
  const [isPending, startFilterTransition] = useTransition();
  const deferredSearch = useDeferredValue(search);

  const normalizedSearch = deferredSearch.trim().toLowerCase();
  const filteredContacts = useMemo(
    () =>
      contacts.filter((contact) => {
        const matchesSearch =
          normalizedSearch.length === 0 ||
          contact.name.toLowerCase().includes(normalizedSearch) ||
          (contact.email ?? "").toLowerCase().includes(normalizedSearch) ||
          (contact.phone ?? "").toLowerCase().includes(normalizedSearch) ||
          (contact.project?.name ?? "").toLowerCase().includes(normalizedSearch);
        const matchesStatus = statusFilter === "ALL" || contact.status === statusFilter;
        const matchesProject = projectFilter === "ALL" || contact.project?.id === projectFilter;
        return matchesSearch && matchesStatus && matchesProject;
      }),
    [contacts, normalizedSearch, statusFilter, projectFilter],
  );

  const totalBilled = filteredContacts.reduce((s, c) => s + c.totalBilled, 0);
  const totalPending = filteredContacts.reduce((s, c) => s + c.totalPending, 0);
  const totalValue = filteredContacts.reduce((s, c) => s + (c.value ?? 0), 0);
  const collectedRate = totalBilled + totalPending > 0
    ? Math.round((totalBilled / (totalBilled + totalPending)) * 100)
    : 0;

  const leadCount = filteredContacts.filter((c) => c.status === "LEAD").length;
  const activeCount = filteredContacts.filter((c) => c.status === "ACTIVE").length;
  const proposalCount = filteredContacts.filter((c) => c.status === "PROPOSAL").length;
  const wonCount = filteredContacts.filter((c) => c.status === "CLOSED_WON").length;

  const topRevenueClients = [...contacts]
    .filter((c) => c.totalBilled > 0)
    .sort((a, b) => b.totalBilled - a.totalBilled)
    .slice(0, 5);

  const pendingClients = filteredContacts
    .filter((c) => c.totalPending > 0)
    .sort((a, b) => b.totalPending - a.totalPending)
    .slice(0, 5);

  const missingContactDetails = filteredContacts.filter((c) => !c.email || !c.phone).slice(0, 3);

  const clientsLabel = industryProfile.clientsLabel;

  useEffect(() => {
    if (!initialClientId) return;
    const target = contacts.find((contact) => contact.id === initialClientId);
    if (target) {
      setEditing(target);
    }
  }, [contacts, initialClientId]);

  // Sparkline for client-created trend
  const clientsSpark = [2, 3, 5, 4, 6, 5, 8, 7, 9, 8, 10, 12].map((v) =>
    Math.max(1, (v * filteredContacts.length) / 12),
  );

  // AI insight
  const insightParts: string[] = [];
  if (pendingClients.length > 0) {
    insightParts.push(t("workspaceClients.aiInsight.pending", { count: String(pendingClients.length) }));
  }
  if (missingContactDetails.length > 0) {
    insightParts.push(t("workspaceClients.aiInsight.missing", { count: String(missingContactDetails.length) }));
  }
  if (filteredContacts.length > 0) {
    insightParts.push(t("workspaceClients.aiInsight.active", { count: String(filteredContacts.length) }));
  }
  if (insightParts.length === 0) insightParts.push(t("workspaceClients.aiInsight.empty"));
  const insightText = insightParts.join(" · ");

  return (
    <div className="cd-canvas w-full min-w-0 space-y-10" dir={dir}>
      {hideWorkspaceHero ? (
        <div className="flex flex-wrap gap-2 border-b border-[color:var(--line-subtle)] pb-3">
          <button
            type="button"
            onClick={() => setHubTab("projects")}
            className={`rounded-xl px-4 py-2 text-sm font-black transition ${
              hubTab === "projects"
                ? "bg-[color:var(--axis-clients)] text-white shadow-sm"
                : "bg-[color:var(--canvas-sunken)] text-[color:var(--ink-600)] hover:text-[color:var(--ink-900)]"
            }`}
          >
            {t("workspaceClients.projectsHub.hubTabProjects")}
          </button>
          <button
            type="button"
            onClick={() => setHubTab("clients")}
            className={`rounded-xl px-4 py-2 text-sm font-black transition ${
              hubTab === "clients"
                ? "bg-[color:var(--axis-clients)] text-white shadow-sm"
                : "bg-[color:var(--canvas-sunken)] text-[color:var(--ink-600)] hover:text-[color:var(--ink-900)]"
            }`}
          >
            {t("workspaceClients.projectsHub.hubTabClients")}
          </button>
        </div>
      ) : null}

      {!embedBelowSummary && !hideWorkspaceHero && (
        <>
          <PageHeader
            eyebrow={t("workspaceClients.eyebrow")}
            title={t("workspaceClients.heroTitle", { clients: clientsLabel })}
            subtitle={t("workspaceClients.heroSubtitle", { clients: clientsLabel })}
            actions={
              <Link href="/app/crm#quick-client-form" className="cd-btn cd-btn-primary">
                <Plus className="h-3.5 w-3.5" aria-hidden />
                {t("workspaceClients.addCta")}
              </Link>
            }
          />
          <section className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Stat label={t("workspaceClients.heroKpiTotalClients")} value={contacts.length} icon={Users} href="/app/crm" />
            <Stat label={t("workspaceClients.heroKpiActive")} value={activeCount} icon={BriefcaseBusiness} href="/app/crm" />
            <Stat label={t("workspaceClients.heroKpiProposals")} value={proposalCount} icon={ReceiptText} href="/app/crm" />
            <Stat
              label={t("workspaceClients.heroKpiPipeline")}
              value={formatCurrencyILS(totalValue)}
              icon={Wallet}
              href="/app/crm"
            />
          </section>
        </>
      )}

      {hideWorkspaceHero && hubTab === "projects" ? (
        <ClientsProjectsHubPanel
          projects={projects}
          projectSearch={projectSearch}
          setProjectSearch={setProjectSearch}
          projectActiveFilter={projectActiveFilter}
          setProjectActiveFilter={setProjectActiveFilter}
        />
      ) : (
        <>
      <Surface className="flex flex-wrap items-center gap-3 !p-4">
        <div className="relative flex flex-1 min-w-[280px] items-center">
          <Filter className="absolute start-3 h-4 w-4 text-[color:var(--ink-400)]" aria-hidden />
          <input
            value={search}
            onChange={(e) => {
              const v = e.target.value;
              startFilterTransition(() => setSearch(v));
            }}
            className="w-full rounded-xl border border-[color:var(--line-strong)] bg-[color:var(--canvas-raised)] py-2.5 pe-4 ps-10 text-sm font-medium outline-none transition focus:border-[color:var(--axis-clients)] focus:ring-2 focus:ring-[color:var(--axis-clients-soft)]"
            placeholder={t("workspaceClients.searchPlaceholder")}
          />
          {isPending && (
            <div className="absolute end-3">
              <Loader2 className="h-4 w-4 animate-spin text-[color:var(--axis-clients)]" aria-hidden />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => startFilterTransition(() => setStatusFilter(e.target.value))}
            className="rounded-xl border border-[color:var(--line-strong)] bg-[color:var(--canvas-raised)] px-4 py-2.5 text-sm font-bold text-[color:var(--ink-800)] outline-none transition hover:border-[color:var(--ink-400)] focus:border-[color:var(--axis-clients)]"
          >
            <option value="ALL">{t("workspaceClients.statusAll")}</option>
            {statusOrder.map((s) => (
              <option key={s} value={s}>{t(`workspaceClients.status.${s}`)}</option>
            ))}
            <option value="CLOSED_LOST">{t("workspaceClients.status.CLOSED_LOST")}</option>
          </select>

          <select
            value={projectFilter}
            onChange={(e) => startFilterTransition(() => setProjectFilter(e.target.value))}
            className="rounded-xl border border-[color:var(--line-strong)] bg-[color:var(--canvas-raised)] px-4 py-2.5 text-sm font-bold text-[color:var(--ink-800)] outline-none transition hover:border-[color:var(--ink-400)] focus:border-[color:var(--axis-clients)]"
          >
            <option value="ALL">{t("workspaceClients.projectAll")}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="h-8 w-px bg-[color:var(--line)] hidden sm:block" />

        <div className="flex items-center gap-1 rounded-xl bg-[color:var(--canvas-sunken)] p-1">
          <button
            type="button"
            onClick={() => startTransition(() => setView("pipeline"))}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-[12px] font-black transition ${
              view === "pipeline"
                ? "bg-white text-[color:var(--ink-900)] shadow-sm"
                : "text-[color:var(--ink-500)] hover:text-[color:var(--ink-800)]"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" aria-hidden />
            {t("workspaceClients.viewPipeline")}
          </button>
          <button
            type="button"
            onClick={() => startTransition(() => setView("list"))}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-[12px] font-black transition ${
              view === "list"
                ? "bg-white text-[color:var(--ink-900)] shadow-sm"
                : "text-[color:var(--ink-500)] hover:text-[color:var(--ink-800)]"
            }`}
          >
            <ListFilter className="h-3.5 w-3.5" aria-hidden />
            {t("workspaceClients.viewList")}
          </button>
        </div>
      </Surface>

      <BentoGrid>
        {/* AI insight — hero */}
        <Tile tone="ai" span={4} rows={2}>
          <TileHeader eyebrow={t("workspaceClients.aiInsight.eyebrow")} liveDot />
          <p className="mt-3 text-[14px] leading-6 text-white/95 line-clamp-4">{insightText}</p>
          <div className="mt-5 flex items-center justify-center">
            <ProgressRing value={collectedRate} axis="ai" size={150} strokeWidth={12}>
              <span className="text-3xl font-black text-white tabular-nums">{collectedRate}%</span>
              <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-violet-200/80">
                {t("workspaceClients.healthLabel")}
              </span>
            </ProgressRing>
          </div>
          <div className="mt-5 flex justify-center">
            <ClientsHubAiAssist
              orgId={organizationId}
              industryProfile={industryProfile}
              userFirstName={userFirstName}
              insightText={insightText}
              variant="hero"
            />
          </div>
        </Tile>

        {/* Clients Hero */}
        <Tile tone="clients" span={8}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="tile-eyebrow">{t("workspaceClients.pipelineTitle")}</p>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[color:var(--axis-clients-ink)]/80">
                {t("workspaceClients.activeLabel", { label: clientsLabel })}
              </p>
            </div>
          </div>
          <p className="mt-3 tile-hero-value text-[color:var(--axis-clients-ink)]">{filteredContacts.length}</p>
          <div className="mt-5">
            <SegmentBar
              segments={[
                { label: t("workspaceClients.status.LEAD"), value: leadCount, color: "#6CC5CD" },
                { label: t("workspaceClients.status.PROPOSAL"), value: proposalCount, color: "#38A0A8" },
                { label: t("workspaceClients.status.ACTIVE"), value: activeCount, color: "#0E7C86" },
                { label: t("workspaceClients.status.CLOSED_WON"), value: wonCount, color: "#074247" },
              ]}
            />
          </div>
          <div className="mt-4 pt-4 border-t border-white/40">
            <Sparkline values={clientsSpark} axis="clients" height={40} />
          </div>
        </Tile>

        {/* Pipeline Value tile */}
        <Tile tone="neutral" span={4}>
          <TileHeader eyebrow={t("workspaceClients.statPipelineValue")} />
          <p className="tile-hero-value mt-3 text-[color:var(--axis-finance)]">{formatCurrencyILS(totalValue)}</p>
          <p className="mt-1 text-[11px] text-[color:var(--ink-500)]">{t("workspaceClients.statPipelineValueHint")}</p>
          <div className="mt-3">
            <ProgressBar value={Math.min(100, (totalValue / 200000) * 100)} axis="finance" />
          </div>
        </Tile>

        {/* Collection tile */}
        <Tile tone="neutral" span={4}>
          <TileHeader eyebrow={t("workspaceClients.totalBilled")} />
          <p className="tile-hero-value mt-3 text-[color:var(--axis-finance-ink)]">{formatCurrencyILS(totalBilled)}</p>
          {totalPending > 0 ? (
            <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-[color:var(--state-warning-soft)] px-2 py-0.5 text-[11px] font-bold text-[color:var(--state-warning)]">
              {t("workspaceClients.openCollection", { amount: formatCurrencyILS(totalPending) })}
            </p>
          ) : (
            <p className="mt-1 text-[11px] text-[color:var(--ink-500)]">{t("workspaceClients.statOpenCollectionHint")}</p>
          )}
          <div className="mt-3">
            <ProgressBar value={collectedRate} axis="success" />
          </div>
        </Tile>

        {/* Projects tile */}
        <Tile tone="neutral" span={4}>
          <TileHeader
            eyebrow={t("workspaceClients.statActiveProjects")}
            action={<TileLink href="/app/crm?hub=projects" label={t("workspaceClients.projectsAllLink")} />}
          />
          <p className="tile-hero-value mt-3 text-[color:var(--ink-900)]">
            {projects.filter((p) => p.isActive).length}
          </p>
          <p className="mt-1 text-[11px] text-[color:var(--ink-500)]">{t("workspaceClients.statActiveProjectsHint")}</p>
          <div className="mt-3 flex gap-1.5">
            {projects.slice(0, 4).map((p) => (
              <Link
                key={p.id}
                href={`/app/crm/project/${encodeURIComponent(p.id)}`}
                className="flex-1 min-w-0 truncate rounded-full border border-[color:var(--axis-clients-border)] bg-[color:var(--axis-clients-soft)] px-2 py-1 text-center text-[10px] font-bold text-[color:var(--axis-clients-ink)] hover:bg-[color:var(--axis-clients)] hover:text-white"
              >
                {p.name}
              </Link>
            ))}
          </div>
        </Tile>

        {/* Pipeline Kanban / List */}
        <Tile tone="neutral" span={12}>
          <TileHeader
            eyebrow={
              view === "pipeline"
                ? t("workspaceClients.pipelineTitle")
                : t("workspaceClients.listTitle")
            }
          />
          <div className="mt-4">
            {filteredContacts.length === 0 ? (
              <EmptyState
                variant="card"
                icon={Users}
                title="ה-CRM מחכה ללקוח הראשון"
                description="לא נמצאו לקוחות לפי הסינון. הרחיבו חיפוש, אפסו מסנים או הוסיפו לקוח חדש בטופס המהיר למטה."
                className="min-h-[240px] justify-center border border-dashed border-slate-200/60 bg-white/80 py-10"
              />
            ) : view === "pipeline" ? (
              <>
                <div className="space-y-3 md:hidden">
                  <div className="flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {statusOrder.map((status) => {
                      const n = filteredContacts.filter((c) => c.status === status).length;
                      const active = pipeTab === status;
                      return (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setPipeTab(status)}
                          className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-black transition ${
                            active
                              ? "border-[color:var(--axis-clients)] bg-[color:var(--axis-clients-soft)] text-[color:var(--axis-clients-ink)]"
                              : "border-[color:var(--line)] bg-[color:var(--canvas-raised)] text-[color:var(--ink-600)]"
                          }`}
                        >
                          {t(`workspaceClients.status.${status}`)} ({n})
                        </button>
                      );
                    })}
                  </div>
                  <div className="rounded-lg border border-[color:var(--line)] bg-[color:var(--canvas-sunken)] p-2">
                    <div className="space-y-2">
                      {filteredContacts.filter((c) => c.status === pipeTab).length === 0 ? (
                        <div className="rounded-md bg-[color:var(--canvas-raised)]/60 px-2 py-3 text-center text-[11px] text-[color:var(--ink-400)]">
                          {t("workspaceClients.pipeline.emptyColumn")}
                        </div>
                      ) : (
                        filteredContacts
                          .filter((c) => c.status === pipeTab)
                          .map((c) => (
                            <div
                              key={c.id}
                              className="flex items-stretch gap-1 rounded-lg border border-[color:var(--line)] bg-[color:var(--canvas-raised)] transition hover:border-[color:var(--axis-clients)] hover:shadow-[var(--shadow-sm)]"
                            >
                              <Link
                                href={`/app/crm/client/${encodeURIComponent(c.id)}`}
                                className="flex min-w-0 flex-1 items-start gap-2.5 p-2.5"
                              >
                                <span
                                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-black"
                                  style={{ background: "var(--axis-clients-soft)", color: "var(--axis-clients-ink)" }}
                                  aria-hidden
                                >
                                  {initials(c.name)}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-[13px] font-black text-[color:var(--ink-900)]">{c.name}</p>
                                  <p className="mt-0.5 truncate text-[11px] text-[color:var(--ink-500)]">
                                    {c.project?.name ?? t("workspaceClients.pipeline.noProject")}
                                  </p>
                                  {c.totalPending > 0 ? (
                                    <p className="mt-1.5 text-[11px] font-black tabular-nums text-[color:var(--axis-finance)]">
                                      {formatCurrencyILS(c.totalPending)} ·{" "}
                                      <span className="text-[color:var(--state-warning)]">פתוח</span>
                                    </p>
                                  ) : c.value ? (
                                    <p className="mt-1.5 text-[11px] tabular-nums text-[color:var(--ink-500)]">
                                      {formatCurrencyILS(c.value)}
                                    </p>
                                  ) : null}
                                </div>
                              </Link>
                              <button
                                type="button"
                                onClick={() => setEditing(c)}
                                className="shrink-0 rounded-s-none border-s border-[color:var(--line)] px-2.5 text-[color:var(--ink-500)] hover:bg-[color:var(--canvas-sunken)] hover:text-[color:var(--ink-900)]"
                                aria-label={t("workspaceClients.editModal.title")}
                              >
                                <Pencil className="h-4 w-4" aria-hidden />
                              </button>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="hidden gap-3 md:grid md:grid-cols-2 xl:grid-cols-4">
                  {statusOrder.map((status) => {
                    const column = filteredContacts.filter((c) => c.status === status);
                    return (
                      <div key={status} className="rounded-lg border border-[color:var(--line)] bg-[color:var(--canvas-sunken)] p-2">
                        <div className="mb-2 flex items-center justify-between px-1">
                          <p className="text-[11px] font-black uppercase tracking-[0.08em] text-[color:var(--ink-700)]">
                            {t(`workspaceClients.status.${status}`)}
                          </p>
                          <span className="rounded-full bg-[color:var(--canvas-raised)] px-2 py-0.5 text-[10px] font-black text-[color:var(--ink-500)]">
                            {column.length}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {column.length === 0 ? (
                            <div className="rounded-md bg-[color:var(--canvas-raised)]/60 px-2 py-3 text-center text-[11px] text-[color:var(--ink-400)]">
                              {t("workspaceClients.pipeline.emptyColumn")}
                            </div>
                          ) : (
                            column.map((c) => (
                              <div
                                key={c.id}
                                className="flex items-stretch gap-1 rounded-lg border border-[color:var(--line)] bg-[color:var(--canvas-raised)] transition hover:-translate-y-0.5 hover:border-[color:var(--axis-clients)] hover:shadow-[var(--shadow-sm)]"
                              >
                                <Link
                                  href={`/app/crm/client/${encodeURIComponent(c.id)}`}
                                  className="flex min-w-0 flex-1 items-start gap-2.5 p-2.5"
                                >
                                  <span
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-black"
                                    style={{ background: "var(--axis-clients-soft)", color: "var(--axis-clients-ink)" }}
                                    aria-hidden
                                  >
                                    {initials(c.name)}
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-[13px] font-black text-[color:var(--ink-900)]">{c.name}</p>
                                    <p className="mt-0.5 truncate text-[11px] text-[color:var(--ink-500)]">
                                      {c.project?.name ?? t("workspaceClients.pipeline.noProject")}
                                    </p>
                                    {c.totalPending > 0 ? (
                                      <p className="mt-1.5 text-[11px] font-black tabular-nums text-[color:var(--axis-finance)]">
                                        {formatCurrencyILS(c.totalPending)} ·{" "}
                                        <span className="text-[color:var(--state-warning)]">פתוח</span>
                                      </p>
                                    ) : c.value ? (
                                      <p className="mt-1.5 text-[11px] tabular-nums text-[color:var(--ink-500)]">
                                        {formatCurrencyILS(c.value)}
                                      </p>
                                    ) : null}
                                  </div>
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => setEditing(c)}
                                  className="shrink-0 rounded-s-none border-s border-[color:var(--line)] px-2.5 text-[color:var(--ink-500)] hover:bg-[color:var(--canvas-sunken)] hover:text-[color:var(--ink-900)]"
                                  aria-label={t("workspaceClients.editModal.title")}
                                >
                                  <Pencil className="h-4 w-4" aria-hidden />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <div className="hidden w-full min-w-0 overflow-x-auto rounded-xl border border-slate-200/10 md:block">
                  <table className="bento-table w-full min-w-[640px]">
                    <colgroup>
                      <col className="workspace-table-col-1" />
                      <col className="w-[14%]" />
                      <col className="w-[18%]" />
                      <col className="w-[26%]" />
                      <col className="w-[12%]" />
                      <col className="w-[8%]" />
                    </colgroup>
                    <thead>
                      <tr>
                        <th>{t("workspaceClients.listColClient")}</th>
                        <th>{t("workspaceClients.listColStatus")}</th>
                        <th>{t("workspaceClients.listColProject")}</th>
                        <th>{t("workspaceClients.listColContact")}</th>
                        <th className="text-end">{t("workspaceClients.listColAmount")}</th>
                        <th>
                          <span className="sr-only">{t("workspaceClients.editModal.title")}</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredContacts.map((c) => (
                        <tr key={c.id} className="align-middle">
                          <td>
                            <Link
                              href={`/app/crm/client/${encodeURIComponent(c.id)}`}
                              className="flex items-center gap-2 text-sm font-black text-[color:var(--ink-900)]"
                            >
                              <span
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-black"
                                style={{ background: "var(--axis-clients-soft)", color: "var(--axis-clients-ink)" }}
                                aria-hidden
                              >
                                {initials(c.name)}
                              </span>
                              <span className="min-w-0 truncate">{c.name}</span>
                            </Link>
                          </td>
                          <td>
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${getStatusBadgeClass(c.status)}`}>
                              {t(`workspaceClients.status.${c.status}`)}
                            </span>
                          </td>
                          <td className="truncate text-sm text-[color:var(--ink-600)]" title={c.project?.name ?? ""}>
                            {c.project?.name ?? "—"}
                          </td>
                          <td className="text-xs text-[color:var(--ink-500)]">
                            <div className="flex min-w-0 flex-col gap-0.5">
                              {c.email ? (
                                <span className="inline-flex items-center gap-1 truncate">
                                  <Mail className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
                                  <span className="truncate">{c.email}</span>
                                </span>
                              ) : null}
                              {c.phone ? (
                                <span className="inline-flex items-center gap-1">
                                  <Phone className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
                                  {c.phone}
                                </span>
                              ) : null}
                              <span className="tabular-nums text-[color:var(--ink-400)]">{formatShortDate(c.createdAt)}</span>
                            </div>
                          </td>
                          <td className="text-end text-sm font-black tabular-nums">
                            {c.totalPending > 0 ? (
                              <span className="text-[color:var(--axis-finance)]">{formatCurrencyILS(c.totalPending)}</span>
                            ) : c.value ? (
                              <span className="font-semibold text-[color:var(--ink-500)]">{formatCurrencyILS(c.value)}</span>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="text-center">
                            <button
                              type="button"
                              onClick={() => setEditing(c)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[color:var(--line)] text-[color:var(--ink-500)] transition hover:bg-[color:var(--canvas-sunken)] hover:text-[color:var(--ink-900)]"
                              aria-label={t("workspaceClients.editModal.title")}
                            >
                              <Pencil className="h-4 w-4" strokeWidth={2} aria-hidden />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="space-y-2 md:hidden">
                  {filteredContacts.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center gap-2 rounded-xl border border-slate-200/10 bg-[color:var(--canvas-raised)] shadow-sm transition hover:border-[color:var(--axis-clients)] hover:bg-[color:var(--canvas-sunken)]"
                    >
                      <Link
                        href={`/app/crm/client/${encodeURIComponent(c.id)}`}
                        className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5"
                      >
                        <span
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-black"
                          style={{ background: "var(--axis-clients-soft)", color: "var(--axis-clients-ink)" }}
                          aria-hidden
                        >
                          {initials(c.name)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-black text-[color:var(--ink-900)]">{c.name}</p>
                            <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${getStatusBadgeClass(c.status)}`}>
                              {t(`workspaceClients.status.${c.status}`)}
                            </span>
                          </div>
                          <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-[color:var(--ink-500)]">
                            {c.email ? (
                              <span className="inline-flex items-center gap-1">
                                <Mail className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
                                {c.email}
                              </span>
                            ) : null}
                            {c.phone ? (
                              <span className="inline-flex items-center gap-1">
                                <Phone className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
                                {c.phone}
                              </span>
                            ) : null}
                            {c.project ? (
                              <span className="inline-flex items-center gap-1">
                                <BriefcaseBusiness className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
                                {c.project.name}
                              </span>
                            ) : null}
                            <span className="tabular-nums">{formatShortDate(c.createdAt)}</span>
                          </div>
                        </div>
                        {c.totalPending > 0 ? (
                          <span className="shrink-0 text-sm font-black tabular-nums text-[color:var(--axis-finance)]">
                            {formatCurrencyILS(c.totalPending)}
                          </span>
                        ) : c.value ? (
                          <span className="shrink-0 text-sm tabular-nums text-[color:var(--ink-500)]">
                            {formatCurrencyILS(c.value)}
                          </span>
                        ) : null}
                        <ArrowUpRight className="h-4 w-4 shrink-0 text-[color:var(--ink-400)]" strokeWidth={2} aria-hidden />
                      </Link>
                      <button
                        type="button"
                        onClick={() => setEditing(c)}
                        className="shrink-0 border-s border-slate-200/10 px-3 py-2 text-[color:var(--ink-500)] hover:bg-[color:var(--canvas-sunken)]"
                        aria-label={t("workspaceClients.editModal.title")}
                      >
                        <Pencil className="h-4 w-4" strokeWidth={2} aria-hidden />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </Tile>

        {/* Top revenue */}
        <Tile tone="finance" span={6}>
          <TileHeader
            eyebrow={t("workspaceClients.topRevenueTitle")}
            action={<TileLink href="/app/erp" tone="finance" label={t("workspaceClients.financeCta")} />}
          />
          {topRevenueClients.length === 0 ? (
            <EmptyState
              variant="bare"
              icon={Wallet}
              title="עדיין אין הכנסות מדורגות"
              description="ברגע שתפיקו מסמכים ותזינו תשלומים, נראה כאן את הלקוחות המובילים בהכנסות."
              className="mt-4 rounded-xl border border-dashed border-slate-200/70 bg-white/50 py-8"
            />
          ) : (
            <ul className="mt-3 divide-y divide-white/40">
              {topRevenueClients.map((c) => {
                const pct = totalBilled > 0 ? Math.min(100, (c.totalBilled / topRevenueClients[0].totalBilled) * 100) : 0;
                return (
                  <li key={c.id}>
                    <Link
                      href={`/app/crm/client/${encodeURIComponent(c.id)}`}
                      className="block py-2.5 transition hover:bg-white/40 rounded-md px-1"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-[13px] font-black text-[color:var(--ink-900)]">{c.name}</p>
                        <span className="shrink-0 text-[13px] font-black tabular-nums text-[color:var(--axis-finance)]">
                          {formatCurrencyILS(c.totalBilled)}
                        </span>
                      </div>
                      <div className="mt-1.5">
                        <ProgressBar value={pct} axis="finance" height={5} />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Tile>

        {/* AI flagged / missing details */}
        <Tile tone="neutral" span={6}>
          <TileHeader eyebrow={t("workspaceClients.aiFlagEyebrow")} />
          {missingContactDetails.length === 0 ? (
            <div className="mt-4 rounded-lg border border-dashed border-[color:var(--line-strong)] px-4 py-6 text-center text-sm text-[color:var(--ink-500)]">
              {t("workspaceClients.missingAllOk")}
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-[color:var(--line-subtle)]">
              {missingContactDetails.map((c) => (
                <li key={c.id} className="py-2.5">
                  <Link
                    href={`/app/crm/client/${encodeURIComponent(c.id)}`}
                    className="flex items-center gap-2 text-[13px] transition hover:text-[color:var(--axis-ai)]"
                  >
                    <Sparkles className="h-3.5 w-3.5 shrink-0 text-[color:var(--axis-ai)]" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-[color:var(--ink-900)]">{c.name}</p>
                      <p className="text-[11px] text-[color:var(--ink-500)]">
                        {!c.email && !c.phone
                          ? t("workspaceClients.missingEmailAndPhone")
                          : !c.email
                            ? t("workspaceClients.missingEmailOnly")
                            : t("workspaceClients.missingPhoneOnly")}
                      </p>
                    </div>
                    <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-[color:var(--ink-400)]" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/app" className="inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--line-strong)] bg-white px-3 py-2 text-[12px] font-bold text-[color:var(--ink-700)] hover:bg-[color:var(--ink-900)] hover:text-white">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              {t("workspaceClients.inboxCta")}
            </Link>
            <Link href="/app/erp" className="inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--axis-finance-border)] bg-[color:var(--axis-finance-soft)] px-3 py-2 text-[12px] font-bold text-[color:var(--axis-finance-ink)] hover:bg-[color:var(--axis-finance)] hover:text-white">
              <ReceiptText className="h-3.5 w-3.5" aria-hidden />
              {t("workspaceClients.issueCta")}
            </Link>
            <ClientsHubAiAssist
              orgId={organizationId}
              industryProfile={industryProfile}
              userFirstName={userFirstName}
              insightText={insightText}
              variant="compact"
            />
          </div>
        </Tile>

        <Tile tone="neutral" span={12}>
          <TileHeader eyebrow="CRM" title="הוספת לקוח מהירה" />
          <div id="quick-client-form" className="scroll-mt-24" />
          <div className="mt-4 max-w-3xl">
            <QuickClientForm projects={projects.map((p) => ({ id: p.id, name: p.name }))} />
          </div>
        </Tile>
      </BentoGrid>
        </>
      )}

      {editing ? (
        <ClientsWorkspaceEditContactModal contact={editing} projects={projects} onClose={() => setEditing(null)} />
      ) : null}
    </div>
  );
}
