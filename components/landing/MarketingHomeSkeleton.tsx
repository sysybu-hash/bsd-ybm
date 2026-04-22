/** שלד טעינה לדף הבית השיווקי — קל, ללא אייקונים כבדים */
export default function MarketingHomeSkeleton() {
  return (
    <div
      className="bento-site-shell min-h-[70vh] animate-pulse"
      aria-busy="true"
      aria-label="טוען דף הבית"
    >
      <div className="sticky top-0 z-40 border-b border-[color:var(--line)] bg-[color:var(--canvas-raised)]/90 px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-7xl justify-between gap-4">
          <div className="h-10 w-40 rounded-xl bg-[color:var(--canvas-sunken)]" />
          <div className="hidden gap-3 sm:flex">
            <div className="h-9 w-24 rounded-xl bg-[color:var(--canvas-sunken)]" />
            <div className="h-9 w-28 rounded-xl bg-[color:var(--canvas-sunken)]" />
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-12 sm:px-6 lg:px-8">
        <div className="h-4 w-32 rounded bg-[color:var(--canvas-sunken)]" />
        <div className="h-14 max-w-2xl rounded-xl bg-[color:var(--canvas-sunken)]" />
        <div className="h-24 max-w-xl rounded-xl bg-[color:var(--canvas-sunken)]" />
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="h-32 rounded-2xl bg-[color:var(--canvas-sunken)]" />
          <div className="h-32 rounded-2xl bg-[color:var(--canvas-sunken)]" />
          <div className="h-32 rounded-2xl bg-[color:var(--canvas-sunken)]" />
        </div>
      </div>
    </div>
  );
}
