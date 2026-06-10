import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { createFaceAnalysisSessionsRepository } from '@/features/face-analysis/application/factory-session';

const expiresInSeconds = 60 * 60; // 60 minutes

type Params = { sessionId: string };

export async function GET(
  req: Request,
  context: { params: Promise<Params> }
) {
  const { sessionId } = await context.params;


  const supabase = await createClient();
  const { data, error: authError } = await supabase.auth.getUser();

  const user = data.user;

  if (authError || !user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (typeof sessionId !== 'string' || sessionId.trim().length === 0) {
    return NextResponse.json({ ok: false, error: 'Invalid sessionId' }, { status: 400 });
  }

  const repo = createFaceAnalysisSessionsRepository();
  const sessionRes = await repo.getById({ sessionId, userId: user.id });

  if (!sessionRes.ok) {
    if (sessionRes.error === 'NOT_FOUND') {
      return NextResponse.json({ ok: true, session: null });
    }
    return NextResponse.json({ ok: false, error: sessionRes.error }, { status: 422 });
  }

  const signed = await repo.createSignedUrl({
    bucket: 'face-scans',
    objectPath: sessionRes.session.imagePath,
    expiresInSeconds,
  });

  if (!signed.ok) {
    return NextResponse.json({ ok: false, error: signed.error }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    session: {
      sessionId: sessionRes.session.id,
      faceShape: sessionRes.session.faceShape,
      confidence: sessionRes.session.confidence,
      createdAt: sessionRes.session.createdAt,
      signedImageUrl: signed.url.signedUrl,
    },
  });
}

