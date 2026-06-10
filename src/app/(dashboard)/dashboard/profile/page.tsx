import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, Mail, Shield, CalendarDays, FileText } from 'lucide-react';
import { SupabaseBookingRepository } from '@/features/booking/infrastructure/repositories/supabase-booking-repository';
import CancelButton from './cancel-button';

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Ambil data profil real-time dari database
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single();

  const repository = new SupabaseBookingRepository();
  const upcomingBooking = await repository.getUpcomingBooking(user.id);
  const bookingHistory = await repository.getUserBookings(user.id);

  const displayName = profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Pengguna';
  const roleName = profile?.role || 'customer';

  // Badges styling
  const statusConfig = {
    pending: { bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20', label: 'Menunggu' },
    confirmed: { bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', label: 'Dikonfirmasi' },
    completed: { bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'Selesai' },
    cancelled: { bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20', label: 'Dibatalkan' },
  };

  const roleConfig = {
    customer: { bg: 'bg-neutral-800 text-neutral-400 border-neutral-750', label: 'Customer' },
    barber: { bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20', label: 'Barber' },
    admin: { bg: 'bg-violet-500/10 text-violet-400 border-violet-500/20', label: 'Administrator' },
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-850 bg-neutral-900/60 text-neutral-400 hover:border-neutral-750 hover:text-white transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white sm:text-2xl">Profil Pengguna</h1>
          <p className="text-xs text-neutral-500 mt-0.5">Kelola data diri dan reservasi Anda</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* User Card */}
        <div className="md:col-span-1 rounded-3xl border border-neutral-800 bg-neutral-900/40 p-6 space-y-6 backdrop-blur-sm">
          <div className="text-center space-y-3">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-600/20">
              <User className="h-10 w-10 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-snug">{displayName}</h2>
              <span className={`mt-1.5 inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${roleConfig[roleName as keyof typeof roleConfig]?.bg || ''}`}>
                {roleConfig[roleName as keyof typeof roleConfig]?.label || roleName}
              </span>
            </div>
          </div>

          <div className="border-t border-neutral-800/80 pt-5 space-y-4 text-sm">
            <div className="flex items-center gap-3 text-neutral-400">
              <Mail className="h-4 w-4 text-neutral-500 shrink-0" />
              <div className="truncate">
                <span className="block text-[10px] uppercase text-neutral-600 font-bold">Email</span>
                <span className="text-xs text-neutral-300">{user.email}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-neutral-400">
              <Shield className="h-4 w-4 text-neutral-500 shrink-0" />
              <div>
                <span className="block text-[10px] uppercase text-neutral-600 font-bold">User ID</span>
                <span className="font-mono text-[11px] text-neutral-300">{user.id.slice(0, 8)}...</span>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <div className="pt-2 border-t border-neutral-800/80">
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="w-full rounded-2xl border border-rose-500/20 bg-rose-500/5 py-3 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 transition-all text-center"
              >
                Keluar Dari Akun
              </button>
            </form>
          </div>
        </div>

        {/* Bookings Details */}
        <div className="md:col-span-2 space-y-6">
          {/* Upcoming Booking Widget */}
          <div className="rounded-3xl border border-neutral-800 bg-neutral-900/40 p-6 space-y-4 backdrop-blur-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">
              Booking Berikutnya
            </h2>
            {upcomingBooking ? (
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400 shrink-0">
                      <CalendarDays className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        {upcomingBooking.barberName || 'Barber Ahli'}
                      </h3>
                      <p className="text-xs text-neutral-500 mt-0.5">Premium Barber Studio</p>
                    </div>
                  </div>
                  <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${statusConfig[upcomingBooking.status]?.bg || ''}`}>
                    {statusConfig[upcomingBooking.status]?.label || upcomingBooking.status}
                  </span>
                </div>

                <div className="grid gap-3 grid-cols-2 text-xs border-y border-neutral-900 py-3">
                  <div>
                    <span className="block text-[10px] text-neutral-600 uppercase font-bold">Kode Booking</span>
                    <span className="font-mono font-bold text-violet-400">{upcomingBooking.bookingCode}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-neutral-600 uppercase font-bold">Waktu</span>
                    <span className="font-semibold text-neutral-300">
                      {upcomingBooking.bookingDate} @ {upcomingBooking.bookingTime.slice(0, 5)}
                    </span>
                  </div>
                  {upcomingBooking.phoneNumber && (
                    <div>
                      <span className="block text-[10px] text-neutral-600 uppercase font-bold">Nomor HP</span>
                      <span className="text-neutral-300">{upcomingBooking.phoneNumber}</span>
                    </div>
                  )}
                </div>

                {upcomingBooking.notes && (
                  <div className="space-y-1 text-xs">
                    <span className="block text-[10px] text-neutral-600 uppercase font-bold">Catatan</span>
                    <p className="rounded-lg bg-neutral-900 border border-neutral-850 p-2.5 text-neutral-400 italic">
                      {upcomingBooking.notes}
                    </p>
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  {upcomingBooking.status === 'pending' && (
                    <CancelButton bookingId={upcomingBooking.id} />
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/10 py-8 text-center text-xs">
                <CalendarDays className="mb-2 h-7 w-7 text-neutral-700" />
                <p className="font-semibold text-neutral-500">Tidak ada booking aktif</p>
                <p className="text-neutral-600 mt-0.5">Jadwal Anda saat ini kosong.</p>
                <Link
                  href="/booking"
                  className="mt-3 rounded-lg bg-white px-3 py-1.5 text-neutral-950 font-semibold hover:bg-neutral-200 transition"
                >
                  Booking Sekarang
                </Link>
              </div>
            )}
          </div>

          {/* Booking History Table */}
          <div className="rounded-3xl border border-neutral-800 bg-neutral-900/40 p-6 space-y-4 backdrop-blur-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">
              Riwayat Kunjungan
            </h2>
            {bookingHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-800 text-neutral-500 uppercase tracking-wider text-[10px] font-bold">
                      <th className="pb-3 pr-2">Kode</th>
                      <th className="pb-3 pr-2">Barber</th>
                      <th className="pb-3 pr-2">Tanggal</th>
                      <th className="pb-3 pr-2">Jam</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookingHistory.map((history) => (
                      <tr
                        key={history.id}
                        className="border-b border-neutral-850/60 hover:bg-neutral-900/20 text-neutral-300 transition-colors"
                      >
                        <td className="py-3.5 pr-2 font-mono font-semibold text-neutral-400">
                          {history.bookingCode || 'N/A'}
                        </td>
                        <td className="py-3.5 pr-2 font-semibold text-white">
                          {history.barberName || 'Barber'}
                        </td>
                        <td className="py-3.5 pr-2 text-neutral-400">{history.bookingDate}</td>
                        <td className="py-3.5 pr-2 text-neutral-400">{history.bookingTime.slice(0, 5)}</td>
                        <td className="py-3.5">
                          <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusConfig[history.status]?.bg || ''}`}>
                            {statusConfig[history.status]?.label || history.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-neutral-500 text-xs">
                <FileText className="mx-auto mb-2 h-7 w-7 text-neutral-700" />
                <p>Belum ada riwayat booking.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
