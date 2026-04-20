"use client";

import { startTransition, useDeferredValue, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  BriefcaseBusiness,
  CheckCircle2,
  CircleDollarSign,
  Filter,
  LayoutGrid,
  ListFilter,
  Loader2,
  Mail,
  Phone,
  Plus,
  ReceiptText,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
import type { IndustryProfile } from "@/lib/professions/runtime";
import { formatCurrencyILS, formatShortDate } from "@/lib/ui-formatters";
import {
  AxisCard,
  AxisSeeAllLink,
  SplitDualityAxes,
  SplitDualityBridge,
  SplitDualityHeadline,
  SplitDualityShell,
} from "@/components/workspace/SplitDuality";

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
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}

function ClientCard({ contact }: { contact: ClientRecord }) {
  const { t } = useI18n();
  const badgeClass = getStatusBadgeClass(contact.status);
  const statusLabel = t(`workspaceClients.status.${contact.status}`);

  return (
    <Link
      href={`/app/advanced?clientId=${encodeURIComponent(contact.id)}`}
      className="group flex items-start gap-3 rounded-lg border border-[color:var(--line)] bg-white/80 p-3.5 transition hover:-translate-y-0.5 hover:border-[color:var(--axis-clients)] hover:shadow-[var(--shadow-sm)]"
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[12px] font-black"
        style={{
          background: "var(--axis-clients-soft)",
          color: "var(--axis-clients-ink)",
        }}
        aria-hidden
      >
        {initials(contact.name)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-black text-[color:var(--ink-900)]">{contact.name}</p>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${badgeClass}`}>
            {statusLabel}
          </span>
        </div>
        <p className="mt-0.5 truncate text-[12px] text-[color:var(--ink-500)]">
          {contact.project?.name ?? t("workspaceClients.card.noProject")}
        </p>
        <div className="mt-2 flex items-center justify-between text-[11px]">
          <span className="text-[color:var(--ink-500)]">
            {formatShortDate(contact.createdAt)}
          </span>
          {contact.totalPending > 0 ? (
            <span className="inline-flex items-center gap-1 font-black tabular-nums text-[color:var(--axis-finance)]">
              <CircleDollarSign className="h-3 w-3" aria-hidden />
              {formatCurrencyILS(contact.totalPending)}
            </span>
          ) : contact.value ? (
            <span className="tabular-nums text-[color:var(--ink-500)]">
              {formatCurrencyILS(contact.value)}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
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

  const totalValue = filteredContacts.reduce((sum, contact) => sum + (contact.value ?? 0), 0);
  const totalPending = filteredContacts.reduce((sum, contact) => sum + contact.totalPending, 0);
  const totalBilled = filteredContacts.reduce((sum, contact) => sum + contact.totalBilled, 0);
  const pendingBillingContacts = filteredContacts
    .filter((contact) => contact.totalPending > 0)
    .sort((left, right) => right.totalPending - left.totalPending);
  const topRevenueClients = [...contacts]
    .filter((contact) => contact.totalBilled > 0)
    .sort((left, right) => right.totalBilled - left.totalBilled)
    .slice(0, 5);
  const missingContactDetails = filteredContacts.filter((contact) => !contact.email || !contact.phone).slice(0, 3);

  const clientsLabel = industryProfile.clientsLabel;

  // AI insight
  const insightParts: string[] = [];
  if (pendingBillingContacts.length > 0) {
    insightParts.push(
      t("workspaceClients.aiInsight.pending", {
        count: String(pendingBillingContacts.length),
      }),
    );
  }
  if (missingContactDetails.length > 0) {
    insightParts.push(
      t("workspaceClients.aiInsight.missing", {
        count: String(missingContactDetails.length),
      }),
    );
  }
  if (filteredContacts.length > 0) {
    insightParts.push(
      t("workspaceClients.aiInsight.active", {
        count: String(filteredContacts.length),
      }),
    );
  }
  if (insightParts.length === 0) {
    insightParts.push(t("workspaceClients.aiInsight.empty"));
  }

  return (
    <SplitDualityShell mode="clients">
      <div className="relative z-10 mx-auto max-w-[1400px]" dir={dir}>
        <div className="space-y-8">
          <SplitDualityHeadline
            eyebrow={t("workspaceClients.eyebrow")}
            title={t("workspaceClients.heroTitle", { clients: clientsLabel })}
            subtitle={t("workspaceClients.heroSubtitle", { clients: clientsLabel })}
          />

          <SplitDualityBridge
            eyebrow={t("workspaceClients.aiInsight.eyebrow")}
            insight={insightParts.join(" · ")}
            ctaLabel={t("workspaceHome.aiNarrative.open")}
            ctaHref="/app/ai"
          />

          {/* Filters bar */}
          <div className="relative z-10 flex flex-wrap items-center justify-center gap-2.5 rounded-lg border border-white/80 bg-white/65 p-3 backdrop-blur-sm">
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-[color:var(--line-strong)] bg-[color:var(--canvas-raised)] px-3 py-2 focus-within:border-[color:var(--axis-clients)]">
              <Filter className="h-4 w-4 text-[color:var(--ink-400)]" aria-hidden />
              <input
                value={search}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  startFilterTransition(() => setSearch(nextValue));
                }}
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[color:var(--ink-400)]"
                placeholder={t("workspaceClients.searchPlaceholder")}
              />
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin text-[color:var(--axis-clients)]" aria-hidden />
              ) : null}
            </div>
            <select
              value={statusFilter}
              onChange={(event) => startFilterTransition(() => setStatusFilter(event.target.value))}
              className="rounded-lg border border-[color:var(--line-strong)] bg-[color:var(--canvas-raised)] px-3 py-2 text-sm font-semibold text-[color:var(--ink-900)] outline-none focus:border-[color:var(--axis-clients)]"
            >
              <option value="ALL">{t("workspaceClients.statusAll")}</option>
              {statusOrder.map((status) => (
                <option key={status} value={status}>
                  {t(`workspaceClients.status.${status}`)}
                </option>
              ))}
              <option value="CLOSED_LOST">{t("workspaceClients.status.CLOSED_LOST")}</option>
            </select>
            <select
              value={projectFilter}
              onChange={(event) => startFilterTransition(() => setProjectFilter(event.target.value))}
              className="rounded-lg border border-[color:var(--line-strong)] bg-[color:var(--canvas-raised)] px-3 py-2 text-sm font-semibold text-[color:var(--ink-900)] outline-none focus:border-[color:var(--axis-clients)]"
            >
              <option value="ALL">{t("workspaceClients.projectAll")}</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
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
              className="v2-button v2-button-primary axis-clients"
            >
              <Plus className="h-4 w-4" aria-hidden />
              {t("workspaceClients.addCta")}
            </Link>
          </div>

          {/* Dual axes: clients (dominant right) + finance impact (left) */}
          <SplitDualityAxes
            mode="clients"
            leadingAxis={
              <AxisCard
                axis="clients"
                eyebrow={clientsLabel}
                title={t("workspaceClients.pipelineTitle")}
                action={
                  <AxisSeeAllLink
                    axis="clients"
                    href="/app/advanced"
                    label={t("workspaceClients.advancedCta")}
                  />
                }
              >
                {/* Clients KPI mini */}
                <div className="mb-4 grid grid-cols-3 gap-2 border-b border-[color:var(--line-subtle)] pb-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[color:var(--ink-500)]">
                      {t("workspaceClients.statActiveClients")}
                    </p>
                    <p className="mt-1 text-2xl font-black tabular-nums text-[color:var(--axis-clients)]">
                      {filteredContacts.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[color:var(--ink-500)]">
                      {t("workspaceClients.statPipelineValue")}
                    </p>
                    <p className="mt-1 text-lg font-black tabular-nums text-[color:var(--ink-900)]">
                      {formatCurrencyILS(totalValue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[color:var(--ink-500)]">
                      {t("workspaceClients.statActiveProjects")}
                    </p>
                    <p className="mt-1 text-2xl font-black tabular-nums text-[color:var(--ink-900)]">
                      {projects.filter((project) => project.isActive).length}
                    </p>
                  </div>
                </div>

                {view === "pipeline" ? (
                  filteredContacts.length === 0 ? (
                    <div className="py-10 text-center">
                      <UsersRound className="mx-auto h-8 w-8 text-[color:var(--ink-300)]" aria-hidden />
                      <p className="mt-3 text-sm font-semibold text-[color:var(--ink-500)]">
                        {t("workspaceClients.emptyFilterTitle")}
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      {statusOrder.map((status) => {
                        const column = filteredContacts.filter((contact) => contact.status === status);
                        return (
                          <div key={status} className="rounded-lg bg-[color:var(--canvas-sunken)] p-2">
                            <div className="mb-2 flex items-center justify-between px-1">
                              <p className="text-[11px] font-black uppercase tracking-[0.08em] text-[color:var(--ink-700)]">
                                {t(`workspaceClients.status.${status}`)}
                              </p>
                              <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-[color:var(--ink-500)]">
                                {column.length}
                              </span>
                            </div>
                            <div className="space-y-2">
                              {column.length === 0 ? (
                                <div className="rounded-md bg-white/60 px-2 py-3 text-center text-[11px] text-[color:var(--ink-400)]">
                                  {t("workspaceClients.pipeline.emptyColumn")}
                                </div>
                              ) : (
                                column.map((contact) => (
                                  <ClientCard key={contact.id} contact={contact} />
                                ))
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                ) : (
                  <div className="space-y-2">
                    {filteredContacts.length === 0 ? (
                      <div className="py-10 text-center text-sm text-[color:var(--ink-500)]">
                        {t("workspaceClients.emptyFilterTitle")}
                      </div>
                    ) : (
                      filteredContacts.map((contact) => (
                        <Link
                          key={contact.id}
                          href={`/app/advanced?clientId=${encodeURIComponent(contact.id)}`}
                          className="flex items-center gap-3 rounded-lg border border-[color:var(--line)] bg-white/70 px-3 py-2.5 transition hover:border-[color:var(--axis-clients)] hover:bg-white"
                        >
                          <span
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-black"
                            style={{ background: "var(--axis-clients-soft)", color: "var(--axis-clients-ink)" }}
                            aria-hidden
                          >
                            {initials(contact.name)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate font-black text-[color:var(--ink-900)]">{contact.name}</p>
                              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${getStatusBadgeClass(contact.status)}`}>
                                {t(`workspaceClients.status.${contact.status}`)}
                              </span>
                            </div>
                            <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[12px] text-[color:var(--ink-500)]">
                              {contact.email ? (
                                <span className="inline-flex items-center gap-1">
                                  <Mail className="h-3 w-3" aria-hidden />
                                  {contact.email}
                                </span>
                              ) : null}
                              {contact.phone ? (
                                <span className="inline-flex items-center gap-1">
                                  <Phone className="h-3 w-3" aria-hidden />
                                  {contact.phone}
                                </span>
                              ) : null}
                              {contact.project ? (
                                <span className="inline-flex items-center gap-1">
                                  <BriefcaseBusiness className="h-3 w-3" aria-hidden />
                                  {contact.project.name}
                                </span>
                              ) : null}
                            </div>
                          </div>
                          {contact.totalPending > 0 ? (
                            <span className="shrink-0 text-sm font-black tabular-nums text-[color:var(--axis-finance)]">
                              {formatCurrencyILS(contact.totalPending)}
                            </span>
                          ) : contact.value ? (
                            <span className="shrink-0 text-sm tabular-nums text-[color:var(--ink-500)]">
                              {formatCurrencyILS(contact.value)}
                            </span>
                          ) : null}
                          <ArrowLeft className="h-4 w-4 shrink-0 text-[color:var(--ink-400)]" aria-hidden />
                        </Link>
                      ))
                    )}
                  </div>
                )}
              </AxisCard>
            }
            trailingAxis={
              <div className="space-y-6">
                {/* Finance impact */}
                <AxisCard
                  axis="finance"
                  eyebrow={t("workspaceClients.financeImpactEyebrow")}
                  title={t("workspaceClients.financeImpactTitle")}
                  action={
                    <AxisSeeAllLink
                      axis="finance"
                      href="/app/finance"
                      label={t("workspaceClients.financeCta")}
                    />
                  }
                >
                  <div className="mb-4 border-b border-[color:var(--line-subtle)] pb-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[color:var(--ink-500)]">
                      {t("workspaceClients.totalBilled")}
                    </p>
                    <p className="sd-hero-value sd-hero-value--finance mt-1">
                      {formatCurrencyILS(totalBilled)}
                    </p>
                    {totalPending > 0 ? (
                      <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-[color:var(--state-warning-soft)] px-2 py-0.5 text-[11px] font-bold text-[color:var(--state-warning)]">
                        <CircleDollarSign className="h-3 w-3" aria-hidden />
                        {t("workspaceClients.openCollection", { amount: formatCurrencyILS(totalPending) })}
                      </p>
                    ) : null}
                  </div>

                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[color:var(--ink-500)]">
                    {t("workspaceClients.topRevenueTitle")}
                  </p>
                  {topRevenueClients.length === 0 ? (
                    <p className="rounded-lg bg-[color:var(--canvas-sunken)] p-3 text-center text-sm text-[color:var(--ink-500)]">
                      {t("workspaceClients.topRevenueEmpty")}
                    </p>
                  ) : (
                    <ul className="divide-y divide-[color:var(--line-subtle)]">
                      {topRevenueClients.map((contact) => (
                        <li key={contact.id}>
                          <Link
                            href={`/app/advanced?clientId=${encodeURIComponent(contact.id)}`}
                            className="flex items-center justify-between gap-2 py-2 transition hover:bg-[color:var(--axis-finance-soft)]"
                          >
                            <span className="truncate text-[13px] font-bold text-[color:var(--ink-900)]">
                              {contact.name}
                            </span>
                            <span className="shrink-0 text-[13px] font-black tabular-nums text-[color:var(--axis-finance)]">
                              {formatCurrencyILS(contact.totalBilled)}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </AxisCard>

                {/* Risk / missing details */}
                {missingContactDetails.length > 0 ? (
                  <AxisCard
                    axis="ai"
                    eyebrow={t("workspaceClients.aiFlagEyebrow")}
                    title={t("workspaceClients.missingTitle")}
                  >
                    <ul className="divide-y divide-[color:var(--line-subtle)]">
                      {missingContactDetails.map((contact) => (
                        <li key={contact.id} className="py-2">
                          <Link
                            href={`/app/advanced?clientId=${encodeURIComponent(contact.id)}`}
                            className="flex items-start gap-2 text-[13px] transition hover:text-[color:var(--axis-ai)]"
                          >
                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--state-warning)]" aria-hidden />
                            <div className="min-w-0">
                              <p className="font-black text-[color:var(--ink-900)]">{contact.name}</p>
                              <p className="text-[12px] text-[color:var(--ink-500)]">
                                {!contact.email && !contact.phone
                                  ? t("workspaceClients.missingEmailAndPhone")
                                  : !contact.email
                                    ? t("workspaceClients.missingEmailOnly")
                                    : t("workspaceClients.missingPhoneOnly")}
                              </p>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </AxisCard>
                ) : null}

                {/* Related projects */}
                <AxisCard
                  axis="clients"
                  eyebrow={t("workspaceClients.projectsTitle")}
                  title={t("workspaceClients.projectsSubtitle")}
                  action={
                    <AxisSeeAllLink
                      axis="clients"
                      href="/app/projects"
                      label={t("workspaceClients.projectsAllLink")}
                    />
                  }
                >
                  {projects.length === 0 ? (
                    <p className="text-center text-sm text-[color:var(--ink-500)]">
                      {t("workspaceFinance.projectsEmpty")}
                    </p>
                  ) : (
                    <ul className="divide-y divide-[color:var(--line-subtle)]">
                      {projects.slice(0, 4).map((project) => (
                        <li key={project.id}>
                          <Link
                            href={`/app/clients?projectId=${encodeURIComponent(project.id)}`}
                            className="block py-2 transition hover:bg-[color:var(--axis-clients-soft)]"
                          >
                            <div className="flex items-center justify-between">
                              <p className="font-black text-[color:var(--ink-900)]">{project.name}</p>
                              <span className="text-[11px] font-bold text-[color:var(--ink-500)]">
                                {t("workspaceClients.projectClientsCount", { count: String(project.contactCount) })}
                              </span>
                            </div>
                            <p className="mt-0.5 text-[12px] text-[color:var(--ink-500)]">
                              {t("workspaceClients.projectDealsLine", {
                                deals: String(project.activeDeals),
                                total: formatCurrencyILS(project.totalValue),
                              })}
                            </p>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </AxisCard>

                <div className="flex flex-wrap gap-2">
                  <Link href="/app/inbox" className="v2-button v2-button-secondary text-xs">
                    <Sparkles className="h-4 w-4" aria-hidden />
                    {t("workspaceClients.inboxCta")}
                  </Link>
                  <Link href="/app/advanced" className="v2-button v2-button-secondary text-xs">
                    <CheckCircle2 className="h-4 w-4" aria-hidden />
                    {t("workspaceClients.advancedCta")}
                  </Link>
                  <Link href="/app/documents/issue" className="v2-button v2-button-secondary text-xs">
                    <ReceiptText className="h-4 w-4" aria-hidden />
                    {t("workspaceClients.issueCta")}
                  </Link>
                </div>
              </div>
            }
          />
        </div>
      </div>
    </SplitDualityShell>
  );
}
