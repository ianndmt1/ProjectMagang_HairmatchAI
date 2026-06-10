'use client';

import React, { useTransition } from 'react';
import { cancelBookingAction } from './actions';
import { Loader2 } from 'lucide-react';

export default function CancelButton({ bookingId }: { bookingId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleCancel = () => {
    if (confirm('Apakah Anda yakin ingin membatalkan booking ini?')) {
      startTransition(async () => {
        const res = await cancelBookingAction(bookingId);
        if (!res.ok) {
          alert(res.error || 'Gagal membatalkan booking.');
        }
      });
    }
  };

  return (
    <button
      onClick={handleCancel}
      disabled={isPending}
      className="rounded-xl border border-rose-500/30 bg-rose-500/5 px-4 py-2.5 text-xs font-semibold text-rose-400 transition hover:bg-rose-500/10 disabled:opacity-50 flex items-center gap-1.5"
    >
      {isPending ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Memproses...
        </>
      ) : (
        'Batalkan Booking'
      )}
    </button>
  );
}
