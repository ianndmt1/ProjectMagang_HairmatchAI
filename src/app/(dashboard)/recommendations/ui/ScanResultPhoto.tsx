'use client';

import { useEffect, useState } from "react";

/**
 * ScanResultPhoto component
 * Reads the persisted scan image from localStorage (key: hairmatch_scan_image)
 * and renders it. If no image is found, displays a fallback message.
 */
export default function ScanResultPhoto() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    // Retrieve the image data URL from localStorage on client side only
    const stored = typeof window !== "undefined" ? localStorage.getItem("hairmatch_scan_image") : null;
    if (stored) {
      setImageUrl(stored);
    }
  }, []);

  if (!imageUrl) {
    return (
      <div className="flex h-64 w-full items-center justify-center rounded-xl bg-neutral-900/60 text-neutral-400">
        Foto scan tidak tersedia
      </div>
    );
  }

  return (
    <div className="mb-4 flex justify-center">
      <img
        src={imageUrl}
        alt="Hasil Scan Wajah"
        className="max-h-64 max-w-full rounded-xl object-cover"
      />
    </div>
  );
}
