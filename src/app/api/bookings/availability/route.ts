import { NextResponse } from 'next/server';
import { SupabaseBookingRepository } from '@/features/booking/infrastructure/repositories/supabase-booking-repository';
import { GetAvailabilityUseCase } from '@/features/booking/application/use-cases/get-availability';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const barberId = searchParams.get('barberId');
    const date = searchParams.get('date');

    // Validasi parameter query
    if (!barberId) {
      return NextResponse.json({ ok: false, error: 'barberId diperlukan' }, { status: 400 });
    }
    if (!date) {
      return NextResponse.json({ ok: false, error: 'date diperlukan' }, { status: 400 });
    }

    // Dependency Injection & Eksekusi Use Case
    const repository = new SupabaseBookingRepository();
    const useCase = new GetAvailabilityUseCase(repository);

    const availableSlots = await useCase.execute({ barberId, date });

    return NextResponse.json({
      ok: true,
      availableSlots,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
