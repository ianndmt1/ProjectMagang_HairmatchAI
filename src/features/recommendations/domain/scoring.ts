import type { FaceShapeType } from '@/features/face-analysis/domain/types';
import type { HairRecommendation, Hairstyle } from './types';

const maintenanceScores = {
  low: 100,
  medium: 82,
  high: 64,
} as const;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function getVersatilityScore(hairstyle: Hairstyle) {
  const values = Object.values(hairstyle.faceShapeScores);
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  return clamp(average, 0, 100);
}

function confidenceAdjustment(confidence?: number) {
  if (typeof confidence !== 'number') return 1;
  return clamp(0.85 + clamp(confidence, 0, 100) / 1000, 0.85, 0.95);
}

export function scoreHairstyle(
  hairstyle: Hairstyle,
  faceShape: FaceShapeType,
  analysisConfidence?: number
): HairRecommendation {
  const faceFit = hairstyle.faceShapeScores[faceShape] ?? 0;
  const maintenanceFit = maintenanceScores[hairstyle.maintenanceLevel];
  const versatility = getVersatilityScore(hairstyle);

  const rawScore = faceFit * 0.72 + versatility * 0.18 + maintenanceFit * 0.1;
  const score = Math.round(clamp(rawScore * confidenceAdjustment(analysisConfidence), 0, 100));

  return {
    hairstyle,
    score,
    reasoning: `${hairstyle.name} cocok untuk wajah ${faceShape} karena skor kesesuaian bentuk ${faceFit}/100, fleksibilitas ${Math.round(
      versatility
    )}/100, dan maintenance ${hairstyle.maintenanceLevel}.`,
    bookingPrefill: {
      hairstyleId: hairstyle.id,
      hairstyleName: hairstyle.name,
    },
  };
}
