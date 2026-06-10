import type { FaceAnalysisSessionsRepository } from '../ports/face-analysis-sessions-repository';
import type { FaceShapeType } from '../../domain/types';

export type CreateFaceAnalysisSessionFromUploadInput = {
  userId: string;
  imagePath: string;
  faceShape: FaceShapeType;
  confidence: number;
};

export type CreateFaceAnalysisSessionFromUploadDeps = {
  repository: FaceAnalysisSessionsRepository;
};

export function createFaceAnalysisSessionFromUploadUseCase(
  input: CreateFaceAnalysisSessionFromUploadInput,
  deps: CreateFaceAnalysisSessionFromUploadDeps
) {
  return deps.repository.create({
    userId: input.userId,
    imagePath: input.imagePath,
    faceShape: input.faceShape,
    confidence: input.confidence,
  });
}

