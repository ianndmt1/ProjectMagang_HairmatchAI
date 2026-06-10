import { NextResponse } from 'next/server';
import { SupabaseBookingRepository } from '@/features/booking/infrastructure/repositories/supabase-booking-repository';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const repository = new SupabaseBookingRepository();
    const upcoming = await repository.getUpcomingBooking(user.id);

    return NextResponse.json({
      ok: true,
      upcoming,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
