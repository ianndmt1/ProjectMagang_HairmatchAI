import { createClient } from '@/lib/supabase/server';
import type { Booking, BookingStatus } from '../../domain/types';
import type { BookingRepository, CreateBookingInput } from './booking-repository';

// Shape of a raw row returned from the bookings table joined with barbers
interface BookingRow {
  id: string;
  user_id: string;
  barbershop_id: string;
  barber_id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  notes: string | null;
  phone_number: string | null;
  booking_code: string | null;
  created_at: string;
  barber: { name: string } | null;
}

function mapRow(b: BookingRow): Booking {
  return {
    id: b.id,
    userId: b.user_id,
    barbershopId: b.barbershop_id,
    barberId: b.barber_id,
    bookingDate: b.booking_date,
    bookingTime: b.booking_time,
    status: b.status as BookingStatus,
    notes: b.notes ?? undefined,
    phoneNumber: b.phone_number ?? undefined,
    bookingCode: b.booking_code ?? undefined,
    createdAt: new Date(b.created_at),
    barberName: b.barber?.name,
  };
}

export class SupabaseBookingRepository implements BookingRepository {
  async getAvailableSlots(barberId: string, date: string): Promise<string[]> {
    try {
      const supabase = await createClient();

      // 1. Dapatkan hari keberapa dari tanggal tersebut (0 = Minggu, 1 = Senin, dst)
      const dayOfWeek = new Date(date).getDay();

      // 2. Ambil jadwal kerja barber untuk hari tersebut
      const { data: schedule, error: scheduleError } = await supabase
        .from('schedules')
        .select('start_time, end_time, is_available')
        .eq('barber_id', barberId)
        .eq('day_of_week', dayOfWeek)
        .eq('is_available', true)
        .maybeSingle();

      if (scheduleError || !schedule) {
        return [];
      }

      // 3. Buat slot jam per jam (hourly) berdasarkan start_time s/d end_time
      const startHour = parseInt(schedule.start_time.split(':')[0], 10);
      const endHour = parseInt(schedule.end_time.split(':')[0], 10);
      const allSlots: string[] = [];

      for (let h = startHour; h < endHour; h++) {
        const hh = String(h).padStart(2, '0');
        allSlots.push(`${hh}:00`);
      }

      // 4. Ambil booking yang sudah terdaftar di tanggal tersebut (kecuali yang dibatalkan)
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('booking_time')
        .eq('barber_id', barberId)
        .eq('booking_date', date)
        .neq('status', 'cancelled');

      if (bookingsError || !bookings) {
        return allSlots;
      }

      // 5. Potong slot yang sudah terbooking
      const bookedTimes = new Set(
        bookings.map((b: { booking_time: string }) => b.booking_time.slice(0, 5))
      );

      return allSlots.filter((slot) => !bookedTimes.has(slot));
    } catch (e) {
      console.error('Error in getAvailableSlots:', e);
      return [];
    }
  }

  async createBooking(input: CreateBookingInput): Promise<{ ok: true; booking: Booking } | { ok: false; error: string }> {
    try {
      const supabase = await createClient();

      // 1. Validasi slot ketersediaan ganda (double-booking) sebelum insert
      const { data: existing, error: checkError } = await supabase
        .from('bookings')
        .select('id')
        .eq('barber_id', input.barberId)
        .eq('booking_date', input.bookingDate)
        .eq('booking_time', input.bookingTime)
        .neq('status', 'cancelled')
        .limit(1);

      if (checkError) {
        return { ok: false, error: checkError.message };
      }
      if (existing && existing.length > 0) {
        return { ok: false, error: 'Barber sudah memiliki jadwal booking pada waktu tersebut.' };
      }

      // 2. Generate kode booking unik: HM-YYYY-XXXXX
      const year = new Date(input.bookingDate).getFullYear();
      const startOfYear = `${year}-01-01`;
      const endOfYear = `${year}-12-31`;

      const { count, error: countError } = await supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .gte('booking_date', startOfYear)
        .lte('booking_date', endOfYear);

      if (countError) {
        return { ok: false, error: 'Gagal men-generate kode booking: ' + countError.message };
      }

      const sequence = (count || 0) + 1;
      const sequenceStr = String(sequence).padStart(5, '0');
      const bookingCode = `HM-${year}-${sequenceStr}`;

      // 3. Update nama lengkap pengguna di profiles jika dikirim
      if (input.fullName) {
        await supabase
          .from('profiles')
          .update({ full_name: input.fullName })
          .eq('id', input.userId);
      }

      // 4. Simpan booking ke database
      const { data: inserted, error: insertError } = await supabase
        .from('bookings')
        .insert({
          user_id: input.userId,
          barbershop_id: input.barbershopId,
          barber_id: input.barberId,
          booking_date: input.bookingDate,
          booking_time: input.bookingTime,
          notes: input.notes || null,
          phone_number: input.phoneNumber,
          booking_code: bookingCode,
          status: 'pending',
        })
        .select('*, barber:barbers(name)')
        .single();

      if (insertError || !inserted) {
        return { ok: false, error: insertError?.message || 'Gagal menyimpan booking.' };
      }

      return { ok: true, booking: mapRow(inserted as BookingRow) };
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Terjadi kesalahan sistem.';
      return { ok: false, error: message };
    }
  }

  async getUserBookings(userId: string): Promise<Booking[]> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('bookings')
        .select('*, barber:barbers(name)')
        .eq('user_id', userId)
        .order('booking_date', { ascending: false })
        .order('booking_time', { ascending: false });

      if (error || !data) {
        return [];
      }

      return (data as BookingRow[]).map(mapRow);
    } catch (e) {
      console.error(`Error in getUserBookings for userId ${userId}:`, e);
      return [];
    }
  }

  async getUpcomingBooking(userId: string): Promise<Booking | null> {
    try {
      const supabase = await createClient();
      const today = new Date().toISOString().split('T')[0];

      // Ambil seluruh booking aktif (pending/confirmed) untuk hari ini dan hari esok
      const { data, error } = await supabase
        .from('bookings')
        .select('*, barber:barbers(name)')
        .eq('user_id', userId)
        .in('status', ['pending', 'confirmed'])
        .gte('booking_date', today)
        .order('booking_date', { ascending: true })
        .order('booking_time', { ascending: true });

      if (error || !data || data.length === 0) {
        return null;
      }

      // Filter yang jam-nya sudah lewat jika tanggalnya hari ini
      const now = new Date();
      const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      const upcoming = (data as BookingRow[]).find((b) => {
        if (b.booking_date === today) {
          return b.booking_time >= currentHHMM;
        }
        return true;
      });

      if (!upcoming) {
        return null;
      }

      return mapRow(upcoming);
    } catch (e) {
      console.error(`Error in getUpcomingBooking for userId ${userId}:`, e);
      return null;
    }
  }

  async cancelBooking(bookingId: string): Promise<{ ok: boolean; error?: string }> {
    try {
      const supabase = await createClient();

      const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('status')
        .eq('id', bookingId)
        .single();

      if (fetchError || !booking) {
        return { ok: false, error: 'Booking tidak ditemukan.' };
      }

      if (booking.status !== 'pending') {
        return { ok: false, error: 'Hanya booking dengan status pending yang dapat dibatalkan.' };
      }

      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId)
        .eq('status', 'pending');

      if (error) {
        return { ok: false, error: error.message };
      }

      return { ok: true };
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Gagal membatalkan booking.';
      return { ok: false, error: message };
    }
  }
}
