import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-200 p-4 font-mono text-center">
      <h2 className="text-2xl font-bold text-white mb-2">404 - Page Not Found</h2>
      <p className="text-sm text-slate-400 mb-6">The requested trading terminal page does not exist.</p>
      <Link
        href="/"
        className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 transition-colors"
      >
        Return to Trading Terminal
      </Link>
    </div>
  );
}
