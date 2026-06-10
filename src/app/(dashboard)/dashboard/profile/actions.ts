'use server';

import { SupabaseBookingRepository } from '@/features/booking/infrastructure/repositories/supabase-booking-repository';
import { revalidatePath } from 'next/cache';

export async function cancelBookingAction(bookingId: string) {
  const repository = new SupabaseBookingRepository();
  const res = await repository.cancelBooking(bookingId);
  if (res.ok) {
    revalidatePath('/dashboard/profile');
    revalidatePath('/dashboard');
    revalidatePath(`/dashboard/bookings/${bookingId}`);
  }
  return res;
}
