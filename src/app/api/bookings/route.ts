import { NextResponse } from 'next/server';
import { SupabaseBookingRepository } from '@/features/booking/infrastructure/repositories/supabase-booking-repository';
import { CreateBookingUseCase } from '@/features/booking/application/use-cases/create-booking';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    // 1. Cek otentikasi user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse request body
    let body: Record<string, string>;
    try {
      body = (await req.json()) as Record<string, string>;
    } catch {
      return NextResponse.json({ ok: false, error: 'Request body tidak valid' }, { status: 400 });
    }

    const { barberId, bookingDate, bookingTime, notes, barbershopId, fullName, phoneNumber } = body;

    // 3. Validasi parameter input dasar
    if (!barberId) {
      return NextResponse.json({ ok: false, error: 'barberId diperlukan' }, { status: 400 });
    }
    if (!bookingDate) {
      return NextResponse.json({ ok: false, error: 'bookingDate diperlukan' }, { status: 400 });
    }
    if (!bookingTime) {
      return NextResponse.json({ ok: false, error: 'bookingTime diperlukan' }, { status: 400 });
    }
    if (!phoneNumber) {
      return NextResponse.json({ ok: false, error: 'Nomor HP diperlukan' }, { status: 400 });
    }

    // 4. Dependency Injection & Eksekusi Use Case
    const repository = new SupabaseBookingRepository();
    const useCase = new CreateBookingUseCase(repository);

    // Sediakan placeholder barbershopId jika tidak dispesifikasikan oleh body request
    const resolvedBarbershopId = barbershopId || '00000000-0000-0000-0000-000000000000';

    const result = await useCase.execute({
      userId: user.id,
      barberId,
      barbershopId: resolvedBarbershopId,
      bookingDate,
      bookingTime,
      notes: notes || undefined,
      phoneNumber,
      fullName: fullName || undefined,
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      bookingId: result.booking.id,
      bookingCode: result.booking.bookingCode,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
