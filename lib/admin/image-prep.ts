/** Pure parts of the browser image pipeline (spec 06 §6.0 Uploads). The canvas work lives in ImageUpload. */

export const MAX_EDGE = 2400;

/** Scales so the long edge is at most `max`, keeping the aspect ratio. Never upscales. */
export function fitWithin(width: number, height: number, max: number = MAX_EDGE): { width: number; height: number } {
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

/** iPhone photos: browsers can't decode them on a canvas, so the upload asks for a JPEG instead. */
export function isHeic(file: { type: string; name: string }): boolean {
  return /image\/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name);
}

/** "Mock Trading Night (2).JPG" → "uploads/photos/mock-trading-night-2.jpg". The upload route adds a random suffix. */
export function uploadPathname(folder: string, fileName: string): string {
  const base = fileName.split(/[\\/]/).pop() ?? "image";
  const dot = base.lastIndexOf(".");
  const ext = dot > 0 ? base.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "") : "";
  const stem = (dot > 0 ? base.slice(0, dot) : base)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `uploads/${folder}/${stem || "image"}${ext ? `.${ext}` : ""}`;
}
