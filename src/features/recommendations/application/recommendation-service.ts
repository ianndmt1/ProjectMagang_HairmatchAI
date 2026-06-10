import { HAIRSTYLE_CATALOG } from '../domain/hairstyle-catalog';
import { scoreHairstyle } from '../domain/scoring';
import type {
  HairRecommendation,
  RecommendationRequest,
  RecommendationRuleProvider,
} from '../domain/types';

export class StaticRecommendationRuleProvider implements RecommendationRuleProvider {
  async listHairstyles() {
    return HAIRSTYLE_CATALOG;
  }
}

export class RecommendationService {
  constructor(private readonly ruleProvider: RecommendationRuleProvider) {}

  async recommend(input: RecommendationRequest): Promise<HairRecommendation[]> {
    const limit = input.limit ?? 12;
    const hairstyles = await this.ruleProvider.listHairstyles();

    return hairstyles
      .map((hairstyle) =>
        scoreHairstyle(hairstyle, input.faceShape, input.analysisConfidence)
      )
      .sort((a, b) => b.score - a.score || a.hairstyle.name.localeCompare(b.hairstyle.name))
      .slice(0, limit);
  }
}
