"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { 
  Sparkles, 
  MessageSquare, 
  X, 
  Send, 
  Bot, 
  Minimize2, 
  Maximize2,
  BrainCircuit,
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ContextualAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();
  const scrollRef = useRef<HTMLDivElement>(null);

  // ברוך הבא לפי ההקשר של העמוד
  useEffect(() => {
    const contextMsg = getContextualWelcome(pathname);
    setMessages([{ role: 'assistant', content: contextMsg }]);
  }, [pathname]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  function getContextualWelcome(path: string) {
    if (path.includes("/crm")) return "היי! אני רואה שאתה בניהול הלקוחות. רוצה שאעזור לך לזהות לידים חמים או לנסח הצעת מחיר?";
    if (path.includes("/erp")) return "נכנסת לניהול ה-ERP. אני יכול לעזור לך להשוות מחירי ספקים או לבדוק תזרים מזומנים.";
    if (path.includes("/ai")) return "כאן מנוע הסריקה שלנו. פשוט תעלה קובץ ואני אוודא שהפענוח מדויק ב-100%.";
    if (path.includes("/executive")) return "שלום למנהל. אני מוכן לנתח עבורך את הנתונים העסקיים ולתת המלצות אסטרטגיות.";
    return "שלום! אני עוזר ה-AI שלך. איך אוכל לסייע לך לנהל את העסק טוב יותר היום?";
  }

  async function handleSend() {
    if (!input.trim() || loading) return;
    
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: userMsg, 
          context: pathname,
          history: messages 
        })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: "מצטער, הייתה לי תקלה בחיבור. נסה שוב בעוד רגע." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-6 left-6 z-[1001]" dir="rtl">
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 45 }}
            onClick={() => setIsOpen(true)}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-teal-600 to-teal-800 text-white shadow-2xl shadow-teal-500/30 hover:shadow-teal-500/50 transition-all hover:scale-110 active:scale-95 border-4 border-white"
          >
            <Sparkles size={28} className="animate-pulse" />
          </motion.button>
        )}

        {isOpen && (
          <motion.div
            initial={{ y: 50, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 50, opacity: 0, scale: 0.9 }}
            className={`flex flex-col rounded-3xl bg-white/95 backdrop-blur-md border border-teal-100 shadow-2xl transition-all duration-300 ${isMinimized ? 'h-16 w-64' : 'h-[500px] w-[350px]'}`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-t-[22px] cursor-pointer" onClick={() => setIsMinimized(!isMinimized)}>
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white/20 rounded-lg">
                  <Bot size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-black leading-none">BSD-YBM Assistant</h4>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-bold text-white/70">פעיל • מחובר ל-Context</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                  {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                </button>
                <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Chat Area */}
            {!isMinimized && (
              <>
                <div 
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50"
                  style={{ maskImage: 'linear-gradient(to bottom, transparent, black 10px)' }}
                >
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${
                        msg.role === 'user' 
                          ? 'bg-white border border-slate-100 text-slate-800 rounded-br-none' 
                          : 'bg-teal-600 text-white rounded-bl-none font-medium'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-end">
                      <div className="bg-teal-600/10 p-3 rounded-2xl rounded-bl-none">
                        <div className="flex gap-1">
                           <span className="h-1.5 w-1.5 rounded-full bg-teal-600 animate-bounce" />
                           <span className="h-1.5 w-1.5 rounded-full bg-teal-600 animate-bounce [animation-delay:0.2s]" />
                           <span className="h-1.5 w-1.5 rounded-full bg-teal-600 animate-bounce [animation-delay:0.4s]" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-slate-100 bg-white rounded-b-3xl">
                  <div className="flex items-center gap-2 p-1.5 bg-slate-50 rounded-2xl border border-slate-200 focus-within:ring-4 focus-within:ring-teal-500/10 focus-within:border-teal-500 transition-all">
                    <input 
                      type="text" 
                      placeholder="שאל אותי משהו על העסק..."
                      className="flex-1 px-3 py-2 text-sm bg-transparent outline-none text-slate-900"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <button 
                      onClick={handleSend}
                      disabled={!input.trim() || loading}
                      className="h-9 w-9 flex items-center justify-center rounded-xl bg-teal-600 text-white shadow-lg shadow-teal-200 hover:bg-teal-700 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
