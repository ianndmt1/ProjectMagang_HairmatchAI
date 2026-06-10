import type { FaceAnalysisRepository } from './ports/repositories';
import type { FaceMeasurementEngine } from '../domain/engine';
import type { PhotoQualityValidator } from '../domain/validator';
import { analyzeFaceUseCase } from './use-cases/analyze-face';


export type AnalyzeFaceFactoryDeps = {
  photoQualityValidator: PhotoQualityValidator;
  faceMeasurementEngine: FaceMeasurementEngine;
  faceAnalysisRepository: FaceAnalysisRepository;
};

export function createAnalyzeFace(deps: AnalyzeFaceFactoryDeps) {
  return (params: Parameters<typeof analyzeFaceUseCase>[0]) =>
    analyzeFaceUseCase(params, {
      photoQualityValidator: deps.photoQualityValidator,
      faceMeasurementEngine: deps.faceMeasurementEngine,
      faceAnalysisRepository: deps.faceAnalysisRepository,
    });
}

