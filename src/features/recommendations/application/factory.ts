import { RecommendationService, StaticRecommendationRuleProvider } from './recommendation-service';

export function createRecommendationService() {
  return new RecommendationService(new StaticRecommendationRuleProvider());
}
