"use client";

import Link from "next/link";

type Props = Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>;

export default function RootError({ error, reset }: Props) {
  const showDetail = process.env.NODE_ENV === "development" && Boolean(error?.message);

  return (
    <div
      className="mx-auto flex min-h-[50vh] max-w-lg flex-col justify-center gap-6 px-6 py-16 text-center"
      dir="rtl"
    >
      <h1 className="text-2xl font-black text-slate-900">אירעה תקלה בטעינה</h1>
      <p className="text-sm leading-relaxed text-slate-600">
        {showDetail ? error.message : "נסו שוב או חזרו לדף הבית. אם הבעיה נמשכת, רעננו את הדף."}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
        >
          לנסות שוב
        </button>
        <Link
          href="/"
          className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
        >
          דף הבית
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
