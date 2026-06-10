import type { FaceShapeResult } from '../../domain/types';

export type SaveFaceAnalysisInput = {
  userId: string;
  photoUrl?: string;
  faceShape: FaceShapeResult;
};

export interface FaceAnalysisRepository {
  save(input: SaveFaceAnalysisInput): Promise<{ ok: true; id: string } | { ok: false; error: string }>;
}

