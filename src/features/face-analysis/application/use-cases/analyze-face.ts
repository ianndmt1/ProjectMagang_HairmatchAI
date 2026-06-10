import type { FaceAnalysisRepository } from '../ports/repositories';
import type { FaceMeasurementEngine } from '../../domain/engine';
import type { PhotoQualityValidator } from '../../domain/validator';
import type { FaceMeasurementEngineInput } from '../../domain/engine';
import type { FaceShapeResult } from '../../domain/types';
import { classifyFaceShape } from '../../domain/classifier';

export type AnalyzeFaceInput = {
  userId: string;
  photoUrl: string;
  engineInput: FaceMeasurementEngineInput;
};

export type AnalyzeFaceDeps = {
  photoQualityValidator: PhotoQualityValidator;
  faceMeasurementEngine: FaceMeasurementEngine;
  faceAnalysisRepository: FaceAnalysisRepository;
};

export async function analyzeFaceUseCase(
  input: AnalyzeFaceInput,
  deps: AnalyzeFaceDeps
): Promise<{ ok: true; faceShape: FaceShapeResult; analysisId: string } | { ok: false; error: string }> {
  // 1) Validate photo quality (pre-analysis)
  const quality = await deps.photoQualityValidator.validate({
    photoUrl: input.photoUrl,
    fileType: undefined,
    fileSizeBytes: undefined,
  });

  if (!quality.ok) {
    return { ok: false, error: quality.quality.notes || 'Foto tidak memenuhi kualitas minimum' };
  }

  // 2) Get measurements from engine
  const measurements = await deps.faceMeasurementEngine.getMeasurements(input.engineInput);

  // 3) Domain classification + confidence
  const { result } = classifyFaceShape(measurements);

  // 4) Persist
  const save = await deps.faceAnalysisRepository.save({
    userId: input.userId,
    photoUrl: input.photoUrl,
    faceShape: result,
  });

  if (!save.ok) {
    return { ok: false, error: save.error };
  }

  return { ok: true, faceShape: result, analysisId: save.id };
}

