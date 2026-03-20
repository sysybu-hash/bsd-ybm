import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-slate-50 text-slate-900 font-sans">
      <main className="max-w-2xl text-center flex-grow flex flex-col justify-center">
        {/* שם האפליקציה כפי שמופיע ב-Google Console */}
        <h1 className="text-6xl font-black mb-6 text-blue-900 tracking-tight">
          bsd-ybm
        </h1>
        
        <div className="bg-white p-10 rounded-3xl shadow-2xl border border-slate-200">
          <h2 className="text-2xl font-bold mb-4 text-blue-800">
            Professional Construction Management
          </h2>
          {/* הסבר על מטרת האפליקציה כדי שגוגל יאשרו */}
          <p className="text-lg text-slate-600 leading-relaxed mb-6">
            BSD-YBM is an advanced digital platform tailored for high-end residential 
            construction and interior finishing projects. Our system streamlines 
            workflow documentation, task tracking, and project oversight.
          </p>
          <div className="inline-block px-6 py-3 bg-blue-600 text-white rounded-full font-semibold">
            System Active & Verified
          </div>
        </div>
      </main>

      {/* פוטר עם הקישור למדיניות הפרטיות שגוגל דורשת */}
      <footer className="w-full mt-12 p-8 border-t border-slate-200 text-center text-sm text-slate-400">
        <p className="mb-3 font-medium">© 2026 BSD-YBM Projects LTD</p>
        <div className="flex justify-center gap-6">
          <Link href="/en/legal" className="text-blue-600 hover:underline font-semibold">
            Privacy Policy
          </Link>
          <span className="text-slate-300">|</span>
          <span className="italic">Excellence in Construction</span>
        </div>
      </footer>
    </div>
  );
}