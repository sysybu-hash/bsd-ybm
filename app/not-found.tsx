import Link from "next/link";

export default function NotFound() {
  return (
    <div
      className="mx-auto flex min-h-[50vh] max-w-lg flex-col justify-center gap-6 px-6 py-16 text-center"
      dir="rtl"
    >
      <p className="text-sm font-bold uppercase tracking-widest text-slate-500">404</p>
      <h1 className="text-3xl font-black text-slate-900">העמוד לא נמצא</h1>
      <p className="leading-relaxed text-slate-600">
        הקישור שגוי או שהתוכן הועבר. אפשר לחזור לדף הבית, למרחב העבודה או להתחברות.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
        >
          דף הבית
        </Link>
        <Link
          href="/app"
          className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
        >
          מרחב העבודה
        </Link>
        <Link
          href="/login"
          className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
        >
          התחברות
        </Link>
      </div>
    </div>
  );
}
