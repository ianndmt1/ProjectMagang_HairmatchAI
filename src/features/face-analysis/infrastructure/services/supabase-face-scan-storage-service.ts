import { createClient } from '@/lib/supabase/server';
import { getFaceScansBucketName } from '@/lib/supabase/storage-private';
import type { StorageBucketName } from '@/lib/supabase/storage-types';

import type {
  StorageUploader,
  UploadToStorageOutput,
} from '../../application/use-cases/upload-face-scan-to-storage';

export class SupabaseFaceScanStorageService implements StorageUploader {
  async uploadJpegToPrivateBucket(input: {
    objectPath: string;
    blob: Blob;
    contentType: 'image/jpeg';
  }): Promise<UploadToStorageOutput> {
    try {
      const supabase = await createClient();

      const bucket: StorageBucketName = getFaceScansBucketName();

      const { error } = await supabase.storage
        .from(bucket)
        .upload(input.objectPath, input.blob, {
          contentType: input.contentType,
          upsert: false,
          cacheControl: '3600',
        });

      if (error) {
        return { ok: false, error: error.message };
      }

      return { ok: true, imagePath: input.objectPath };
    } catch (e: unknown) {
      return { ok: false, error: e instanceof Error ? e.message : 'Upload gagal' };
    }
  }
}

