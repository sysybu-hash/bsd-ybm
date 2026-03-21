import Link from 'next/link';

export default function TermsPage() {
  return (
    <div
      className="mx-auto min-h-screen max-w-3xl bg-[#FDFDFD] px-6 py-12 font-sans leading-relaxed text-slate-800 md:px-12 md:py-16"
      dir="ltr"
    >
      <header className="mb-12 border-b border-slate-200 pb-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Terms of Service</h1>
        <p className="mt-2 text-sm font-medium text-slate-500">BSD-YBM · Last updated: March 2026</p>
        <p className="mx-auto mt-6 max-w-xl text-sm text-slate-600" dir="rtl">
          מסמך משפטי באנגלית.{' '}
          <Link href="/" className="font-semibold text-[#004694] underline underline-offset-2" hrefLang="he">
            חזרה לדף הבית בעברית
          </Link>
        </p>
      </header>

      <div className="flex flex-col gap-8">
        <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">1. Agreement</h2>
          <p className="text-slate-600">
            By accessing or using <span className="font-semibold text-slate-800">BSD-YBM</span>, you agree to these
            Terms of Service. If you do not agree, do not use the service.
          </p>
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">2. The service</h2>
          <p className="mb-4 text-slate-600">
            BSD-YBM is a <span className="font-semibold text-slate-800">construction management platform</span> for
            authorized users. Features may include project coordination, documentation, and related workflows. We may
            update or change the service with reasonable notice where appropriate.
          </p>
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">3. Accounts and Google sign-in</h2>
          <p className="mb-4 text-slate-600">
            You may sign in with Google. You are responsible for maintaining the security of your account and for
            activity under your account. You must provide accurate information.
          </p>
          <p className="text-slate-600">
            Use of Google sign-in is also subject to Google&apos;s terms and policies. We use Google data only as
            described in our{' '}
            <Link href="/en/legal" className="font-medium text-slate-900 underline underline-offset-2">
              Privacy Policy
            </Link>
            .
          </p>
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">4. Acceptable use</h2>
          <p className="mb-4 text-slate-600">
            You agree not to misuse the service: no unlawful activity, no attempt to gain unauthorized access, no
            interference with other users or infrastructure, and no uploading of malicious content.
          </p>
          <p className="text-slate-600">
            You retain responsibility for the legality and accuracy of content you submit (for example project data
            and documents).
          </p>
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">5. Disclaimer and limitation</h2>
          <p className="mb-4 text-slate-600">
            The service is provided &quot;as is&quot; to the extent permitted by law. We do not guarantee uninterrupted
            or error-free operation. To the maximum extent permitted by law, we are not liable for indirect or
            consequential damages arising from your use of the service.
          </p>
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">6. Changes and termination</h2>
          <p className="text-slate-600">
            We may modify these terms; the &quot;Last updated&quot; date will change. Continued use after changes
            constitutes acceptance. We may suspend or terminate access for violations of these terms or for operational
            reasons.
          </p>
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-slate-50 p-6 md:p-8">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">7. Contact</h2>
          <p className="text-slate-600">
            Questions about these terms:{' '}
            <a href="mailto:sysybu@gmail.com" className="font-medium text-slate-900 underline underline-offset-2">
              sysybu@gmail.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
