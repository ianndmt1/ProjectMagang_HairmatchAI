import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { createFaceAnalysisSessionsRepository } from '@/features/face-analysis/application/factory-session';

const expiresInSeconds = 60 * 60; // 60 minutes

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const repo = createFaceAnalysisSessionsRepository();
  const latestRes = await repo.getLatestByUser({ userId: user.id });

  if (!latestRes.ok) {
    if (latestRes.error === 'NOT_FOUND') {
      return NextResponse.json({ ok: true, latest: null });
    }
    return NextResponse.json({ ok: false, error: latestRes.error }, { status: 422 });
  }

  const signed = await repo.createSignedUrl({
    bucket: 'face-scans',
    objectPath: latestRes.session.imagePath,
    expiresInSeconds,
  });

  if (!signed.ok) {
    return NextResponse.json({ ok: false, error: signed.error }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    latest: {
      sessionId: latestRes.session.id,
      faceShape: latestRes.session.faceShape,
      confidence: latestRes.session.confidence,
      createdAt: latestRes.session.createdAt,
      signedImageUrl: signed.url.signedUrl,
    },
  });
}

