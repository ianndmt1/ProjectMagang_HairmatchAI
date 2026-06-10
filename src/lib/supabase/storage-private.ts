import type { StorageBucketName } from './storage-types';

export type SupabaseStorageSignedUrl = {
  signedUrl: string;
  expiresInSeconds: number;
};

export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${String(value)}`);
}

export function getFaceScansBucketName(): StorageBucketName {
  return 'face-scans';
}


