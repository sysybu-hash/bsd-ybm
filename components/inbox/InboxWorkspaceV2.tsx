"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BellRing,
  CheckCheck,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  FileWarning,
  Loader2,
  MailWarning,
  Sparkles,
} from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
import { getAdvancedWorkspaceHref } from "@/components/app-shell/app-nav";
import { formatCurrencyILS, formatDateTime } from "@/lib/ui-formatters";

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
};

type ActionItem = {
  id: string;
  category: string;
  title: string;
  body: string;
  href: string;
  cta: string;
  severity: "high" | "medium" | "low";
};

type DueSoonItem = {
  id: string;
  clientName: string;
  total: number;
  dueDate: string | null;
  href: string;
};

type Props = Readonly<{
  notifications: NotificationItem[];
  priorityItems: ActionItem[];
  dueSoon: DueSoonItem[];
  unreadCount: number;
  overdueCount: number;
  reviewCount: number;
  missingInfoCount: number;
}>;

function severityClasses(severity: ActionItem["severity"]) {
  if (severity === "high") return "bg-rose-100 text-rose-700";
  if (severity === "medium") return "bg-amber-100 text-amber-700";
  return "bg-sky-100 text-sky-700";
}

export default function InboxWorkspaceV2({
  notifications: initialNotifications,
  priorityItems,
  dueSoon,
  unreadCount,
  overdueCount,
  reviewCount,
  missingInfoCount,
}: Props) {
  const { t, dir, locale } = useI18n();
  const dateLocale = locale === "he" ? "he-IL" : locale === "ru" ? "ru-RU" : "en-GB";
  const advancedInboxHref = getAdvancedWorkspaceHref("inbox");
  const [notifications, setNotifications] = useState(initialNotifications);
  const [markingAll, setMarkingAll] = useState(false);
  const [markingIds, setMarkingIds] = useState<string[]>([]);
  const [dismissedPriorityIds, setDismissedPriorityIds] = useState<string[]>([]);

  const unread = notifications.filter((item) => !item.read).length;

  const visiblePriority = priorityItems.filter((item) => !dismissedPriorityIds.includes(item.id));

  async function markAllRead() {
    setMarkingAll(true);
    try {
      const response = await fetch("/api/user/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });

      if (!response.ok) return;

      setNotifications((current) => current.map((item) => ({ ...item, read: true })));
    } finally {
      setMarkingAll(false);
    }
  }

  async function markOneRead(id: string) {
    setMarkingIds((current) => [...current, id]);
    try {
      const response = await fetch("/api/user/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] }),
      });

      if (!response.ok) return;

      setNotifications((current) => current.map((item) => (item.id === id ? { ...item, read: true } : item)));
    } finally {
      setMarkingIds((current) => current.filter((item) => item !== id));
    }
  }

  const summaryItems = [
    { label: t("workspaceInbox.summaryUnread"), value: unreadCount.toString(), icon: BellRing },
    { label: t("workspaceInbox.summaryOverdue"), value: overdueCount.toString(), icon: CreditCard },
    { label: t("workspaceInbox.summaryReview"), value: reviewCount.toString(), icon: FileWarning },
    { label: t("workspaceInbox.summaryMissing"), value: missingInfoCount.toString(), icon: MailWarning },
  ];

  return (
    <div className="flex w-full min-w-0 flex-col gap-8" dir={dir}>
      <section className="tile p-6 sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[color:var(--ink-400)]">
              {t("workspaceInbox.eyebrow")}
            </span>
            <h1 className="mt-4 text-3xl font-black tracking-[-0.06em] text-[color:var(--ink-900)] sm:text-4xl">
              {t("workspaceInbox.heroTitle")}
            </h1>
            <p className="mt-3 text-base leading-7 text-[color:var(--ink-500)]">{t("workspaceInbox.heroSubtitle")}</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={advancedInboxHref}
              className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--axis-clients)] bg-[color:var(--axis-clients)] px-4 py-2.5 text-sm font-black text-white shadow-[var(--shadow-sm)] transition hover:bg-[color:var(--axis-clients-strong)]"
            >
              {t("workspaceInbox.advancedCta")}
              <ExternalLink className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href="/app/clients"
              className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--line-strong)] bg-[color:var(--canvas-raised)] px-4 py-2.5 text-sm font-bold text-[color:var(--ink-800)] hover:bg-[color:var(--canvas-sunken)]"
            >
              {t("workspaceInbox.clientsCta")}
              <Sparkles className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {summaryItems.map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-2xl border border-[color:var(--line)] bg-white/92 px-4 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[color:var(--axis-clients-soft)] text-[color:var(--axis-clients)]">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[color:var(--ink-500)]">{label}</p>
                  <p className="mt-1 text-xl font-black tracking-[-0.04em] text-[color:var(--ink-900)]">{value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-4">
          <div className="tile p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-lg font-black text-[color:var(--ink-900)]">{t("workspaceInbox.priorityTitle")}</p>
                <p className="mt-2 text-sm leading-6 text-[color:var(--ink-500)]">{t("workspaceInbox.prioritySubtitle")}</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {visiblePriority.length === 0 ? (
                <div className="rounded-2xl bg-[color:var(--canvas-sunken)] px-4 py-5 text-sm text-[color:var(--ink-500)]">
                  {t("workspaceInbox.priorityEmpty")}
                </div>
              ) : null}

              {visiblePriority.map((item) => (
                <div key={item.id} className="rounded-2xl border border-[color:var(--line)] bg-white/88 px-4 py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${severityClasses(item.severity)}`}>
                        {item.category}
                      </span>
                      <p className="mt-3 text-base font-black text-[color:var(--ink-900)]">{item.title}</p>
                      <p className="mt-2 text-sm leading-6 text-[color:var(--ink-500)]">{item.body}</p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setDismissedPriorityIds((prev) => [...prev, item.id])}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-[color:var(--line-strong)] bg-[color:var(--canvas-raised)] px-3 py-2 text-xs font-black text-[color:var(--ink-700)] hover:bg-[color:var(--canvas-sunken)]"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                        {t("workspaceInbox.priorityDismiss")}
                      </button>
                      <Link
                        href={item.href}
                        className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--line-strong)] bg-[color:var(--canvas-raised)] px-3 py-2 text-xs font-black text-[color:var(--ink-800)] hover:bg-[color:var(--canvas-sunken)]"
                      >
                        {item.cta}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="tile p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[color:var(--axis-clients)]" aria-hidden />
              <p className="text-lg font-black text-[color:var(--ink-900)]">{t("workspaceInbox.dueSoonTitle")}</p>
            </div>

            <div className="mt-4 grid gap-3">
              {dueSoon.length === 0 ? (
                <div className="rounded-2xl bg-[color:var(--canvas-sunken)] px-4 py-4 text-sm text-[color:var(--ink-500)]">
                  {t("workspaceInbox.dueSoonEmpty")}
                </div>
              ) : null}

              {dueSoon.map((item) => (
                <div key={item.id} className="rounded-2xl bg-[color:var(--canvas-sunken)] px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-black text-[color:var(--ink-900)]">{item.clientName}</p>
                    <p className="text-sm font-black text-[color:var(--ink-900)]">{formatCurrencyILS(item.total)}</p>
                  </div>
                  <p className="mt-2 text-sm text-[color:var(--ink-500)]">
                    {t("workspaceInbox.paymentDuePrefix")}{" "}
                    {item.dueDate ? new Date(item.dueDate).toLocaleDateString(dateLocale) : t("workspaceInbox.paymentDueUnset")}
                  </p>
                  <Link href={item.href} className="mt-3 inline-flex text-sm font-black text-[color:var(--axis-clients)]">
                    {t("workspaceInbox.openBillingArea")}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="tile tile--lavender p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-lg font-black text-[color:var(--ink-900)]">{t("workspaceInbox.notificationsTitle")}</p>
              <p className="mt-2 text-sm text-[color:var(--ink-500)]">{t("workspaceInbox.notificationsSubtitle")}</p>
            </div>
            {unread > 0 ? (
              <button
                type="button"
                onClick={() => void markAllRead()}
                disabled={markingAll}
                className="inline-flex items-center gap-2 text-sm font-black text-[color:var(--axis-clients)] disabled:opacity-50"
              >
                {markingAll ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <CheckCheck className="h-4 w-4" aria-hidden />
                )}
                {t("workspaceInbox.markAllRead")}
              </button>
            ) : null}
          </div>

          <div className="mt-4 grid gap-3">
            {notifications.length === 0 ? (
              <div className="rounded-2xl bg-white/84 px-4 py-4 text-sm text-[color:var(--ink-500)]">
                {t("workspaceInbox.notificationsEmpty")}
              </div>
            ) : null}

            {notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => {
                  if (!notification.read) void markOneRead(notification.id);
                }}
                className={`rounded-2xl px-4 py-4 text-end transition ${
                  notification.read ? "bg-white/64" : "bg-white text-[color:var(--ink-900)] shadow-sm"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-black text-[color:var(--ink-900)]">{notification.title}</p>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--ink-500)]">{notification.body}</p>
                    <p className="mt-2 text-xs font-semibold text-[color:var(--ink-500)]">
                      {formatDateTime(notification.createdAt)}
                    </p>
                  </div>
                  {!notification.read ? (
                    markingIds.includes(notification.id) ? (
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[color:var(--axis-clients)]" aria-hidden />
                    ) : (
                      <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[color:var(--axis-clients)]" />
                    )
                  ) : null}
                </div>
              </button>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}
