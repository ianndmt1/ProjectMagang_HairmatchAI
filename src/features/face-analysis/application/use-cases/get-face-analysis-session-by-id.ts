import type { FaceAnalysisSessionsRepository } from '../ports/face-analysis-sessions-repository';

export type GetFaceAnalysisSessionByIdUseCaseInput = {
  sessionId: string;
  userId: string;
};

export type GetFaceAnalysisSessionByIdUseCaseDeps = {
  repository: FaceAnalysisSessionsRepository;
};

export function getFaceAnalysisSessionByIdUseCase(
  input: GetFaceAnalysisSessionByIdUseCaseInput,
  deps: GetFaceAnalysisSessionByIdUseCaseDeps
) {
  return deps.repository.getById({ sessionId: input.sessionId, userId: input.userId });
}

