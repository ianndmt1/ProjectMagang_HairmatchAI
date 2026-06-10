-- Mencegah double booking untuk barber pada hari dan jam yang sama,
-- kecuali jika status booking sudah dibatalkan ('cancelled').
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_prevent_double_booking
ON public.bookings (barber_id, booking_date, booking_time)
WHERE status != 'cancelled';
