/**
 * Tipe-tipe presentasi untuk fitur kamera scan real-time.
 * Digunakan oleh CameraScanner dan FaceQualityChecker.
 */

export type CameraPermissionState = 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable';

export type FaceQualityIssue =
  | 'no_face'
  | 'too_far'
  | 'tilted'
  | 'poor_lighting'
  | 'multiple_faces';

export type FaceQualityResult = {
  ok: boolean;
  issues: FaceQualityIssue[];
  /** Skor kualitas 0..1, semakin tinggi semakin baik */
  score: number;
};

export type ScanStatus =
  | 'idle'
  | 'requesting_permission'
  | 'permission_denied'
  | 'camera_unavailable'
  | 'scanning'
  | 'quality_check'
  | 'capturing'
  | 'done'
  | 'error';

/** Hasil pemindaian wajah lokal yang disimpan ke localStorage */
export type LocalScanResult = {
  faceShape: string;
  confidenceScore: number;
  scannedAt: string; // ISO date string
};
