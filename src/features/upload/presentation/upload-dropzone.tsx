'use client';

import React, { useState, useCallback, useRef, useTransition } from 'react';
import Image from 'next/image';
import {
  Upload,
  X,
  ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileImage,
  ZoomIn,
} from 'lucide-react';
import {
  validateImageFile,
  formatFileSize,
  ACCEPTED_EXTENSIONS,
  MAX_FILE_SIZE_LABEL,
} from '../domain/schemas';
import { uploadFacePhoto, type UploadResult } from '../infrastructure/actions';

type UploadState = 'idle' | 'preview' | 'uploading' | 'success' | 'error';

interface UploadDropzoneProps {
  /** Callback saat upload berhasil, menerima photoUrl */
  onUploadComplete?: (result: UploadResult & { success: true }) => void;
}

export default function UploadDropzone({ onUploadComplete }: UploadDropzoneProps) {
  const [state, setState] = useState<UploadState>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadResult, setUploadResult] = useState<(UploadResult & { success: true }) | null>(null);
  const [isPending, startTransition] = useTransition();

  const inputRef = useRef<HTMLInputElement>(null);

  // ── File selection handler ────────────────────
  const handleFile = useCallback((selectedFile: File) => {
    // Validate
    const validation = validateImageFile(selectedFile);
    if (!validation.valid) {
      setError(validation.error!);
      setState('error');
      return;
    }

    // Set file & create preview
    setFile(selectedFile);
    setError(null);
    setState('preview');

    // Create object URL for preview
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreview(objectUrl);
  }, []);

  // ── Drag & Drop handlers ──────────────────────
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        handleFile(droppedFile);
      }
    },
    [handleFile]
  );

  // ── File input change handler ─────────────────
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        handleFile(selectedFile);
      }
    },
    [handleFile]
  );

  // ── Upload handler ────────────────────────────
  const handleUpload = () => {
    if (!file) return;

    setState('uploading');
    setError(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.append('file', file);

      const result = await uploadFacePhoto(formData);

      if (result.success) {
        setState('success');
        setUploadResult(result);
        onUploadComplete?.(result);
      } else {
        setState('error');
        setError(result.error);
      }
    });
  };

  // ── Reset handler ─────────────────────────────
  const handleReset = useCallback(() => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setFile(null);
    setPreview(null);
    setError(null);
    setState('idle');
    setUploadResult(null);

    // Reset file input
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [preview]);

  // ── Render: Success State ─────────────────────
  if (state === 'success' && uploadResult) {
    return (
      <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-8">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10">
            <CheckCircle2 className="h-8 w-8 text-emerald-400 animate-bounce" />
          </div>
          <h3 className="text-lg font-bold text-white">Upload Berhasil!</h3>
          <p className="mt-2 text-sm text-neutral-400">
            Foto wajah Anda telah berhasil diupload. Siap untuk dianalisis.
          </p>

          {/* Preview thumbnail */}
          {preview && (
            <div className="mt-6 overflow-hidden rounded-2xl border border-emerald-500/20 relative h-48 w-48">
              <Image
                src={preview}
                alt="Foto wajah yang diupload"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleReset}
              className="rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-2.5 text-sm font-medium text-neutral-300 transition-all hover:border-neutral-700 hover:text-white"
            >
              Upload Lagi
            </button>
            {/* Placeholder: akan mengarah ke halaman analisis di Milestone 5 */}
            <button
              disabled
              className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 opacity-50 cursor-not-allowed"
            >
              Analisis Wajah →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Dropzone Area ─────────────────────── */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => state === 'idle' && inputRef.current?.click()}
        className={`
          relative cursor-pointer overflow-hidden rounded-3xl border-2 border-dashed p-8 text-center
          transition-all duration-300 ease-out
          ${
            isDragOver
              ? 'border-violet-500 bg-violet-500/10 scale-[1.01]'
              : state === 'error'
                ? 'border-rose-500/40 bg-rose-500/5'
                : state === 'preview' || state === 'uploading'
                  ? 'border-neutral-700 bg-neutral-900/40 cursor-default'
                  : 'border-neutral-800 bg-neutral-900/30 hover:border-neutral-700 hover:bg-neutral-900/50'
          }
        `}
      >
        {/* Hidden file input */}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS.join(',')}
          onChange={handleInputChange}
          className="hidden"
          id="face-upload-input"
        />

        {/* ── Idle / Drag state ──────────────── */}
        {state === 'idle' && (
          <div className="flex flex-col items-center py-8">
            <div
              className={`mb-5 flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300 ${
                isDragOver
                  ? 'bg-violet-500/20 text-violet-400 scale-110'
                  : 'bg-neutral-800/50 text-neutral-500'
              }`}
            >
              <Upload className="h-7 w-7" />
            </div>

            <h3 className="text-base font-semibold text-white">
              {isDragOver ? 'Lepas untuk mengupload' : 'Drag & drop foto wajah Anda'}
            </h3>
            <p className="mt-2 text-sm text-neutral-500">
              atau{' '}
              <span className="font-medium text-violet-400 underline decoration-violet-400/30 underline-offset-2">
                klik untuk memilih file
              </span>
            </p>

            {/* Format & size info */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-800/60 px-3 py-1.5 text-xs text-neutral-400">
                <FileImage className="h-3.5 w-3.5" />
                JPG, PNG, WebP
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-800/60 px-3 py-1.5 text-xs text-neutral-400">
                <ZoomIn className="h-3.5 w-3.5" />
                Maks. {MAX_FILE_SIZE_LABEL}
              </span>
            </div>
          </div>
        )}

        {/* ── Preview state ──────────────────── */}
        {(state === 'preview' || state === 'uploading') && file && preview && (
          <div className="flex flex-col items-center sm:flex-row sm:items-start sm:gap-6 sm:text-left">
            {/* Image preview */}
            <div className="relative mb-4 shrink-0 overflow-hidden rounded-2xl border border-neutral-700 sm:mb-0">
              <Image
                src={preview}
                alt="Preview foto wajah"
                fill
                className={`object-cover transition-all ${
                  state === 'uploading' ? 'opacity-50' : ''
                }`}
                unoptimized
              />
              {state === 'uploading' && (
                <div className="absolute inset-0 flex items-center justify-center bg-neutral-950/50">
                  <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
                </div>
              )}
            </div>

            {/* File info */}
            <div className="flex flex-1 flex-col items-center sm:items-start">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-violet-400" />
                <span className="text-sm font-medium text-white truncate max-w-[200px]">
                  {file.name}
                </span>
              </div>
              <p className="mt-1 text-xs text-neutral-500">{formatFileSize(file.size)}</p>

              {/* Tips */}
              <div className="mt-4 rounded-xl bg-violet-500/5 border border-violet-500/10 p-3 w-full">
                <p className="text-xs text-violet-300/80 leading-relaxed">
                  💡 <strong>Tips:</strong> Gunakan foto dengan wajah menghadap ke depan, pencahayaan
                  yang baik, dan tanpa aksesori yang menutupi wajah untuk hasil analisis terbaik.
                </p>
              </div>

              {/* Action buttons */}
              <div className="mt-4 flex gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReset();
                  }}
                  disabled={isPending}
                  className="flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-xs font-medium text-neutral-400 transition-all hover:border-neutral-700 hover:text-white disabled:opacity-50"
                >
                  <X className="h-3.5 w-3.5" />
                  Ganti Foto
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpload();
                  }}
                  disabled={isPending}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-violet-600/20 transition-all hover:from-violet-500 hover:to-indigo-500 active:scale-[0.98] disabled:opacity-50"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Mengupload...
                    </>
                  ) : (
                    <>
                      <Upload className="h-3.5 w-3.5" />
                      Upload Foto
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Error message ────────────────────── */}
      {state === 'error' && error && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
          <div>
            <p className="text-sm font-medium text-rose-400">{error}</p>
            <button
              onClick={handleReset}
              className="mt-2 text-xs font-medium text-rose-300 underline decoration-rose-300/30 underline-offset-2 transition-colors hover:text-rose-200"
            >
              Coba lagi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
