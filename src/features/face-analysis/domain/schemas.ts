import { z } from 'zod';

const IMAGE_URL_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'];

function hasImageExtension(url: URL) {
  const pathname = url.pathname.toLowerCase();
  return IMAGE_URL_EXTENSIONS.some((extension) => pathname.endsWith(extension));
}

export const analyzeFaceRequestSchema = z.object({
  photoUrl: z
    .string()
    .trim()
    .min(1, 'photoUrl wajib')
    .url('photoUrl harus berupa URL yang valid')
    .refine((value) => {
      try {
        const url = new URL(value);
        return url.protocol === 'https:' || url.protocol === 'http:';
      } catch {
        return false;
      }
    }, 'photoUrl hanya menerima URL http/https')
    .refine((value) => {
      try {
        return hasImageExtension(new URL(value));
      } catch {
        return false;
      }
    }, 'photoUrl harus mengarah ke file gambar JPG, PNG, WebP, GIF, atau AVIF'),
});

export type AnalyzeFaceRequest = z.infer<typeof analyzeFaceRequestSchema>;
