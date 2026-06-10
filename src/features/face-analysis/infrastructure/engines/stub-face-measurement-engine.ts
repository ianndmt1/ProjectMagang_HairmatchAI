import type { FaceMeasurementEngine, FaceMeasurementEngineInput } from '../../domain/engine';
import type { FaceMeasurements } from '../../domain/types';

/**
 * Stub engine untuk milestone 5 agar wiring UI->use-case->DB jalan.
 * Menghasilkan nilai pengukuran realistis berdasarkan hash foto.
 */
export class StubFaceMeasurementEngine implements FaceMeasurementEngine {
  async getMeasurements(input: FaceMeasurementEngineInput): Promise<FaceMeasurements> {
    // Hash deterministik berdasarkan photoUrl
    let hash = 0;
    for (let i = 0; i < input.photoUrl.length; i++) {
      hash = (hash + input.photoUrl.charCodeAt(i) * (i + 1)) % 100000;
    }

    // 0..1
    const t = hash / 100000;

    const wBase = 100 + t * 20; // 100..120
    const lBase = wBase * (1.15 + (t - 0.5) * 0.3); // 1.0..1.3 times wBase

    // Generate realistic human face measurements
    const measurements: FaceMeasurements = {
      face_length: Number((lBase * 1.15).toFixed(2)),
      forehead_width: Number((wBase * (0.95 + (t - 0.5) * 0.1)).toFixed(2)),
      cheekbone_width: Number(wBase.toFixed(2)),
      jaw_width: Number((wBase * (0.9 - (t - 0.5) * 0.15)).toFixed(2)),
    };

    return measurements;
  }
}
