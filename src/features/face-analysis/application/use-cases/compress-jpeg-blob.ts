export type CompressJpegInput = {
  blob: Blob;
  maxSizeBytes: number;
  minQuality: number; // 0..1
};

export type CompressJpegOutput = {
  blob: Blob;
  didCompress: boolean;
};

function blobToImageBitmap(blob: Blob): Promise<ImageBitmap> {
  return createImageBitmap(blob);
}

function canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (!b) {
          reject(new Error('Failed to encode jpeg'));
          return;
        }
        resolve(b);
      },
      'image/jpeg',
      quality
    );
  });
}

/**
 * Client-side JPEG compression via re-encode.
 *
 * Note: This file is meant to be used by client components.
 */
export async function compressJpegBlobIfNeeded(input: CompressJpegInput): Promise<CompressJpegOutput> {
  if (input.blob.size <= input.maxSizeBytes) {
    return { blob: input.blob, didCompress: false };
  }

  const bitmap = await blobToImageBitmap(input.blob);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return { blob: input.blob, didCompress: false };
  }

  ctx.drawImage(bitmap, 0, 0);

  let quality = 0.85;
  const minQuality = Math.max(0.2, Math.min(1, input.minQuality));

  // Simple linear decrement
  while (quality >= minQuality) {
    const compressed = await canvasToJpegBlob(canvas, quality);
    if (compressed.size <= input.maxSizeBytes) {
      return { blob: compressed, didCompress: true };
    }
    quality -= 0.1;
  }

  // Return the smallest attempt
  const fallback = await canvasToJpegBlob(canvas, minQuality);
  return { blob: fallback, didCompress: true };
}

