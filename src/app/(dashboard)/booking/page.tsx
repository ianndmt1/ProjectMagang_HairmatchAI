'use client';

import React, { useState, useEffect, useTransition, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CalendarDays, ArrowLeft, CheckCircle2, AlertCircle, Loader2, Clock, User, Phone } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

function BookingForm() {
  const searchParams = useSearchParams();
  const supabase = createClient();

  const prefillHairstyleName = searchParams.get('hairstyleName') || '';

  // Form State
  const [barbers, setBarbers] = useState<{ id: string; name: string }[]>([]);
  const [selectedBarberId, setSelectedBarberId] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState(prefillHairstyleName ? `Model Rambut: ${prefillHairstyleName}` : '');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // API State
  const [isLoadingBarbers, setIsLoadingBarbers] = useState(true);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState('');

  // Submit State
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState('');
  const [successBookingId, setSuccessBookingId] = useState('');
  const [successBookingCode, setSuccessBookingCode] = useState('');

  // Get Today's Date String for input min limit
  const todayStr = new Date().toISOString().split('T')[0];

  // Fetch Barbers and User Profile on mount
  useEffect(() => {
    async function loadInitialData() {
      try {
        setIsLoadingBarbers(true);
        // Load active barbers
        const { data: dbBarbers, error: barbersError } = await supabase
          .from('barbers')
          .select('id, name, specialty')
          .eq('is_active', true);

        if (!barbersError && dbBarbers) {
          const formatted = dbBarbers.map((b) => ({
            id: b.id,
            name: `${b.name} (${b.specialty || 'Generalist'})`,
          }));
          setBarbers(formatted);
          if (formatted.length > 0) {
            setSelectedBarberId(formatted[0].id);
          }
        }

        // Prefill user profile name
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setFullName(user.user_metadata?.full_name || '');
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single();
          if (profile?.full_name) {
            setFullName(profile.full_name);
          }
        }
      } catch (err) {
        console.error('Failed to load initial booking data:', err);
      } finally {
        setIsLoadingBarbers(false);
      }
    }

    void loadInitialData();
  }, [supabase]);

  // Fetch Available Slots when Barber or Date changes
  useEffect(() => {
    if (!selectedBarberId || !bookingDate) {
      setAvailableSlots([]);
      return;
    }

    async function fetchSlots() {
      setIsLoadingSlots(true);
      setSlotsError('');
      setSelectedTime(''); // Reset selected time

      try {
        const res = await fetch(
          `/api/bookings/availability?barberId=${selectedBarberId}&date=${bookingDate}`
        );
        const data = await res.json();

        if (!res.ok || data.ok !== true) {
          throw new Error(data.error || 'Gagal memuat ketersediaan jadwal');
        }

        setAvailableSlots(data.availableSlots || []);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
        setSlotsError(msg);
      } finally {
        setIsLoadingSlots(false);
      }
    }

    void fetchSlots();
  }, [selectedBarberId, bookingDate]);

  // Handle Submit Form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBarberId || !bookingDate || !selectedTime || !fullName || !phoneNumber) {
      setSubmitError('Harap lengkapi semua field pilihan dan data diri.');
      return;
    }

    setSubmitError('');

    startTransition(async () => {
      try {
        const res = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            barberId: selectedBarberId,
            bookingDate,
            bookingTime: selectedTime + ':00', // Format HH:MM:SS
            notes: notes || undefined,
            fullName,
            phoneNumber,
          }),
        });

        const data = await res.json();

        if (!res.ok || data.ok !== true) {
          throw new Error(data.error || 'Gagal membuat booking');
        }

        setSuccessBookingId(data.bookingId);
        setSuccessBookingCode(data.bookingCode);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Gagal membuat booking.';
        setSubmitError(msg);
      }
    });
  };

  const selectedBarberName = barbers.find((b) => b.id === selectedBarberId)?.name || '';

  // Success Screen UI
  if (successBookingId) {
    return (
      <div className="mx-auto max-w-lg rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center shadow-xl backdrop-blur-sm">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
          <CheckCircle2 className="h-10 w-10 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold text-white">Booking Berhasil Dibuat</h2>
        <p className="mt-2 text-sm text-neutral-400">
          Reservasi Anda telah berhasil disimpan di database.
        </p>

        {/* Details Card */}
        <div className="mt-6 space-y-3 rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5 text-left text-sm">
          <div className="flex justify-between border-b border-neutral-800/80 pb-2">
            <span className="text-neutral-500">Kode Booking</span>
            <span className="font-mono font-bold text-emerald-400">{successBookingCode}</span>
          </div>
          <div className="flex justify-between border-b border-neutral-800/80 pb-2">
            <span className="text-neutral-500">Barber</span>
            <span className="font-semibold text-white">{selectedBarberName}</span>
          </div>
          <div className="flex justify-between border-b border-neutral-800/80 pb-2">
            <span className="text-neutral-500">Tanggal</span>
            <span className="font-semibold text-white">{bookingDate}</span>
          </div>
          <div className="flex justify-between border-b border-neutral-800/80 pb-2">
            <span className="text-neutral-500">Waktu</span>
            <span className="font-semibold text-white">{selectedTime}</span>
          </div>
          <div className="flex justify-between border-b border-neutral-800/80 pb-2">
            <span className="text-neutral-500">Status</span>
            <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-xs text-amber-400 font-bold">pending</span>
          </div>
          {notes && (
            <div className="flex flex-col gap-1 pt-1">
              <span className="text-neutral-500 font-medium">Catatan</span>
              <p className="rounded-lg bg-neutral-950 p-2.5 text-xs text-neutral-400 border border-neutral-850">
                {notes}
              </p>
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-200"
          >
            Kembali ke Dashboard
          </Link>
          <button
            onClick={() => {
              setSuccessBookingId('');
              setSelectedTime('');
              setNotes('');
            }}
            className="flex items-center justify-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-3 text-sm font-semibold text-neutral-300 transition hover:border-neutral-700 hover:text-white"
          >
            Buat Booking Baru
          </button>
        </div>
      </div>
    );
  }

  // Active Form UI
  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-neutral-800 bg-neutral-900/40 p-6 md:p-8 shadow-xl backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Input Nama Lengkap */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-white">
            <User className="h-4 w-4 text-violet-400" />
            Nama Lengkap
          </label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Masukkan nama lengkap Anda"
            className="w-full rounded-xl border border-neutral-850 bg-neutral-950 px-3.5 py-3 text-sm text-white outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all placeholder:text-neutral-600"
          />
        </div>

        {/* Input Nomor HP */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-white">
            <Phone className="h-4 w-4 text-violet-400" />
            Nomor HP
          </label>
          <input
            type="tel"
            required
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Contoh: 081234567890"
            className="w-full rounded-xl border border-neutral-850 bg-neutral-950 px-3.5 py-3 text-sm text-white outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all placeholder:text-neutral-600"
          />
        </div>

        {/* Input Barber */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-white">
            <User className="h-4 w-4 text-violet-400" />
            Pilih Barber
          </label>
          {isLoadingBarbers ? (
            <div className="flex items-center gap-2 py-3 text-sm text-neutral-400">
              <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
              <span>Memuat daftar barber...</span>
            </div>
          ) : barbers.length === 0 ? (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 text-xs text-amber-400 font-semibold">
              Belum ada barber tersedia. Silakan hubungi admin untuk mendaftarkan barber.
            </div>
          ) : (
            <select
              value={selectedBarberId}
              onChange={(e) => setSelectedBarberId(e.target.value)}
              className="w-full rounded-xl border border-neutral-850 bg-neutral-950 px-3.5 py-3 text-sm text-white outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all"
            >
              {barbers.map((barber) => (
                <option key={barber.id} value={barber.id}>
                  {barber.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Input Tanggal */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-white">
            <CalendarDays className="h-4 w-4 text-violet-400" />
            Pilih Tanggal
          </label>
          <input
            type="date"
            min={todayStr}
            value={bookingDate}
            onChange={(e) => setBookingDate(e.target.value)}
            className="w-full rounded-xl border border-neutral-850 bg-neutral-950 px-3.5 py-3 text-sm text-white outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all scheme-dark"
          />
        </div>

        {/* Tersedia Waktu */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-white">
            <Clock className="h-4 w-4 text-violet-400" />
            Pilih Waktu (Slot Tersedia)
          </label>

          {isLoadingSlots ? (
            <div className="flex items-center gap-2 py-3 text-sm text-neutral-400">
              <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
              <span>Memuat slot waktu...</span>
            </div>
          ) : slotsError ? (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-400">
              {slotsError}
            </div>
          ) : !bookingDate ? (
            <p className="text-xs text-neutral-500 italic">
              Silakan pilih tanggal terlebih dahulu untuk melihat slot jam operasional.
            </p>
          ) : availableSlots.length === 0 ? (
            <p className="text-xs text-amber-400 font-medium">
              Tidak ada slot waktu kosong tersedia untuk tanggal ini. Silakan pilih hari lain.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {availableSlots.map((slot) => {
                const isActive = selectedTime === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedTime(slot)}
                    className={`rounded-xl py-2.5 text-sm font-semibold transition-all border ${
                      isActive
                        ? 'bg-violet-600 border-violet-500 text-white shadow-md shadow-violet-600/20 scale-[0.98]'
                        : 'bg-neutral-950 border-neutral-850 text-neutral-300 hover:border-neutral-700 hover:text-white'
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Input Catatan */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-white">Catatan Opsional</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Tuliskan model rambut detail, preferensi styling, atau instruksi lainnya..."
            className="w-full rounded-xl border border-neutral-850 bg-neutral-950 px-3.5 py-3 text-sm text-white outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all placeholder:text-neutral-600 resize-none"
          />
        </div>

        {/* Error Banner */}
        {submitError && (
          <div className="flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
            <p className="text-sm text-rose-400 font-medium">{submitError}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isPending || !selectedTime}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-600/25 transition-all hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Memproses Booking...
            </>
          ) : (
            'Konfirmasi Pemesanan'
          )}
        </button>
      </form>
    </div>
  );
}

export default function BookingPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-850 bg-neutral-900/60 text-neutral-400 hover:border-neutral-750 hover:text-white transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white sm:text-2xl">Booking Jadwal</h1>
            <p className="text-xs text-neutral-500 mt-0.5">Reservasi potong rambut Anda sekarang</p>
          </div>
        </div>
      </div>

      {/* Main Content with Suspense wrap for searchParams */}
      <Suspense
        fallback={
          <div className="flex justify-center py-20 text-neutral-500">
            <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
          </div>
        }
      >
        <BookingForm />
      </Suspense>
    </div>
  );
}
