export type FaceShapeType =
  | 'oval'
  | 'round'
  | 'square'
  | 'rectangle'
  | 'heart'
  | 'diamond'
  | 'triangle';

export type FaceAnalysisSession = {
  id: string;
  userId: string;
  imagePath: string;
  faceShape: FaceShapeType;
  confidence: number;
  createdAt: string; // ISO
};

