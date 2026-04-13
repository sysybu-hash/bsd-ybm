"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, Command, CornerDownLeft, Search } from "lucide-react";

export type AppCommandItem = {
  href: string;
  label: string;
  summary: string;
  icon: LucideIcon;
  keywords?: string[];
};

type Props = Readonly<{
  items: AppCommandItem[];
}>;

function isCurrentPath(pathname: string, href: string) {
  const current = pathname.replace(/\/$/, "") || "/";
  const target = href.replace(/\/$/, "") || "/";
  if (target === "/app") return current === "/app";
  return current === target || current.startsWith(`${target}/`);
}

export default function AppCommandPalette({ items }: Props) {
  const router = useRouter();
  const pathname = usePathname() ?? "/app";
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const shortcut = "Ctrl/Cmd+K";

  const normalizedQuery = query.trim().toLowerCase();
  const filteredItems = items.filter((item) => {
    if (!normalizedQuery) return true;
    const haystack = [item.label, item.summary, ...(item.keywords ?? [])].join(" ").toLowerCase();
    return haystack.includes(normalizedQuery);
  });

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
        return;
      }

      if (!open) return;

      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((current) => Math.min(current + 1, Math.max(filteredItems.length - 1, 0)));
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((current) => Math.max(current - 1, 0));
        return;
      }

      if (event.key === "Enter") {
        const selected = filteredItems[activeIndex];
        if (!selected) return;
        event.preventDefault();
        setOpen(false);
        setQuery("");
        router.push(selected.href);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, filteredItems, open, router]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setActiveIndex(0);
      return;
    }

    const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden min-w-[320px] items-center gap-3 rounded-2xl border border-[color:var(--v2-line)] bg-white/82 px-4 py-3 text-right transition hover:bg-white lg:flex"
        aria-label="פתיחת חיפוש מהיר"
      >
        <Search className="h-4 w-4 text-[color:var(--v2-muted)]" aria-hidden />
        <span className="flex-1 text-sm text-[color:var(--v2-muted)]">חיפוש מהיר, מעבר בין מסכים ופעולות נפוצות</span>
        <span className="rounded-lg bg-[color:var(--v2-canvas)] px-2 py-1 text-[11px] font-black text-[color:var(--v2-muted)]">
          {shortcut}
        </span>
      </button>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full border border-[color:var(--v2-line)] bg-white/86 px-3 py-2 text-xs font-bold text-[color:var(--v2-muted)] lg:hidden"
        aria-label="פתיחת חיפוש מהיר"
      >
        <Search className="h-4 w-4 text-[color:var(--v2-accent)]" aria-hidden />
        חיפוש
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 bg-slate-950/35 px-4 py-8 backdrop-blur-sm" role="presentation">
          <button type="button" className="absolute inset-0 cursor-default" onClick={() => setOpen(false)} aria-label="סגירת חיפוש מהיר" />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="חיפוש מהיר"
            className="relative mx-auto flex max-w-2xl flex-col overflow-hidden rounded-[32px] border border-white/60 bg-[color:var(--v2-surface)] shadow-[0_35px_90px_-30px_rgba(15,23,42,0.45)]"
          >
            <div className="border-b border-[color:var(--v2-line)] px-5 py-4">
              <div className="flex items-center gap-3 rounded-2xl border border-[color:var(--v2-line)] bg-white px-4 py-3">
                <Search className="h-4 w-4 text-[color:var(--v2-muted)]" aria-hidden />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="w-full bg-transparent text-sm text-[color:var(--v2-ink)] outline-none placeholder:text-[color:var(--v2-muted)]"
                  placeholder="חפש מסך, פעולה או אזור עבודה"
                />
                <span className="hidden items-center gap-1 rounded-lg bg-[color:var(--v2-canvas)] px-2 py-1 text-[11px] font-black text-[color:var(--v2-muted)] sm:inline-flex">
                  <Command className="h-3 w-3" aria-hidden />
                  {shortcut}
                </span>
              </div>
            </div>

            <div className="max-h-[65vh] overflow-y-auto p-3">
              {filteredItems.length === 0 ? (
                <div className="rounded-2xl bg-white/78 px-4 py-8 text-center">
                  <p className="text-lg font-black text-[color:var(--v2-ink)]">לא נמצאו תוצאות</p>
                  <p className="mt-2 text-sm text-[color:var(--v2-muted)]">נסה לחפש לפי שם מסך, תהליך או כלי.</p>
                </div>
              ) : null}

              <div className="grid gap-2">
                {filteredItems.map((item, index) => {
                  const active = index === activeIndex;
                  const current = isCurrentPath(pathname, item.href);

                  return (
                    <button
                      key={item.href}
                      type="button"
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => {
                        setOpen(false);
                        setQuery("");
                        router.push(item.href);
                      }}
                      className={`flex items-start gap-3 rounded-[24px] px-4 py-4 text-right transition ${
                        active ? "bg-[color:var(--v2-accent-soft)]" : "bg-white/82 hover:bg-white"
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                          active ? "bg-[color:var(--v2-accent)] text-white" : "bg-[color:var(--v2-canvas)] text-[color:var(--v2-accent)]"
                        }`}
                      >
                        <item.icon className="h-4 w-4" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-sm font-black text-[color:var(--v2-ink)]">{item.label}</span>
                          {current ? (
                            <span className="rounded-full bg-white px-2 py-1 text-[10px] font-black text-[color:var(--v2-accent)]">
                              כאן
                            </span>
                          ) : null}
                        </span>
                        <span className="mt-1 block text-sm leading-6 text-[color:var(--v2-muted)]">{item.summary}</span>
                      </span>
                      <span className="mt-1 hidden items-center gap-1 text-[11px] font-black text-[color:var(--v2-muted)] sm:inline-flex">
                        <CornerDownLeft className="h-3.5 w-3.5" aria-hidden />
                        פתח
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-[color:var(--v2-line)] px-5 py-3 text-xs text-[color:var(--v2-muted)]">
              <span>חיפוש חוצה מערכת: מסכים ראשיים, מסכי עומק וכלי ניהול.</span>
              <span className="inline-flex items-center gap-2 font-black">
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                Enter לפתיחה
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
