'use client';

import React, { useState } from 'react';
import { addDoc, serverTimestamp } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { Send, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { projectCommunicationsRef } from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';
import type { ProjectCommunication } from '@/types/multitenant';

const ORANGE = '#FF8C00';
const BLUE = '#004694';

export default function ProjectStaffComposer({
  companyId,
  projectId,
}: {
  companyId: string;
  projectId: string;
}) {
  const { user } = useAuth();
  const [kind, setKind] = useState<ProjectCommunication['kind']>('message');
  const [body, setBody] = useState('');
  const [internal, setInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const send = async () => {
    if (!user || !body.trim()) return;
    if (!isFirebaseConfigured()) {
      setMsg('Firebase לא מוגדר');
      return;
    }
    setSending(true);
    setMsg(null);
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
        ...(internal ? { internal: true, visibility: 'internal' as const } : {}),
      };
      await addDoc(ref, payload);
      setBody('');
      setMsg(internal ? 'הערה פנימית נשמרה (לא תוצג ללקוח).' : 'נשלח לציר הזמן.');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'שליחה נכשלה');
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="flex w-full max-w-2xl flex-col items-center justify-center gap-4 rounded-4xl border border-gray-100 bg-[#FDFDFD] p-6 pt-safe sm:p-8">
      <h2 className="text-center text-lg font-black text-[#004694]">הודעה מהדשבורד</h2>
      <p className="text-center text-xs text-gray-500">
        סמנו &quot;הערה פנימית&quot; כדי שלא תופיע בפורטל הלקוחות
      </p>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => setKind('message')}
          className={`min-h-12 rounded-4xl px-6 font-bold ${
            kind === 'message' ? 'text-white' : 'border border-gray-200 bg-white'
          }`}
          style={kind === 'message' ? { backgroundColor: BLUE } : undefined}
        >
          הודעה
        </button>
        <button
          type="button"
          onClick={() => setKind('task')}
          className={`min-h-12 rounded-4xl px-6 font-bold ${
            kind === 'task' ? 'text-white' : 'border border-gray-200 bg-white'
          }`}
          style={kind === 'task' ? { backgroundColor: ORANGE } : undefined}
        >
          משימה
        </button>
      </div>

      <label className="flex cursor-pointer items-center justify-center gap-3 rounded-4xl border border-gray-200 bg-white px-4 py-3">
        <input
          type="checkbox"
          checked={internal}
          onChange={(e) => setInternal(e.target.checked)}
          className="h-5 w-5 rounded accent-[#004694]"
        />
        <Lock className="h-4 w-4 text-gray-500" aria-hidden />
        <span className="text-sm font-bold text-gray-700">הערה פנימית (לא ללקוח)</span>
      </label>

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        placeholder="תוכן ההודעה…"
        className="min-h-[120px] w-full rounded-4xl border border-gray-200 bg-white p-4 text-center text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#FF8C00]"
        dir="rtl"
      />

      <motion.button
        type="button"
        disabled={sending || !body.trim()}
        onClick={() => void send()}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex min-h-12 w-full max-w-xs items-center justify-center gap-2 rounded-4xl font-bold text-white disabled:opacity-50"
        style={{
          backgroundColor: internal ? '#64748b' : ORANGE,
          boxShadow: internal ? undefined : `0 0 20px ${ORANGE}66`,
        }}
      >
        <Send className="h-4 w-4" />
        {sending ? 'שולח…' : internal ? 'שמור פנימי' : 'שלח לפרויקט'}
      </motion.button>

      {msg && <p className="text-center text-sm text-gray-600">{msg}</p>}
    </section>
  );
}
