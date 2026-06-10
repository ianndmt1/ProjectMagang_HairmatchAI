import type { FaceAnalysisSessionsRepository } from './ports/face-analysis-sessions-repository';
import { SupabaseFaceAnalysisSessionsRepository } from '../infrastructure/repositories/supabase-face-analysis-sessions-repository';

export function createFaceAnalysisSessionsRepository(): FaceAnalysisSessionsRepository {
  return new SupabaseFaceAnalysisSessionsRepository();
}


