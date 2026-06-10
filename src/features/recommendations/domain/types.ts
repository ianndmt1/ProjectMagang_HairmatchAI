import type { FaceShapeType } from '@/features/face-analysis/domain/types';

export type HairLength = 'short' | 'medium' | 'long';
export type MaintenanceLevel = 'low' | 'medium' | 'high';

export type Hairstyle = {
  id: string;
  slug: string;
  name: string;
  description: string;
  imageUrl: string;
  length: HairLength;
  maintenanceLevel: MaintenanceLevel;
  stylingTimeMinutes: number;
  tags: string[];
  faceShapeScores: Record<FaceShapeType, number>;
};

export type RecommendationRequest = {
  faceShape: FaceShapeType;
  analysisConfidence?: number;
  limit?: number;
};

export type HairRecommendation = {
  hairstyle: Hairstyle;
  score: number;
  reasoning: string;
  bookingPrefill: {
    hairstyleId: string;
    hairstyleName: string;
  };
};

export interface RecommendationRuleProvider {
  listHairstyles(): Promise<Hairstyle[]>;
}
