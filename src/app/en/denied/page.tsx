import Link from 'next/link';

export default function AccessDeniedPage() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-[#FDFDFD] p-6 font-sans text-slate-800 md:p-12"
      dir="ltr"
    >
      <div className="w-full max-w-md space-y-6 rounded-[32px] border border-slate-200 bg-white p-8 text-center shadow-sm md:p-10">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Access denied</h1>
        <p className="text-base leading-relaxed text-slate-600">
          Your Google account is not on the approved list for BSD-YBM. Access is limited to users who have
          been granted permission by an administrator.
        </p>
        <p className="text-sm text-slate-500">
          If you believe you should have access, contact your admin and ask them to add your email to the
          allowed users list.
        </p>
        <div className="flex flex-col items-center justify-center gap-4 pt-4">
          <Link
            href="/login"
            className="font-medium text-slate-900 underline underline-offset-4 hover:opacity-70"
          >
            Back to sign in
          </Link>
          <Link href="/" className="text-sm text-slate-500 underline underline-offset-4 hover:text-slate-800">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
