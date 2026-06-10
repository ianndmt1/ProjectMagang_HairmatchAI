import type { BookingStatus } from './types';

/**
 * Memvalidasi apakah format string waktu berupa HH:MM atau HH:MM:SS yang valid (24 jam).
 */
export function isValidBookingTime(time: string): boolean {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
  return timeRegex.test(time);
}

/**
 * Memvalidasi apakah status booking merupakan nilai BookingStatus yang valid.
 */
export function isValidBookingStatus(status: string): status is BookingStatus {
  const validStatuses: BookingStatus[] = ['pending', 'confirmed', 'completed', 'cancelled'];
  return validStatuses.includes(status as BookingStatus);
}
