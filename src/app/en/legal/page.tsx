export default function LegalPage() {
  return (
    <div
      className="mx-auto min-h-screen max-w-3xl bg-[#FDFDFD] px-6 py-12 font-sans leading-relaxed text-slate-800 md:px-12 md:py-16"
      dir="ltr"
    >
      <header className="mb-12 border-b border-slate-200 pb-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Privacy Policy</h1>
        <p className="mt-2 text-sm font-medium text-slate-500">bsd-ybm · Last updated: March 2026</p>
      </header>

      <div className="flex flex-col gap-8">
        <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">1. Who we are</h2>
          <p className="text-slate-600">
            <span className="font-semibold text-slate-800">bsd-ybm</span> is a construction management platform.
            This policy describes how we handle information when you use our service.
          </p>
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">2. Sign-in with Google</h2>
          <p className="mb-4 text-slate-600">
            We offer sign-in with Google (OAuth). Google may share basic profile data with us, such as your name
            and email address, only as needed to create and secure your account.
          </p>
          <p className="text-slate-600">
            <span className="font-semibold text-slate-800">We use Google-provided data solely for authentication</span>{' '}
            and to identify you within the application. We do not use it for advertising and we do not sell it.
          </p>
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">3. Construction project management</h2>
          <p className="text-slate-600">
            Information you add while using bsd-ybm (for example project details, documents, or team activity) is
            processed to provide{' '}
            <span className="font-semibold text-slate-800">construction project management</span> features, such as
            planning, coordination, and record-keeping within your organization&apos;s workspace.
          </p>
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">4. Sharing & retention</h2>
          <p className="mb-4 text-slate-600">
            We do not sell your personal information. We do not share Google account data with third parties for
            their own marketing. We may use service providers who process data on our behalf under strict
            confidentiality, only to operate the platform.
          </p>
          <p className="text-slate-600">
            We retain data only as long as needed to provide the service and meet legal obligations.
          </p>
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-slate-50 p-6 md:p-8">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">5. Contact</h2>
          <p className="text-slate-600">
            Questions about this policy:{' '}
            <a href="mailto:sysybu@gmail.com" className="font-medium text-slate-900 underline underline-offset-2">
              sysybu@gmail.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
