const NAV = ["בית", "מרכז עסקי", "חשבוניות", "לקוחות", "AI", "הגדרות"];
const STATS = ["לקוחות", "חשבוניות", "מסמכים", "הכנסות"];
const ACTIONS = ["הנפק חשבונית", "מרכז עסקי", "הגדרות"];

export default function DesignPreviewPage() {
  return (
    <div className="min-h-screen bg-[#080810] p-8 font-sans" dir="rtl">
      <div className="text-center mb-14">
        <div className="mb-4 inline-block rounded-full border border-gray-200 bg-white/8 px-4 py-1.5 text-xs uppercase tracking-widest text-gray-500">
          עיצוב — בחר אחד
        </div>
        <h1 className="text-5xl font-black text-white mb-4 tracking-tight">
          איזה עיצוב אתה רוצה?
        </h1>
        <p className="text-gray-400 text-lg">6 סגנונות שונים — אמור לי A עד F ואני אבנה הכל מחדש</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-7 max-w-7xl mx-auto">

        {/* A - AURORA DARK */}
        <div className="cursor-pointer overflow-hidden rounded-2xl ring-1 ring-gray-200 shadow-xl shadow-black/20 transition-all duration-300 hover:scale-[1.02] hover:ring-teal-400/60">
          <div className="bg-gradient-to-r from-teal-600 to-sky-500 text-white text-center py-2.5 text-sm font-bold tracking-wide">
            A — Aurora Dark
          </div>
          <div className="flex h-[400px]">
            <div className="w-[155px] bg-[#0d0d1a] border-l border-white/5 flex flex-col py-5 px-3 shrink-0 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-teal-600/20 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center gap-2 mb-7 px-1 relative">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-sky-500 flex items-center justify-center text-white text-xs font-black shadow-lg shadow-teal-500/40">B</div>
                <span className="text-xs font-black text-white tracking-wider">BSD-YBM</span>
              </div>
              {NAV.map((item, i) => (
                <div key={item} className={`flex items-center gap-2.5 px-2 py-1.5 rounded-xl text-[11px] mb-0.5 font-medium ${
                  i === 0 ? "bg-gradient-to-r from-teal-500/20 to-sky-500/20 text-teal-100 border border-teal-500/20" : "text-gray-400 hover:text-gray-500"
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${i === 0 ? "bg-teal-400" : "bg-white/15"}`} />
                  {item}
                </div>
              ))}
            </div>
            <div className="flex-1 bg-[#10101f] p-4 overflow-hidden relative">
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />
              <div className="text-[10px] text-gray-400 mb-1">בוקר טוב ✦</div>
              <h2 className="text-sm font-black text-white mb-4">לוח הבקרה</h2>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {[{l:"לקוחות",c:"from-teal-500/15 to-sky-500/15 border-teal-500/20"},{l:"חשבוניות",c:"from-teal-500/15 to-cyan-500/15 border-teal-500/20"},{l:"מסמכים",c:"from-emerald-500/15 to-teal-500/15 border-emerald-500/20"},{l:"הכנסות",c:"from-amber-500/15 to-orange-500/15 border-amber-500/20"}].map((s) => (
                  <div key={s.l} className={`bg-gradient-to-br ${s.c} border rounded-2xl p-2.5`}>
                    <div className="text-[9px] text-gray-400 mb-1">{s.l}</div>
                    <div className="text-sm font-black text-gray-700">—</div>
                  </div>
                ))}
              </div>
              <div className="bg-white/3 border border-white/8 rounded-2xl p-3">
                {ACTIONS.map((a) => (
                  <div key={a} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                    <span className="text-[10px] text-gray-500">{a}</span>
                    <span className="text-teal-400/50 text-[10px]">←</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-[#0d0d1a] border-t border-white/5 px-4 py-2.5 text-center text-[10px] text-gray-300">
            Deep Navy · Aurora Glow · Gradient Accents
          </div>
        </div>

        {/* B - NEON GLASS */}
        <div className="cursor-pointer overflow-hidden rounded-2xl ring-1 ring-gray-200 shadow-xl shadow-black/20 transition-all duration-300 hover:scale-[1.02] hover:ring-cyan-400/60">
          <div className="bg-gradient-to-r from-cyan-500 to-teal-600 text-white text-center py-2.5 text-sm font-bold tracking-wide">
            B — Neon Glass
          </div>
          <div className="flex h-[400px] bg-[#050d1a]">
            <div className="w-[155px] bg-black/40 border-l border-cyan-500/10 flex flex-col py-5 px-3 shrink-0 relative overflow-hidden">
              <div className="absolute top-10 right-5 w-16 h-16 bg-cyan-400/20 rounded-full blur-xl" />
              <div className="flex items-center gap-2 mb-7 px-1 relative">
                <div className="w-8 h-8 rounded-xl bg-cyan-400/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 text-xs font-black">B</div>
                <span className="text-xs font-black text-cyan-100">BSD-YBM</span>
              </div>
              {NAV.map((item, i) => (
                <div key={item} className={`flex items-center gap-2.5 px-2 py-1.5 rounded-xl text-[11px] mb-0.5 font-medium ${
                  i === 0 ? "bg-cyan-400/10 text-cyan-300 border border-cyan-400/20" : "text-gray-400 hover:text-cyan-200/60"
                }`}>
                  <div className={`w-4 h-4 rounded-lg shrink-0 flex items-center justify-center text-[8px] ${i === 0 ? "bg-cyan-400/20 text-cyan-300" : "bg-gray-50 text-gray-300"}`}>◆</div>
                  {item}
                </div>
              ))}
            </div>
            <div className="flex-1 p-4 overflow-hidden relative">
              <div className="absolute top-10 left-10 w-48 h-48 bg-cyan-500/8 rounded-full blur-3xl" />
              <div className="text-[10px] text-cyan-400/40 mb-1 font-mono">/ dashboard</div>
              <h2 className="text-sm font-black text-white mb-4">לוח הבקרה</h2>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {STATS.map((s) => (
                  <div key={s} className="bg-white/3 border border-white/8 rounded-2xl p-2.5">
                    <div className="text-[9px] text-gray-400 font-mono mb-1">{s}</div>
                    <div className="text-sm font-black text-gray-600">—</div>
                  </div>
                ))}
              </div>
              <div className="bg-black/30 border border-white/6 rounded-2xl p-3">
                {ACTIONS.map((a) => (
                  <div key={a} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                    <span className="text-[10px] text-gray-400 font-mono">{a}</span>
                    <span className="text-cyan-400/40 text-[10px]">‹</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-black/60 border-t border-cyan-500/10 px-4 py-2.5 text-center text-[10px] text-cyan-400/30 font-mono tracking-widest">
            GLASSMORPHISM · NEON CYAN · DARK
          </div>
        </div>

        {/* C - CLEAN MINIMAL */}
        <div className="cursor-pointer overflow-hidden rounded-2xl bg-white ring-1 ring-gray-200 shadow-xl shadow-black/15 transition-all duration-300 hover:scale-[1.02] hover:ring-gray-400/40">
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white text-center py-2.5 text-sm font-bold tracking-wide">
            C — מינימלי לבן (Notion / Linear)
          </div>
          <div className="flex h-[400px]">
            <div className="w-[155px] bg-white border-l border-gray-100 flex flex-col py-5 px-3 shrink-0">
              <div className="flex items-center gap-2 mb-7 px-1">
                <div className="w-8 h-8 rounded-xl bg-gray-900 flex items-center justify-center text-white text-xs font-black">B</div>
                <span className="text-xs font-black text-gray-900">BSD-YBM</span>
              </div>
              {NAV.map((item, i) => (
                <div key={item} className={`flex items-center gap-2 px-2 py-2 rounded-lg text-[11px] mb-0.5 font-medium ${
                  i === 0 ? "bg-teal-600 text-white" : "text-gray-400 hover:bg-gray-50"
                }`}>
                  <div className={`w-1 h-3.5 rounded-full shrink-0 ${i === 0 ? "bg-gray-900" : "bg-transparent"}`} />
                  {item}
                </div>
              ))}
            </div>
            <div className="flex-1 bg-[#fafafa] p-5 overflow-hidden">
              <p className="text-[10px] text-gray-400 mb-1">BSD-YBM Active</p>
              <h2 className="text-base font-black text-gray-900 mb-5 tracking-tight">לוח הבקרה</h2>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {STATS.map((s) => (
                  <div key={s} className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
                    <div className="text-[9px] text-gray-400 mb-1 uppercase tracking-wider">{s}</div>
                    <div className="text-base font-black text-gray-700">—</div>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="px-3 py-2 border-b border-gray-100">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">פעולות</span>
                </div>
                {ACTIONS.map((a) => (
                  <div key={a} className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100 last:border-0">
                    <span className="text-[11px] font-medium text-gray-600">{a}</span>
                    <span className="text-gray-200 text-xs">→</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-gray-50 border-t border-gray-100 px-4 py-2.5 text-center text-[10px] text-gray-400">
            White · Clean · No gradients · Notion-style
          </div>
        </div>

        {/* D - OBSIDIAN PRO */}
        <div className="cursor-pointer overflow-hidden rounded-2xl ring-1 ring-gray-200 shadow-xl shadow-black/20 transition-all duration-300 hover:scale-[1.02] hover:ring-white/30">
          <div className="bg-white text-black text-center py-2.5 text-sm font-bold tracking-wide">
            D — Obsidian Pro (Vercel / Raycast)
          </div>
          <div className="flex h-[400px]">
            <div className="w-[155px] bg-black border-l border-white/6 flex flex-col py-5 px-3 shrink-0">
              <div className="flex items-center gap-2 mb-7 px-1">
                <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-black text-xs font-black">B</div>
                <span className="text-xs font-black text-white">BSD-YBM</span>
              </div>
              {NAV.map((item, i) => (
                <div key={item} className={`flex items-center gap-2.5 px-2 py-2 rounded-lg text-[11px] mb-0.5 font-medium ${
                  i === 0 ? "bg-white text-black" : "text-gray-400 hover:bg-white/6"
                }`}>
                  {item}
                </div>
              ))}
              <div className="mt-auto pt-3 border-t border-white/8">
                <div className="text-[9px] text-gray-300 px-2">ישראל כ. — Pro</div>
              </div>
            </div>
            <div className="flex-1 bg-[#0a0a0a] p-4 overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-black text-white">לוח הבקרה</h2>
                <div className="bg-white text-black text-[9px] font-bold px-2 py-0.5 rounded-full">Pro</div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {STATS.map((s) => (
                  <div key={s} className="bg-white/4 rounded-xl p-2.5 border border-white/6">
                    <div className="text-[9px] text-gray-400 uppercase tracking-wider mb-1">{s}</div>
                    <div className="text-sm font-black text-white">—</div>
                  </div>
                ))}
              </div>
              <div className="bg-white/3 rounded-xl border border-white/6">
                {ACTIONS.map((a) => (
                  <div key={a} className="flex items-center justify-between px-3 py-2.5 border-b border-white/5 last:border-0">
                    <span className="text-[11px] font-medium text-gray-500">{a}</span>
                    <span className="text-gray-300 text-xs">←</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-black border-t border-white/6 px-4 py-2.5 text-center text-[10px] text-gray-300 tracking-widest uppercase">
            Pure Black · High Contrast · Bold Type
          </div>
        </div>

        {/* E - INDIGO SAAS */}
        <div className="cursor-pointer overflow-hidden rounded-2xl ring-1 ring-gray-200 shadow-xl shadow-black/20 transition-all duration-300 hover:scale-[1.02] hover:ring-teal-400/60">
          <div className="bg-gradient-to-r from-teal-600 to-sky-500 text-white text-center py-2.5 text-sm font-bold tracking-wide">
            E — Indigo SaaS (Stripe / Linear)
          </div>
          <div className="flex h-[400px]">
            <div className="w-[155px] bg-teal-950 flex flex-col py-5 px-3 shrink-0">
              <div className="flex items-center gap-2 mb-7 px-1">
                <div className="w-8 h-8 rounded-xl bg-teal-400 flex items-center justify-center text-white text-xs font-black shadow-lg shadow-teal-500/40">B</div>
                <span className="text-xs font-black text-teal-100">BSD-YBM</span>
              </div>
              <div className="text-[9px] text-teal-400/40 uppercase tracking-widest px-2 mb-2 font-semibold">ניווט</div>
              {NAV.map((item, i) => (
                <div key={item} className={`flex items-center gap-2 px-2 py-1.5 rounded-xl text-[11px] mb-0.5 font-medium ${
                  i === 0 ? "bg-teal-500/25 text-teal-100 border-r-2 border-teal-400" : "text-teal-300/40 hover:bg-teal-500/10"
                }`}>
                  <div className={`w-4 h-4 rounded-md shrink-0 ${i === 0 ? "bg-teal-400/30" : "bg-teal-500/15"}`} />
                  {item}
                </div>
              ))}
            </div>
            <div className="flex-1 bg-white p-4 overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-[10px] text-gray-400 mb-0.5">בוקר טוב, ישראל</div>
                  <h2 className="text-sm font-black text-white">לוח הבקרה</h2>
                </div>
                <div className="bg-teal-600 text-white text-[9px] font-bold px-2.5 py-1 rounded-full">Pro ✦</div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {[{l:"לקוחות",bg:"bg-teal-500/15 border-teal-500/20 text-teal-300"},{l:"חשבוניות",bg:"bg-sky-50 border-sky-100 text-sky-700"},{l:"מסמכים",bg:"bg-emerald-500/15 border-emerald-100 text-emerald-400"},{l:"הכנסות",bg:"bg-amber-500/15 border-amber-100 text-amber-400"}].map((s) => (
                  <div key={s.l} className={`${s.bg} border rounded-xl p-2.5`}>
                    <div className="text-[9px] font-semibold mb-1 opacity-70 uppercase tracking-wider">{s.l}</div>
                    <div className="text-sm font-black">—</div>
                  </div>
                ))}
              </div>
              <div className="bg-gray-50 rounded-xl border border-gray-100">
                {ACTIONS.map((a, i) => (
                  <div key={a} className="flex items-center justify-between px-3 py-2 border-b border-gray-100 last:border-0">
                    <span className={`text-[11px] font-semibold ${["text-teal-400","text-sky-600","text-gray-500"][i]}`}>{a}</span>
                    <span className="text-gray-200">←</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-teal-950 border-t border-teal-800/50 px-4 py-2.5 text-center text-[10px] text-teal-400/30">
            Indigo Dark Sidebar · White Content · Colorful Stats
          </div>
        </div>

        {/* F - SUNSET BOLD */}
        <div className="cursor-pointer overflow-hidden rounded-2xl ring-1 ring-gray-200 shadow-xl shadow-black/20 transition-all duration-300 hover:scale-[1.02] hover:ring-orange-400/60">
          <div className="bg-gradient-to-r from-orange-500 via-rose-500 to-pink-600 text-white text-center py-2.5 text-sm font-bold tracking-wide">
            F — Sunset Bold (עז ועתידני)
          </div>
          <div className="flex h-[400px]">
            <div className="w-[155px] bg-[#120a0e] flex flex-col py-5 px-3 shrink-0 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/15 rounded-full blur-2xl" />
              <div className="flex items-center gap-2 mb-7 px-1 relative">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-white text-xs font-black shadow-lg shadow-rose-500/40">B</div>
                <span className="text-xs font-black text-white">BSD-YBM</span>
              </div>
              {NAV.map((item, i) => (
                <div key={item} className={`flex items-center gap-2 px-2 py-1.5 rounded-xl text-[11px] mb-0.5 font-medium ${
                  i === 0 ? "bg-gradient-to-r from-orange-500/20 to-rose-500/20 text-orange-200 border border-orange-400/20" : "text-gray-400 hover:text-gray-500"
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${i === 0 ? "bg-orange-400" : "bg-white/15"}`} />
                  {item}
                </div>
              ))}
            </div>
            <div className="flex-1 bg-[#0e0810] p-4 overflow-hidden relative">
              <div className="absolute bottom-5 right-5 w-32 h-32 bg-rose-500/8 rounded-full blur-3xl" />
              <div className="text-[10px] text-gray-400 mb-1">ברוך הבא ✦</div>
              <h2 className="text-sm font-black text-white mb-4" style={{background:"linear-gradient(to left, #fb923c, #f43f5e)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent"}}>לוח הבקרה</h2>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {[{l:"לקוחות",c:"border-orange-500/20 bg-orange-500/8"},{l:"חשבוניות",c:"border-rose-500/20 bg-rose-500/8"},{l:"מסמכים",c:"border-pink-500/20 bg-pink-500/8"},{l:"הכנסות",c:"border-amber-500/20 bg-amber-500/8"}].map((s) => (
                  <div key={s.l} className={`border ${s.c} rounded-2xl p-2.5`}>
                    <div className="text-[9px] text-gray-400 mb-1">{s.l}</div>
                    <div className="text-sm font-black text-gray-600">—</div>
                  </div>
                ))}
              </div>
              <div className="bg-white/3 border border-white/6 rounded-2xl p-3">
                {ACTIONS.map((a) => (
                  <div key={a} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                    <span className="text-[10px] text-gray-400">{a}</span>
                    <span className="text-rose-400/40 text-[10px]">←</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-[#120a0e] border-t border-white/5 px-4 py-2.5 text-center text-[10px] text-rose-400/25">
            Sunset Gradient · Dark Bold · Futuristic
          </div>
        </div>

      </div>

      <div className="mt-14 text-center">
        <p className="text-gray-400 text-base">אמור לי <span className="text-gray-500 font-bold">A, B, C, D, E</span> או <span className="text-gray-500 font-bold">F</span> — ואני אבנה את כל האתר מחדש</p>
      </div>
    </div>
  );
}
