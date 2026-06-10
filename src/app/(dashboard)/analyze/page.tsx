import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Camera, Shield, Sparkles, Zap } from 'lucide-react';
import UploadDropzone from '@/features/upload/presentation/upload-dropzone';

export const metadata: Metadata = {
  title: 'Analisis Wajah',
  description:
    'Upload foto wajah Anda untuk mendapatkan analisis bentuk wajah dan rekomendasi model rambut terbaik.',
};

export default async function AnalyzePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Page Header */}
      <section>
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-600/25">
            <Camera className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Analisis Bentuk Wajah
            </h1>
            <p className="mt-1 text-sm leading-relaxed text-neutral-400">
              Upload foto wajah Anda untuk menganalisis bentuk wajah dan menemukan model rambut
              yang paling cocok.
            </p>
          </div>
        </div>
      </section>

      {/* Steps Indicator */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          {
            step: 1,
            title: 'Upload Foto',
            desc: 'Pilih atau drag foto wajah',
            icon: Camera,
            active: true,
          },
          {
            step: 2,
            title: 'Analisis',
            desc: 'Deteksi bentuk wajah',
            icon: Sparkles,
            active: false,
          },
          {
            step: 3,
            title: 'Rekomendasi',
            desc: 'Model rambut terbaik',
            icon: Zap,
            active: false,
          },
        ].map((item) => (
          <div
            key={item.step}
            className={`flex items-center gap-3 rounded-2xl border p-4 transition-all ${
              item.active
                ? 'border-violet-500/30 bg-violet-500/5'
                : 'border-neutral-800/50 bg-neutral-900/30 opacity-50'
            }`}
          >
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                item.active
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                  : 'bg-neutral-800 text-neutral-500'
              }`}
            >
              {item.step}
            </div>
            <div>
              <p
                className={`text-sm font-semibold ${
                  item.active ? 'text-white' : 'text-neutral-500'
                }`}
              >
                {item.title}
              </p>
              <p className="text-xs text-neutral-500">{item.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Upload Dropzone */}
      <section>
        <UploadDropzone />
      </section>

      {/* Info Cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex items-start gap-3 rounded-2xl border border-neutral-800/50 bg-neutral-900/30 p-5">
          <Shield className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
          <div>
            <h3 className="text-sm font-semibold text-white">Privasi Terjamin</h3>
            <p className="mt-1 text-xs leading-relaxed text-neutral-500">
              Foto Anda disimpan dengan aman dan hanya dapat diakses oleh Anda. Tidak akan pernah
              dibagikan ke pihak ketiga.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-2xl border border-neutral-800/50 bg-neutral-900/30 p-5">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
          <div>
            <h3 className="text-sm font-semibold text-white">Hasil Akurat</h3>
            <p className="mt-1 text-xs leading-relaxed text-neutral-500">
              Menggunakan adapter analisis wajah berbasis landmark dengan boundary domain yang
              terpisah dari engine teknis.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
