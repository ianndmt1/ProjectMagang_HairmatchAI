import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createRecommendationService } from '@/features/recommendations/application/factory';
import { recommendationQuerySchema } from '@/features/recommendations/domain/schemas';
import type { FaceShapeType } from '@/features/face-analysis/domain/types';

async function getLatestFaceAnalysis(userId: string): Promise<{
  faceShape: FaceShapeType;
  confidence: number;
} | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('face_analysis')
    .select('face_shape, confidence_score')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data?.face_shape) {
    return null;
  }

  return {
    faceShape: data.face_shape as FaceShapeType,
    confidence: Number(data.confidence_score ?? 0),
  };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = recommendationQuerySchema.safeParse(
    Object.fromEntries(url.searchParams.entries())
  );

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

  let faceShape = parsed.data.faceShape;
  let analysisConfidence = parsed.data.analysisConfidence;
  let source = 'query';

  if (!faceShape) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const latest = await getLatestFaceAnalysis(user.id);
    if (!latest?.faceShape) {
      return NextResponse.json(
        { ok: false, error: 'Belum ada face analysis. Kirim faceShape atau lakukan analisis dulu.' },
        { status: 422 }
      );
    }

    faceShape = latest.faceShape;
    analysisConfidence = latest.confidence;
    source = 'latest-face-analysis';
  }

  const service = createRecommendationService();
  const recommendations = await service.recommend({
    faceShape,
    analysisConfidence,
    limit: parsed.data.limit,
  });

  return NextResponse.json({
    ok: true,
    source,
    faceShape,
    analysisConfidence,
    recommendations,
  });
}
