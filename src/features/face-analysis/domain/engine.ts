import type { FaceMeasurements } from './types';

export type FaceMeasurementEngineInput = {
  /** Sumber analisis. Domain tidak peduli apakah ini MediaPipe/OpenCV, dsb. */
  photoUrl: string;
};

export interface FaceMeasurementEngine {
  /** 
   * Domain layer tidak mengetahui MediaPipe.
   * Implementasi engine ada di infrastructure.
   */
  getMeasurements(input: FaceMeasurementEngineInput): Promise<FaceMeasurements>;
}

