export default function AppLoading() {
  return (
    <div className="grid gap-6">
      <section className="v2-panel v2-panel-soft p-6 sm:p-8">
        <div className="h-7 w-28 animate-pulse rounded-full bg-white/80" />
        <div className="mt-5 h-10 max-w-2xl animate-pulse rounded-3xl bg-white/80" />
        <div className="mt-4 h-6 max-w-3xl animate-pulse rounded-2xl bg-white/70" />
        <div className="mt-6 flex gap-3">
          <div className="h-12 w-36 animate-pulse rounded-2xl bg-white/85" />
          <div className="h-12 w-36 animate-pulse rounded-2xl bg-white/70" />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="v2-panel p-5">
            <div className="h-11 w-11 animate-pulse rounded-2xl bg-[color:var(--v2-accent-soft)]" />
            <div className="mt-4 h-4 w-24 animate-pulse rounded-full bg-white/75" />
            <div className="mt-3 h-8 w-28 animate-pulse rounded-2xl bg-white/85" />
          </div>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="v2-panel p-6">
          <div className="h-6 w-40 animate-pulse rounded-2xl bg-white/82" />
          <div className="mt-5 grid gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-20 animate-pulse rounded-[24px] bg-white/78" />
            ))}
          </div>
        </div>
        <div className="v2-panel v2-panel-highlight p-6">
          <div className="h-6 w-32 animate-pulse rounded-2xl bg-white/78" />
          <div className="mt-5 grid gap-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-24 animate-pulse rounded-2xl bg-white/75" />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
