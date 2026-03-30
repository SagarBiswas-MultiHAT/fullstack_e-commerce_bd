'use client';

import Image from 'next/image';
import { useMemo, useRef, useState } from 'react';

interface ImageUploaderProps {
  productId?: string;
  value: string[];
  onChange: (urls: string[]) => void;
}

const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_FILE_SIZE = 5 * 1024 * 1024;

function toEnvelopeData<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T }).data;
  }

  return payload as T;
}

export function ImageUploader({ productId, value, onChange }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const apiBase = useMemo(
    () => process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
    [],
  );

  async function handleFiles(files: FileList | null) {
    if (!files?.length) {
      return;
    }

    setError(null);

    const selectedFiles = Array.from(files);

    for (const file of selectedFiles) {
      if (!ACCEPTED_TYPES.has(file.type)) {
        setError('Only JPG, PNG, and WEBP are allowed.');
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        setError('Each image must be 5MB or smaller.');
        return;
      }
    }

    const formData = new FormData();
    for (const file of selectedFiles) {
      formData.append('files', file);
    }

    setUploading(true);
    setProgress(15);

    try {
      const params = new URLSearchParams();
      if (productId) {
        params.set('productId', productId);
      }

      const response = await fetch(
        `${apiBase}/admin/upload/multiple${params.toString() ? `?${params.toString()}` : ''}`,
        {
          method: 'POST',
          body: formData,
          credentials: 'include',
        },
      );

      setProgress(70);

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          payload && typeof payload === 'object' && 'message' in payload
            ? String((payload as { message: string }).message)
            : 'Upload failed';

        throw new Error(message);
      }

      const data = toEnvelopeData<{ urls: string[] }>(payload);
      const merged = [...value, ...(data.urls ?? [])];
      onChange(Array.from(new Set(merged)));
      setProgress(100);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Upload failed');
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 400);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          handleFiles(event.dataTransfer.files);
        }}
        className="rounded-xl border border-dashed border-slate-600 bg-slate-950 p-4"
      >
        <p className="text-sm text-slate-300">Drag images here, or pick files manually.</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-3 rounded-md border border-slate-600 px-3 py-2 text-xs text-slate-100"
        >
          Choose files
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(event) => handleFiles(event.target.files)}
        />

        {uploading ? (
          <div className="mt-3 h-2 overflow-hidden rounded bg-slate-800">
            <div
              className="h-full bg-sky-400 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        ) : null}
      </div>

      {error ? <p className="text-xs text-rose-300">{error}</p> : null}

      {value.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {value.map((url) => (
            <div key={url} className="relative overflow-hidden rounded-lg border border-slate-700">
              <Image src={url} alt="Uploaded product" width={240} height={180} className="h-28 w-full object-cover" />
              <button
                type="button"
                onClick={() => onChange(value.filter((entry) => entry !== url))}
                className="absolute right-2 top-2 rounded bg-black/70 px-2 py-1 text-[10px] text-white"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
