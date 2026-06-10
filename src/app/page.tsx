import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, Camera, Scissors, CalendarDays, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'HairMatch AI — Temukan Gaya Rambut Terbaik Anda',
  description:
    'Analisis bentuk wajah Anda secara instan menggunakan AI dan temukan model rambut yang paling cocok serta lakukan booking online.',
};

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Jika user sudah login, redirect langsung ke dashboard utama
  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-violet-600/30 selection:text-white">
      {/* Background Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px] -translate-y-1/2"></div>
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-indigo-600/5 rounded-full blur-[100px]"></div>
      </div>

      {/* Navigation Header */}
      <header className="relative mx-auto max-w-7xl px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-md shadow-violet-600/20">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">HairMatch AI</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-semibold text-neutral-400 hover:text-white transition-colors"
          >
            Masuk
          </Link>
          <Link
            href="/register"
            className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-200"
          >
            Daftar
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative mx-auto max-w-7xl px-6 pt-16 pb-24 text-center z-10 md:pt-24 md:pb-32">
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/5 px-4 py-1.5 text-xs font-semibold text-violet-300 mb-6 backdrop-blur-sm animate-pulse">
          <Sparkles className="h-3 w-3" />
          Didukung oleh Kecerdasan Buatan (AI)
        </div>
        
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl">
          <span className="block">HairMatch AI</span>
          <span className="block mt-2 text-2xl font-bold tracking-tight sm:text-4xl lg:text-5xl text-neutral-400">
            Analisis Bentuk Wajah dengan AI dan Temukan Model Rambut yang Cocok
          </span>
        </h1>
        
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-neutral-400 sm:text-lg">
          Unggah foto wajah Anda untuk memproses proporsi dan geometri struktur tulang wajah secara instan. 
          Temukan model rambut terbaik yang direkomendasikan secara ilmiah dan langsung booking barber favorit Anda.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/scan"
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-600/20 hover:from-violet-500 hover:to-indigo-500 transition-all hover:scale-[1.02]"
          >
            Analisis Wajah Gratis
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#features"
            className="rounded-xl border border-neutral-800 bg-neutral-900/60 px-6 py-3.5 text-sm font-semibold text-neutral-300 hover:border-neutral-700 hover:text-white transition-all backdrop-blur-sm"
          >
            Lihat Fitur
          </a>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative mx-auto max-w-7xl px-6 py-20 z-10 border-t border-neutral-900">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-violet-400">Fitur Unggulan</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Solusi Menyeluruh untuk Gaya Rambut Pria Modern
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Feature 1 */}
          <div className="rounded-3xl border border-neutral-850 bg-neutral-900/40 p-8 shadow-md hover:border-neutral-700 transition-all backdrop-blur-sm group">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 text-violet-400 group-hover:scale-110 transition-transform">
              <Camera className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">1. Analisis Bentuk Wajah AI</h3>
            <p className="mt-3 text-sm leading-relaxed text-neutral-400">
              Unggah foto wajah tampak depan untuk menganalisis geometri wajah secara detail. Sistem akan mengukur proporsi lebar dahi, pipi, rahang, serta panjang wajah untuk mendeteksi tipe bentuk wajah Anda dengan skor akurasi (confidence score) yang transparan.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="rounded-3xl border border-neutral-850 bg-neutral-900/40 p-8 shadow-md hover:border-neutral-700 transition-all backdrop-blur-sm group">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600/20 to-cyan-600/20 text-blue-400 group-hover:scale-110 transition-transform">
              <Scissors className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">2. Rekomendasi Gaya Rambut</h3>
            <p className="mt-3 text-sm leading-relaxed text-neutral-400">
              Dapatkan katalog rekomendasi model rambut terbaik yang dicocokkan secara ilmiah dengan tipe bentuk wajah Anda. Didukung skor kesesuaian, panduan tingkat kesulitan perawatan (*maintenance*), serta instruksi penataan (*styling*) harian.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="rounded-3xl border border-neutral-850 bg-neutral-900/40 p-8 shadow-md hover:border-neutral-700 transition-all backdrop-blur-sm group">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600/20 to-teal-600/20 text-emerald-400 group-hover:scale-110 transition-transform">
              <CalendarDays className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">3. Booking Online Barbershop</h3>
            <p className="mt-3 text-sm leading-relaxed text-neutral-400">
              Tidak perlu mengantre lama di barbershop. Setelah menentukan gaya rambut pilihan, langsung hubungkan preferensi gaya tersebut ke pemesanan jadwal barber ahli pilihan Anda melalui modul reservasi digital kami.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative mx-auto max-w-7xl px-6 py-20 z-10 border-t border-neutral-900 bg-neutral-950">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-violet-400">Cara Kerja</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            4 Langkah Mudah Mendapatkan Gaya Rambut Terbaik
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              step: '1',
              title: 'Upload Foto',
              desc: 'Gunakan selfie wajah dari depan dengan cahaya terang.',
            },
            {
              step: '2',
              title: 'AI Menganalisis Wajah',
              desc: 'Sistem mengukur proporsi lebar dahi, pipi, rahang, dan panjang wajah.',
            },
            {
              step: '3',
              title: 'Dapatkan Rekomendasi',
              desc: 'Lihat daftar rekomendasi gaya rambut lengkap dengan skor kecocokan.',
            },
            {
              step: '4',
              title: 'Booking Barber',
              desc: 'Jadwalkan potong rambut dengan mengirimkan model rambut pilihan Anda secara otomatis.',
            },
          ].map((item) => (
            <div key={item.step} className="relative rounded-2xl border border-neutral-850 bg-neutral-900/20 p-6">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-sm font-bold text-white shadow-md shadow-violet-600/20 mb-4">
                {item.step}
              </div>
              <h4 className="text-base font-semibold text-white">{item.title}</h4>
              <p className="mt-2 text-xs leading-relaxed text-neutral-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative mx-auto max-w-5xl px-6 py-16 z-10 text-center md:py-24">
        <div className="rounded-3xl border border-violet-500/25 bg-gradient-to-b from-neutral-900 to-neutral-950 p-8 md:p-16 shadow-2xl relative overflow-hidden">
          {/* Subtle Glow Overlay */}
          <div className="absolute inset-0 bg-violet-600/5 mix-blend-color-dodge"></div>
          
          <h2 className="relative text-3xl font-bold tracking-tight text-white sm:text-4xl z-10">
            Siap Menemukan Gaya Rambut Terbaik Anda?
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-sm leading-relaxed text-neutral-400 sm:text-base z-10">
            Bergabunglah sekarang dengan HairMatch AI dan rasakan pengalaman potong rambut modern yang didukung AI untuk tampilan maksimal Anda.
          </p>

          <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row z-10">
            <Link
              href="/scan"
              className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-neutral-950 shadow-md hover:bg-neutral-200 transition-colors"
            >
              Coba Gratis Sekarang
            </Link>
            <Link
              href="/register"
              className="rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-3 text-sm font-semibold text-neutral-300 hover:border-neutral-700 hover:text-white transition-colors"
            >
              Daftar Akun
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-neutral-900 bg-neutral-950/80 py-8 z-10 text-center text-xs text-neutral-600">
        <p>© {new Date().getFullYear()} HairMatch AI. All rights reserved.</p>
        <p className="mt-1 text-[10px]">Tugas Project Magang - Keamanan Privasi Terjamin.</p>
      </footer>
    </div>
  );
}
