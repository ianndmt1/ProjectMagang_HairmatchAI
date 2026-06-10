import type { FaceShapeType } from '../../domain/types';

export type CompressImageResult = {
  blob: Blob;
  sizeBytes: number;
};

export type UploadToStorageInput = {
  userId: string;
  sessionId: string;
  imageBlob: Blob;
  faceShape: FaceShapeType;
};

export type UploadToStorageOutput = {
  ok: true;
  imagePath: string;
} | {
  ok: false;
  error: string;
};

export type StorageUploader = {
  uploadJpegToPrivateBucket(input: {
    objectPath: string;
    blob: Blob;
    contentType: 'image/jpeg';
  }): Promise<UploadToStorageOutput>;
};

export function uploadFaceScanToStorageUseCase(
  input: UploadToStorageInput,
  deps: {
    uploader: StorageUploader;
  }
) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');

  const objectPath = `${input.userId}/${year}/${month}/${input.sessionId}.jpg`;

  return deps.uploader.uploadJpegToPrivateBucket({
    objectPath,
    blob: input.imageBlob,
    contentType: 'image/jpeg',
  });
}

