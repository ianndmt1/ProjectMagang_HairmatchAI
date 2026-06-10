import type { Metadata } from 'next';
import Link from 'next/link';
import { Scissors } from 'lucide-react';

export const metadata: Metadata = {
  robots: 'noindex',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
      {/* Animated background */}
      <div className="auth-bg" aria-hidden="true">
        <div className="grid-overlay" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex w-full max-w-md flex-col items-center">
        {/* Logo / Brand */}
        <Link
          href="/"
          className="mb-8 flex items-center gap-2.5 text-white transition-opacity hover:opacity-80"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-600/30">
            <Scissors className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            Hair<span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">Match</span> AI
          </span>
        </Link>

        {/* Auth card (rendered by child page) */}
        {children}

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-neutral-600">
          © {new Date().getFullYear()} HairMatch AI. Semua hak dilindungi.
        </p>
      </div>
    </div>
  );
}
