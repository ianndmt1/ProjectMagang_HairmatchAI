import { z } from 'zod';

export const faceShapeSchema = z.enum([
  'oval',
  'round',
  'square',
  'rectangle',
  'heart',
  'diamond',
  'triangle',
]);

export const recommendationQuerySchema = z.object({
  faceShape: faceShapeSchema.optional(),
  analysisConfidence: z.coerce.number().min(0).max(100).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export type RecommendationQuery = z.infer<typeof recommendationQuerySchema>;
