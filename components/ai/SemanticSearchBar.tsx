"use client";

import { useState } from "react";
import { 
  Search, 
  Sparkles, 
  Loader2, 
  X, 
  ArrowRight,
  Zap,
  Filter
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type SemanticSearchBarProps = {
  onResults: (matchedIds: string[] | null) => void;
  placeholder?: string;
};

export default function SemanticSearchBar({ onResults, placeholder }: SemanticSearchBarProps) {
  const [query, setQuery] = useState("");
  const [isAiMode, setIsAiMode] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSearch() {
    if (!query.trim()) {
      onResults(null);
      return;
    }

    if (isAiMode) {
      setLoading(true);
      try {
        const res = await fetch("/api/crm/semantic-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query })
        });
        const data = await res.json();
        onResults(data.matchedIds || []);
      } catch (e) {
        console.error("Semantic search failed", e);
        onResults([]);
      } finally {
        setLoading(false);
      }
    } else {
        // Simple filter mode
        onResults(null); // Let the parent filter by text
    }
  }

  return (
    <div className="relative w-full max-w-2xl mx-auto group">
      <div className={`relative flex items-center bg-white border-2 rounded-2xl p-1.5 transition-all duration-300 ${isAiMode ? 'border-teal-500 ring-4 ring-teal-500/10' : 'border-slate-100 hover:border-slate-200 shadow-sm'}`}>
        
        {/* Sparkles Mode Toggle */}
        <button
          onClick={() => setIsAiMode(!isAiMode)}
          className={`flex-none px-3 py-2 rounded-xl flex items-center gap-2 transition-all ${isAiMode ? 'bg-teal-600 text-white shadow-lg' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
        >
          <Sparkles size={16} className={isAiMode ? 'animate-pulse' : ''} />
          <span className="text-xs font-black uppercase tracking-wider hidden sm:inline">AI Search</span>
        </button>

        <div className="flex-1 flex items-center px-3 gap-2">
          {!isAiMode && <Search size={18} className="text-slate-400" />}
          <input 
            type="text"
            placeholder={isAiMode ? "שאל את ה-AI על נתוני הלקוחות שלך..." : placeholder || "חפש לפי שם, אימייל או נייד..."}
            className="w-full text-sm font-medium bg-transparent border-none outline-none text-slate-900 placeholder:text-slate-400"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>

        <div className="flex items-center gap-1">
          {query && (
            <button onClick={() => { setQuery(""); onResults(null); }} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
              <X size={16} />
            </button>
          )}
          <button 
            onClick={handleSearch}
            disabled={loading}
            className={`flex-none px-4 py-2 rounded-xl font-bold text-xs transition-all ${isAiMode ? 'bg-teal-600 text-white hover:bg-teal-700' : 'bg-slate-900 text-white hover:bg-black'}`}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : (isAiMode ? "שאל AI" : "חפש")}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isAiMode && !loading && !query && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-0 right-0 mt-3 p-4 bg-white/95 backdrop-blur-md rounded-2xl border border-teal-100 shadow-xl z-20"
          >
             <p className="text-[10px] font-black text-teal-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Zap size={10} /> הצעות לחיפוש חכם
             </p>
             <div className="flex flex-wrap gap-2">
                {[
                  "לקוחות שחייבים כסף", 
                  "לידים חמים מהשבוע האחרון", 
                  "חברות הייטק עם שווי עסקה גבוה",
                  "לקוחות שצריכים הצעת מחיר"
                ].map((s, i) => (
                  <button 
                    key={i} 
                    onClick={() => { setQuery(s); }}
                    className="px-3 py-1.5 bg-teal-50 text-teal-700 text-xs font-bold rounded-lg border border-teal-100 hover:bg-teal-100 transition-colors"
                  >
                    {s}
                  </button>
                ))}
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
