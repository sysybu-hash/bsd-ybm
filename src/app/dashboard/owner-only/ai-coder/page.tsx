'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Bot, Github } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import AddFromFileButton from '@/components/ui/AddFromFileButton';
import { isFirebaseConfigured } from '@/lib/firebase';
import { IS_OWNER } from '@/lib/ownerVault';

const MAX_INSTRUCTION = 12_000;

export default function OwnerAiCoderPage() {
  const { user } = useAuth();
  const [instruction, setInstruction] = useState('');
  const [applyGithub, setApplyGithub] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reply, setReply] = useState<string | null>(null);
  const [githubMeta, setGithubMeta] = useState<{ branch: string; htmlUrl: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);

  const allowed = IS_OWNER(user?.email);

  const run = async () => {
    if (!allowed || !user || !instruction.trim()) return;
    setBusy(true);
    setErr(null);
    setNotice(null);
    setReply(null);
    setGithubMeta(null);
    try {
      if (!isFirebaseConfigured()) throw new Error('Firebase לא מוגדר');
      const token = await user.getIdToken();
      if (!token) throw new Error('אין טוקן');

      const res = await fetch('/api/owner/ai-coder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ instruction: instruction.trim(), applyGithub }),
      });
      const j = (await res.json()) as {
        ok?: boolean;
        reply?: string;
        github?: { branch: string; htmlUrl: string } | null;
        error?: string;
        githubError?: string;
        warning?: string;
        warnings?: string[];
      };
      if (!res.ok) {
        const raw = j.error || `HTTP ${res.status}`;
        if (raw === 'server_not_configured') {
          throw new Error('שרת: Firebase Admin לא מוגדר — הגדרו מפתח שירות בשרת (או השתמשו בגרסת API המעודכנת).');
        }
        throw new Error(raw);
      }
      setReply(j.reply ?? '');
      if (j.github?.htmlUrl) setGithubMeta({ branch: j.github.branch, htmlUrl: j.github.htmlUrl });
      if (j.githubError) setErr(j.githubError);
      const parts = [...(j.warnings ?? []), j.warning].filter(Boolean) as string[];
      if (parts.length) setNotice(parts.join('\n'));
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'שגיאה');
    } finally {
      setBusy(false);
    }
  };

  const onInstructionFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setLoadingFile(true);
    setErr(null);
    const r = new FileReader();
    r.onload = () => {
      const t = typeof r.result === 'string' ? r.result : '';
      setInstruction(t.slice(0, MAX_INSTRUCTION));
      setLoadingFile(false);
    };
    r.onerror = () => {
      setErr('קריאת הקובץ נכשלה');
      setLoadingFile(false);
    };
    r.readAsText(file, 'UTF-8');
  };

  if (!allowed) return null;

  return (
    <div className="min-h-full bg-[#FDFDFD] p-6 pb-24 pt-safe px-safe sm:p-8 md:p-12" dir="rtl">
      <div className="mb-8 flex flex-col items-center justify-center gap-4 sm:flex-row sm:justify-between">
        <Link
          href="/dashboard/owner-zone"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-4xl px-4 text-sm font-bold text-gray-500 transition-colors hover:text-[#001A4D]"
        >
          <ArrowRight className="h-4 w-4" aria-hidden />
          חזרה לאזור בעלים
        </Link>
      </div>

      <header className="mb-10 flex flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-4xl border border-[#004694]/20 bg-[#004694]/5 text-[#004694]">
          <Bot className="h-8 w-8" aria-hidden />
        </div>
        <div>
          <h1 className="text-2xl font-black text-[#001A4D]">AI Development Hub</h1>
          <p className="mt-2 max-w-xl text-sm text-gray-600">
            הוראות פיתוח → מודל שפה → (אופציונלי) קובץ patch בענף <code className="rounded bg-gray-100 px-1">hotfix/sentinel-*</code> ב-GitHub.
          </p>
        </div>
      </header>

      <div className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-6">
        <div className="flex w-full flex-col items-center justify-center gap-4">
          <label className="flex w-full flex-col items-center justify-center gap-4 text-sm font-bold text-gray-800">
            הוראה למודל
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value.slice(0, MAX_INSTRUCTION))}
              rows={8}
              className="min-h-48 w-full rounded-4xl border border-gray-200 bg-white p-4 text-sm font-normal leading-relaxed shadow-inner outline-none focus-visible:ring-2 focus-visible:ring-[#FF8C00]"
              placeholder="למשל: הוסף אימות שדה X בטופס הרשמה, או שפר הודעת שגיאה ב-API Y…"
            />
          </label>
          <AddFromFileButton
            accept=".txt,.md,text/plain,.markdown"
            uploading={loadingFile}
            uploadingLabel="טוען קובץ…"
            labelOverride="הוספה מקובץ (טקסט / הוראות)"
            disabled={busy}
            onChange={onInstructionFile}
            className="max-w-md"
          />
          <p className="text-center text-xs text-gray-500">עד {MAX_INSTRUCTION.toLocaleString('he-IL')} תווים · קבצי .txt / .md</p>
        </div>

        <label className="flex items-center justify-center gap-4 text-sm font-bold text-gray-700">
          <input
            type="checkbox"
            checked={applyGithub}
            onChange={(e) => setApplyGithub(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 accent-[#004694]"
          />
          <span className="flex items-center justify-center gap-2">
            <Github className="h-4 w-4" aria-hidden />
            דחוף תוצאה ל-branch חדש ב-GitHub (קובץ .diff תחת sentinel/)
          </span>
        </label>

        <button
          type="button"
          disabled={busy || !instruction.trim()}
          onClick={() => void run()}
          className="min-h-12 w-full max-w-xs rounded-4xl bg-[#004694] px-8 py-4 text-sm font-black text-white disabled:opacity-50"
        >
          {busy ? 'מעבד…' : 'שליחה ל-AI'}
        </button>

        {notice ? (
          <p
            className="w-full rounded-4xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm font-semibold text-amber-900"
            role="status"
          >
            {notice}
          </p>
        ) : null}

        {err ? (
          <p className="text-center text-sm font-bold text-red-600" role="alert">
            {err}
          </p>
        ) : null}

        {githubMeta ? (
          <a
            href={githubMeta.htmlUrl}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-12 items-center justify-center rounded-4xl border border-gray-200 bg-white px-6 py-3 text-sm font-bold text-[#004694] underline-offset-2 hover:underline"
          >
            פתיחת {githubMeta.branch} ב-GitHub
          </a>
        ) : null}

        {reply ? (
          <section className="w-full rounded-4xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-center text-lg font-black text-[#001A4D]">תשובת המודל</h2>
            <pre className="max-h-[480px] overflow-auto whitespace-pre-wrap rounded-4xl bg-[#0a0a0a] p-4 text-start text-xs leading-relaxed text-[#e8e8e8]">
              {reply}
            </pre>
          </section>
        ) : null}
      </div>
    </div>
  );
}
