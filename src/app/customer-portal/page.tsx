'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { addDoc, serverTimestamp } from 'firebase/firestore';
import { Home, Upload, Send, MessageSquare, ListTodo } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/CompanyContext';
import ProjectTimeline from '@/components/project/ProjectTimeline';
import { projectCommunicationsRef } from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';
import type { ProjectCommunication } from '@/types/multitenant';

const ORANGE = '#FF8C00';
const BRAND = '#004694';

export default function CustomerPortalPage() {
  const { user, loading: authLoading } = useAuth();
  const { companies } = useCompany();
  const [kind, setKind] = useState<ProjectCommunication['kind']>('message');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const clientMembership = useMemo(
    () => companies.find((c) => c.role === 'client'),
    [companies]
  );
  const companyId = clientMembership?.companyId ?? null;
  const projectId = clientMembership?.allowedProjectIds?.[0] ?? null;

  const sendCommunication = async () => {
    if (!user || !companyId || !projectId || !body.trim()) return;
    if (!isFirebaseConfigured()) {
      setFeedback('Firebase לא מוגדר');
      return;
    }
    setSending(true);
    setFeedback(null);
    try {
      const ref = projectCommunicationsRef(companyId, projectId);
      const payload: Record<string, unknown> = {
        kind,
        body: body.trim(),
        createdByUid: user.uid,
        displayName: user.displayName || user.email || null,
        companyId,
        projectId,
        createdAt: serverTimestamp(),
      };
      await addDoc(ref, payload);
      setBody('');
      setFeedback('נשלח בהצלחה. המנהל יראה ביומן הפרויקט.');
    } catch (e) {
      console.error(e);
      setFeedback('שליחה נכשלה. נסו שוב.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-[#FDFDFD] font-['Heebo']" dir="rtl">
      <header className="flex items-center justify-center gap-4 border-b border-gray-100 px-4 py-4 pt-safe px-safe sm:p-6">
        <span className="flex-1 truncate text-center text-lg font-bold sm:text-xl" style={{ color: BRAND }}>
          Client Lounge
        </span>
        <Link
          href="/"
          className="flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-[32px] px-3 text-sm font-medium text-gray-500 transition-colors hover:text-[#1a1a1a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#004694]"
        >
          <Home size={18} aria-hidden />
          דף הבית
        </Link>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center p-4 pb-safe sm:p-8">
        {authLoading && (
          <p className="text-center text-gray-500">טוען…</p>
        )}

        {!authLoading && !user && (
          <div className="flex w-full max-w-md flex-col items-center justify-center gap-6 rounded-[32px] border border-gray-100 bg-white p-8 text-center shadow-sm">
            <p className="text-gray-600">יש להתחבר כדי לגשת לפורטל הלקוחות.</p>
            <Link
              href="/login"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-[32px] px-6 font-bold text-white"
              style={{ backgroundColor: ORANGE }}
            >
              כניסה
            </Link>
          </div>
        )}

        {!authLoading && user && !clientMembership && (
          <div className="max-w-md rounded-[32px] border border-gray-100 bg-white p-8 text-center text-gray-600 shadow-sm">
            <p>החשבון אינו מוגדר כלקוח, או שחסרה שייכות לחברה.</p>
            <Link
              href="/dashboard"
              className="mt-6 inline-flex min-h-12 items-center justify-center rounded-[32px] px-6 font-bold text-white"
              style={{ backgroundColor: BRAND }}
            >
              לאזור הניהול
            </Link>
          </div>
        )}

        {!authLoading && user && clientMembership && (!companyId || !projectId) && (
          <div className="max-w-md rounded-[32px] border border-amber-100 bg-amber-50 p-8 text-center text-amber-900">
            <p>לא הוקצה פרויקט לחשבון שלך. פנה למנהל לאישור הרשמה.</p>
          </div>
        )}

        {!authLoading && user && companyId && projectId && (
          <div className="flex w-full max-w-lg flex-col items-center justify-center gap-8">
            <div className="w-full text-center">
              <h1 className="text-2xl font-black text-[#1a1a1a] sm:text-3xl">מרכז תקשורת</h1>
              <p className="mt-2 text-sm text-gray-500">הודעות ומשימות למנהל הפרויקט</p>
            </div>

            <section
              className="flex w-full flex-col items-center justify-center gap-6 rounded-[32px] border-2 border-white bg-white p-6 shadow-md sm:p-8"
              style={{ boxShadow: `0 12px 40px ${ORANGE}22` }}
            >
              <div className="flex w-full flex-wrap items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setKind('message')}
                  className={`flex min-h-12 items-center justify-center gap-2 rounded-[32px] px-6 font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF8C00] ${
                    kind === 'message' ? 'text-white' : 'border border-gray-200 bg-[#FDFDFD] text-gray-700'
                  }`}
                  style={kind === 'message' ? { backgroundColor: ORANGE } : undefined}
                >
                  <MessageSquare className="h-4 w-4" aria-hidden />
                  הודעה
                </button>
                <button
                  type="button"
                  onClick={() => setKind('task')}
                  className={`flex min-h-12 items-center justify-center gap-2 rounded-[32px] px-6 font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF8C00] ${
                    kind === 'task' ? 'text-white' : 'border border-gray-200 bg-[#FDFDFD] text-gray-700'
                  }`}
                  style={kind === 'task' ? { backgroundColor: ORANGE } : undefined}
                >
                  <ListTodo className="h-4 w-4" aria-hidden />
                  משימה
                </button>
              </div>

              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={5}
                placeholder="כתבו כאן את ההודעה או תיאור המשימה…"
                className="min-h-[140px] w-full rounded-[32px] border border-gray-200 bg-[#FDFDFD] p-4 text-center text-sm text-[#1a1a1a] outline-none focus-visible:ring-2 focus-visible:ring-[#FF8C00]"
              />

              <button
                type="button"
                disabled={sending || !body.trim()}
                onClick={() => void sendCommunication()}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-[32px] font-bold text-white transition-opacity disabled:opacity-50"
                style={{ backgroundColor: ORANGE }}
              >
                <Send className="h-4 w-4" aria-hidden />
                {sending ? 'שולח…' : 'שליחה למנהל'}
              </button>

              {feedback && (
                <p className="text-center text-sm text-gray-600">{feedback}</p>
              )}
            </section>

            <section className="flex w-full flex-col items-center justify-center gap-4 rounded-4xl border border-dashed border-gray-200 bg-white p-6">
              <div className="flex items-center justify-center gap-2 text-gray-500">
                <Upload className="h-5 w-5" style={{ color: ORANGE }} aria-hidden />
                <span className="font-bold">העלאת מסמכים</span>
              </div>
              <p className="text-center text-sm text-gray-400">בקרוב — העלאה לפרויקט (גישה חלקית)</p>
              <button
                type="button"
                disabled
                className="min-h-12 rounded-4xl border border-gray-200 px-8 font-medium text-gray-400"
              >
                בחר קובץ
              </button>
            </section>

            <div className="flex w-full max-w-lg flex-col items-center gap-4">
              <ProjectTimeline
                companyId={companyId}
                projectId={projectId}
                variant="client"
                heading="ציר עדכונים"
                subheading="הודעות, משימות ואבני דרך שהושלמו (ללא הערות פנימיות)"
                showFinanceFab={false}
              />
            </div>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/dashboard"
                className="inline-flex min-h-12 items-center justify-center rounded-[32px] border border-gray-200 px-6 font-bold text-gray-700"
              >
                לאזור הניהול
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
