# Recommendations Feature

Recommendation Engine dipisahkan dari Face Analysis Module.

## Milestone 6 Scope

- Minimal 50 hairstyle tersedia di `domain/hairstyle-catalog.ts`.
- Mapping face shape ke hairstyle disimpan sebagai `faceShapeScores`.
- `RecommendationService` terpisah dari face analysis service.
- Scoring rule-based, bukan AI generatif.
- API endpoint: `GET /api/recommendations`.
- UI dashboard: `/recommendations`.
- Booking flow disiapkan melalui query prefill `hairstyleId` dan `hairstyleName`.

## Scoring Formula

```txt
rawScore = faceShapeFit * 0.72 + versatility * 0.18 + maintenanceFit * 0.10
finalScore = rawScore * confidenceAdjustment
```

- `faceShapeFit`: skor utama dari mapping catalog untuk face shape tertentu.
- `versatility`: rata-rata skor hairstyle terhadap semua face shape.
- `maintenanceFit`: low=100, medium=82, high=64.
- `confidenceAdjustment`: 1 jika manual; 0.85..0.95 jika berasal dari confidence face analysis.

## Extension Point

`RecommendationRuleProvider` adalah boundary untuk mengganti sumber rule:

- `StaticRecommendationRuleProvider` untuk MVP lokal.
- Provider database/admin config dapat ditambahkan tanpa mengubah Face Analysis Module.

