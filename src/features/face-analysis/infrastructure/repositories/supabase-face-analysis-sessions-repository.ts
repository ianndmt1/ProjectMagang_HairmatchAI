import { createClient } from '@/lib/supabase/server';
import { getFaceScansBucketName } from '@/lib/supabase/storage-private';
import type {
  FaceAnalysisSessionsRepository,
  CreateFaceAnalysisSessionInput,
  SignedUrlInput,
} from '../../application/ports/face-analysis-sessions-repository';
import type { FaceAnalysisSession } from '../../domain/types-session';
import type { FaceShapeType } from '../../domain/types';

function toSession(input: {
  id: string;
  user_id: string;
  image_path: string;
  face_shape: FaceShapeType;
  confidence: number;
  created_at: string;
}): FaceAnalysisSession {
  return {
    id: input.id,
    userId: input.user_id,
    imagePath: input.image_path,
    faceShape: input.face_shape,
    confidence: Number(input.confidence),
    createdAt: input.created_at,
  };
}

export class SupabaseFaceAnalysisSessionsRepository implements FaceAnalysisSessionsRepository {
  async create(
    input: CreateFaceAnalysisSessionInput
  ): Promise<{ ok: true; sessionId: string } | { ok: false; error: string }> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('face_analysis_sessions')
        .insert({
          user_id: input.userId,
          image_path: input.imagePath,
          face_shape: input.faceShape,
          confidence: input.confidence,
        })
        .select('id')
        .single();

      if (error || !data?.id) {
        return { ok: false, error: error?.message ?? 'Gagal menyimpan session' };
      }

      return { ok: true, sessionId: String(data.id) };
    } catch (e: unknown) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : 'Gagal menyimpan session',
      };
    }
  }

  async getById(input: { sessionId: string; userId: string }): Promise<
    | { ok: true; session: FaceAnalysisSession }
    | { ok: false; error: string }
  > {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('face_analysis_sessions')
        .select('id, user_id, image_path, face_shape, confidence, created_at')
        .eq('id', input.sessionId)
        .eq('user_id', input.userId)
        .maybeSingle();

      if (error || !data?.id) {
        return { ok: false, error: error?.message ?? 'NOT_FOUND' };
      }

      return { ok: true, session: toSession(data) };
    } catch (e: unknown) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : 'Gagal mengambil session',
      };
    }
  }

  async getLatestByUser(input: { userId: string }): Promise<
    | { ok: true; session: FaceAnalysisSession }
    | { ok: false; error: string }
    | { ok: false; error: 'NOT_FOUND' }
  > {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('face_analysis_sessions')
        .select('id, user_id, image_path, face_shape, confidence, created_at')
        .eq('user_id', input.userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        return { ok: false, error: error.message };
      }

      if (!data?.id) {
        return { ok: false, error: 'NOT_FOUND' };
      }

      return { ok: true, session: toSession(data) };
    } catch (e: unknown) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : 'Gagal mengambil latest session',
      };
    }
  }

  async listByUser(input: { userId: string; limit: number }): Promise<
    | { ok: true; sessions: FaceAnalysisSession[] }
    | { ok: false; error: string }
  > {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('face_analysis_sessions')
        .select('id, user_id, image_path, face_shape, confidence, created_at')
        .eq('user_id', input.userId)
        .order('created_at', { ascending: false })
        .limit(input.limit);

      if (error) {
        return { ok: false, error: error.message };
      }

      const sessions = (data ?? []).map((row) =>
        toSession({
          id: String((row as { id: unknown }).id),
          user_id: String((row as { user_id: unknown }).user_id),
          image_path: String((row as { image_path: unknown }).image_path),
          face_shape: (row as { face_shape: FaceShapeType }).face_shape,
          confidence: Number((row as { confidence: unknown }).confidence),
          created_at: String((row as { created_at: unknown }).created_at),
        })
      );
      return { ok: true, sessions };

    } catch (e: unknown) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : 'Gagal mengambil history',
      };
    }
  }

  async createSignedUrl(input: SignedUrlInput): Promise<
    | { ok: true; url: { signedUrl: string; expiresInSeconds: number } }
    | { ok: false; error: string }
  > {
    try {
      const supabase = await createClient();

      if (input.bucket !== 'face-scans') {
        return { ok: false, error: 'Bucket tidak diizinkan' };
      }

      const expiresInSeconds = input.expiresInSeconds;

      const { data, error } = await supabase.storage
        .from(getFaceScansBucketName())
        .createSignedUrl(input.objectPath, expiresInSeconds);

      if (error || !data?.signedUrl) {
        return {
          ok: false,
          error: error?.message ?? 'Gagal membuat signed URL',
        };
      }

      return { ok: true, url: { signedUrl: data.signedUrl, expiresInSeconds } };
    } catch (e: unknown) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : 'Gagal membuat signed URL',
      };
    }
  }
}

