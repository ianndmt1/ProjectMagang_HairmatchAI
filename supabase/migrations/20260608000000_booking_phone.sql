-- Migration to add phone_number and booking_code to bookings
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS booking_code TEXT;

-- Create unique index for booking_code
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_booking_code_unique ON public.bookings(booking_code);

-- Create helper index for query performance
CREATE INDEX IF NOT EXISTS idx_bookings_booking_code ON public.bookings(booking_code);
