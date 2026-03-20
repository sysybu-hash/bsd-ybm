export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50">
      <main className="max-w-2xl text-center flex-grow flex flex-col justify-center">
        <h1 className="text-5xl font-extrabold mb-6 text-blue-900">BSD-YBM</h1>
        <p className="text-2xl text-gray-700 mb-4">
          Advanced Project Management Platform
        </p>
        <p className="text-lg text-gray-600 mb-8">
          The BSD-YBM system provides comprehensive solutions for managing construction projects, 
          tracking tasks, and streamlining professional workflows.
        </p>
      </main>
      
      <footer className="w-full mt-10 p-6 border-t text-center text-sm text-gray-500">
        <p className="mb-2">© 2026 BSD-YBM Systems</p>
        <div className="space-x-4">
          <a href="/en/legal" className="text-blue-600 hover:underline transition-colors">
            Privacy Policy
          </a>
        </div>
      </footer>
    </div>
  );
}