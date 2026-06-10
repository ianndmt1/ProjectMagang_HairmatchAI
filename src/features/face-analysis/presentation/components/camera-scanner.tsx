'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, CameraOff, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import type { CameraPermissionState } from '../types';
import { checkFaceQuality, QUALITY_ISSUE_MESSAGES } from '../face-quality-checker';
import type { FaceBoundingBox } from '../face-quality-checker';
import type { FaceQualityResult } from '../types';
import type { FaceMeasurements } from '@/features/face-analysis/domain/types';
import { classifyFaceShape } from '@/features/face-analysis/domain/classifier';

interface CameraScannerProps {
  /** Dipanggil saat scan berhasil, memberikan gambar frame sebagai data URL, pengukuran wajah, dan confidence score landmark */
  onCapture: (imageDataUrl: string, measurements?: FaceMeasurements, landmarkConfidence?: number) => void;
  /** Dipanggil ketika scan dibatalkan */
  onCancel?: () => void;
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).FaceMesh) {
      resolve();
      return;
    }
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      const handler = () => {
        existing.removeEventListener('load', handler);
        resolve();
      };
      existing.addEventListener('load', handler);
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.crossOrigin = 'anonymous';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Gagal memuat script: ${src}`));
    document.head.appendChild(script);
  });
}

export default function CameraScanner({ onCapture, onCancel }: CameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // References for MediaPipe FaceMesh & loops
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const faceMeshRef = useRef<any>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const lastAnalysisTimeRef = useRef<number>(0);
  const lastLogTimeRef = useRef<number>(0);

  // Data refs for tracking latest frame info
  const latestMeasurementsRef = useRef<FaceMeasurements | null>(null);
  const latestConfidenceRef = useRef<number>(0);
  const historyRef = useRef<FaceMeasurements[]>([]);

  // States
  const [permission, setPermission] = useState<CameraPermissionState>('idle');
  const [quality, setQuality] = useState<FaceQualityResult | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isTimeout, setIsTimeout] = useState(false);

  // MediaPipe library loading states
  const [isLibraryLoading, setIsLibraryLoading] = useState(true);
  const [libraryError, setLibraryError] = useState<string | null>(null);

  // ── Hentikan stream kamera ────────────────────────────
  const stopStream = useCallback(() => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // ── Sample luminansi dari canvas untuk quality check ─
  const sampleFrameLuminance = useCallback((): number => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return 128;

    const ctx = canvas.getContext('2d');
    if (!ctx) return 128;

    // Sample frame kecil (80x60) untuk performa optimal
    canvas.width = 80;
    canvas.height = 60;
    ctx.drawImage(video, 0, 0, 80, 60);

    const data = ctx.getImageData(0, 0, 80, 60).data;
    let sum = 0;
    for (let i = 0; i < data.length; i += 4) {
      // Luminansi relatif: 0.299R + 0.587G + 0.114B
      sum += 0.299 * (data[i] ?? 0) + 0.587 * (data[i + 1] ?? 0) + 0.114 * (data[i + 2] ?? 0);
    }
    return sum / (data.length / 4);
  }, []);

  // ── Proses hasil deteksi wajah MediaPipe ─────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleFaceMeshResults = useCallback((results: any) => {
    const luminance = sampleFrameLuminance();

    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
      const qualityResult = checkFaceQuality(null, 0);
      setQuality(qualityResult);
      latestMeasurementsRef.current = null;
      latestConfidenceRef.current = 0;
      return;
    }

    const landmarks = results.multiFaceLandmarks[0];
    const count = results.multiFaceLandmarks.length;

    // Tentukan bounding box dari seluruh landmark
    let xMin = 1.0, yMin = 1.0, xMax = 0.0, yMax = 0.0;
    for (const pt of landmarks) {
      if (pt.x < xMin) xMin = pt.x;
      if (pt.x > xMax) xMax = pt.x;
      if (pt.y < yMin) yMin = pt.y;
      if (pt.y > yMax) yMax = pt.y;
    }

    // Ambil landmark keypoints
    const p10 = landmarks[10];   // Dahi atas tengah
    const p152 = landmarks[152]; // Dagu bawah tengah
    const p103 = landmarks[103]; // Pelipis kiri
    const p332 = landmarks[332]; // Pelipis kanan
    const p234 = landmarks[234]; // Tulang pipi kiri
    const p454 = landmarks[454]; // Tulang pipi kanan
    const p172 = landmarks[172]; // Rahang kiri
    const p397 = landmarks[397]; // Rahang kanan

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getDistance = (a: any, b: any) => {
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dz = (a.z ?? 0) - (b.z ?? 0);
      return Math.sqrt(dx * dx + dy * dy + dz * dz);
    };

    // Jarak normalisasi
    const faceLength_normalized = getDistance(p10, p152);
    const foreheadWidth_normalized = getDistance(p103, p332);
    const cheekboneWidth_normalized = getDistance(p234, p454);
    const jawWidth_normalized = getDistance(p172, p397);

    // Skala ke milimeter (asumsi cheekboneWidth rata-rata 140mm)
    const SCALE = 350;
    const face_length = Number((faceLength_normalized * SCALE).toFixed(2));
    const forehead_width = Number((foreheadWidth_normalized * SCALE).toFixed(2));
    const cheekbone_width = Number((cheekboneWidth_normalized * SCALE).toFixed(2));
    const jaw_width = Number((jawWidth_normalized * SCALE).toFixed(2));

    const currentMeasurements: FaceMeasurements = {
      face_length,
      forehead_width,
      cheekbone_width,
      jaw_width
    };

    // Roll angle kepala dalam derajat
    const rollAngle = Math.atan2(p454.y - p234.y, p454.x - p234.x) * (180 / Math.PI);

    // Simpan ke history pengukuran untuk analisis stabilitas
    historyRef.current.push(currentMeasurements);
    if (historyRef.current.length > 5) {
      historyRef.current.shift();
    }

    const box: FaceBoundingBox = {
      xMin,
      yMin,
      xMax,
      yMax,
      rollAngle,
      luminance,
      faceCount: count
    };

    // Validasi kualitas wajah berbasis rule
    const qualityResult = checkFaceQuality(box, count);
    setQuality(qualityResult);

    // Hitung sub-skor kualitas scan untuk metrik confidence
    const faceWidthRatio = xMax - xMin;
    const sizeScore = Math.max(0, 1 - Math.abs(faceWidthRatio - 0.32) / 0.14); // optimal width ratio di frame ~0.32
    const tiltScore = Math.max(0, 1 - Math.abs(rollAngle) / 15); // max kemiringan kepala 15 derajat
    
    const faceCenterX = (xMin + xMax) / 2;
    const faceCenterY = (yMin + yMax) / 2;
    const centerScore = Math.max(0, 1 - (Math.abs(faceCenterX - 0.5) + Math.abs(faceCenterY - 0.5)) / 0.3); // optimal terpusat di (0.5, 0.5)
    
    const lightScore = Math.max(0, 1 - Math.abs(luminance - 128) / 73); // optimal luminansi ~128

    // Hitung skor stabilitas berdasarkan deviasi standar cheekbone width pada 5 frame terakhir
    const getStabilityScore = () => {
      const hist = historyRef.current;
      if (hist.length < 3) return 1.0;
      const widths = hist.map(m => m.cheekbone_width);
      const mean = widths.reduce((s, w) => s + w, 0) / widths.length;
      const variance = widths.reduce((s, w) => s + (w - mean) ** 2, 0) / widths.length;
      const stdDev = Math.sqrt(variance);
      return Math.max(0.5, 1 - stdDev / 8.0); // penalti stabilitas maks 0.5
    };

    const stabilityScore = getStabilityScore();
    const frameConfidence = (sizeScore * 0.3 + tiltScore * 0.3 + centerScore * 0.2 + lightScore * 0.2) * stabilityScore * 100;
    const finalConfidence = Math.round(Math.min(100, Math.max(0, frameConfidence)));

    latestMeasurementsRef.current = currentMeasurements;
    latestConfidenceRef.current = finalConfidence;

    // Logging Debug Ter-throttle (setiap 1.5 detik)
    const now = performance.now();
    if (now - lastLogTimeRef.current >= 1500) {
      lastLogTimeRef.current = now;
      const rLen = face_length / ((forehead_width + cheekbone_width + jaw_width) / 3);
      const rForeJaw = forehead_width / jaw_width;
      const rCheekJaw = cheekbone_width / jaw_width;
      const rForeCheek = forehead_width / cheekbone_width;

      const { result: tempResult } = classifyFaceShape(currentMeasurements);

      console.log("=== FACE ANALYSIS REALTIME LOG ===");
      console.log(`- Detected Landmarks Count: ${landmarks.length}`);
      console.log(`- Face Measurements: Length=${face_length}, Forehead=${forehead_width}, Cheekbone=${cheekbone_width}, Jaw=${jaw_width}`);
      console.log(`- Calculated Ratios: rLen=${rLen.toFixed(3)}, rForeJaw=${rForeJaw.toFixed(3)}, rCheekJaw=${rCheekJaw.toFixed(3)}, rForeCheek=${rForeCheek.toFixed(3)}`);
      console.log(`- Quality Scores: Size=${sizeScore.toFixed(2)}, Tilt=${tiltScore.toFixed(2)}, Center=${centerScore.toFixed(2)}, Light=${lightScore.toFixed(2)}, Stability=${stabilityScore.toFixed(2)}`);
      console.log(`- Estimated Shape: ${tempResult.face_shape}`);
      console.log(`- Scan Confidence: ${finalConfidence}%`);
      console.log("==================================");
    }
  }, [sampleFrameLuminance]);

  /**
   * Tunggu hingga videoRef.current tersedia di DOM
   */
  const waitForVideoRef = useCallback(
    (stream: MediaStream): Promise<HTMLVideoElement> => {
      return new Promise((resolve, reject) => {
        let attempts = 0;
        const MAX_ATTEMPTS = 50;

        const check = () => {
          const video = videoRef.current;
          if (video) {
            resolve(video);
            return;
          }
          attempts++;
          if (attempts >= MAX_ATTEMPTS) {
            reject(new Error('videoRef tidak tersedia setelah 50 frame'));
            return;
          }
          requestAnimationFrame(check);
        };

        if (stream.active) {
          requestAnimationFrame(check);
        } else {
          reject(new Error('Stream tidak aktif'));
        }
      });
    },
    [],
  );

  /**
   * Pasang stream ke elemen video dan mulai loop FaceMesh.
   */
  const attachStreamToVideo = useCallback(
    async (video: HTMLVideoElement, stream: MediaStream) => {
      return new Promise<void>((resolve, reject) => {
        let started = false;

        const startPlay = async () => {
          if (started) return;
          started = true;
          try {
            await video.play();
            console.log('▶ video.play() berhasil, readyState:', video.readyState);

            // Inisialisasi loop requestAnimationFrame untuk kirim frame ke FaceMesh
            if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
            
            const loop = async () => {
              const v = videoRef.current;
              if (!v || v.paused || v.ended) {
                animationFrameIdRef.current = requestAnimationFrame(loop);
                return;
              }
              const now = performance.now();
              // Batasi pemrosesan FaceMesh (throttling) ke 150ms per frame untuk menghemat resource
              if (now - lastAnalysisTimeRef.current >= 150) {
                lastAnalysisTimeRef.current = now;
                if (faceMeshRef.current && v.readyState >= 2) {
                  try {
                    await faceMeshRef.current.send({ image: v });
                  } catch (err) {
                    console.error("Error sending frame to FaceMesh:", err);
                  }
                }
              }
              animationFrameIdRef.current = requestAnimationFrame(loop);
            };
            animationFrameIdRef.current = requestAnimationFrame(loop);

            resolve();
          } catch (err) {
            console.error('video.play() gagal:', err);
            reject(err);
          }
        };

        video.onloadedmetadata = () => {
          console.log('onloadedmetadata fired', {
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight,
            readyState: video.readyState,
          });
          void startPlay();
        };

        video.onerror = (e) => {
          console.error('video error:', e);
          reject(new Error('Video element error'));
        };

        video.srcObject = stream;

        if (video.readyState >= 1) {
          console.log('readyState sudah >=1, langsung play');
          void startPlay();
        }
      });
    },
    [],
  );

  // ── Mulai kamera ──────────────────────────────────────
  const startCamera = useCallback(async () => {
    stopStream();
    setPermission('requesting');
    setQuality(null);
    setIsTimeout(false);

    console.log('📷 Meminta izin kamera...');

    const timeoutId = setTimeout(() => {
      setPermission((prev) => {
        if (prev === 'requesting') {
          setIsTimeout(true);
          console.error('Camera Error: Timeout 10 detik');
          return 'unavailable';
        }
        return prev;
      });
    }, 10000);

    if (!navigator.mediaDevices?.getUserMedia) {
      clearTimeout(timeoutId);
      setPermission('unavailable');
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      clearTimeout(timeoutId);
      console.log('✅ Stream diperoleh:', stream.id);
      streamRef.current = stream;

      setPermission('granted');

      try {
        const video = await waitForVideoRef(stream);
        console.log('✅ videoRef tersedia');
        await attachStreamToVideo(video, stream);
      } catch (attachErr) {
        console.error('Gagal attach stream ke video:', attachErr);
        setPermission('unavailable');
      }
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      console.error('Camera Error:', err);
      const error = err as { name?: string };
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setPermission('denied');
      } else {
        setPermission('unavailable');
      }
    }
  }, [facingMode, stopStream, waitForVideoRef, attachStreamToVideo]);

  // ── Ganti arah kamera (depan/belakang) ───────────────
  const toggleCamera = useCallback(() => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  }, []);

  // ── Ambil foto dari frame saat ini ───────────────────
  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || isCapturing) return;

    setIsCapturing(true);

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsCapturing(false);
      return;
    }

    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    stopStream();

    const finalMeasurements = latestMeasurementsRef.current || {
      face_length: 0,
      forehead_width: 0,
      cheekbone_width: 0,
      jaw_width: 0
    };
    const finalConfidence = latestConfidenceRef.current || 0;

    onCapture(dataUrl, finalMeasurements, finalConfidence);
  }, [isCapturing, stopStream, onCapture]);

  // ── Load library MediaPipe FaceMesh
  useEffect(() => {
    let active = true;

    const initFaceMesh = async () => {
      try {
        console.log("Loading MediaPipe FaceMesh script...");
        // Gunakan CDN resmi yang stabil
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js');
        if (!active) return;

        console.log("MediaPipe FaceMesh script loaded. Initializing...");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const FaceMeshConstructor = (window as any).FaceMesh;
        if (!FaceMeshConstructor) {
          throw new Error("Pustaka FaceMesh tidak terdefinisi di window.");
        }

        const fm = new FaceMeshConstructor({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
        });

        fm.setOptions({
          maxNumFaces: 1,
          refineLandmarks: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fm.onResults((results: any) => {
          if (!active) return;
          handleFaceMeshResults(results);
        });

        faceMeshRef.current = fm;
        setIsLibraryLoading(false);
      } catch (err: unknown) {
        console.error("Gagal menginisialisasi FaceMesh:", err);
        if (active) {
          const errMsg = err instanceof Error ? err.message : "Gagal memuat pustaka deteksi wajah.";
          setLibraryError(errMsg);
          setIsLibraryLoading(false);
        }
      }
    };

    void initFaceMesh();

    return () => {
      active = false;
      if (faceMeshRef.current) {
        try {
          faceMeshRef.current.close();
        } catch {
          // ignore
        }
        faceMeshRef.current = null;
      }
      stopStream();
    };
  }, [stopStream, handleFaceMeshResults]);

  // Restart kamera saat facingMode berganti
  useEffect(() => {
    if (!isLibraryLoading && !libraryError) {
      void startCamera();
    }
    return () => stopStream();
  }, [facingMode, isLibraryLoading, libraryError]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── UI: Memuat library ────────────────────────────────
  if (isLibraryLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-neutral-800 bg-neutral-900/40 p-10 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10">
          <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
        </div>
        <p className="text-sm font-semibold text-white">Memuat modul AI deteksi wajah...</p>
        <p className="text-xs text-neutral-500">
          Mengunduh model MediaPipe FaceMesh dari CDN. Harap tunggu...
        </p>
      </div>
    );
  }

  // ── UI: Library error ──────────────────────────────────
  if (libraryError) {
    return (
      <div className="flex flex-col items-center justify-center gap-5 rounded-3xl border border-rose-500/20 bg-rose-500/5 p-10 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10">
          <CameraOff className="h-8 w-8 text-rose-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">Gagal Memuat Modul AI</p>
          <p className="mt-2 max-w-xs text-xs leading-relaxed text-neutral-500">
            {libraryError}
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
        >
          Muat Ulang Halaman
        </button>
      </div>
    );
  }

  // ── UI: Meminta izin ──────────────────────────────────
  if (permission === 'idle' || permission === 'requesting') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-neutral-800 bg-neutral-900/40 p-10 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10">
          <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
        </div>
        <p className="text-sm font-semibold text-white">Meminta izin kamera...</p>
        <p className="text-xs text-neutral-500">
          Izinkan akses kamera ketika browser meminta konfirmasi Anda.
        </p>
      </div>
    );
  }

  // ── UI: Izin ditolak ──────────────────────────────────
  if (permission === 'denied') {
    return (
      <div className="flex flex-col items-center justify-center gap-5 rounded-3xl border border-rose-500/20 bg-rose-500/5 p-10 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10">
          <CameraOff className="h-8 w-8 text-rose-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">Izin Kamera Ditolak</p>
          <p className="mt-2 max-w-xs text-xs leading-relaxed text-neutral-500">
            Harap aktifkan izin kamera di pengaturan browser Anda, kemudian muat ulang halaman ini.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            onClick={() => void startCamera()}
            className="flex items-center justify-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-xs font-semibold text-neutral-300 hover:text-white transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Coba Lagi
          </button>
          {onCancel && (
            <button
              onClick={onCancel}
              className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
            >
              Kembali
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── UI: Kamera tidak tersedia ─────────────────────────
  if (permission === 'unavailable') {
    return (
      <div className="flex flex-col items-center justify-center gap-5 rounded-3xl border border-amber-500/20 bg-amber-500/5 p-10 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10">
          <AlertTriangle className="h-8 w-8 text-amber-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">Kamera Tidak Tersedia</p>
          <p className="mt-2 max-w-xs text-xs leading-relaxed text-neutral-500">
            {isTimeout
              ? 'Gagal mengakses kamera. Periksa izin browser atau perangkat kamera.'
              : 'Browser atau perangkat Anda tidak mendukung akses kamera, atau kamera sedang digunakan oleh aplikasi lain.'}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            onClick={() => void startCamera()}
            className="flex items-center justify-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-xs font-semibold text-neutral-300 hover:text-white transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Coba Lagi
          </button>
          {onCancel && (
            <button
              onClick={onCancel}
              className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
            >
              Kembali
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── UI: Kamera aktif ──────────────────────────────────
  const qualityOk = quality?.ok ?? false;
  const firstIssue = quality?.issues[0];

  return (
    <div className="flex flex-col gap-4">
      {/* Viewfinder */}
      <div className="relative overflow-hidden rounded-3xl border border-neutral-800 bg-black aspect-[4/3] sm:aspect-video">
        {/* Video Feed */}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="h-full w-full object-cover"
          style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
        />

        {/* Canvas tersembunyi untuk sampling & capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Face Guide Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className={`w-2/5 aspect-[3/4] rounded-full border-2 transition-colors duration-500 ${
              qualityOk ? 'border-emerald-400/70' : 'border-white/20'
            }`}
          />
        </div>

        {/* Quality Status Pill */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none">
          <div
            className={`rounded-full px-4 py-1.5 text-xs font-semibold backdrop-blur-sm transition-all ${
              qualityOk
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-black/40 text-neutral-300 border border-neutral-700/50'
            }`}
          >
            {qualityOk
              ? '✓ Wajah terdeteksi — siap foto'
              : firstIssue
                ? QUALITY_ISSUE_MESSAGES[firstIssue]
                : 'Mendeteksi wajah...'}
          </div>
        </div>

        {/* Tombol Ganti Kamera (Mobile) */}
        <button
          onClick={toggleCamera}
          className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-xl bg-black/40 backdrop-blur-sm border border-neutral-700/50 text-white hover:bg-black/60 transition-colors"
          title="Ganti Kamera"
        >
          <Camera className="h-4 w-4" />
        </button>
      </div>

      {/* Tombol Ambil Foto */}
      <button
        onClick={handleCapture}
        disabled={isCapturing || !qualityOk}
        className={`flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold transition-all ${
          qualityOk && !isCapturing
            ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/25 hover:from-violet-500 hover:to-indigo-500 active:scale-[0.98]'
            : 'bg-neutral-900 text-neutral-600 border border-neutral-800 cursor-not-allowed'
        }`}
      >
        {isCapturing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Memproses...
          </>
        ) : (
          <>
            <Camera className="h-4 w-4" />
            Ambil Foto Wajah
          </>
        )}
      </button>

      {onCancel && (
        <button
          onClick={onCancel}
          className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors text-center"
        >
          Batalkan
        </button>
      )}
    </div>
  );
}
