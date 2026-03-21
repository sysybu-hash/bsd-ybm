import Link from 'next/link';

export default function LegalPage() {
  return (
    <div
      className="mx-auto min-h-screen max-w-3xl bg-[#FDFDFD] px-6 py-12 font-sans leading-relaxed text-slate-800 md:px-12 md:py-16"
      dir="ltr"
    >
      <header className="mb-12 border-b border-slate-200 pb-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
          Privacy Policy &amp; Terms of Service
        </h1>
        <p className="mt-2 text-sm font-medium text-slate-500">
          <span className="font-semibold text-[#004694]">bsd-ybm</span> · Last updated: March 2026
        </p>
        <p className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm">
          <a href="#privacy" className="font-medium text-slate-900 underline underline-offset-2">
            Privacy
          </a>
          <a href="#terms" className="font-medium text-slate-900 underline underline-offset-2">
            Terms
          </a>
          <Link href="/" className="font-medium text-slate-600 underline underline-offset-2" hrefLang="he">
            דף הבית (עברית)
          </Link>
        </p>
        <p className="mx-auto mt-6 max-w-xl text-center text-sm text-slate-600" dir="rtl">
          התוכן המשפטי המלא להלן באנגלית — לשקיפות, תאימות בינלאומית ואימות OAuth. לפרטים בעברית ניתן לפנות דרך האתר.
        </p>
      </header>

      <div id="privacy" className="flex flex-col gap-8">
        <p className="text-center text-sm font-semibold uppercase tracking-wide text-slate-400">Privacy policy</p>
        <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">1. Who we are</h2>
          <p className="text-slate-600">
            <span className="font-semibold text-slate-800">bsd-ybm</span> (BSD-YBM) is a construction management platform.
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
          <p className="mb-4 text-slate-600">
            Questions about this policy:{' '}
            <a href="mailto:sysybu@gmail.com" className="font-medium text-slate-900 underline underline-offset-2">
              sysybu@gmail.com
            </a>
          </p>
          <p className="text-sm text-slate-600">
            Standalone terms page:{' '}
            <Link href="/en/terms" className="font-medium text-slate-900 underline underline-offset-2">
              /en/terms
            </Link>
            .
          </p>
        </section>

        <div id="terms" className="border-t border-slate-200 pt-12">
          <p className="mb-8 text-center text-sm font-semibold uppercase tracking-wide text-slate-400">
            Terms of service
          </p>
        </div>

        <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">6. Acceptance</h2>
          <p className="text-slate-600">
            By accessing or using <span className="font-semibold">bsd-ybm</span>, you agree to these Terms and our
            Privacy Policy above. If you do not agree, do not use the service.
          </p>
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">7. The service</h2>
          <p className="mb-4 text-slate-600">
            bsd-ybm provides software for construction and finishing contractors (including ERP-style modules such as
            projects, finance views, payroll logging, and settings). Features may change over time. The service is
            provided &quot;as is&quot; to the extent permitted by law.
          </p>
          <p className="text-slate-600">
            You are responsible for the accuracy of data you enter (including payroll and expense records) and for
            complying with tax, labor, and invoicing rules in your jurisdiction.
          </p>
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">8. Accounts &amp; access control</h2>
          <p className="mb-4 text-slate-600">
            Access may require sign-in (e.g. Google). We may restrict access to specific email addresses allowed by the
            account owner (allowlist). Unauthorized users may be signed out and redirected.
          </p>
          <p className="text-slate-600">
            You must keep credentials secure and notify us if you suspect unauthorized use.
          </p>
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">9. Acceptable use</h2>
          <p className="text-slate-600">
            You may not misuse the platform (including attempting to breach security, overload systems, or use the
            service for unlawful purposes). Company workspaces and project data must be used in line with your
            organization&apos;s permissions.
          </p>
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">10. Limitation of liability</h2>
          <p className="mb-4 text-slate-600">
            To the maximum extent permitted by applicable law, bsd-ybm and its operators are not liable for indirect,
            incidental, or consequential damages arising from your use of the software.
          </p>
          <p className="text-slate-600">
            Nothing in these Terms limits liability where such limitation is prohibited by law.
          </p>
        </section>
      </div>
    </div>
  );
}
