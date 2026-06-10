import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Sparkles, Camera, CalendarDays, UserCircle, Scissors, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { SupabaseBookingRepository } from '@/features/booking/infrastructure/repositories/supabase-booking-repository';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const displayName =
    user.user_metadata?.full_name || user.email?.split('@')[0] || 'Pengguna';

  // Fetch upcoming booking for Phase 2 widget
  const bookingRepository = new SupabaseBookingRepository();
  const upcomingBooking = await bookingRepository.getUpcomingBooking(user.id);

  const quickActions = [
    {
      title: 'Analisis Wajah',
      description: 'Upload foto dan dapatkan rekomendasi model rambut',
      icon: Camera,
      href: '/analyze',
      gradient: 'from-violet-600 to-indigo-600',
      shadow: 'shadow-violet-600/20',
    },
    {
      title: 'Booking Barbershop',
      description: 'Jadwalkan kunjungan ke barber favorit Anda',
      icon: CalendarDays,
      href: '/booking',
      gradient: 'from-emerald-600 to-teal-600',
      shadow: 'shadow-emerald-600/20',
    },
    {
      title: 'Rekomendasi Rambut',
      description: 'Lihat model rambut terbaik dari analisis terakhir',
      icon: Scissors,
      href: '/recommendations',
      gradient: 'from-sky-600 to-cyan-600',
      shadow: 'shadow-sky-600/20',
    },
    {
      title: 'Profil Saya',
      description: 'Kelola informasi dan preferensi akun Anda',
      icon: UserCircle,
      href: '/dashboard/profile',
      gradient: 'from-amber-600 to-orange-600',
      shadow: 'shadow-amber-600/20',
    },
  ];

  // Map status styles
  const statusConfig = {
    pending: { bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20', label: 'Menunggu' },
    confirmed: { bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', label: 'Dikonfirmasi' },
    completed: { bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'Selesai' },
    cancelled: { bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20', label: 'Dibatalkan' },
  };

  return (
    <div className="space-y-10">
      {/* Welcome Header */}
      <section>
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-600/25">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Halo, {displayName}! 👋
            </h1>
            <p className="mt-1 text-sm text-neutral-400">
              Selamat datang kembali. Apa yang ingin Anda lakukan hari ini?
            </p>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-500">
          Aksi Cepat
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className="group relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 transition-all hover:border-neutral-700 hover:bg-neutral-900"
            >
              <div
                className={`mb-4 inline-flex items-center justify-center rounded-xl bg-gradient-to-br ${action.gradient} p-3 shadow-lg ${action.shadow} transition-transform group-hover:scale-110`}
              >
                <action.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-base font-semibold text-white">{action.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-neutral-400">
                {action.description}
              </p>

              {/* Hover glow */}
              <div className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-violet-500/5 opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />
            </Link>
          ))}
        </div>
      </section>

      {/* Phase 2: Booking Saya Widget */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-500">
          Booking Saya
        </h2>
        {upcomingBooking ? (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 backdrop-blur-sm relative overflow-hidden group hover:border-neutral-750 transition-all">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
                  <CalendarDays className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">
                    {upcomingBooking.barberName || 'Barber Ahli'}
                  </h3>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-neutral-400">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5 text-neutral-500" />
                      {upcomingBooking.bookingDate}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-neutral-500" />
                      {upcomingBooking.bookingTime.slice(0, 5)}
                    </span>
                    <span className="font-mono text-violet-400">
                      {upcomingBooking.bookingCode}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-3 border-t border-neutral-800/60 pt-4 md:border-none md:pt-0">
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusConfig[upcomingBooking.status]?.bg || ''}`}>
                  {statusConfig[upcomingBooking.status]?.label || upcomingBooking.status}
                </span>
                <Link
                  href="/dashboard/profile"
                  className="flex items-center gap-1 text-xs font-semibold text-violet-400 hover:text-white transition-colors"
                >
                  Lihat Detail
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/30 py-10 text-center">
            <div>
              <CalendarDays className="mx-auto mb-3 h-8 w-8 text-neutral-700" />
              <p className="text-sm font-semibold text-neutral-500">
                Tidak ada booking aktif
              </p>
              <p className="mt-1 text-xs text-neutral-600 mb-4">
                Jadwalkan kunjungan potong rambut Anda sekarang.
              </p>
              <Link
                href="/booking"
                className="inline-flex items-center justify-center rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-2 text-xs font-semibold text-white transition hover:border-neutral-700 hover:bg-neutral-850"
              >
                Booking Sekarang
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Placeholder sections for future milestones */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-500">
          Riwayat Analisis Terakhir
        </h2>
        <div className="flex items-center justify-center rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/30 py-16 text-center">
          <div>
            <Camera className="mx-auto mb-3 h-10 w-10 text-neutral-700" />
            <p className="text-sm font-medium text-neutral-500">
              Belum ada analisis
            </p>
            <p className="mt-1 text-xs text-neutral-600">
              Upload foto wajah untuk memulai analisis pertama Anda
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
