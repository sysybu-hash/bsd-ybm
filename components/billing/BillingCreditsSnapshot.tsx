type ActivityRow = {
  action: string;
  details: string | null;
  createdAt: Date;
};

type Props = {
  cheap: number;
  premium: number;
  tier: string;
  recent: ActivityRow[];
};

/** תצוגת יתרות והיסטוריית פעילות קשורה לקרדיטים (שרת) */
export default function BillingCreditsSnapshot({ cheap, premium, tier, recent }: Props) {
  return (
    <section
      className="rounded-[28px] border border-[color:var(--cd-line)] bg-[color:var(--cd-bg-raised)] p-5 shadow-[var(--cd-shadow)]"
      dir="rtl"
    >
      <h2 className="text-lg font-black text-[color:var(--ink-900)]">הקרדיטים שלי</h2>
      <p className="mt-1 text-sm text-[color:var(--ink-500)]">
        מסלול: <span className="font-bold text-[color:var(--ink-800)]">{tier}</span>
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-[color:var(--cd-line)] bg-white/90 p-4">
          <p className="text-[11px] font-black uppercase tracking-wide text-[color:var(--ink-400)]">זול</p>
          <p className="mt-1 text-2xl font-black tabular-nums text-[color:var(--ink-900)]">{cheap}</p>
        </div>
        <div className="rounded-2xl border border-[color:var(--cd-line)] bg-white/90 p-4">
          <p className="text-[11px] font-black uppercase tracking-wide text-[color:var(--ink-400)]">פרימיום</p>
          <p className="mt-1 text-2xl font-black tabular-nums text-[color:var(--ink-900)]">{premium}</p>
        </div>
      </div>
      <div className="mt-6">
        <p className="text-xs font-black uppercase tracking-wide text-[color:var(--ink-400)]">
          פעילות אחרונה (30 יום)
        </p>
        {recent.length === 0 ? (
          <p className="mt-2 text-sm text-[color:var(--ink-500)]">אין רישומים בתקופה זו.</p>
        ) : (
          <ul className="mt-2 max-h-52 space-y-2 overflow-y-auto text-sm">
            {recent.map((row) => (
              <li
                key={`${row.createdAt.toISOString()}-${row.action}`}
                className="flex flex-wrap items-baseline justify-between gap-2 rounded-xl border border-[color:var(--cd-line)] bg-[color:var(--cd-bg-sunken)] px-3 py-2"
              >
                <span className="font-bold text-[color:var(--ink-800)]">{row.action}</span>
                <time className="text-xs text-[color:var(--ink-500)]" dateTime={row.createdAt.toISOString()}>
                  {row.createdAt.toLocaleString("he-IL")}
                </time>
                {row.details ? (
                  <span className="w-full truncate text-xs text-[color:var(--ink-600)]">{row.details}</span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
