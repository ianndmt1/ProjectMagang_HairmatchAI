'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import Image from 'next/image';
import { CalendarDays, Loader2, Scissors, SlidersHorizontal, Star, Info } from 'lucide-react';
import ScanResultPhoto from './ScanResultPhoto';

const FACE_SHAPES = ['oval', 'round', 'square', 'rectangle', 'heart', 'diamond', 'triangle'] as const;

type FaceShape = (typeof FACE_SHAPES)[number];

type Recommendation = {
  score: number;
  reasoning: string;
  hairstyle: {
    id: string;
    name: string;
    description: string;
    length: string;
    maintenanceLevel: string;
    stylingTimeMinutes: number;
    tags: string[];
    imageUrl?: string;
  };
  bookingPrefill: {
    hairstyleId: string;
    hairstyleName: string;
  };
};

type ApiState =
  | { status: 'idle' | 'loading'; recommendations: Recommendation[]; error: string }
  | {
      status: 'success';
      recommendations: Recommendation[];
      error: string;
      faceShape: FaceShape;
      source: string;
      analysisConfidence?: number;
    };

type RecommendationsResponse =
  | {
      ok: true;
      source: string;
      faceShape: FaceShape;
      analysisConfidence?: number;
      recommendations: Recommendation[];
    }
  | { ok: false; error?: string };

const FACE_SHAPE_CHARACTERISTICS: Record<FaceShape, string> = {
  oval: 'Proporsi seimbang dengan panjang wajah sedikit lebih besar dari lebar tulang pipi.',
  round: 'Panjang dan lebar wajah hampir sama, dengan rahang melengkung lembut.',
  square: 'Rahang tegas bersudut, dengan lebar dahi, pipi, dan rahang yang hampir sama.',
  rectangle: 'Wajah lebih panjang dari lebarnya, dengan dahi, pipi, dan rahang sama lebarnya.',
  heart: 'Dahi lebar dengan tulang pipi menonjol, meruncing ke arah dagu.',
  diamond: 'Tulang pipi lebar dengan dahi dan rahang yang lebih sempit.',
  triangle: 'Rahang lebih lebar dari tulang pipi dan dahi.',
};

function HairstyleImage({ src, alt, name }: { src?: string; alt: string; name: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src || '/hairstyles/placeholder.svg');

  const handleError = () => {
    if (currentSrc !== '/hairstyles/placeholder.svg') {
      setCurrentSrc('/hairstyles/placeholder.svg');
    } else {
      setError(true);
    }
  };

  if (error) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-neutral-900 to-neutral-950 p-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600/10 text-violet-400 mb-2 border border-violet-500/20 font-bold text-lg">
          {name.charAt(0)}
        </div>
        <span className="text-xs font-semibold text-neutral-400">{name}</span>
        <span className="text-[10px] text-neutral-600 mt-1">Gaya Rambut Pilihan</span>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-neutral-950">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm">
          <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
        </div>
      )}
      <Image
        src={currentSrc}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, 33vw"
        className={`object-cover transition-all duration-500 hover:scale-105 ${loading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
        onLoad={() => setLoading(false)}
        onError={handleError}
        unoptimized
      />
    </div>
  );
}

export default function RecommendationsClient({
  initialFaceShape,
}: {
  initialFaceShape?: string;
}) {
  const defaultShape =
    initialFaceShape && FACE_SHAPES.includes(initialFaceShape as FaceShape)
      ? (initialFaceShape as FaceShape)
      : 'oval';

  const [selectedShape, setSelectedShape] = useState<FaceShape>(defaultShape);
  const [state, setState] = useState<ApiState>({
    status: 'idle',
    recommendations: [],
    error: '',
  });
  const [isPending, startTransition] = useTransition();

  const _topScore = useMemo(() => {
    if (!state.recommendations.length) return 0;
    return Math.max(...state.recommendations.map((item) => item.score));
  }, [state.recommendations]);
  void _topScore; // calculated for future use

  async function loadRecommendations(faceShape?: FaceShape) {
    setState((current) => ({ ...current, status: 'loading', error: '' }));

    const params = new URLSearchParams({ limit: '12' });
    if (faceShape) params.set('faceShape', faceShape);

    const res = await fetch(`/api/recommendations?${params.toString()}`);
    const data = (await res.json()) as RecommendationsResponse;

    if (data.ok !== true) {
      setState({ status: 'idle', recommendations: [], error: data?.error ?? 'Gagal memuat rekomendasi' });
      return;
    }

    setState({
      status: 'success',
      recommendations: data.recommendations,
      error: '',
      faceShape: data.faceShape,
      source: data.source,
      analysisConfidence: data.analysisConfidence,
    });
    setSelectedShape(data.faceShape);
  }

  useEffect(() => {
    startTransition(() => {
      void loadRecommendations(defaultShape);
    });
  }, [defaultShape]);

  function handleManualLoad() {
    startTransition(() => {
      void loadRecommendations(selectedShape);
    });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Rekomendasi Model Rambut
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-400">
            Rule-based recommendation dari hasil analisis wajah terbaru, siap dipakai sebagai prefill booking.
          </p>
        </div>
        <ScanResultPhoto />
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-neutral-400">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Face shape
          </div>
          <div className="flex gap-2">
            <select
              value={selectedShape}
              onChange={(event) => setSelectedShape(event.target.value as FaceShape)}
              className="min-w-0 rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white outline-none focus:border-neutral-600"
            >
              {FACE_SHAPES.map((shape) => (
                <option key={shape} value={shape}>
                  {shape}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleManualLoad}
              disabled={isPending || state.status === 'loading'}
              className="inline-flex items-center justify-center rounded-xl bg-white px-3 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-200 disabled:opacity-60"
            >
              {isPending || state.status === 'loading' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Scissors className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </section>


      {state.error ? (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
          {state.error}
        </div>
      ) : null}

      {state.status === 'success' ? (
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6">
          <h2 className="flex items-center gap-2 text-xl font-bold text-white">
            <Info className="h-5 w-5 text-violet-400" />
            Hasil Analisis Wajah
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wider text-neutral-500">Bentuk Wajah</p>
              <p className="mt-1 text-lg font-semibold capitalize text-white">{state.faceShape}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-neutral-500">Karakteristik</p>
              <p className="mt-1 text-sm leading-relaxed text-neutral-300">
                {FACE_SHAPE_CHARACTERISTICS[state.faceShape]}
              </p>
            </div>
            {state.recommendations.length > 0 && (
              <div className="sm:col-span-2">
                <p className="text-xs uppercase tracking-wider text-neutral-500">
                  Alasan Rekomendasi Utama Cocok
                </p>
                <p className="mt-1 text-sm leading-relaxed text-neutral-300">
                  {state.recommendations[0].reasoning}
                </p>
              </div>
            )}
          </div>
        </section>
      ) : null}

      {/* Hairstyle list */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {state.recommendations.map((item) => (
          <article
            key={item.hairstyle.id}
            className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/70"
          >
            <div className="relative flex aspect-[16/9] items-center justify-center bg-neutral-800 overflow-hidden">
              <HairstyleImage
                src={item.hairstyle.imageUrl}
                alt={item.hairstyle.name}
                name={item.hairstyle.name}
              />
            </div>
            <div className="space-y-4 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-white">{item.hairstyle.name}</h2>
                  <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-neutral-400">
                    {item.hairstyle.description}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1 rounded-xl bg-emerald-500/10 px-2.5 py-1 text-sm font-bold text-emerald-300">
                  <Star className="h-3.5 w-3.5" />
                  {item.score}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-lg bg-neutral-800 px-2 py-1 text-xs text-neutral-300">
                  {item.hairstyle.length}
                </span>
                <span className="rounded-lg bg-neutral-800 px-2 py-1 text-xs text-neutral-300">
                  {item.hairstyle.maintenanceLevel}
                </span>
                <span className="rounded-lg bg-neutral-800 px-2 py-1 text-xs text-neutral-300">
                  {item.hairstyle.stylingTimeMinutes} min
                </span>
              </div>

              <p className="text-xs leading-relaxed text-neutral-500">{item.reasoning}</p>

              <a
                href={`/booking?hairstyleId=${encodeURIComponent(
                  item.bookingPrefill.hairstyleId
                )}&hairstyleName=${encodeURIComponent(item.bookingPrefill.hairstyleName)}`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-200"
              >
                <CalendarDays className="h-4 w-4" />
                Booking dengan gaya ini
              </a>
            </div>
          </article>
        ))}
      </section>

      {state.status === 'loading' ? (
        <div className="flex justify-center py-12 text-neutral-500">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : null}
    </div>
  );
}
