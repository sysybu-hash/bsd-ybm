import Link from 'next/link';

export default function HomePage() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-[#FDFDFD] p-6 font-sans text-slate-900 md:p-12"
      dir="ltr"
    >
      <main className="flex w-full max-w-2xl flex-grow flex-col items-center justify-center gap-8 text-center">
        <div className="flex flex-col items-center justify-center gap-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Application</p>
          <h1 className="text-5xl font-bold tracking-tight text-slate-900 md:text-6xl">bsd-ybm</h1>
          <p className="max-w-md text-lg text-slate-600">Construction Management Platform</p>
        </div>

        <div className="w-full rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm md:p-10">
          <p className="mb-6 text-center text-base leading-relaxed text-slate-600 md:text-lg">
            Plan, coordinate, and track construction projects in one place. bsd-ybm helps teams manage tasks,
            documentation, and workflows for professional building and infrastructure work.
          </p>
          <div className="flex items-center justify-center">
            <span className="rounded-[32px] bg-slate-900 px-6 py-3 text-sm font-semibold text-white">
              Sign in to access your dashboard
            </span>
          </div>
        </div>
      </main>

      <footer className="mt-12 flex w-full max-w-2xl flex-col items-center justify-center gap-4 border-t border-slate-200 pt-8 text-center text-sm text-slate-500">
        <p className="font-medium text-slate-600">© 2026 bsd-ybm</p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/en/legal"
            className="font-medium text-slate-900 underline underline-offset-4 transition-opacity hover:opacity-70"
          >
            Privacy Policy
          </Link>
        </div>
      </footer>
    </div>
  );
}
