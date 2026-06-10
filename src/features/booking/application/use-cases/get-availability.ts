import type { BookingRepository } from '../../infrastructure/repositories/booking-repository';

export type GetAvailabilityInput = {
  barberId: string;
  date: string;
};

export class GetAvailabilityUseCase {
  constructor(private readonly bookingRepository: BookingRepository) {}

  async execute(input: GetAvailabilityInput): Promise<string[]> {
    if (!input.barberId) {
      throw new Error('barberId diperlukan untuk memeriksa ketersediaan');
    }
    if (!input.date) {
      throw new Error('date diperlukan untuk memeriksa ketersediaan');
    }
    return this.bookingRepository.getAvailableSlots(input.barberId, input.date);
  }
}
