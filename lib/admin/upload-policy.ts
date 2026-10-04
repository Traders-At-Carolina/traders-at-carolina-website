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

// ── Private resource files (spec 06 §5.3, §6.11) ──

/** Resource files: PDF, PowerPoint, Word, Excel, plain text, zip archives and images. */
export const PRIVATE_UPLOAD_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/plain",
  "application/zip",
  "image/jpeg",
  "image/png",
  "image/webp",
];

export const MAX_PRIVATE_UPLOAD_BYTES = 50 * 1024 * 1024;

/** Every private file lives under resources/, so a resource row can only ever point into that folder. */
export const PRIVATE_PREFIX = "resources/";

/**
 * The private store's read-write token (spec 06 §3 Member files). The private store is a separate Blob store from the
 * public one, so its token has its own variable and is passed explicitly to every @vercel/blob call.
 */
export function privateBlobToken(env: Record<string, string | undefined> = process.env): string | undefined {
  return env.BLOB_PRIVATE_READ_WRITE_TOKEN?.trim() || undefined;
}

/** Token options for a browser-to-private-Blob upload: documents only, up to 50 MB, under resources/ with a random suffix. */
export function privateUploadTokenOptions(pathname: string) {
  if (!pathname.startsWith(PRIVATE_PREFIX) || pathname.includes("..")) throw new Error(`Files must go under ${PRIVATE_PREFIX}`);
  return { allowedContentTypes: PRIVATE_UPLOAD_TYPES, maximumSizeInBytes: MAX_PRIVATE_UPLOAD_BYTES, addRandomSuffix: true };
}

const EXTENSION_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ppt: "application/vnd.ms-powerpoint",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  doc: "application/msword",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xls: "application/vnd.ms-excel",
  txt: "text/plain",
  zip: "application/zip",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

/** A file's type, from the browser or else its extension (some browsers report "" for Office files). Empty if unsupported. */
export function resourceContentType(file: { type: string; name: string }): string {
  if (PRIVATE_UPLOAD_TYPES.includes(file.type)) return file.type;
  if (file.type === "application/x-zip-compressed") return "application/zip";
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSION_TYPES[ext] ?? "";
}

/** "Week 3 Options (final).PDF" → "resources/week-3-options-final.pdf". The upload route adds a random suffix. */
export function resourcePathname(fileName: string): string {
  const base = fileName.split(/[\\/]/).pop() ?? "file";
  const dot = base.lastIndexOf(".");
  const ext = dot > 0 ? base.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "") : "";
  const stem = (dot > 0 ? base.slice(0, dot) : base)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `${PRIVATE_PREFIX}${stem || "file"}${ext ? `.${ext}` : ""}`;
}

/** The download name for a stored file: its pathname's last segment, without the random suffix Blob added. */
export function resourceFileName(pathname: string): string {
  const last = pathname.split("/").pop() ?? "file";
  return last.replace(/-[A-Za-z0-9]{20,}(?=\.[a-z0-9]+$|$)/, "");
}

/** "Week 3: Options (final)" + resources/x.pdf → "Week 3 Options (final).pdf": ASCII only, safe inside a quoted header. */
export function downloadName(title: string, pathname: string): string {
  const ext = /\.([a-z0-9]+)$/i.exec(pathname)?.[1]?.toLowerCase();
  const base =
    title
      .normalize("NFKD")
      .replace(/[^\x20-\x7e]/g, "")
      .replace(/["\\/:*?<>|;]+/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 100) || "file";
  return ext ? `${base}.${ext}` : base;
}
