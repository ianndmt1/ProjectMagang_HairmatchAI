import type { FaceAnalysisSessionsRepository } from '../ports/face-analysis-sessions-repository';

export type GetFaceAnalysisHistorySessionsUseCaseInput = {
  userId: string;
  limit: number;
};

export type GetFaceAnalysisHistorySessionsUseCaseDeps = {
  repository: FaceAnalysisSessionsRepository;
};

export function getFaceAnalysisHistorySessionsUseCase(
  input: GetFaceAnalysisHistorySessionsUseCaseInput,
  deps: GetFaceAnalysisHistorySessionsUseCaseDeps
) {
  return deps.repository.listByUser({ userId: input.userId, limit: input.limit });
}

