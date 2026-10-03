import { z } from "zod";

/** Shared form rules for the admin editors (spec 06 §5.3). */

const BLOB_HOST = /\.public\.blob\.vercel-storage\.com$/;

/** An uploaded image: on the club's Blob store, measured, with an optional small blur. */
export const imageSchema = z.object({
  src: z.url().refine((u) => BLOB_HOST.test(new URL(u).hostname), "Upload the image here rather than linking to it."),
  width: z.int().positive(),
  height: z.int().positive(),
  blurDataURL: z.string().startsWith("data:image/").max(4096).optional(),
});

const json = (s: string, ctx: z.RefinementCtx) => {
  try {
    return JSON.parse(s) as unknown;
  } catch {
    ctx.addIssue({ code: "custom", message: "Upload the image again." });
    return z.NEVER;
  }
};

/** The ImageUpload hidden field (JSON), required. */
export const requiredImage = (message: string) => z.string({ error: message }).min(1, message).transform(json).pipe(imageSchema);

/** The ImageUpload hidden field, optional: empty means "no image". */
export const optionalImage = z.preprocess(
  (v) => (typeof v === "string" && v.trim() ? v : null),
  z.string().transform(json).pipe(imageSchema).nullable(),
);

/** Optional trimmed text; blank becomes null. */
export const optionalText = (max: number, message?: string) =>
  z.preprocess((v) => (typeof v === "string" && v.trim() ? v.trim() : null), z.string().max(max, message).nullable());

/** Optional https URL; blank becomes null. */
export const optionalHttps = (message = "Use a full https:// link.") =>
  z.preprocess((v) => (typeof v === "string" && v.trim() ? v.trim() : null), z.url(message).startsWith("https://", message).nullable());

export const checkbox = z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean());

export const optionalYear = z.preprocess(
  (v) => (v === "" || v == null ? null : Number(v)),
  z.int("Use a four-digit year, like 2027.").min(1990, "Use a four-digit year, like 2027.").max(2100, "Use a four-digit year, like 2027.").nullable(),
);

export const optionalTrack = z.preprocess((v) => (v === "" || v == null ? null : v), z.enum(["trading", "research", "development"]).nullable());
