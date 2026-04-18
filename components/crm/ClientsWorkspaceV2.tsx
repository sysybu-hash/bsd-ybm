"use client";

import { startTransition, useDeferredValue, useState, useTransition } from "react";
import Link from "next/link";
import {
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
  ReceiptText,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
import { getAdvancedWorkspaceHref } from "@/components/app-shell/app-nav";
import type { IndustryProfile } from "@/lib/professions/runtime";
import { formatCurrencyILS, formatShortDate } from "@/lib/ui-formatters";

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
}>;

const STATUS_BADGE_CLASS = {
  LEAD: "bg-sky-100 text-sky-700",
  ACTIVE: "bg-blue-100 text-blue-700",
  PROPOSAL: "bg-amber-100 text-amber-800",
  CLOSED_WON: "bg-emerald-100 text-emerald-700",
  CLOSED_LOST: "bg-rose-100 text-rose-700",
} as const;

const statusOrder = ["LEAD", "ACTIVE", "PROPOSAL", "CLOSED_WON", "CLOSED_LOST"] as const;

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

function ClientCard({ contact, advancedHref }: { contact: ClientRecord; advancedHref: string }) {
  const { t, dir } = useI18n();
  const badgeClass = getStatusBadgeClass(contact.status);
  const statusLabel = t(`workspaceClients.status.${contact.status}`);

  return (
    <article className="v2-panel overflow-hidden p-5" dir={dir}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--v2-accent-soft)] text-sm font-black text-[color:var(--v2-accent)]">
            {initials(contact.name)}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-lg font-black text-[color:var(--v2-ink)]">{contact.name}</h3>
            <p className="mt-1 text-xs font-semibold text-[color:var(--v2-muted)]">
              {t("workspaceClients.card.createdPrefix")}
              {formatShortDate(contact.createdAt)}
            </p>
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${badgeClass}`}>{statusLabel}</span>
      </div>

      <div className="mt-5 grid gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-3">
            <p className="text-xs font-bold text-[color:var(--v2-muted)]">{t("workspaceClients.card.potentialValue")}</p>
            <p className="mt-2 text-base font-black text-[color:var(--v2-ink)]">
              {contact.value != null ? formatCurrencyILS(contact.value) : t("workspaceClients.card.notDefined")}
            </p>
          </div>
          <div className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-3">
            <p className="text-xs font-bold text-[color:var(--v2-muted)]">{t("workspaceClients.card.openCollection")}</p>
            <p className="mt-2 text-base font-black text-[color:var(--v2-ink)]">
              {contact.totalPending > 0 ? formatCurrencyILS(contact.totalPending) : t("workspaceClients.card.noOpenDebt")}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-[color:var(--v2-line)] bg-white/76 px-4 py-3">
          <p className="text-xs font-bold text-[color:var(--v2-muted)]">{t("workspaceClients.card.billingDocs")}</p>
          <p className="mt-2 text-base font-black text-[color:var(--v2-ink)]">
            {contact.invoiceCount > 0
              ? t("workspaceClients.card.invoiceCount", { count: String(contact.invoiceCount) })
              : t("workspaceClients.card.noBillingYet")}
          </p>
        </div>

        <div className="grid gap-2 text-sm text-[color:var(--v2-muted)]">
          <div className="flex items-center gap-2">
            <BriefcaseBusiness className="h-4 w-4 shrink-0 text-[color:var(--v2-accent)]" aria-hidden />
            <span>{contact.project?.name ?? t("workspaceClients.card.noProject")}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 shrink-0 text-[color:var(--v2-accent)]" aria-hidden />
            <span dir="ltr">{contact.email ?? t("workspaceClients.card.noEmail")}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 shrink-0 text-[color:var(--v2-accent)]" aria-hidden />
            <span dir="ltr">{contact.phone ?? t("workspaceClients.card.noPhone")}</span>
          </div>
        </div>

        {contact.notes ? (
          <p className="rounded-2xl border border-[color:var(--v2-line)] bg-white/76 px-4 py-3 text-sm leading-7 text-[color:var(--v2-muted)]">
            {contact.notes}
          </p>
        ) : null}
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Link href={advancedHref} className="v2-button v2-button-primary">
          {t("workspaceClients.card.advancedCrm")}
          <ArrowLeft className="h-4 w-4" aria-hidden />
        </Link>
        {contact.status === "CLOSED_WON" ? (
          <Link
            href={`/app/documents/issue?client=${encodeURIComponent(contact.name)}&contactId=${contact.id}`}
            className="v2-button v2-button-secondary"
          >
            {t("workspaceClients.card.openBilling")}
            <ReceiptText className="h-4 w-4" aria-hidden />
          </Link>
        ) : null}
      </div>
    </article>
  );
}

function PipelineColumn({
  label,
  contacts,
  advancedHref,
}: {
  label: string;
  contacts: ClientRecord[];
  advancedHref: string;
}) {
  const { t, dir } = useI18n();

  return (
    <div className="v2-panel flex min-h-[280px] flex-col p-4" dir={dir}>
      <div className="flex items-center justify-between gap-3 border-b border-[color:var(--v2-line)] pb-3">
        <h3 className="text-sm font-black text-[color:var(--v2-ink)]">{label}</h3>
        <span className="rounded-full bg-[color:var(--v2-canvas)] px-3 py-1 text-xs font-black text-[color:var(--v2-muted)]">
          {contacts.length}
        </span>
      </div>

      <div className="mt-4 grid gap-3">
        {contacts.length === 0 ? (
          <div className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-6 text-center text-sm text-[color:var(--v2-muted)]">
            {t("workspaceClients.pipeline.emptyColumn")}
          </div>
        ) : null}
        {contacts.map((contact) => (
          <div key={contact.id} className="rounded-[22px] border border-[color:var(--v2-line)] bg-white/80 px-4 py-4">
            <p className="font-black text-[color:var(--v2-ink)]">{contact.name}</p>
            <p className="mt-2 text-sm text-[color:var(--v2-muted)]">
              {contact.project?.name ?? t("workspaceClients.pipeline.noProject")}
            </p>
            <div className="mt-3 flex items-center justify-between gap-3 text-sm">
              <span className="font-bold text-[color:var(--v2-muted)]">
                {contact.value != null ? formatCurrencyILS(contact.value) : t("workspaceClients.pipeline.noValue")}
              </span>
              <Link href={advancedHref} className="font-black text-[color:var(--v2-accent)]">
                {t("workspaceClients.pipeline.openAdvanced")}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ClientsWorkspaceV2({ contacts, projects, industryProfile }: Props) {
  const { t, dir } = useI18n();
  const advancedClientsHref = getAdvancedWorkspaceHref("clients");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [projectFilter, setProjectFilter] = useState("ALL");
  const [view, setView] = useState<"overview" | "board">("overview");
  const [isPending, startFilterTransition] = useTransition();
  const deferredSearch = useDeferredValue(search);

  const normalizedSearch = deferredSearch.trim().toLowerCase();
  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      normalizedSearch.length === 0 ||
      contact.name.toLowerCase().includes(normalizedSearch) ||
      (contact.email ?? "").toLowerCase().includes(normalizedSearch) ||
      (contact.phone ?? "").toLowerCase().includes(normalizedSearch) ||
      (contact.project?.name ?? "").toLowerCase().includes(normalizedSearch);

    const matchesStatus = statusFilter === "ALL" || contact.status === statusFilter;
    const matchesProject = projectFilter === "ALL" || contact.project?.id === projectFilter;

    return matchesSearch && matchesStatus && matchesProject;
  });

  const totalValue = filteredContacts.reduce((sum, contact) => sum + (contact.value ?? 0), 0);
  const totalPending = filteredContacts.reduce((sum, contact) => sum + contact.totalPending, 0);
  const activeProjects = projects.filter((project) => project.isActive).length;
  const missingContactDetails = filteredContacts.filter((contact) => !contact.email || !contact.phone).slice(0, 3);
  const pendingBillingContacts = filteredContacts
    .filter((contact) => contact.totalPending > 0)
    .sort((left, right) => right.totalPending - left.totalPending)
    .slice(0, 3);
  const recentProjects = [...projects]
    .sort((left, right) => right.contactCount - left.contactCount)
    .slice(0, 4);

  const clientsLabel = industryProfile.clientsLabel;

  return (
    <div className="grid gap-6" dir={dir}>
      <section className="v2-panel v2-panel-soft overflow-hidden p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div>
            <span className="v2-eyebrow">{t("workspaceClients.eyebrow")}</span>
            <h1 className="mt-4 text-3xl font-black tracking-[-0.06em] text-[color:var(--v2-ink)] sm:text-5xl">
              {t("workspaceClients.heroTitle", { clients: clientsLabel })}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-[color:var(--v2-muted)] sm:text-lg">
              {t("workspaceClients.heroSubtitle", { clients: clientsLabel })}
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href={advancedClientsHref} className="v2-button v2-button-primary">
                {t("workspaceClients.advancedCta")}
                <ArrowLeft className="h-4 w-4" aria-hidden />
              </Link>
              <Link href="/app/inbox" className="v2-button v2-button-secondary">
                {t("workspaceClients.inboxCta")}
                <Sparkles className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: clientsLabel, value: filteredContacts.length.toString(), icon: UsersRound },
              { label: t("workspaceClients.statPipelineValue"), value: formatCurrencyILS(totalValue), icon: CircleDollarSign },
              { label: t("workspaceClients.statOpenCollection"), value: formatCurrencyILS(totalPending), icon: ReceiptText },
              { label: t("workspaceClients.statActiveProjects"), value: activeProjects.toString(), icon: CheckCircle2 },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="v2-panel p-5">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--v2-accent-soft)] text-[color:var(--v2-accent)]">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <p className="mt-4 text-sm font-bold text-[color:var(--v2-muted)]">{label}</p>
                <p className="mt-2 text-2xl font-black tracking-[-0.04em] text-[color:var(--v2-ink)]">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-4">
          <div className="v2-panel p-5">
            <div className="grid gap-3 lg:grid-cols-[1.4fr_0.8fr_0.8fr_auto]">
              <label className="grid gap-2">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-[color:var(--v2-muted)]">
                  {t("workspaceClients.searchLabel")}
                </span>
                <div className="flex items-center gap-3 rounded-2xl border border-[color:var(--v2-line)] bg-white/86 px-4 py-3">
                  <Filter className="h-4 w-4 text-[color:var(--v2-muted)]" aria-hidden />
                  <input
                    value={search}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      startFilterTransition(() => setSearch(nextValue));
                    }}
                    className="w-full bg-transparent text-sm outline-none placeholder:text-[color:var(--v2-muted)]"
                    placeholder={t("workspaceClients.searchPlaceholder")}
                  />
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin text-[color:var(--v2-accent)]" aria-hidden /> : null}
                </div>
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-[color:var(--v2-muted)]">
                  {t("workspaceClients.statusLabel")}
                </span>
                <select
                  value={statusFilter}
                  onChange={(event) => startFilterTransition(() => setStatusFilter(event.target.value))}
                  className="rounded-2xl border border-[color:var(--v2-line)] bg-white/86 px-4 py-3 text-sm font-semibold text-[color:var(--v2-ink)] outline-none"
                >
                  <option value="ALL">{t("workspaceClients.statusAll")}</option>
                  {statusOrder.map((status) => (
                    <option key={status} value={status}>
                      {t(`workspaceClients.status.${status}`)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-[color:var(--v2-muted)]">
                  {t("workspaceClients.projectLabel")}
                </span>
                <select
                  value={projectFilter}
                  onChange={(event) => startFilterTransition(() => setProjectFilter(event.target.value))}
                  className="rounded-2xl border border-[color:var(--v2-line)] bg-white/86 px-4 py-3 text-sm font-semibold text-[color:var(--v2-ink)] outline-none"
                >
                  <option value="ALL">{t("workspaceClients.projectAll")}</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid gap-2">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-[color:var(--v2-muted)]">
                  {t("workspaceClients.viewLabel")}
                </span>
                <div className="flex items-center gap-2 rounded-2xl bg-[color:var(--v2-canvas)] p-1">
                  <button
                    type="button"
                    onClick={() => startTransition(() => setView("overview"))}
                    className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-black transition ${
                      view === "overview" ? "bg-white text-[color:var(--v2-ink)] shadow-sm" : "text-[color:var(--v2-muted)]"
                    }`}
                  >
                    <LayoutGrid className="h-4 w-4" aria-hidden />
                    {t("workspaceClients.viewOverview")}
                  </button>
                  <button
                    type="button"
                    onClick={() => startTransition(() => setView("board"))}
                    className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-black transition ${
                      view === "board" ? "bg-white text-[color:var(--v2-ink)] shadow-sm" : "text-[color:var(--v2-muted)]"
                    }`}
                  >
                    <ListFilter className="h-4 w-4" aria-hidden />
                    {t("workspaceClients.viewBoard")}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {view === "overview" ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {filteredContacts.length === 0 ? (
                <div className="v2-panel col-span-full p-8 text-center">
                  <p className="text-2xl font-black text-[color:var(--v2-ink)]">{t("workspaceClients.emptyFilterTitle")}</p>
                  <p className="mt-3 text-sm leading-7 text-[color:var(--v2-muted)]">{t("workspaceClients.emptyFilterBody")}</p>
                </div>
              ) : null}
              {filteredContacts.map((contact) => (
                <ClientCard key={contact.id} contact={contact} advancedHref={advancedClientsHref} />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-3">
              {statusOrder.map((status) => (
                <PipelineColumn
                  key={status}
                  label={t(`workspaceClients.status.${status}`)}
                  contacts={filteredContacts.filter((contact) => contact.status === status)}
                  advancedHref={advancedClientsHref}
                />
              ))}
            </div>
          )}
        </div>

        <aside className="grid gap-4">
          <div className="v2-panel v2-panel-highlight p-6">
            <p className="text-lg font-black text-[color:var(--v2-ink)]">{t("workspaceClients.missingTitle")}</p>
            <div className="mt-4 grid gap-3">
              {missingContactDetails.length === 0 ? (
                <div className="rounded-2xl bg-white/78 px-4 py-4 text-sm text-[color:var(--v2-muted)]">
                  {t("workspaceClients.missingAllOk")}
                </div>
              ) : null}
              {missingContactDetails.map((contact) => (
                <div key={contact.id} className="rounded-2xl bg-white/78 px-4 py-4">
                  <p className="font-black text-[color:var(--v2-ink)]">{contact.name}</p>
                  <p className="mt-2 text-sm text-[color:var(--v2-muted)]">
                    {!contact.email && !contact.phone
                      ? t("workspaceClients.missingEmailAndPhone")
                      : !contact.email
                        ? t("workspaceClients.missingEmailOnly")
                        : t("workspaceClients.missingPhoneOnly")}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="v2-panel p-6">
            <p className="text-lg font-black text-[color:var(--v2-ink)]">{t("workspaceClients.openBillingTitle")}</p>
            <div className="mt-4 grid gap-3">
              {pendingBillingContacts.length === 0 ? (
                <div className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-4 text-sm text-[color:var(--v2-muted)]">
                  {t("workspaceClients.openBillingEmpty")}
                </div>
              ) : null}
              {pendingBillingContacts.map((contact) => (
                <div key={contact.id} className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-4">
                  <p className="font-black text-[color:var(--v2-ink)]">{contact.name}</p>
                  <p className="mt-2 text-sm text-[color:var(--v2-muted)]">{formatCurrencyILS(contact.totalPending)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="v2-panel p-6">
            <p className="text-lg font-black text-[color:var(--v2-ink)]">{t("workspaceClients.projectsTitle")}</p>
            <div className="mt-4 grid gap-3">
              {recentProjects.map((project) => (
                <div key={project.id} className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-black text-[color:var(--v2-ink)]">{project.name}</p>
                    <span className="text-xs font-black text-[color:var(--v2-muted)]">
                      {t("workspaceClients.projectClientsCount", { count: String(project.contactCount) })}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[color:var(--v2-muted)]">
                    {t("workspaceClients.projectDealsLine", {
                      deals: String(project.activeDeals),
                      total: formatCurrencyILS(project.totalValue),
                    })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
