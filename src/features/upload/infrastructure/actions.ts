'use server';

import { createClient } from '@/lib/supabase/server';
import { ACCEPTED_IMAGE_TYPES, MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_LABEL } from '../domain/schemas';

/** Nama bucket di Supabase Storage */
const STORAGE_BUCKET = 'face-uploads';

export type UploadResult =
  | { success: true; photoUrl: string; analysisId: null }
  | { success: false; error: string };

/**
 * Upload foto wajah ke Supabase Storage.
 *
 * Arsitektur:
 * 1. Terima FormData dari client component
 * 2. Validasi ulang file (format + ukuran) di server
 * 3. Upload ke Supabase Storage bucket "face-uploads"
 * 4. Return public URL untuk digunakan oleh Milestone 5 (analisis)
 *
 * Catatan: Record face_analysis belum dibuat di sini.
 * Record akan dibuat oleh engine analisis (Milestone 5) setelah
 * MediaPipe selesai memproses foto.
 */
export async function uploadFacePhoto(formData: FormData): Promise<UploadResult> {
  try {
    // ── 1. Ambil file dari FormData ─────────────
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return { success: false, error: 'File tidak ditemukan dalam request' };
    }

    // ── 2. Validasi format ──────────────────────
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type as typeof ACCEPTED_IMAGE_TYPES[number])) {
      return {
        success: false,
        error: 'Format file tidak didukung. Gunakan JPG, PNG, atau WebP',
      };
    }

    // ── 3. Validasi ukuran ──────────────────────
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return {
        success: false,
        error: `Ukuran file melebihi batas maksimal ${MAX_FILE_SIZE_LABEL}`,
      };
    }

    // ── 4. Auth check ───────────────────────────
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Anda harus login untuk mengupload foto' };
    }

    // ── 5. Buat unique file path ────────────────
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const timestamp = Date.now();
    const filePath = `${user.id}/${timestamp}.${fileExtension}`;

    // ── 6. Upload ke Supabase Storage ───────────
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      console.error('[Upload Error]', uploadError);

      // Handle specific Supabase errors
      if (uploadError.message.includes('Bucket not found')) {
        return {
          success: false,
          error: 'Storage belum dikonfigurasi. Hubungi administrator.',
        };
      }
      if (uploadError.message.includes('duplicate') || uploadError.message.includes('already exists')) {
        return {
          success: false,
          error: 'File sudah ada. Coba lagi.',
        };
      }

      return {
        success: false,
        error: 'Gagal mengupload foto. Silakan coba lagi.',
      };
    }

    // ── 7. Dapatkan public URL ──────────────────
    const {
      data: { publicUrl },
    } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);

    return {
      success: true,
      photoUrl: publicUrl,
      analysisId: null, // Akan diisi oleh Milestone 5 (analisis)
    };
  } catch (error) {
    console.error('[Upload Action - Unexpected Error]', error);
    return {
      success: false,
      error: 'Terjadi kesalahan sistem. Silakan coba lagi nanti.',
    };
  }
}
