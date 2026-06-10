import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createFaceAnalysisSessionsRepository } from '@/features/face-analysis/application/factory-session';
import { SupabaseFaceScanStorageService } from '@/features/face-analysis/infrastructure/services/supabase-face-scan-storage-service';
import { createFaceAnalysisSessionUseCase } from '@/features/face-analysis/application/use-cases/create-face-analysis-session';
import { uploadFaceScanToStorageUseCase } from '@/features/face-analysis/application/use-cases/upload-face-scan-to-storage';

const ALLOWED_FACE_SHAPES = [
  'oval',
  'round',
  'square',
  'rectangle',
  'heart',
  'diamond',
  'triangle',
] as const;

type AllowedFaceShape = (typeof ALLOWED_FACE_SHAPES)[number];

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data, error: authError } = await supabase.auth.getUser();
  const user = data.user;

  if (authError || !user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const contentType = req.headers.get('content-type') ?? '';

    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ ok: false, error: 'Expected multipart/form-data' }, { status: 400 });
    }

    const formData = await req.formData();
    const sessionId = formData.get('sessionId');
    const faceShapeRaw = formData.get('faceShape');
    const confidenceRaw = formData.get('confidence');
    const file = formData.get('file');

    if (typeof sessionId !== 'string' || sessionId.trim().length === 0 || typeof faceShapeRaw !== 'string') {
      return NextResponse.json({ ok: false, error: 'Invalid sessionId/faceShape' }, { status: 400 });
    }

    if (!ALLOWED_FACE_SHAPES.includes(faceShapeRaw as AllowedFaceShape)) {
      return NextResponse.json({ ok: false, error: 'Invalid faceShape' }, { status: 400 });
    }

    const faceShape = faceShapeRaw as AllowedFaceShape;

    const confidence = typeof confidenceRaw === 'string' ? Number(confidenceRaw) : Number(confidenceRaw);
    if (!Number.isFinite(confidence)) {
      return NextResponse.json({ ok: false, error: 'Invalid confidence' }, { status: 400 });
    }

    if (!(file instanceof Blob)) {
      return NextResponse.json({ ok: false, error: 'Invalid file' }, { status: 400 });
    }

    if (file.type !== '' && file.type !== 'image/jpeg') {
      return NextResponse.json({ ok: false, error: 'Invalid image type (expected image/jpeg)' }, { status: 400 });
    }

    // Upload first (private storage), then create DB row with image_path
    const storageService = new SupabaseFaceScanStorageService();
    const uploadRes = await uploadFaceScanToStorageUseCase(
      {
        userId: user.id,
        sessionId,
        imageBlob: file,
        faceShape,
      },
      { uploader: storageService }
    );

    if (!uploadRes.ok) {
      return NextResponse.json({ ok: false, error: uploadRes.error }, { status: 422 });
    }

    const sessionsRepo = createFaceAnalysisSessionsRepository();
    const dbRes = await createFaceAnalysisSessionUseCase(
      {
        userId: user.id,
        imagePath: uploadRes.imagePath,
        faceShape,
        confidence,
      },
      { repository: sessionsRepo }
    );

    if (!dbRes.ok) {
      return NextResponse.json({ ok: false, error: dbRes.error }, { status: 422 });
    }

    return NextResponse.json({ ok: true, sessionId: dbRes.sessionId, faceShape, confidence });
  } catch (e: unknown) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Unexpected error' },
      { status: 500 }
    );
  }
}

