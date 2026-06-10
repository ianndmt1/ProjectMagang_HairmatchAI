export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export type Booking = {
  id: string;
  userId: string;
  barbershopId: string;
  barberId: string;
  bookingDate: string; // Format YYYY-MM-DD
  bookingTime: string; // Format HH:MM atau HH:MM:SS
  status: BookingStatus;
  notes?: string;
  phoneNumber?: string;
  bookingCode?: string;
  barberName?: string;
  createdAt: Date;
};

export type Barber = {
  id: string;
  barbershopId: string;
  profileId: string | null;
  name: string;
  avatarUrl?: string;
  specialty?: string;
  isActive: boolean;
  createdAt: Date;
};

export type Schedule = {
  id: string;
  barberId: string;
  dayOfWeek: number; // 0 (Minggu) sampai 6 (Sabtu)
  startTime: string; // Format HH:MM atau HH:MM:SS
  endTime: string; // Format HH:MM atau HH:MM:SS
  isAvailable: boolean;
  createdAt: Date;
};
