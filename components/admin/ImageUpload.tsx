"use client";

import { upload } from "@vercel/blob/client";
import { ImagePlus, LoaderCircle } from "lucide-react";
import { useId, useRef, useState } from "react";
import { buttonClasses } from "@/components/admin/ui/Button";
import type { ImageAsset } from "@/content/types";
import { fitWithin, isHeic, uploadPathname } from "@/lib/admin/image-prep";

type ImageUploadProps = {
  /** Form field that carries the uploaded image as JSON. */
  name: string;
  /** Blob folder under uploads/, e.g. "photos". */
  folder: string;
  value: ImageAsset | null;
  onChange: (image: ImageAsset) => void;
  /** Logos may be SVG and keep their exact pixels (no resizing or blur). */
  kind?: "photo" | "logo";
  label: string;
  error?: string;
  /** Logos only: told whether the image's corners are fully opaque (it would render as a solid block in a mask). */
  onAnalyze?: (info: { opaque: boolean }) => void;
};

/** True when all four corner pixels are fully opaque, i.e. the logo has no transparent background. */
function opaqueCorners(bitmap: ImageBitmap): boolean {
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return false;
  ctx.drawImage(bitmap, 0, 0);
  const corners: Array<[number, number]> = [[0, 0], [bitmap.width - 1, 0], [0, bitmap.height - 1], [bitmap.width - 1, bitmap.height - 1]];
  return corners.every(([x, y]) => ctx.getImageData(x, y, 1, 1).data[3] === 255);
}

const RASTER = ["image/jpeg", "image/png", "image/webp"];

async function blurFor(source: CanvasImageSource, width: number, height: number): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = 16;
  canvas.height = Math.max(1, Math.round((16 * height) / width));
  canvas.getContext("2d")?.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/webp", 0.5);
}

/** Downsizes to at most 2400px on the long edge and makes a 16px blur, all in the browser (spec 06 §6.0). */
async function prepareRaster(file: File): Promise<{ blob: Blob; width: number; height: number; blurDataURL: string; type: string }> {
  const bitmap = await createImageBitmap(file);
  const size = fitWithin(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, size.width, size.height);
  const type = file.type === "image/png" ? "image/png" : file.type === "image/webp" ? "image/webp" : "image/jpeg";
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode failed"))), type, 0.86));
  const blurDataURL = await blurFor(canvas, size.width, size.height);
  bitmap.close();
  return { blob, ...size, blurDataURL, type };
}

async function svgSize(file: File): Promise<{ width: number; height: number }> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return { width: img.naturalWidth || 512, height: img.naturalHeight || 512 };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Drop or pick an image; it is prepared in the browser and uploaded straight to Blob through /api/admin/blob. */
export function ImageUpload({ name, folder, value, onChange, kind = "photo", label, error, onAnalyze }: ImageUploadProps) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{ busy: boolean; message?: string }>({ busy: false });
  const [over, setOver] = useState(false);
  const accept = kind === "logo" ? [...RASTER, "image/svg+xml"] : RASTER;

  async function handle(file: File | undefined) {
    if (!file) return;
    if (isHeic(file)) {
      setStatus({ busy: false, message: "This is an iPhone HEIC photo. Export it as a JPEG first (Photos → Export → JPEG), then upload that." });
      return;
    }
    if (!accept.includes(file.type)) {
      setStatus({ busy: false, message: kind === "logo" ? "Use a JPEG, PNG, WebP or SVG file." : "Use a JPEG, PNG or WebP photo." });
      return;
    }
    setStatus({ busy: true, message: "Uploading…" });
    try {
      let image: ImageAsset;
      const pathname = uploadPathname(folder, file.name);
      if (file.type === "image/svg+xml") {
        const size = await svgSize(file);
        const blob = await upload(pathname, file, { access: "public", handleUploadUrl: "/api/admin/blob", contentType: file.type });
        image = { src: blob.url, ...size };
        onAnalyze?.({ opaque: false });
      } else if (kind === "logo") {
        const bitmap = await createImageBitmap(file);
        onAnalyze?.({ opaque: opaqueCorners(bitmap) });
        const blob = await upload(pathname, file, { access: "public", handleUploadUrl: "/api/admin/blob", contentType: file.type });
        image = { src: blob.url, width: bitmap.width, height: bitmap.height };
        bitmap.close();
      } else {
        const prepared = await prepareRaster(file);
        const blob = await upload(pathname, prepared.blob, { access: "public", handleUploadUrl: "/api/admin/blob", contentType: prepared.type });
        image = { src: blob.url, width: prepared.width, height: prepared.height, blurDataURL: prepared.blurDataURL };
      }
      onChange(image);
      setStatus({ busy: false, message: "Uploaded." });
    } catch (e) {
      setStatus({ busy: false, message: `Upload failed: ${(e as Error).message}. Try again.` });
    }
  }

  const describedBy = `${id}-status${error ? ` ${id}-error` : ""}`;
  return (
    <div className="flex flex-col gap-1.5">
      <span id={`${id}-label`} className="text-ui-label font-medium text-ui-text">
        {label}
      </span>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          void handle(e.dataTransfer.files[0]);
        }}
        className={`flex flex-col items-center justify-center gap-2 rounded-ui-lg border border-dashed px-4 py-6 text-center transition-colors duration-150 ${
          over ? "border-ui-accent bg-ui-accent-soft" : error ? "border-ui-danger bg-ui-surface" : "border-ui-border-strong bg-ui-surface hover:bg-ui-accent-soft"
        }`}
      >
        <ImagePlus aria-hidden className="size-5 text-ui-text-3" />
        <p className="text-ui-base text-ui-text-2">{value ? "Drop a new file to replace it, or" : "Drop an image here, or"}</p>
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={status.busy}
          aria-describedby={describedBy}
          className={buttonClasses({ variant: "secondary", size: "sm" })}
        >
          {status.busy ? <LoaderCircle aria-hidden className="size-4 animate-spin" /> : null}
          {status.busy ? "Uploading…" : "Choose a file"}
        </button>
        <input
          ref={input}
          type="file"
          accept={[...accept, ".heic,.heif"].join(",")}
          className="sr-only"
          tabIndex={-1}
          aria-labelledby={`${id}-label`}
          onChange={(e) => void handle(e.target.files?.[0])}
        />
      </div>
      <input type="hidden" name={name} value={value ? JSON.stringify(value) : ""} />
      <p id={`${id}-status`} role="status" className="min-h-4 text-ui-hint text-ui-text-3">
        {status.message ?? ""}
      </p>
      {error ? (
        <p id={`${id}-error`} className="text-ui-hint font-medium text-ui-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
