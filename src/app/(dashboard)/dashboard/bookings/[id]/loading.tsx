import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-neutral-900 border border-neutral-850" />
        <div className="space-y-2">
          <div className="h-6 w-32 rounded bg-neutral-800" />
          <div className="h-3.5 w-48 rounded bg-neutral-900" />
        </div>
      </div>

      {/* Booking Code Banner Skeleton */}
      <div className="rounded-2xl border border-neutral-850 bg-neutral-900/20 p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-neutral-900" />
          <div className="space-y-1.5">
            <div className="h-3 w-16 rounded bg-neutral-800" />
            <div className="h-5 w-28 rounded bg-neutral-900" />
          </div>
        </div>
        <div className="h-6 w-24 rounded-full bg-neutral-900" />
      </div>

      {/* Detail Card Skeleton */}
      <div className="rounded-3xl border border-neutral-800 bg-neutral-900/40 p-6 space-y-5">
        <div className="h-4 w-36 rounded bg-neutral-800" />

        <div className="grid gap-4 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="h-8 w-8 rounded bg-neutral-900" />
              <div className="space-y-1.5 flex-1">
                <div className="h-2.5 w-12 rounded bg-neutral-800" />
                <div className="h-4 w-24 rounded bg-neutral-900" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Spinner fallback */}
      <div className="flex justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-600" />
      </div>
    </div>
  );
}
