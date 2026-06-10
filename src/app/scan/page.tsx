import type { Metadata } from 'next';
import Link from 'next/link';
import { Sparkles, ArrowLeft } from 'lucide-react';
import ScanClient from '@/features/face-analysis/presentation/components/scan-client';

export const metadata: Metadata = {
  title: 'Scan Wajah — HairMatch AI',
  description:
    'Pindai wajah Anda secara real-time menggunakan kamera perangkat untuk mendapatkan analisis bentuk wajah instan.',
};

export default function ScanPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Header Navigation */}
      <header className="mx-auto max-w-2xl px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold text-white">HairMatch AI</span>
          </div>
        </div>

        <Link
          href="/login"
          className="text-xs font-semibold text-neutral-500 hover:text-white transition-colors"
        >
          Masuk / Daftar
        </Link>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-2xl px-6 pb-16 space-y-6">
        {/* Page Title */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Pindai Wajah Anda
          </h1>
          <p className="text-sm text-neutral-400 max-w-md mx-auto leading-relaxed">
            Tidak perlu membuat akun. Posisikan wajah Anda di dalam bingkai kamera dan biarkan AI
            menganalisis bentuk wajah Anda secara instan.
          </p>
        </div>

        {/* Tips Section */}
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { icon: '💡', label: 'Cahaya cukup' },
            { icon: '👤', label: 'Satu wajah saja' },
            { icon: '📐', label: 'Posisi lurus' },
          ].map((tip) => (
            <div
              key={tip.label}
              className="rounded-2xl border border-neutral-850 bg-neutral-900/30 p-3"
            >
              <div className="text-xl mb-1">{tip.icon}</div>
              <p className="text-xs text-neutral-500 font-medium">{tip.label}</p>
            </div>
          ))}
        </div>

        {/* Camera Scanner (Client-side only) */}
        <ScanClient />

        {/* Privacy Notice */}
        <p className="text-center text-[11px] leading-relaxed text-neutral-700">
          🔒 Gambar wajah Anda diproses secara lokal di perangkat ini dan tidak dikirim ke server
          tanpa izin Anda.
        </p>
      </main>
    </div>
  );
}
