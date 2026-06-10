import { z } from 'zod';

// ── Konstanta Validasi ──────────────────────────
export const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
] as const;

export const ACCEPTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'] as const;

/** Max file size: 10 MB */
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

/** Readable max size string */
export const MAX_FILE_SIZE_LABEL = '10 MB';

// ── Zod Schema ──────────────────────────────────
export const uploadFileSchema = z.object({
  file: z
    .instanceof(File, { message: 'File wajib dipilih' })
    .refine(
      (file) => file.size > 0,
      { message: 'File tidak boleh kosong' }
    )
    .refine(
      (file) => file.size <= MAX_FILE_SIZE_BYTES,
      { message: `Ukuran file maksimal ${MAX_FILE_SIZE_LABEL}` }
    )
    .refine(
      (file) => ACCEPTED_IMAGE_TYPES.includes(file.type as typeof ACCEPTED_IMAGE_TYPES[number]),
      { message: 'Format file harus JPG, PNG, atau WebP' }
    ),
});

export type UploadFileInput = z.infer<typeof uploadFileSchema>;

// ── Helper: Validasi sisi client (sebelum submit) ─
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'File wajib dipilih' };
  }

  if (!ACCEPTED_IMAGE_TYPES.includes(file.type as typeof ACCEPTED_IMAGE_TYPES[number])) {
    return {
      valid: false,
      error: `Format tidak didukung. Gunakan: ${ACCEPTED_EXTENSIONS.join(', ')}`,
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `Ukuran file terlalu besar (maks. ${MAX_FILE_SIZE_LABEL})`,
    };
  }

  return { valid: true };
}

// ── Helper: Format bytes ke readable string ─────
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}
