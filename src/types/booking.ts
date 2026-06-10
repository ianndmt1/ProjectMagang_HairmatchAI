export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

export interface BookingInput {
  barberId: string;
  date: string;
  time: string;
  phoneNumber: string;
  notes?: string;
}

export interface Booking {
  id: string;
  bookingCode: string;
  userId: string;
  barberId: string;
  date: string;
  time: string;
  phoneNumber: string;
  status: BookingStatus;
  notes?: string;
}

export interface AvailabilityResponse {
  availableSlots: string[];
}
