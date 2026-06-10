# Face Recommendation Integration

Integration flow:

1. Face Analysis menghasilkan `analysisId`, `face_shape`, dan `confidence_score`.
2. `GET /api/recommendations` mengambil face analysis terbaru milik user jika `faceShape` tidak dikirim.
3. `RecommendationService` menghitung ranking hairstyle dari rule catalog.
4. UI `/recommendations` menampilkan hasil dan menyediakan link booking prefill:
   `/booking?hairstyleId=...&hairstyleName=...`

Face Analysis Module tidak mengimpor service recommendation.

