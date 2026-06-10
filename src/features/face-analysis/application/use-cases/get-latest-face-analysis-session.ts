import type { FaceAnalysisSessionsRepository } from '../ports/face-analysis-sessions-repository';

export type GetLatestFaceAnalysisSessionUseCaseInput = {
  userId: string;
};

export type GetLatestFaceAnalysisSessionUseCaseDeps = {
  repository: FaceAnalysisSessionsRepository;
};

export function getLatestFaceAnalysisSessionUseCase(
  input: GetLatestFaceAnalysisSessionUseCaseInput,
  deps: GetLatestFaceAnalysisSessionUseCaseDeps
) {
  return deps.repository.getLatestByUser(input);
}

