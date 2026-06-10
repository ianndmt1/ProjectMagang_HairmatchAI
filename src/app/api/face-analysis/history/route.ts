import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { createFaceAnalysisSessionsRepository } from '@/features/face-analysis/application/factory-session';

const querySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((v) => (typeof v === 'string' ? Number(v) : undefined))
    .pipe(z.number().int().min(1).max(50).optional()),
});

const expiresInSeconds = 60 * 60; // 60 minutes

export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams.entries()));

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid query' },
      { status: 400 }
    );
  }

  const limit = parsed.data.limit ?? 12;

  const repo = createFaceAnalysisSessionsRepository();
  const historyRes = await repo.listByUser({ userId: user.id, limit });

  if (!historyRes.ok) {
    return NextResponse.json({ ok: false, error: historyRes.error }, { status: 422 });
  }

  // signed URLs per item
  const signedItems = await Promise.all(
    historyRes.sessions.map(async (s) => {
      const signed = await repo.createSignedUrl({
        bucket: 'face-scans',
        objectPath: s.imagePath,
        expiresInSeconds,
      });
      return {
        sessionId: s.id,
        faceShape: s.faceShape,
        confidence: s.confidence,
        createdAt: s.createdAt,
        signedImageUrl: signed.ok ? signed.url.signedUrl : null,
      };
    })
  );

  return NextResponse.json({ ok: true, sessions: signedItems });
}

