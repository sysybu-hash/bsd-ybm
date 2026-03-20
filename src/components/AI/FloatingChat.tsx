'use client';

import React, { useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { sendGlobalChatMessage } from '@/services/aiService';

const ORANGE = '#FF8C00';

type LocalMessage = { role: 'user' | 'assistant'; content: string };

export default function FloatingChat() {
  const pathname = usePathname();
  const { user } = useAuth();

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<LocalMessage[]>([]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const reply = await sendGlobalChatMessage({
        message: userMessage,
        pathname,
        uid: user?.uid ?? null,
        engine: 'groq',
      });

      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: err instanceof Error ? err.message : 'שגיאה לא צפויה',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.button
        type="button"
        className="fixed z-[60] flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#004694]"
        style={{
          backgroundColor: ORANGE,
          bottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))',
          left: 'max(1.5rem, env(safe-area-inset-left, 0px))',
        }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => setOpen((v) => !v)}
        aria-label="פתח צ'אט"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="fixed z-[60] flex max-h-[min(85dvh,32rem)] w-[min(360px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[40px] border border-gray-100 bg-white shadow-[0_18px_50px_rgba(0,0,0,0.12)]"
            style={{
              bottom: 'max(6.5rem, calc(env(safe-area-inset-bottom, 0px) + 5.5rem))',
              left: 'max(1.5rem, env(safe-area-inset-left, 0px))',
            }}
            dir="rtl"
          >
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-gray-100 px-4 py-3 sm:px-5 sm:py-4">
              <h3 className="truncate font-bold text-[#1a1a1a]">BSD-YBM Assistant</h3>
              <span className="max-w-[40%] truncate text-xs text-gray-500">{pathname}</span>
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain bg-white px-4 py-3">
              {messages.length === 0 ? (
                <p className="text-sm text-gray-400 text-center mt-20">אפשר לשאול שאלה...</p>
              ) : (
                messages.map((m, i) => (
                  <div
                    key={`${m.role}-${i}`}
                    className={`px-4 py-3 rounded-[24px] text-sm whitespace-pre-wrap ${
                      m.role === 'user'
                        ? 'bg-[#FF8C00] text-white mr-auto max-w-[80%]'
                        : 'bg-gray-100 text-gray-700 ml-auto max-w-[90%]'
                    }`}
                  >
                    {m.content}
                  </div>
                ))
              )}
            </div>

            <form
              onSubmit={handleSend}
              className="flex shrink-0 items-center gap-2 border-t border-gray-100 p-3 pb-safe"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="כתוב הודעה..."
                className="min-h-12 flex-1 rounded-[32px] border border-gray-200 px-4 py-3 text-base outline-none focus-visible:border-[#FF8C00] focus-visible:ring-2 focus-visible:ring-[#FF8C00]/30"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white transition-opacity active:opacity-90 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#004694]"
                style={{ backgroundColor: ORANGE }}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
