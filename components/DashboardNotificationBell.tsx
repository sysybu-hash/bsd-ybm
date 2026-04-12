"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";

type Row = {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
};

export default function DashboardNotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/user/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { notifications: Row[] };
      setItems(data.notifications ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const unread = items.filter((n) => !n.read).length;

  const markRead = async (ids: string[]) => {
    await fetch("/api/user/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    void load();
  };

  const markAll = async () => {
    await fetch("/api/user/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    void load();
  };

  return (
    <div className="relative shrink-0" ref={wrapRef} dir="rtl">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) void load();
        }}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 shadow-sm hover:bg-gray-50"
        aria-label="התראות"
        aria-expanded={open}
      >
        <Bell size={20} />
        {unread > 0 ? (
          <span className="absolute -top-1 -end-1 min-w-[1.125rem] rounded-full bg-rose-500/[0.08] px-1 text-center text-[10px] font-black leading-tight text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute end-0 top-12 z-[200] w-[min(100vw-2rem,22rem)] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg shadow-gray-200/60">
          <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
            <span className="text-xs font-black text-gray-700">הודעות</span>
            {unread > 0 ? (
              <button
                type="button"
                onClick={() => void markAll()}
                className="text-[11px] font-bold text-indigo-400 hover:underline"
              >
                סמן הכל כנקרא
              </button>
            ) : null}
          </div>
          <div className="max-h-72 overflow-y-auto">
            {loading && items.length === 0 ? (
              <p className="p-4 text-center text-xs text-gray-400">טוען…</p>
            ) : items.length === 0 ? (
              <p className="p-4 text-center text-xs text-gray-400">אין הודעות</p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    if (!n.read) void markRead([n.id]);
                  }}
                  className={`w-full text-right border-b border-gray-100 px-3 py-2.5 hover:bg-gray-50 ${
                    n.read ? "opacity-70" : "bg-indigo-500/15"
                  }`}
                >
                  <p className="text-xs font-black text-gray-900">{n.title}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{n.body}</p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {new Date(n.createdAt).toLocaleString("he-IL")}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
