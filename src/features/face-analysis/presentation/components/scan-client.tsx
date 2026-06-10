'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import CameraScanner from './camera-scanner';
import { classifyFaceShape } from '@/features/face-analysis/domain/classifier';
import type { FaceMeasurements } from '@/features/face-analysis/domain/types';
import type { LocalScanResult } from '../types';

/** Kunci localStorage untuk menyimpan hasil scan sementara */
const SCAN_RESULT_KEY = 'hairmatch_scan_result';

type ScanPhase = 'scanning' | 'processing' | 'done' | 'error';

/**
 * ScanClient — Orchestrator client-side untuk alur scan wajah.
 *
 * Alur:
 * 1. CameraScanner → menangkap frame kamera dan memprosesnya secara realtime menggunakan MediaPipe FaceMesh
 * 2. Setelah memicu "Ambil Foto", CameraScanner mengirimkan image data URL, data pengukuran wajah asli, dan confidence score
 * 3. ScanClient menerima data tersebut dan mengklasifikasikan bentuk wajah asli secara instan
 * 4. Menyimpan hasil ke localStorage
 * 5. Redirect ke halaman rekomendasi rambut
 */
export default function ScanClient() {
  const router = useRouter();
  const [phase, setPhase] = useState<ScanPhase>('scanning');
  const [result, setResult] = useState<LocalScanResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCapture = useCallback(async (
    imageDataUrl: string,
    measurements?: FaceMeasurements,
    landmarkConfidence?: number
  ) => {
    // Simpan gambar yang dicapture untuk ditampilkan di halaman rekomendasi
    try {
      localStorage.setItem('hairmatch_scan_image', imageDataUrl);
    } catch {
      // abaikan error storage (misal private mode)
    }
    setPhase('processing');

    try {
      // Delay kecil untuk transisi UI yang halus
      await new Promise<void>((resolve) => setTimeout(resolve, 1000));

      if (!measurements) {
        throw new Error('Gagal mendeteksi koordinat wajah dari kamera.');
      }

      // Klasifikasikan bentuk wajah dari pengukuran asli
      const { result: classifyResult } = classifyFaceShape(measurements);

      // Gunakan confidence score dari landmark quality tracker yang mewakili kualitas scan (cahaya, jarak, sudut, stabilitas)
      const confidenceScore = typeof landmarkConfidence === 'number' ? landmarkConfidence : classifyResult.confidence_score;

      const scanResult: LocalScanResult = {
        faceShape: classifyResult.face_shape,
        confidenceScore: Number(confidenceScore.toFixed(2)),
        scannedAt: new Date().toISOString(),
      };

      // Simpan hasil ke localStorage untuk diambil halaman rekomendasi
      localStorage.setItem(SCAN_RESULT_KEY, JSON.stringify(scanResult));

      setResult(scanResult);
      setPhase('done');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan pemrosesan';
      setErrorMsg(message);
      setPhase('error');
    }
  }, []);

  const handleToRecommendations = useCallback(() => {
    if (!result) return;
    router.push(`/recommendations?faceShape=${encodeURIComponent(result.faceShape)}&source=scan`);
  }, [result, router]);

  const handleRetry = useCallback(() => {
    setPhase('scanning');
    setResult(null);
    setErrorMsg('');
  }, []);

  // ── Phase: Processing ─────────────────────────────────
  if (phase === 'processing') {
    return (
      <div className="flex flex-col items-center justify-center gap-5 rounded-3xl border border-violet-500/20 bg-violet-500/5 py-16 text-center">
        <div className="relative flex h-20 w-20 items-center justify-center">
          <div className="absolute inset-0 animate-ping rounded-full bg-violet-500/20" />
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-500/10">
            <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
          </div>
        </div>
        <div>
          <p className="text-sm font-bold text-white">Menganalisis Bentuk Wajah...</p>
          <p className="mt-1 text-xs text-neutral-500">
            AI sedang memproses geometri wajah Anda
          </p>
        </div>
      </div>
    );
  }

  // ── Phase: Done ───────────────────────────────────────
  if (phase === 'done' && result) {
    const faceShapeLabels: Record<string, string> = {
      oval: 'Oval',
      round: 'Bulat',
      square: 'Kotak',
      rectangle: 'Persegi Panjang',
      heart: 'Hati',
      diamond: 'Diamond',
      triangle: 'Segitiga',
    };

    return (
      <div className="flex flex-col items-center gap-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
          <CheckCircle2 className="h-10 w-10 text-emerald-400" />
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-2">
            Analisis Selesai
          </p>
          <p className="text-3xl font-extrabold tracking-tight text-white">
            {faceShapeLabels[result.faceShape] ?? result.faceShape}
          </p>
          <p className="mt-1 text-sm text-neutral-400">Bentuk Wajah Anda</p>
        </div>

        {/* Confidence Score */}
        <div className="w-full max-w-xs rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4">
          <div className="flex items-center justify-between mb-2 text-xs">
            <span className="text-neutral-500">Akurasi Analisis</span>
            <span className="font-bold text-white">{result.confidenceScore.toFixed(1)}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-neutral-800">
            <div
              className="h-1.5 rounded-full bg-gradient-to-r from-violet-500 to-indigo-400 transition-all"
              style={{ width: `${result.confidenceScore}%` }}
            />
          </div>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row">
          <button
            onClick={handleToRecommendations}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-violet-600/20 hover:from-violet-500 hover:to-indigo-500 transition-all"
          >
            Lihat Rekomendasi
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={handleRetry}
            className="flex-1 rounded-xl border border-neutral-800 bg-neutral-900 py-3 text-sm font-semibold text-neutral-400 hover:text-white transition-colors"
          >
            Scan Ulang
          </button>
        </div>

        <p className="text-[11px] text-neutral-700">
          Daftar akun untuk menyimpan hasil analisis secara permanen
        </p>
      </div>
    );
  }

  // ── Phase: Error ──────────────────────────────────────
  if (phase === 'error') {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-rose-500/20 bg-rose-500/5 p-8 text-center">
        <p className="text-sm font-bold text-white">Analisis Gagal</p>
        <p className="text-xs text-rose-400">{errorMsg}</p>
        <button
          onClick={handleRetry}
          className="rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-2.5 text-xs font-semibold text-neutral-300 hover:text-white transition-colors"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  // ── Phase: Scanning ───────────────────────────────────
  return <CameraScanner onCapture={handleCapture} />;
}
