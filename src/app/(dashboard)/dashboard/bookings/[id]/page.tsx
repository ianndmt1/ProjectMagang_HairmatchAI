import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CalendarDays, Clock, User, Phone, FileText, Hash } from 'lucide-react';
import type { BookingStatus } from '@/features/booking/domain/types';
import CancelButton from '../../profile/cancel-button';

const STATUS_CONFIG: Record<BookingStatus, { label: string; className: string }> = {
  pending: {
    label: 'Menunggu Konfirmasi',
    className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  confirmed: {
    label: 'Dikonfirmasi',
    className: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  },
  completed: {
    label: 'Selesai',
    className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  cancelled: {
    label: 'Dibatalkan',
    className: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BookingDetailPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch booking by ID
  const { data: bookingRaw, error } = await supabase
    .from('bookings')
    .select('*, barber:barbers(name)')
    .eq('id', id)
    .eq('user_id', user.id) // hanya boleh akses booking milik sendiri
    .single();

  if (error || !bookingRaw) {
    notFound();
  }

  const status = bookingRaw.status as BookingStatus;
  const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;

  const canCancel = status === 'pending';

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/profile"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:border-neutral-700 hover:text-white transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white sm:text-2xl">Detail Booking</h1>
          <p className="text-xs text-neutral-500 mt-0.5">Informasi lengkap reservasi Anda</p>
        </div>
      </div>

      {/* Booking Code Banner */}
      <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
            <Hash className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Kode Booking</p>
            <p className="font-mono text-lg font-bold text-violet-300">
              {bookingRaw.booking_code || 'N/A'}
            </p>
          </div>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-bold ${statusCfg.className}`}
        >
          {statusCfg.label}
        </span>
      </div>

      {/* Detail Card */}
      <div className="rounded-3xl border border-neutral-800 bg-neutral-900/40 p-6 space-y-5 backdrop-blur-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">
          Informasi Reservasi
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Barber */}
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-800 text-neutral-400">
              <User className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-neutral-600 tracking-wider">Barber</p>
              <p className="text-sm font-semibold text-white mt-0.5">
                {bookingRaw.barber?.name ?? 'Barber Ahli'}
              </p>
            </div>
          </div>

          {/* Tanggal */}
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-800 text-neutral-400">
              <CalendarDays className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-neutral-600 tracking-wider">Tanggal</p>
              <p className="text-sm font-semibold text-white mt-0.5">{bookingRaw.booking_date}</p>
            </div>
          </div>

          {/* Waktu */}
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-800 text-neutral-400">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-neutral-600 tracking-wider">Jam</p>
              <p className="text-sm font-semibold text-white mt-0.5">
                {bookingRaw.booking_time?.slice(0, 5) ?? '-'}
              </p>
            </div>
          </div>

          {/* Nomor HP */}
          {bookingRaw.phone_number && (
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-800 text-neutral-400">
                <Phone className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-neutral-600 tracking-wider">Nomor HP</p>
                <p className="text-sm font-semibold text-white mt-0.5">{bookingRaw.phone_number}</p>
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        {bookingRaw.notes && (
          <div className="border-t border-neutral-800 pt-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-800 text-neutral-400">
                <FileText className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] uppercase font-bold text-neutral-600 tracking-wider mb-2">
                  Catatan / Model Rambut
                </p>
                <p className="rounded-xl border border-neutral-800 bg-neutral-950 p-3 text-sm text-neutral-300 leading-relaxed italic">
                  {bookingRaw.notes}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <Link
          href="/dashboard/profile"
          className="flex items-center justify-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-3 text-sm font-semibold text-neutral-300 transition hover:border-neutral-700 hover:text-white"
        >
          Kembali ke Profil
        </Link>

        {canCancel && (
          <div className="sm:ml-auto">
            <CancelButton bookingId={bookingRaw.id} />
          </div>
        )}
      </div>
    </div>
  );
}
