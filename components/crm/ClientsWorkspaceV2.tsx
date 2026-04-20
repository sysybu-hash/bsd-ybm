"use client";

import { startTransition, useDeferredValue, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BrainCircuit,
  BriefcaseBusiness,
  Filter,
  LayoutGrid,
  ListFilter,
  Loader2,
  Mail,
  Phone,
  Plus,
  ReceiptText,
  Sparkles,
} from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
import type { IndustryProfile } from "@/lib/professions/runtime";
import { formatCurrencyILS, formatShortDate } from "@/lib/ui-formatters";
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

type ClientRecord = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  status: string;
  value: number | null;
  createdAt: string;
  project: { id: string; name: string } | null;
  invoiceCount: number;
  totalBilled: number;
  totalPending: number;
};

type ProjectRecord = {
  id: string;
  name: string;
  isActive: boolean;
  activeFrom: string | null;
  activeTo: string | null;
  contactCount: number;
  totalValue: number;
  activeDeals: number;
};

type Props = Readonly<{
  contacts: ClientRecord[];
  projects: ProjectRecord[];
  industryProfile: IndustryProfile;
  initialProjectFilter?: string;
}>;

const STATUS_BADGE_CLASS = {
  LEAD: "bg-[color:var(--state-info-soft)] text-[color:var(--state-info)]",
  ACTIVE: "bg-[color:var(--axis-clients-soft)] text-[color:var(--axis-clients-ink)]",
  PROPOSAL: "bg-[color:var(--state-warning-soft)] text-[color:var(--state-warning)]",
  CLOSED_WON: "bg-[color:var(--state-success-soft)] text-[color:var(--state-success)]",
  CLOSED_LOST: "bg-[color:var(--state-danger-soft)] text-[color:var(--state-danger)]",
} as const;

const statusOrder = ["LEAD", "PROPOSAL", "ACTIVE", "CLOSED_WON"] as const;

function getStatusBadgeClass(status: string) {
  return STATUS_BADGE_CLASS[status as keyof typeof STATUS_BADGE_CLASS] ?? "bg-slate-100 text-slate-700";
}

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((p) => p[0] ?? "").join("").toUpperCase();
}

export default function ClientsWorkspaceV2({ contacts, projects, industryProfile, initialProjectFilter }: Props) {
  const { t, dir } = useI18n();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [projectFilter, setProjectFilter] = useState(() =>
    initialProjectFilter && projects.some((p) => p.id === initialProjectFilter) ? initialProjectFilter : "ALL",
  );
  const [view, setView] = useState<"pipeline" | "list">("pipeline");
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
    <div className="mx-auto max-w-[1440px] space-y-6" dir={dir}>
      {/* Header */}
      <header className="flex flex-col gap-1 px-1">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[color:var(--ink-400)]">
          {t("workspaceClients.eyebrow")}
        </p>
        <h1 className="text-[32px] font-black tracking-tight text-[color:var(--ink-900)] sm:text-[38px]">
          {t("workspaceClients.heroTitle", { clients: clientsLabel })}
        </h1>
        <p className="mt-1 max-w-2xl text-[14px] text-[color:var(--ink-500)]">
          {t("workspaceClients.heroSubtitle", { clients: clientsLabel })}
        </p>
      </header>

      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-2.5 rounded-lg border border-[color:var(--line)] bg-[color:var(--canvas-raised)] p-3 shadow-[var(--shadow-xs)]">
        <div className="flex flex-1 min-w-[220px] items-center gap-2 rounded-lg border border-[color:var(--line-strong)] bg-[color:var(--canvas-raised)] px-3 py-2 focus-within:border-[color:var(--axis-clients)]">
          <Filter className="h-4 w-4 text-[color:var(--ink-400)]" aria-hidden />
          <input
            value={search}
            onChange={(e) => {
              const v = e.target.value;
              startFilterTransition(() => setSearch(v));
            }}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[color:var(--ink-400)]"
            placeholder={t("workspaceClients.searchPlaceholder")}
          />
          {isPending ? <Loader2 className="h-4 w-4 animate-spin text-[color:var(--axis-clients)]" aria-hidden /> : null}
        </div>
        <select
          value={statusFilter}
          onChange={(e) => startFilterTransition(() => setStatusFilter(e.target.value))}
          className="rounded-lg border border-[color:var(--line-strong)] bg-[color:var(--canvas-raised)] px-3 py-2 text-sm font-semibold text-[color:var(--ink-900)] outline-none focus:border-[color:var(--axis-clients)]"
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
          className="rounded-lg border border-[color:var(--line-strong)] bg-[color:var(--canvas-raised)] px-3 py-2 text-sm font-semibold text-[color:var(--ink-900)] outline-none focus:border-[color:var(--axis-clients)]"
        >
          <option value="ALL">{t("workspaceClients.projectAll")}</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <div className="flex items-center gap-1 rounded-lg border border-[color:var(--line)] bg-[color:var(--canvas-sunken)] p-0.5">
          <button
            type="button"
            onClick={() => startTransition(() => setView("pipeline"))}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[12px] font-bold transition ${
              view === "pipeline"
                ? "bg-[color:var(--canvas-raised)] text-[color:var(--ink-900)] shadow-[var(--shadow-xs)]"
                : "text-[color:var(--ink-500)]"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" aria-hidden />
            {t("workspaceClients.viewPipeline")}
          </button>
          <button
            type="button"
            onClick={() => startTransition(() => setView("list"))}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[12px] font-bold transition ${
              view === "list"
                ? "bg-[color:var(--canvas-raised)] text-[color:var(--ink-900)] shadow-[var(--shadow-xs)]"
                : "text-[color:var(--ink-500)]"
            }`}
          >
            <ListFilter className="h-3.5 w-3.5" aria-hidden />
            {t("workspaceClients.viewList")}
          </button>
        </div>
        <Link
          href="/app/advanced"
          className="inline-flex items-center gap-1.5 rounded-lg bg-[color:var(--axis-clients)] px-3 py-2 text-[12px] font-bold text-white hover:bg-[color:var(--axis-clients-strong)]"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          {t("workspaceClients.addCta")}
        </Link>
      </div>

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
            <Link href="/app/ai" className="tile-cta">
              {t("workspaceHome.aiNarrative.open")}
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
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
            action={<TileLink href="/app/projects" label={t("workspaceClients.projectsAllLink")} />}
          />
          <p className="tile-hero-value mt-3 text-[color:var(--ink-900)]">
            {projects.filter((p) => p.isActive).length}
          </p>
          <p className="mt-1 text-[11px] text-[color:var(--ink-500)]">{t("workspaceClients.statActiveProjectsHint")}</p>
          <div className="mt-3 flex gap-1.5">
            {projects.slice(0, 4).map((p) => (
              <Link
                key={p.id}
                href={`/app/clients?projectId=${encodeURIComponent(p.id)}`}
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
              <div className="rounded-lg border border-dashed border-[color:var(--line-strong)] px-4 py-10 text-center text-sm text-[color:var(--ink-500)]">
                {t("workspaceClients.emptyFilterTitle")}
              </div>
            ) : view === "pipeline" ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
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
                            <Link
                              key={c.id}
                              href={`/app/advanced?clientId=${encodeURIComponent(c.id)}`}
                              className="flex items-start gap-2.5 rounded-lg border border-[color:var(--line)] bg-[color:var(--canvas-raised)] p-2.5 transition hover:-translate-y-0.5 hover:border-[color:var(--axis-clients)] hover:shadow-[var(--shadow-sm)]"
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
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredContacts.map((c) => (
                  <Link
                    key={c.id}
                    href={`/app/advanced?clientId=${encodeURIComponent(c.id)}`}
                    className="flex items-center gap-3 rounded-lg border border-[color:var(--line)] bg-[color:var(--canvas-raised)] px-3 py-2.5 transition hover:border-[color:var(--axis-clients)] hover:bg-[color:var(--canvas-sunken)]"
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-black"
                      style={{ background: "var(--axis-clients-soft)", color: "var(--axis-clients-ink)" }}
                      aria-hidden
                    >
                      {initials(c.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-black text-[color:var(--ink-900)]">{c.name}</p>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${getStatusBadgeClass(c.status)}`}>
                          {t(`workspaceClients.status.${c.status}`)}
                        </span>
                      </div>
                      <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[12px] text-[color:var(--ink-500)]">
                        {c.email ? (
                          <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" aria-hidden />{c.email}</span>
                        ) : null}
                        {c.phone ? (
                          <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" aria-hidden />{c.phone}</span>
                        ) : null}
                        {c.project ? (
                          <span className="inline-flex items-center gap-1"><BriefcaseBusiness className="h-3 w-3" aria-hidden />{c.project.name}</span>
                        ) : null}
                        <span className="text-[11px]">{formatShortDate(c.createdAt)}</span>
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
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-[color:var(--ink-400)]" aria-hidden />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </Tile>

        {/* Top revenue */}
        <Tile tone="finance" span={6}>
          <TileHeader
            eyebrow={t("workspaceClients.topRevenueTitle")}
            action={<TileLink href="/app/finance" tone="finance" label={t("workspaceClients.financeCta")} />}
          />
          {topRevenueClients.length === 0 ? (
            <div className="mt-4 rounded-lg border border-dashed border-[color:var(--line-strong)] px-4 py-6 text-center text-sm text-[color:var(--ink-500)]">
              {t("workspaceClients.topRevenueEmpty")}
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-white/40">
              {topRevenueClients.map((c) => {
                const pct = totalBilled > 0 ? Math.min(100, (c.totalBilled / topRevenueClients[0].totalBilled) * 100) : 0;
                return (
                  <li key={c.id}>
                    <Link
                      href={`/app/advanced?clientId=${encodeURIComponent(c.id)}`}
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
                    href={`/app/advanced?clientId=${encodeURIComponent(c.id)}`}
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
            <Link href="/app/inbox" className="inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--line-strong)] bg-white px-3 py-2 text-[12px] font-bold text-[color:var(--ink-700)] hover:bg-[color:var(--ink-900)] hover:text-white">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              {t("workspaceClients.inboxCta")}
            </Link>
            <Link href="/app/documents/issue" className="inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--axis-finance-border)] bg-[color:var(--axis-finance-soft)] px-3 py-2 text-[12px] font-bold text-[color:var(--axis-finance-ink)] hover:bg-[color:var(--axis-finance)] hover:text-white">
              <ReceiptText className="h-3.5 w-3.5" aria-hidden />
              {t("workspaceClients.issueCta")}
            </Link>
            <Link href="/app/ai" className="inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--axis-ai-border)] bg-[color:var(--axis-ai-soft)] px-3 py-2 text-[12px] font-bold text-[color:var(--axis-ai-ink)] hover:bg-[color:var(--axis-ai)] hover:text-white">
              <BrainCircuit className="h-3.5 w-3.5" aria-hidden />
              {t("workspaceHome.aiNarrative.open")}
            </Link>
          </div>
        </Tile>
      </BentoGrid>
    </div>
  );
}
