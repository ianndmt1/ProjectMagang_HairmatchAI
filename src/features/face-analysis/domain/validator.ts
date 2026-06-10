export type PhotoQualityValidationInput = {
  /** metadata: url/jenis file untuk validasi awal */
  photoUrl?: string;
  /** metadata opsional yang bisa didapat dari upload */
  fileType?: string;
  fileSizeBytes?: number;
};

export type PhotoQualityValidationResult =
  | { ok: true; quality: { score: number; notes?: string } }
  | { ok: false; quality: { score: number; notes?: string } };

export interface PhotoQualityValidator {
  validate(input: PhotoQualityValidationInput): Promise<PhotoQualityValidationResult>;
}

