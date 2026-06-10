import type { FaceQualityIssue, FaceQualityResult } from './types';

/**
 * Face Quality Checker — berjalan sepenuhnya di sisi client.
 *
 * Saat ini menggunakan heuristik berbasis ukuran bounding box wajah dari
 * koordinat landmark MediaPipe (atau dummy box untuk scaffold ini).
 * TODO: Integrasikan dengan landmark 3D MediaPipe Face Mesh saat tersedia.
 */

export type FaceBoundingBox = {
  /** Koordinat relatif terhadap lebar frame (0..1) */
  xMin: number;
  yMin: number;
  xMax: number;
  yMax: number;
  /** Estimasi sudut kemiringan kepala dalam derajat (-180..180) */
  rollAngle?: number;
  /** Skor luminansi rata-rata gambar (0..255) */
  luminance?: number;
  /** Jumlah wajah terdeteksi */
  faceCount?: number;
};

const THRESHOLDS = {
  /** Lebar minimum wajah relatif terhadap lebar frame (0..1) */
  MIN_FACE_WIDTH_RATIO: 0.18,
  /** Sudut kemiringan kepala maksimum yang masih diterima (derajat) */
  MAX_ROLL_ANGLE_DEG: 15,
  /** Luminansi rata-rata minimum (0..255) */
  MIN_LUMINANCE: 55,
} as const;

export function checkFaceQuality(box: FaceBoundingBox | null, faceCount = 0): FaceQualityResult {
  const issues: FaceQualityIssue[] = [];

  // 1. Cek apakah wajah terdeteksi
  if (!box || faceCount === 0) {
    return { ok: false, issues: ['no_face'], score: 0 };
  }

  // 2. Cek lebih dari satu wajah
  if (faceCount > 1) {
    issues.push('multiple_faces');
  }

  // 3. Cek jarak wajah (terlalu jauh)
  const faceWidthRatio = box.xMax - box.xMin;
  if (faceWidthRatio < THRESHOLDS.MIN_FACE_WIDTH_RATIO) {
    issues.push('too_far');
  }

  // 4. Cek kemiringan kepala
  if (box.rollAngle !== undefined && Math.abs(box.rollAngle) > THRESHOLDS.MAX_ROLL_ANGLE_DEG) {
    issues.push('tilted');
  }

  // 5. Cek pencahayaan
  if (box.luminance !== undefined && box.luminance < THRESHOLDS.MIN_LUMINANCE) {
    issues.push('poor_lighting');
  }

  const score = issues.length === 0 ? 1 : Math.max(0, 1 - issues.length * 0.3);

  return {
    ok: issues.length === 0,
    issues,
    score,
  };
}

/** Teks panduan ramah pengguna untuk setiap jenis masalah kualitas */
export const QUALITY_ISSUE_MESSAGES: Record<FaceQualityIssue, string> = {
  no_face: 'Wajah tidak terdeteksi. Arahkan kamera ke wajah Anda.',
  too_far: 'Terlalu jauh. Dekatkan wajah ke kamera.',
  tilted: 'Kepala miring. Coba luruskan posisi kepala Anda.',
  poor_lighting: 'Pencahayaan kurang. Cari tempat yang lebih terang.',
  multiple_faces: 'Terdeteksi lebih dari satu wajah. Pastikan hanya Anda yang berada di kamera.',
};
