import { z } from "zod";
import { checkbox, optionalHttps, optionalText } from "@/lib/admin/schemas";
import { MAX_PRIVATE_UPLOAD_BYTES, PRIVATE_PREFIX, PRIVATE_UPLOAD_TYPES } from "@/lib/admin/upload-policy";
import { parseEasternDateTime } from "@/lib/eastern-time";
import { parseInline } from "@/lib/inline-markdown";

/**
 * Form rules for the portal editors (spec 06 §5.3, §6.11–6.13). Pure: the actions parse FormData with these, and the
 * tests exercise them directly.
 */

export const RESOURCE_KINDS = ["slides", "notes", "textbook", "problem-set", "video", "link"] as const;
export const RESOURCE_SECTIONS = ["learning", "interview-prep", "recruiting", "other"] as const;
export const TRACK_IDS = ["trading", "research", "development"] as const;
export const PORTAL_AUDIENCES = ["signed_in", "members"] as const;

const audience = z.enum(PORTAL_AUDIENCES, { error: "Pick who can see it." });

/** The uploader's hidden field: JSON `{ pathname, size, contentType }` for a file in the private store. */
export const storedFileSchema = z.object({
  pathname: z
    .string()
    .startsWith(PRIVATE_PREFIX, "Upload the file again.")
    .max(512)
    .refine((p) => !p.includes(".."), "Upload the file again."),
  size: z.int().nonnegative().max(MAX_PRIVATE_UPLOAD_BYTES, "Files can be up to 50 MB."),
  contentType: z.string().refine((t) => PRIVATE_UPLOAD_TYPES.includes(t), "Use a PDF, PowerPoint, Word, Excel, text, zip or image file."),
});

const optionalFile = z.preprocess(
  (v) => {
    if (typeof v !== "string" || !v.trim()) return null;
    try {
      return JSON.parse(v) as unknown;
    } catch {
      return "invalid";
    }
  },
  storedFileSchema.nullable(),
);

/**
 * A resource (spec 06 §6.11). The Source radio picks a file or a link; the other is dropped, so a saved resource has
 * exactly one (§5.3). Links are https. `uploadsEnabled` is false while the private store isn't set up.
 */
export function resourceSchema({ uploadsEnabled }: { uploadsEnabled: boolean }) {
  return z
    .object({
      title: z.string().trim().min(1, "Add a title.").max(120, "Keep it under 120 characters."),
      kind: z.enum(RESOURCE_KINDS, { error: "Pick a kind." }),
      section: z.enum(RESOURCE_SECTIONS, { error: "Pick a section." }),
      tracks: z.array(z.enum(TRACK_IDS, { error: "Pick from the three tracks." })).transform((t) => TRACK_IDS.filter((id) => t.includes(id))),
      description: optionalText(300, "Keep it under 300 characters."),
      source: z.enum(["file", "link"], { error: "Upload a file or paste a link." }),
      url: optionalHttps(),
      file: optionalFile,
      audience,
      pinned: checkbox,
      hidden: checkbox,
    })
    .superRefine((v, ctx) => {
      if (v.source === "link" && !v.url) ctx.addIssue({ code: "custom", path: ["url"], message: "Paste a full https:// link." });
      if (v.source === "file" && !uploadsEnabled) ctx.addIssue({ code: "custom", path: ["source"], message: "File uploads need the private file store. Paste a link for now." });
      else if (v.source === "file" && !v.file) ctx.addIssue({ code: "custom", path: ["file"], message: "Upload a file." });
    })
    .transform(({ source, url, file, ...rest }) => ({ ...rest, url: source === "link" ? url : null, file: source === "file" ? file : null }));
}

export type ResourceInput = z.infer<ReturnType<typeof resourceSchema>>;

export function readResourceForm(f: FormData) {
  return {
    title: f.get("title"),
    kind: f.get("kind"),
    section: f.get("section"),
    tracks: f.getAll("tracks"),
    description: f.get("description"),
    source: f.get("source"),
    url: f.get("url"),
    file: f.get("file"),
    audience: f.get("audience"),
    pinned: f.get("pinned"),
    hidden: f.get("hidden"),
  };
}

const LOCAL = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

/** An optional datetime-local value in Eastern time, as a Date; blank is null. */
const optionalEastern = z.preprocess(
  (v) => (typeof v === "string" && v.trim() ? v.trim() : null),
  z
    .string()
    .regex(LOCAL, "Pick a date and time.")
    .transform((v, ctx) => {
      try {
        return parseEasternDateTime(v);
      } catch {
        ctx.addIssue({ code: "custom", message: "Pick a real date and time." });
        return z.NEVER;
      }
    })
    .nullable(),
);

/** Links in the body go to a page on the site, an anchor, an https site or an email, never anything that runs script. */
export function bodyLinkProblems(body: string): string[] {
  return parseInline(body).flatMap((t) => (t.type === "link" && !/^(\/|#|https:\/\/|mailto:)/.test(t.href) ? [t.href] : []));
}

/** An announcement (spec 06 §6.12): a short inline-markdown body, shown between its optional dates. */
export const announcementSchema = z
  .object({
    title: z.string().trim().min(1, "Add a title.").max(120, "Keep it under 120 characters."),
    body: z
      .string()
      .trim()
      .min(1, "Write the announcement.")
      .max(600, "Keep it under 600 characters.")
      .refine((b) => bodyLinkProblems(b).length === 0, "Links must start with /, #, https:// or mailto:."),
    audience,
    pinned: checkbox,
    showFrom: optionalEastern,
    showUntil: optionalEastern,
  })
  .refine((v) => !v.showFrom || !v.showUntil || v.showUntil >= v.showFrom, { path: ["showUntil"], message: "“Show until” can't be before “Show from”." });

export type AnnouncementInput = z.infer<typeof announcementSchema>;

export function readAnnouncementForm(f: FormData) {
  return { title: f.get("title"), body: f.get("body"), audience: f.get("audience"), pinned: f.get("pinned"), showFrom: f.get("showFrom"), showUntil: f.get("showUntil") };
}

/** A member link (spec 06 §6.13). URLs are https. */
export const portalLinkSchema = z.object({
  label: z.string().trim().min(1, "Add a label.").max(60, "Keep it under 60 characters."),
  url: z.preprocess((v) => (typeof v === "string" ? v.trim() : v), z.url("Use a full https:// link.").startsWith("https://", "Use a full https:// link.")),
  description: optionalText(200, "Keep it under 200 characters."),
  audience,
});

export type PortalLinkInput = z.infer<typeof portalLinkSchema>;

export function readPortalLinkForm(f: FormData) {
  return { label: f.get("label"), url: f.get("url"), description: f.get("description"), audience: f.get("audience") };
}

/** Welcome lines and access switches (spec 06 §6.13). */
export const portalSettingsFormSchema = z.object({
  welcomeMember: optionalText(200, "Keep it under 200 characters."),
  welcomeVisitor: optionalText(200, "Keep it under 200 characters."),
  alumniAccess: checkbox,
  acceptRequests: checkbox,
});

/** Live, Scheduled or Expired, from the show dates (spec 06 §6.12). */
export function announcementStatus(a: { showFrom: Date | null; showUntil: Date | null }, now: Date = new Date()): "live" | "scheduled" | "expired" {
  if (a.showFrom && a.showFrom > now) return "scheduled";
  if (a.showUntil && a.showUntil < now) return "expired";
  return "live";
}
