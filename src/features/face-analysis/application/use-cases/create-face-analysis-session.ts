import type { FaceAnalysisSessionsRepository } from '../ports/face-analysis-sessions-repository';
import type { FaceShapeType } from '../../domain/types';

export type CreateFaceAnalysisSessionUseCaseInput = {
  userId: string;
  imagePath: string;
  faceShape: FaceShapeType;
  confidence: number;
};

export type CreateFaceAnalysisSessionUseCaseDeps = {
  repository: FaceAnalysisSessionsRepository;
};

export function createFaceAnalysisSessionUseCase(input: CreateFaceAnalysisSessionUseCaseInput, deps: CreateFaceAnalysisSessionUseCaseDeps) {
  return deps.repository.create({
    userId: input.userId,
    imagePath: input.imagePath,
    faceShape: input.faceShape,
    confidence: input.confidence,
  });
}

