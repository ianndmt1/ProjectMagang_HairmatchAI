export type FaceShapeType =
  | 'oval'
  | 'round'
  | 'square'
  | 'rectangle'
  | 'heart'
  | 'diamond'
  | 'triangle';

export type FaceMeasurements = {
  /** Jarak panjang wajah (mis. top → chin) */
  face_length: number;
  /** Lebar dahi */
  forehead_width: number;
  /** Lebar tulang pipi */
  cheekbone_width: number;
  /** Lebar rahang */
  jaw_width: number;
};

export type PhotoQuality = {
  /** 0..1, semakin tinggi semakin baik */
  score: number;
  /** alasan validasi gagal/di-peringatin */
  notes?: string;
};

export type FaceShapeResult = {
  face_shape: FaceShapeType;
  confidence_score: number; // 0..100
  metrics: {
    face_length: number;
    forehead_width: number;
    cheekbone_width: number;
    jaw_width: number;
    ratios: {
      rLen: number;
      rForeJaw: number;
      rCheekJaw: number;
      wAvg: number;
    };
  };
};

