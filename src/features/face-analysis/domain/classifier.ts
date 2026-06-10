import type { FaceMeasurements, FaceShapeResult, FaceShapeType } from './types';

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function abs(n: number) {
  return Math.abs(n);
}

type Score = { category: FaceShapeType; score: number };

function scoreNear(value: number, target: number, tolerance: number) {
  // score: 1 jika sama, turun linier ke 0 saat berjarak >= tolerance
  const diff = abs(value - target);
  return clamp(1 - diff / tolerance, 0, 1);
}

/**
 * Confidence score strategy (0..100):
 * - Hitung rasio yang mengindikasi bentuk
 * - Setiap kategori diberi skor berbasis kedekatan rasio ke target
 * - Ambil kategori dengan skor tertinggi sebagai "top"
 * - Turunkan confidence bila kategori kedua mirip (ambigu)
 */
export function classifyFaceShape(measurements: FaceMeasurements): {
  result: Omit<FaceShapeResult, 'confidence_score'> & { confidence_score: number };
} {
  const L = measurements.face_length;
  const Wf = measurements.forehead_width;
  const Wc = measurements.cheekbone_width;
  const Wj = measurements.jaw_width;

  const wAvg = (Wf + Wc + Wj) / 3;

  const rLen = wAvg === 0 ? 0 : L / wAvg;
  const rForeJaw = Wj === 0 ? 0 : Wf / Wj;
  const rCheekJaw = Wj === 0 ? 0 : Wc / Wj;
  const rForeCheek = Wc === 0 ? 0 : Wf / Wc;

  // Lebar merata / spread antar lebar
  const spread = Math.max(Wf, Wc, Wj) - Math.min(Wf, Wc, Wj);
  const spreadRatio = wAvg === 0 ? 0 : spread / wAvg;
  const widthEvenness = scoreNear(spreadRatio, 0.0, 0.22);

  const scores: Score[] = [];

  // Rectangle: rLen tinggi + lebar tidak terlalu menyebar
  scores.push({
    category: 'rectangle',
    score: scoreNear(rLen, 1.45, 0.25) * widthEvenness,
  });

  // Square: rLen ~ 1.05 + lebar merata + rahang lurus dengan pipi
  scores.push({
    category: 'square',
    score: scoreNear(rLen, 1.05, 0.15) * widthEvenness * scoreNear(rCheekJaw, 1.0, 0.15),
  });

  // Round: rLen ~ 1.0 + semua lebar mirip
  scores.push({
    category: 'round',
    score: scoreNear(rLen, 1.0, 0.15) * widthEvenness * scoreNear(rCheekJaw, 1.0, 0.15),
  });

  // Oval: rLen sedikit lebih tinggi, jaw tidak dominan, dan rForeJaw ~ 1.1
  scores.push({
    category: 'oval',
    score:
      scoreNear(rLen, 1.3, 0.2) *
      scoreNear(rForeJaw, 1.08, 0.18) *
      scoreNear(rCheekJaw, 1.12, 0.18) *
      scoreNear(rForeCheek, 0.95, 0.15),
  });

  // Heart: dahi lebih lebar daripada rahang, pipi lebih lebar dari rahang, rLen ~ 1.25
  scores.push({
    category: 'heart',
    score:
      scoreNear(rLen, 1.25, 0.2) *
      scoreNear(rForeJaw, 1.25, 0.22) *
      scoreNear(rCheekJaw, 1.2, 0.22),
  });

  // Diamond: tulang pipi lebih dominan, dahi & rahang menyempit
  scores.push({
    category: 'diamond',
    score:
      scoreNear(rLen, 1.25, 0.2) *
      scoreNear(rForeCheek, 0.85, 0.18) *
      scoreNear(rCheekJaw, 1.25, 0.22),
  });

  // Triangle: rahang dominan, dahi menyempit
  scores.push({
    category: 'triangle',
    score:
      scoreNear(rLen, 1.15, 0.2) *
      scoreNear(rForeJaw, 0.75, 0.18) *
      scoreNear(rCheekJaw, 0.88, 0.18),
  });

  scores.sort((a, b) => b.score - a.score);
  const top = scores[0] ?? { category: 'oval', score: 0 };
  const second = scores[1] ?? { category: 'oval', score: 0 };

  const topScore = clamp(top.score, 0, 1);
  const secondScore = clamp(second.score, 0, 1);

  // Confidence formula:
  // - bila topScore tinggi => confidence naik
  // - bila secondScore mendekati topScore => turunkan (ambigu)
  const ambiguityPenalty = 1 - clamp(secondScore / (topScore || 1e-6), 0, 1) * 0.5;
  const confidence = clamp(topScore * ambiguityPenalty * 100, 0, 100);

  const face_shape: FaceShapeType = top.category;

  const result: FaceShapeResult = {
    face_shape,
    confidence_score: Number(confidence.toFixed(2)),
    metrics: {
      face_length: L,
      forehead_width: Wf,
      cheekbone_width: Wc,
      jaw_width: Wj,
      ratios: {
        rLen,
        rForeJaw,
        rCheekJaw,
        wAvg,
      },
    },
  };

  return { result };
}

export class FaceShapeClassifier {
  classify(measurements: FaceMeasurements) {
    return classifyFaceShape(measurements);
  }
}
