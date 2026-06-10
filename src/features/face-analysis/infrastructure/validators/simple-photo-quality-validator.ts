import type { PhotoQualityValidator, PhotoQualityValidationInput, PhotoQualityValidationResult } from '../../domain/validator';
import { analyzeFaceRequestSchema } from '../../domain/schemas';

/**
 * Validator awal sebelum MediaPipe.
 * Untuk milestone 5, validasi berbasis metadata sederhana.
 * (Engine MediaPipe nanti bisa memperkaya validasi berbasis landmark.)
 */
export class SimplePhotoQualityValidator implements PhotoQualityValidator {
  async validate(input: PhotoQualityValidationInput): Promise<PhotoQualityValidationResult> {
    if (input.photoUrl) {
      const parsed = analyzeFaceRequestSchema.safeParse({ photoUrl: input.photoUrl });
      if (!parsed.success) {
        return {
          ok: false,
          quality: {
            score: 0,
            notes: parsed.error.issues[0]?.message ?? 'URL foto tidak valid',
          },
        };
      }
    }

    // Score dasar: kalau tidak ada metadata, anggap "cukup" tapi low-confidence
    let score = 0.6;
    let notes: string | undefined;

    if (typeof input.fileSizeBytes === 'number') {
      // Ideal: 50KB - 8MB (rule-of-thumb)
      const size = input.fileSizeBytes;
      if (size < 50 * 1024) {
        score = 0.25;
        notes = 'File terlalu kecil (kemungkinan blur/kompres berlebihan)';
      } else if (size > 8 * 1024 * 1024) {
        score = 0.4;
        notes = 'File terlalu besar (kemungkinan resolusi berlebih namun tetap bisa dipakai)';
      } else {
        score = 0.75;
      }
    }

    if (input.fileType) {
      if (!input.fileType.startsWith('image/')) {
        return { ok: false, quality: { score: 0, notes: 'Bukan tipe gambar' } };
      }
    }

    // Jika score terlalu rendah, anggap tidak layak.
    if (score < 0.2) {
      return { ok: false, quality: { score, notes: notes ?? 'Kualitas foto tidak memenuhi' } };
    }

    return { ok: true, quality: { score, notes } };
  }
}

