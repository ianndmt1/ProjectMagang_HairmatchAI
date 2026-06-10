import type { Booking } from '../../domain/types';

export type CreateBookingInput = {
  userId: string;
  barbershopId: string;
  barberId: string;
  bookingDate: string; // Format YYYY-MM-DD
  bookingTime: string; // Format HH:MM atau HH:MM:SS
  notes?: string;
  phoneNumber: string;
  fullName?: string;
};

export interface BookingRepository {
  /**
   * Mengambil daftar slot waktu (jam) yang tersedia untuk barber pada tanggal tertentu.
   */
  getAvailableSlots(barberId: string, date: string): Promise<string[]>;

  /**
   * Membuat reservasi booking baru di sistem database.
   */
  createBooking(input: CreateBookingInput): Promise<{ ok: true; booking: Booking } | { ok: false; error: string }>;

  /**
   * Mengambil seluruh riwayat reservasi booking milik user tertentu.
   */
  getUserBookings(userId: string): Promise<Booking[]>;

  /**
   * Mengambil booking terdekat yang aktif.
   */
  getUpcomingBooking(userId: string): Promise<Booking | null>;

  /**
   * Membatalkan booking.
   */
  cancelBooking(bookingId: string): Promise<{ ok: boolean; error?: string }>;
}
