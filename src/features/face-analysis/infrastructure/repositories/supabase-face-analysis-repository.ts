import { createClient } from '@/lib/supabase/server';
import type { FaceAnalysisRepository, SaveFaceAnalysisInput } from '../../application/ports/repositories';

export class SupabaseFaceAnalysisRepository implements FaceAnalysisRepository {
  async save(
    input: SaveFaceAnalysisInput
  ): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
    try {
      const supabase = await createClient();

      // NOTE: RLS: user_id harus = auth.uid().
      // Use-case mengirim userId dari server/session.
      const { data: inserted, error } = await supabase
        .from('face_analysis')
        .insert({
          user_id: input.userId,
          photo_url: input.photoUrl ?? null,
          face_length: input.faceShape.metrics.face_length,
          forehead_width: input.faceShape.metrics.forehead_width,
          cheekbone_width: input.faceShape.metrics.cheekbone_width,
          jaw_width: input.faceShape.metrics.jaw_width,
          face_shape: input.faceShape.face_shape,
          confidence_score: input.faceShape.confidence_score,
        })
        .select('id')
        .single();

      if (error) {
        return { ok: false, error: error.message };
      }

      return { ok: true, id: String(inserted.id) };
    } catch (e: unknown) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : 'Gagal menyimpan face analysis',
      };
    }
  }
}

