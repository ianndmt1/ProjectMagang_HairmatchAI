import type { FaceAnalysisSession } from '../../domain/types-session';
import type { FaceShapeType } from '../../domain/types';

export type CreateFaceAnalysisSessionInput = {
  userId: string;
  imagePath: string;
  faceShape: FaceShapeType;
  confidence: number;
};

export type SignedUrlInput = {
  bucket: 'face-scans';
  objectPath: string;
  expiresInSeconds: number;
};

export type SignedUrlOutput = {
  signedUrl: string;
  expiresInSeconds: number;
};

export interface FaceAnalysisSessionsRepository {
  create(input: CreateFaceAnalysisSessionInput): Promise<{ ok: true; sessionId: string } | { ok: false; error: string }>;

  getById(input: { sessionId: string; userId: string }): Promise<
    | { ok: true; session: FaceAnalysisSession }
    | { ok: false; error: string }
  >;

  getLatestByUser(input: { userId: string }): Promise<
    | { ok: true; session: FaceAnalysisSession }
    | { ok: false; error: string }
    | { ok: false; error: 'NOT_FOUND' }
  >;

  listByUser(input: { userId: string; limit: number }): Promise<
    | { ok: true; sessions: FaceAnalysisSession[] }
    | { ok: false; error: string }
  >;

  createSignedUrl(input: SignedUrlInput): Promise<{ ok: true; url: SignedUrlOutput } | { ok: false; error: string }>;
}

