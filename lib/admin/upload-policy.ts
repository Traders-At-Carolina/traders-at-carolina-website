/** Image types admins may upload (spec 06 §5): raster photos plus SVG for logos. HEIC is rejected in the browser. */
export const UPLOAD_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/**
 * Token options for a browser-to-Blob upload. Admin uploads live under uploads/ with a random suffix, so they can never
 * overwrite the seeded content/ copies or each other.
 */
export function uploadTokenOptions(pathname: string) {
  if (!pathname.startsWith("uploads/") || pathname.includes("..")) throw new Error("Uploads must go under uploads/");
  return { allowedContentTypes: UPLOAD_TYPES, maximumSizeInBytes: MAX_UPLOAD_BYTES, addRandomSuffix: true };
}
