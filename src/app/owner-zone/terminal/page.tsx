'use client';

import React, { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Send, Terminal } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { isFirebaseConfigured } from '@/lib/firebase';
import { IS_OWNER } from '@/lib/ownerVault';

type Line =
  | { kind: 'in'; text: string }
  | { kind: 'out'; text: string }
  | { kind: 'err'; text: string };

export default function OwnerAiTerminalPage() {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [dryRun, setDryRun] = useState(true);
  const [busy, setBusy] = useState(false);
  const [lines, setLines] = useState<Line[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const allowed = IS_OWNER(user?.email);

  const appendLines = useCallback((next: Line[]) => {
    setLines((prev) => [...prev, ...next]);
  }, []);

  const run = async () => {
    if (!allowed || !user || !input.trim()) return;
    setBusy(true);
    const cmd = input.trim();
    setInput('');
    appendLines([{ kind: 'in', text: cmd }]);
    try {
      if (!isFirebaseConfigured()) throw new Error('Firebase לא מוגדר');
      const token = await user.getIdToken();
      if (!token) throw new Error('אין טוקן');

      const res = await fetch('/api/owner/terminal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ instruction: cmd, dryRun }),
      });
      const j = (await res.json()) as {
        ok?: boolean;
        summary?: string;
        commitMessage?: string;
        files?: Array<{ path: string; contentLength: number }>;
        rejectedPaths?: string[];
        github?: { branch: string; htmlUrl: string } | null;
        warning?: string;
        githubError?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(j.error || `HTTP ${res.status}`);

      const parts: string[] = [];
      parts.push(j.summary ?? '');
      if (j.commitMessage) parts.push(`\n[commit] ${j.commitMessage}`);
      if (j.files?.length) {
        parts.push('\n[files]');
        for (const f of j.files) parts.push(`  • ${f.path} (${f.contentLength} chars)`);
      }
      if (j.rejectedPaths?.length) {
        parts.push('\n[rejected]');
        for (const p of j.rejectedPaths) parts.push(`  ✕ ${p}`);
      }
      if (j.warning) parts.push(`\n[warn] ${j.warning}`);
      if (j.github?.htmlUrl) parts.push(`\n[github] ${j.github.branch}\n${j.github.htmlUrl}`);
      if (j.githubError) parts.push(`\n[github-error] ${j.githubError}`);

      appendLines([{ kind: 'out', text: parts.join('\n').trim() }]);
    } catch (e) {
      appendLines([{ kind: 'err', text: e instanceof Error ? e.message : 'שגיאה' }]);
    } finally {
      setBusy(false);
      requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }));
    }
  };

  if (!allowed) return null;

  return (
    <div className="min-h-full bg-[#FDFDFD] p-6 pb-24 pt-safe px-safe md:m-12 md:p-12" dir="rtl">
      <div className="mb-8 flex flex-col items-center justify-center gap-4 sm:flex-row sm:justify-between">
        <Link
          href="/dashboard"
          className="inline-flex min-h-11 items-center justify-center gap-4 rounded-4xl px-6 text-sm font-bold text-gray-500 transition-colors hover:text-[#001A4D]"
        >
          <ArrowRight className="h-4 w-4" aria-hidden />
          חזרה לדשבורד
        </Link>
      </div>

      <header className="mb-10 flex flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-4xl border border-[#004694]/20 bg-[#004694]/5 text-[#004694]">
          <Terminal className="h-8 w-8" aria-hidden />
        </div>
        <div>
          <h1 className="text-2xl font-black text-[#001A4D]">AI Command Terminal</h1>
          <p className="mt-2 max-w-xl text-sm text-gray-600">
            הוראות טקסט → Vercel AI SDK (מבנה קבצים) → ענף GitHub חדש{' '}
            <code className="rounded-4xl bg-gray-100 px-2 py-1">owner-terminal/*</code> (אם אינו ניסיון יבש).
          </p>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center gap-4">
        <section
          className="flex min-h-[280px] w-full flex-col items-center justify-center gap-4 rounded-4xl border border-gray-200 bg-white p-6 shadow-inner"
          aria-label="פלט מסוף"
        >
          <div className="max-h-[min(480px,50vh)] w-full overflow-y-auto rounded-4xl bg-[#0a0a0a] p-6">
            {lines.length === 0 ? (
              <p className="text-center text-xs text-gray-500">הקלד הוראה ולחץ שליחה…</p>
            ) : (
              <ul className="flex flex-col items-stretch justify-center gap-4 text-start font-mono text-xs leading-relaxed">
                {lines.map((line, i) => (
                  <li key={i}>
                    {line.kind === 'in' ? (
                      <span className="text-[#FF8C00]">
                        <span className="text-gray-500">$ </span>
                        {line.text}
                      </span>
                    ) : line.kind === 'err' ? (
                      <span className="text-red-400">{line.text}</span>
                    ) : (
                      <span className="whitespace-pre-wrap text-[#e8e8e8]">{line.text}</span>
                    )}
                  </li>
                ))}
                <div ref={bottomRef} />
              </ul>
            )}
          </div>
        </section>

        <label className="flex w-full flex-col items-center justify-center gap-4 text-sm font-bold text-gray-800">
          פקודה
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={4}
            className="min-h-24 w-full rounded-4xl border border-gray-200 bg-white p-6 text-sm font-normal leading-relaxed shadow-inner outline-none focus-visible:ring-2 focus-visible:ring-[#FF8C00]"
            placeholder="למשל: הוסף כפתור שמירה בדף ההגדרות…"
            disabled={busy}
          />
        </label>

        <label className="flex items-center justify-center gap-4 text-sm font-bold text-gray-700">
          <input
            type="checkbox"
            checked={dryRun}
            onChange={(e) => setDryRun(e.target.checked)}
            disabled={busy}
            className="h-4 w-4 rounded border-gray-300 accent-[#004694]"
          />
          <span>מצב יבש (ללא GitHub)</span>
        </label>

        <button
          type="button"
          disabled={busy || !input.trim()}
          onClick={() => void run()}
          className="flex min-h-12 w-full max-w-xs items-center justify-center gap-4 rounded-4xl bg-[#004694] px-8 py-4 text-sm font-black text-white disabled:opacity-50"
        >
          <Send className="h-4 w-4" aria-hidden />
          {busy ? 'מעבד…' : 'שליחה'}
        </button>
      </div>
    </div>
  );
}
