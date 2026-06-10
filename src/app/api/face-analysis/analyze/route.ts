import { NextResponse } from 'next/server';
import { createAnalyzeFace } from '@/features/face-analysis/application/factory';
import { StubFaceMeasurementEngine } from '@/features/face-analysis/infrastructure/engines/stub-face-measurement-engine';
import { SimplePhotoQualityValidator } from '@/features/face-analysis/infrastructure/validators/simple-photo-quality-validator';
import { SupabaseFaceAnalysisRepository } from '@/features/face-analysis/infrastructure/repositories/supabase-face-analysis-repository';
import { analyzeFaceRequestSchema } from '@/features/face-analysis/domain/schemas';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = analyzeFaceRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: parsed.error.issues[0]?.message ?? 'Request tidak valid',
          issues: parsed.error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    const { photoUrl } = parsed.data;

    const analyze = createAnalyzeFace({
      photoQualityValidator: new SimplePhotoQualityValidator(),
      faceMeasurementEngine: new StubFaceMeasurementEngine(),
      faceAnalysisRepository: new SupabaseFaceAnalysisRepository(),
    });

    const res = await analyze({
      userId: user.id,
      photoUrl,
      engineInput: { photoUrl },
    });

    if (!res.ok) {
      return NextResponse.json({ ok: false, error: res.error }, { status: 422 });
    }

    return NextResponse.json({ ok: true, analysisId: res.analysisId, faceShape: res.faceShape });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unexpected error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

