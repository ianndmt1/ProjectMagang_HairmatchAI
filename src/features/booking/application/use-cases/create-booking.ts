import type { Booking } from '../../domain/types';
import { isValidBookingTime } from '../../domain/validation';
import type { BookingRepository, CreateBookingInput } from '../../infrastructure/repositories/booking-repository';

export class CreateBookingUseCase {
  constructor(private readonly bookingRepository: BookingRepository) {}

  async execute(input: CreateBookingInput): Promise<{ ok: true; booking: Booking } | { ok: false; error: string }> {
    // 1. Validasi user login / userId
    if (!input.userId) {
      return { ok: false, error: 'User tidak terotentikasi' };
    }

    // 2. Validasi parameter wajib lainnya
    if (!input.barbershopId) {
      return { ok: false, error: 'barbershopId diperlukan' };
    }
    if (!input.barberId) {
      return { ok: false, error: 'barberId diperlukan' };
    }
    if (!input.bookingDate) {
      return { ok: false, error: 'bookingDate diperlukan' };
    }
    if (!input.phoneNumber) {
      return { ok: false, error: 'Nomor HP diperlukan' };
    }

    // 3. Validasi format booking time
    if (!isValidBookingTime(input.bookingTime)) {
      return { ok: false, error: 'Format waktu booking tidak valid (harus HH:MM atau HH:MM:SS)' };
    }

    // 4. Panggil repository
    return this.bookingRepository.createBooking(input);
  }
}
