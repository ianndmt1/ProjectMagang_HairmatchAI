import Link from 'next/link';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md text-center py-12 space-y-5">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
        <FileQuestion className="h-8 w-8" />
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-bold text-white">Booking Tidak Ditemukan</h2>
        <p className="text-sm text-neutral-400">
          Maaf, reservasi yang Anda cari tidak ditemukan atau Anda tidak memiliki akses untuk melihatnya.
        </p>
      </div>

      <div className="pt-4">
        <Link
          href="/dashboard/profile"
          className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Profil
        </Link>
      </div>
    </div>
  );
}
